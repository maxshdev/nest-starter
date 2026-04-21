# Architecture Documentation — nest-starter

## Overview

`nest-starter` es un backend REST en **NestJS 11** diseñado como contraparte directa de [`next-starter`](https://github.com/maxshdev/next-starter). Prioriza modularidad por dominio, separación estricta de responsabilidades, validación declarativa y portabilidad entre motores de base de datos (MySQL / PostgreSQL / SQLite / MongoDB).

---

## Technology Stack

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | NestJS | ^11.1 |
| Lenguaje | TypeScript | ^5.9 |
| ORM (SQL) | TypeORM | ^0.3.27 |
| Auth | Passport + JWT | ^0.7 / ^11 |
| Validación | class-validator + class-transformer | ^0.14 / ^0.5 |
| Docs | Swagger / OpenAPI | ^11.2 |
| Hash | bcryptjs | ^3.0 |
| Testing | Jest + Supertest | ^30 / ^7 |

---

## Arquitectura de Carpetas

### `src/main.ts` — Bootstrap

Centraliza:
- Creación del `NestApplication`
- Prefijo global `/api`
- `ValidationPipe` global con `whitelist`, `forbidNonWhitelisted`, `transform`
- `GlobalExceptionFilter` — respuestas JSON uniformes
- CORS dinámico (localhost, LAN, URLs de `FRONTEND_URL`)
- Swagger en `/api/docs` con Bearer auth persistente
- Ejecución condicional de seeds

### `src/app.module.ts` — Módulo raíz

- `ConfigModule.forRoot({ isGlobal: true })` — carga `.env` globalmente
- `TypeOrmModule.forRootAsync({ useFactory: getDatabaseConfig })` — multi-DB
- Módulos de dominio: `AuthModule`, `UsersModule`, `UserProfilesModule`, `RolesModule`

### `src/config` — Configuración

```
src/config/
└── database.config.ts    # Factory con switch según DB_TYPE
```

La función `getDatabaseConfig()` devuelve el `TypeOrmModuleOptions` apropiado para el motor seleccionado. Las entidades se cargan dinámicamente vía glob `__dirname + '/../**/*.entity.{ts,js}'` + `autoLoadEntities: true`.

### `src/common` — Transversal

```
src/common/
├── entities/
│   └── base.entity.ts           # UUID id + created_at / updated_at / deleted_at
├── filters/
│   └── http-exception.filter.ts # JSON estable: { statusCode, message, error }
├── guards/
│   ├── jwt-auth.guard.ts        # extends AuthGuard('jwt')
│   └── roles.guard.ts           # Lee metadata @Roles()
└── decorators/
    ├── current-user.decorator.ts # @CurrentUser() — extrae req.user
    └── roles.decorator.ts        # @Roles('admin')
```

### `src/modules` — Dominio

Cada módulo es autosuficiente:

```
src/modules/<feature>/
├── <feature>.module.ts
├── <feature>.controller.ts
├── <feature>.service.ts
├── <feature>.entity.ts       # (si aplica)
├── strategies/                # (solo auth)
└── dto/
    ├── create-<feature>.dto.ts
    └── update-<feature>.dto.ts
```

Módulos incluidos:

| Módulo | Propósito |
|--------|-----------|
| `auth` | Register / Login / Google OAuth, emite JWT |
| `users` | CRUD usuarios |
| `user-profiles` | Perfil 1:1 con usuario (avatar, nombre, bio, social_links) |
| `roles` | CRUD roles del sistema |

### `src/database/seed` — Seeds

```
database/seed/
├── index.ts         # runSeeds(dataSource)
├── roles.seed.ts    # superadmin, admin, user, guest
└── users.seed.ts    # 4 usuarios de prueba con password hasheado
```

Se ejecuta al arrancar si `RUN_SEEDS=true` y el driver no es Mongo (ver `docs/MONGO.md`).

---

## Patrones de Desarrollo

### 1. Controller → Service → Repository

Respeto estricto de capas:

```typescript
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }
}
```

**Reglas:**
- Los controllers **no contienen lógica**; solo delegan al service.
- Los services **no conocen** Express / HTTP.
- Los DTOs tipan las entradas; las entidades modelan persistencia.

### 2. DTOs con `class-validator`

Toda entrada HTTP pasa por un DTO:

```typescript
export class CreateUserDto {
  @IsEmail() email: string;
  @IsString() @MinLength(6) password: string;
  @IsOptional() @IsUUID() roleId?: string;
}
```

El `ValidationPipe` global:
- `whitelist: true` → elimina props no declaradas
- `forbidNonWhitelisted: true` → lanza 400 si vienen props extra
- `transform: true` → instancia clases y castea tipos primitivos

### 3. `BaseEntity` abstracta

Todas las entidades extienden `BaseEntity`:

```typescript
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @CreateDateColumn({ name: 'created_at' }) created_at: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updated_at: Date;
  @DeleteDateColumn({ name: 'deleted_at', nullable: true }) deleted_at: Date | null;
}
```

Soft delete incluido (via `@DeleteDateColumn`). Compatible con MySQL / PostgreSQL / SQLite. Para MongoDB ver `docs/MONGO.md`.

### 4. Hash automático de password

El entity `User` hashea la contraseña con `@BeforeInsert()` y `@BeforeUpdate()`:

```typescript
@BeforeInsert()
@BeforeUpdate()
async hashPassword() {
  if (this.password && !this.password.startsWith('$2')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
}
```

El prefijo `$2` detecta hashes bcrypt ya existentes y evita re-hash.

### 5. JWT como único medio de sesión

- Al login / register, el service firma un JWT con `{ sub, email, role }`.
- El frontend lo guarda y lo envía en `Authorization: Bearer <token>`.
- `JwtAuthGuard` + `JwtStrategy` validan y pueblan `req.user`.
- `@CurrentUser()` es un param decorator que devuelve `req.user`.

### 6. RBAC declarativo

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
@Delete(':id')
remove() { ... }
```

`RolesGuard` lee el metadata `@Roles(...)` y compara con `req.user.role`.

### 7. Multi-DB vía factory

```typescript
TypeOrmModule.forRootAsync({
  useFactory: getDatabaseConfig,
})
```

`getDatabaseConfig()` hace `switch(DB_TYPE)` y retorna opciones distintas, pero las entidades son las mismas (excepto Mongo — ver `docs/MONGO.md`).

### 8. Filtro global de excepciones

`GlobalExceptionFilter`:
- `HttpException` → respeta status/message.
- Errores de BD con `ER_DUP_ENTRY` (MySQL) o `23505` (Postgres) → `409 Conflict`.
- Cualquier otro `Error` → `400 Bad Request` con el mensaje.

Respuesta uniforme:

```json
{
  "statusCode": 400,
  "message": "email must be a valid email",
  "error": "Bad Request"
}
```

---

## Autenticación y Seguridad

### Flujo JWT

```
┌─────────┐  POST /auth/login            ┌──────────┐
│ Cliente │ ───────────────────────────► │ AuthSvc  │
│         │                              │          │
│         │ ◄────────────────────────── │ bcrypt.cmp│
│         │   { user, access_token }     │ jwt.sign │
└─────────┘                              └──────────┘
      │
      │ GET /users
      │ Authorization: Bearer <token>
      ▼
┌──────────────┐
│ JwtAuthGuard │── extrae Bearer ──► JwtStrategy.validate(payload)
└──────────────┘                     └─ req.user = { id, email, role }
```

### JwtStrategy

```typescript
super({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  ignoreExpiration: false,
  secretOrKey: process.env.JWT_SECRET,
});

validate(payload) {
  return { id: payload.sub, email: payload.email, role: payload.role };
}
```

### Google OAuth

El frontend (`next-starter`) usa Auth.js y delega al backend vía `POST /auth/google` con `{ email, name?, image? }`. El service:
1. Busca el usuario por email; si no existe, lo crea con rol default (`user`) y password aleatoria hasheada.
2. Firma un JWT idéntico al login normal.
3. Devuelve `{ user, access_token }`.

### Hash de passwords

`bcryptjs` con cost factor 10. El hook del entity garantiza que ningún string plano llegue a la BD.

---

## Internacionalización

La API es _stateless_ y no maneja i18n de textos visibles. Los mensajes de error son siempre en inglés. El frontend traduce según su locale.

Si necesitás mensajes de validación localizados, usar:

```typescript
@IsEmail({}, { message: 'El email es inválido' })
```

---

## Buenas Prácticas

### Módulos
- Un módulo por dominio. Export explícito de `Service` y `TypeOrmModule` para reusar repositorios en otros módulos.
- No importar un módulo en sí mismo (circular deps). Usar `forwardRef` solo como último recurso.

### DTOs
- `create-*.dto.ts` lleva campos requeridos.
- `update-*.dto.ts` extiende con `PartialType(CreateXDto)` de `@nestjs/mapped-types`.
- Cada campo lleva `@ApiProperty` para Swagger.

### Entidades
- Extender siempre `BaseEntity`.
- `snake_case` para columnas, `camelCase` para propiedades virtuales.
- Relaciones siempre con `onDelete` explícito.

### Servicios
- Inyectar repositorios vía `@InjectRepository(Entity)`.
- Lanzar `NotFoundException`, `BadRequestException`, `UnauthorizedException` con mensajes útiles.
- No loguear información sensible (passwords, tokens).

### Testing
- Mockear el repositorio en services: `jest.fn().mockResolvedValue(...)`.
- E2E con `Test.createTestingModule()` + `supertest`.

---

## Convención de Commits

```
feat:     nueva funcionalidad
fix:      corrección de bug
refactor: reestructura sin cambio de comportamiento
docs:     documentación
chore:    mantenimiento, deps, config
test:     tests
perf:     mejora de performance
```

---

## Cómo Extender la Plantilla

### Agregar un módulo nuevo

```bash
npx nest g resource productos --no-spec
# Luego mover a src/modules/productos/ si hace falta
```

Registrar el módulo en `app.module.ts`:

```typescript
imports: [..., ProductosModule],
```

### Agregar un campo al User

1. Editar `src/modules/users/user.entity.ts`.
2. Agregar en `UpdateUserDto` / `CreateUserDto` según aplique.
3. `synchronize: true` (solo dev) aplica el cambio automáticamente; en prod generá una migración:

```bash
npx typeorm migration:generate src/migrations/AddFieldX -d src/data-source.ts
```

### Agregar un provider OAuth

1. Crear un nuevo DTO en `src/modules/auth/dto/` (ej: `github-oauth.dto.ts`).
2. Crear un método en `AuthService` (`githubLogin`).
3. Exponer el endpoint en `AuthController` (`@Post('github')`).

### Cambiar de BD

Editar `.env` → `DB_TYPE=postgres` (por ejemplo). Ningún código del dominio necesita cambiar (salvo Mongo, ver `docs/MONGO.md`).

---

## Decisiones Arquitectónicas

### ¿Por qué TypeORM y no Prisma?

- TypeORM ofrece soporte nativo para **MySQL, PostgreSQL, SQLite y MongoDB** con el mismo API.
- Decoradores encajan naturalmente con el estilo Nest.
- Migraciones, soft delete, relaciones complejas son de primera clase.

### ¿Por qué JWT stateless?

- El frontend (`next-starter`) usa Auth.js v5 que guarda el JWT en cookies httpOnly.
- Simplifica horizontal scaling: no hay sesiones en memoria.
- El riesgo de no poder invalidar tokens se mitiga con `exp` corto (`7d`) y _token rotation_ si hace falta.

### ¿Por qué UUIDs y no autoincrementales?

- Evita filtración de información (tamaño de la BD).
- Seguro para exponer en URLs.
- Compatible entre MySQL / Postgres / SQLite.
- Migrable a Mongo con un adapter mínimo.

### ¿Por qué `synchronize: true` solo en development?

- Acelera la iteración sin escribir migraciones.
- **Nunca** en producción — puede provocar data loss.
- En prod usar `typeorm migration:run`.

### ¿Por qué un filtro de excepciones global?

- Respuesta JSON consistente para el frontend.
- Traducción de errores de BD (unique constraint → 409) sin repetir código.
- Log centralizado de 500s.

---

## Testing (esqueleto)

```
test/
└── jest-e2e.json   # Config de E2E con supertest
```

Unit tests: `*.spec.ts` junto al archivo.

```typescript
// users.service.spec.ts
describe('UsersService', () => {
  let service: UsersService;
  let repo: Repository<User>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepo() },
      ],
    }).compile();
    service = module.get(UsersService);
  });
  // ...
});
```

---

## Referencias

- [NestJS Docs](https://docs.nestjs.com)
- [TypeORM Docs](https://typeorm.io)
- [Passport](http://www.passportjs.org/)
- [Swagger / OpenAPI](https://swagger.io/)
- [class-validator](https://github.com/typestack/class-validator)
- [next-starter (frontend)](https://github.com/maxshdev/next-starter)
