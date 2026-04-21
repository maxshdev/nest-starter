import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Role } from './role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>,
  ) {}

  findAll(): Promise<Role[]> {
    return this.rolesRepo.find();
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.rolesRepo.findOne({ where: { id } });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  async findByName(name: string): Promise<Role | null> {
    return this.rolesRepo.findOne({
      where: { name: name.trim().toLowerCase() },
    });
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    const normalized = dto.name.trim().toLowerCase();
    const exists = await this.findByName(normalized);
    if (exists) throw new BadRequestException('Role already exists');

    const role = this.rolesRepo.create({ name: normalized });
    return this.rolesRepo.save(role);
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);
    if (dto.name) dto.name = dto.name.trim().toLowerCase();
    Object.assign(role, dto);
    return this.rolesRepo.save(role);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);
    await this.rolesRepo.remove(role);
  }
}
