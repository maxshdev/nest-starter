import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User } from 'src/modules/users/user.entity';
import { Role } from 'src/modules/roles/role.entity';
import { UserProfile } from 'src/modules/user-profiles/user-profile.entity';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleOAuthDto } from './dto/google-oauth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Role) private readonly rolesRepo: Repository<Role>,
    @InjectRepository(UserProfile)
    private readonly profilesRepo: Repository<UserProfile>,
    private readonly jwtService: JwtService,
  ) {}

  private serializeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      role: user.role?.name ?? null,
      profile: user.profile ?? null,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  private async getDefaultRole(): Promise<Role | null> {
    return this.rolesRepo.findOne({ where: { name: 'user' } });
  }

  async register(data: RegisterDto) {
    const exists = await this.userRepo.findOne({
      where: { email: data.email },
    });
    if (exists) throw new BadRequestException('Email already registered');

    const defaultRole = await this.getDefaultRole();

    const user = this.userRepo.create({
      email: data.email,
      password: data.password,
      role: defaultRole,
      profile: this.profilesRepo.create(),
    });

    const savedUser = await this.userRepo.save(user, { reload: true });

    const payload = {
      sub: savedUser.id,
      email: savedUser.email,
      role: savedUser.role?.name ?? null,
    };

    const access_token = await this.jwtService.signAsync(payload);

    return {
      user: this.serializeUser(savedUser),
      access_token,
    };
  }

  async login({ email, password }: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email },
      relations: ['role', 'profile'],
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role?.name ?? null,
    };
    const access_token = await this.jwtService.signAsync(payload);

    return {
      user: this.serializeUser(user),
      access_token,
    };
  }

  async googleLogin(data: GoogleOAuthDto) {
    let user = await this.userRepo.findOne({
      where: { email: data.email },
      relations: ['role', 'profile'],
    });

    if (!user) {
      const defaultRole = await this.getDefaultRole();

      const randomPassword = await bcrypt.hash(
        Math.random().toString(36).slice(-16) + Date.now().toString(36),
        10,
      );

      const newUser = this.userRepo.create({
        email: data.email,
        password: randomPassword,
        role: defaultRole,
        profile: this.profilesRepo.create({
          first_name: data.name?.split(' ')[0],
          last_name: data.name?.split(' ').slice(1).join(' ') || undefined,
          avatar_url: data.image,
        }),
      });

      await this.userRepo.save(newUser, { reload: true });

      user = await this.userRepo.findOne({
        where: { id: newUser.id },
        relations: ['role', 'profile'],
      });

      if (!user) {
        throw new BadRequestException('Failed to create Google OAuth user');
      }
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role?.name ?? null,
    };
    const access_token = await this.jwtService.signAsync(payload);

    return {
      user: this.serializeUser(user),
      access_token,
    };
  }
}
