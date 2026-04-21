# INIT.md — nest-starter

> **Para LLMs (Cursor, Claude, GPT, etc.):** Este archivo + `ARCHITECTURE.md` + `docs/MONGO.md` contienen todo lo necesario para clonar, configurar y extender este proyecto sin consultar fuentes externas. Léelos completos antes de hacer cambios.

---

## ¿Qué es este proyecto?

`nest-starter` es una plantilla de producción para APIs REST con **NestJS 11**. Es la contraparte backend directa de [`next-starter`](https://github.com/maxshdev/next-starter) y expone exactamente los endpoints que ese frontend espera.

Incluye:

- **Autenticación JWT completa** (register / login / Google OAuth)
- **CRUD de usuarios, perfiles y roles**
- **Guards JWT y de roles** (RBAC listo para usar)
- **Validación automática** con `class-validator` y `ValidationPipe`
- **OpenAPI / Swagger** en `/api/docs`
- **Filtro global de excepciones** con respuestas JSON consistentes
- **CORS** configurable para localhost, LAN y URLs declaradas
- **Seeds** automáticos de roles y usuarios
- **Base de datos opcional**: MySQL · PostgreSQL · SQLite · MongoDB

---

## Requisitos del sistema

- Node.js 20 o superior
- npm 10 o superior
- Git
- **Opcional** según la BD elegida:
  - MySQL 8+ corriendo localmente
  - PostgreSQL 14+ corriendo localmente
  - MongoDB 6+ corriendo localmente
  - (SQLite no requiere nada — archivo local)

---

## Clonar y arrancar

```bash
git clone https://github.com/maxshdev/nest-starter.git mi-api
cd mi-api

npm install

cp .env.example .env
# Editar .env y elegir DB_TYPE

npm run dev
```

La API arranca en `http://localhost:4000/api`  
Swagger: `http://localhost:4000/api/docs`

### Arranque sin base de datos externa (recomendado para pruebas)

```bash
# En .env
DB_TYPE=sqlite
SQLITE_PATH=./nest-starter.sqlite
```

No hace falta instalar nada más: el archivo `.sqlite` se crea automáticamente y los seeds lo pueblan.

---

## Variables de entorno

```bash
# === App ===
NODE_ENV=development
PORT=4000
API_GLOBAL_PREFIX=api
FRONTEND_URL=http://localhost:5000

# === JWT ===
JWT_SECRET=cambia-esto-min-32-caracteres
JWT_EXPIRATION=7d

# === Database selector ===
DB_TYPE=mysql            # mysql | postgres | sqlite | mongodb

# === SQL (mysql | postgres) ===
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=password
DB_NAME=nest_starter

# === SQLite ===
SQLITE_PATH=./nest-starter.sqlite

# === MongoDB ===
MONGO_URI=mongodb://localhost:27017/nest_starter

# === Seeder ===
RUN_SEEDS=true
```

**Generar `JWT_SECRET`:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Scripts disponibles

```bash
npm run dev       # Servidor en watch mode (puerto 4000)
npm run build     # Compilar a ./dist
npm run start     # Start sin watch
npm run prod      # node dist/main
npm run debug     # Watch + debug (--inspect)
npm run lint      # ESLint + Prettier --fix
npm run format    # Prettier --write
npm run test      # Jest unit tests
npm run test:cov  # Cobertura
```

---

## Estructura de archivos

```
nest-starter/
├── src/
│   ├── main.ts                     # Bootstrap: CORS, Swagger, seeds
│   ├── app.module.ts               # Módulo raíz
│   ├── app.controller.ts           # /  y  /health
│   ├── app.service.ts
│   ├── config/
│   │   └── database.config.ts      # Factory multi-DB
│   ├── common/
│   │   ├── entities/base.entity.ts
│   │   ├── filters/http-exception.filter.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   └── decorators/
│   │       ├── current-user.decorator.ts
│   │       └── roles.decorator.ts
│   ├── database/seed/
│   │   ├── index.ts                # Orquestador
│   │   ├── roles.seed.ts
│   │   └── users.seed.ts
│   └── modules/
│       ├── auth/
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── dto/
│       │   │   ├── login.dto.ts
│       │   │   ├── register.dto.ts
│       │   │   └── google-oauth.dto.ts
│       │   └── strategies/jwt.strategy.ts
│       ├── users/
│       │   ├── user.entity.ts
│       │   ├── users.module.ts
│       │   ├── users.controller.ts
│       │   ├── users.service.ts
│       │   └── dto/
│       ├── user-profiles/
│       │   ├── user-profile.entity.ts
│       │   ├── user-profiles.module.ts
│       │   ├── user-profiles.controller.ts
│       │   ├── user-profiles.service.ts
│       │   └── dto/update-user-profile.dto.ts
│       └── roles/
│           ├── role.entity.ts
│           ├── roles.module.ts
│           ├── roles.controller.ts
│           ├── roles.service.ts
│           └── dto/
├── docs/
│   └── MONGO.md                    # Implementación alternativa con Mongoose
├── test/
├── .env.example
├── .env
├── nest-cli.json
├── eslint.config.mjs
├── .prettierrc
├── tsconfig.json
├── tsconfig.build.json
├── package.json
├── README.md
├── INIT.md                         # ← Este archivo
└── ARCHITECTURE.md
```

---

## Endpoints

Todos los endpoints están bajo el prefijo `/api`.

### Auth

| Método | Ruta | Body | Auth | Respuesta |
|--------|------|------|------|-----------|
| POST | `/auth/register` | `{ email, password }` | — | `{ user, access_token }` |
| POST | `/auth/login` | `{ email, password }` | — | `{ user, access_token }` |
| POST | `/auth/google` | `{ email, name?, image? }` | — | `{ user, access_token }` |
| GET | `/auth/me` | — | Bearer | `{ id, email, role }` |

### Users

| Método | Ruta | Body | Auth |
|--------|------|------|------|
| GET | `/users` | — | Bearer |
| GET | `/users/:id` | — | Bearer |
| POST | `/users` | `CreateUserDto` | Bearer |
| PATCH | `/users/:id` | `UpdateUserDto` | Bearer |
| DELETE | `/users/:id` | — | Bearer |

### User Profiles

| Método | Ruta | Body | Auth |
|--------|------|------|------|
| GET | `/users-profiles/:userId` | — | Bearer |
| PATCH | `/users-profiles/:userId` | `UpdateUserProfileDto` | Bearer |

### Roles

| Método | Ruta | Body | Auth |
|--------|------|------|------|
| GET | `/roles` | — | Bearer |
| GET | `/roles/:id` | — | Bearer |
| POST | `/roles` | `{ name }` | Bearer |
| PATCH | `/roles/:id` | `{ name? }` | Bearer |
| DELETE | `/roles/:id` | — | Bearer |

**Header de autenticación:**

```
Authorization: Bearer <access_token>
```

---

## Usuarios seed (para login inmediato)

Si `RUN_SEEDS=true`, al arrancar se crean estos usuarios automáticamente:

| Email | Password | Rol |
|-------|----------|-----|
| `superadmin@example.com` | `superadmin123` | superadmin |
| `admin@example.com` | `admin123` | admin |
| `user@example.com` | `user123` | user |
| `guest@example.com` | `guest123` | guest |

---

## Cómo agregar un módulo nuevo

### 1. Generar con el CLI (opcional)

```bash
npx nest generate resource productos --no-spec
```

O crealo a mano siguiendo esta estructura:

### 2. Estructura mínima

```
src/modules/productos/
├── producto.entity.ts
├── productos.module.ts
├── productos.controller.ts
├── productos.service.ts
└── dto/
    ├── create-producto.dto.ts
    └── update-producto.dto.ts
```

### 3. Ejemplo de entidad

```typescript
// producto.entity.ts
import { Entity, Column } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity('productos')
export class Producto extends BaseEntity {
  @Column()
  nombre: string;

  @Column('decimal', { precision: 10, scale: 2 })
  precio: number;
}
```

### 4. Registrar el módulo

```typescript
// app.module.ts
import { ProductosModule } from './modules/productos/productos.module';

@Module({
  imports: [
    // ...otros módulos
    ProductosModule,
  ],
})
export class AppModule {}
```

---

## Cambiar de base de datos

Solo cambiá `DB_TYPE` en `.env` y las credenciales correspondientes. El código del dominio es idéntico para **MySQL / PostgreSQL / SQLite** — son todas SQL con soporte de UUID.

Para **MongoDB** hay consideraciones especiales (ver `docs/MONGO.md`).

```bash
# De MySQL → PostgreSQL
DB_TYPE=postgres
DB_PORT=5432

# De cualquiera → SQLite
DB_TYPE=sqlite
SQLITE_PATH=./local.sqlite

# De cualquiera → MongoDB
DB_TYPE=mongodb
MONGO_URI=mongodb://localhost:27017/mi_db
```

---

## Proteger un endpoint con JWT

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Get('privado')
endpoint() { /* ... */ }
```

## Proteger un endpoint con roles

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
@Delete(':id')
remove() { /* ... */ }
```

## Leer el usuario autenticado

```typescript
import { CurrentUser, CurrentUserPayload } from 'src/common/decorators/current-user.decorator';

@Get('me')
me(@CurrentUser() user: CurrentUserPayload) {
  return user; // { id, email, role }
}
```

---

## Deploy

### Build de producción

```bash
npm run build
NODE_ENV=production node dist/main
```

### Variables críticas en producción

| Variable | Recomendación |
|----------|---------------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | 32+ caracteres aleatorios |
| `DB_TYPE` | `postgres` o `mysql` (no SQLite) |
| `FRONTEND_URL` | Dominios exactos separados por coma |
| `RUN_SEEDS` | `false` en producción (salvo primer arranque) |

### Docker (opcional)

Un `Dockerfile` típico:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 4000
CMD ["node", "dist/main"]
```

---

## Solución de problemas

### `JWT_SECRET is not set`
Verificá que `.env` existe y tiene `JWT_SECRET`. Reiniciá el servidor.

### `ECONNREFUSED` a la BD
- Que el motor esté corriendo.
- Revisar `DB_HOST` / `DB_PORT`.
- Para Docker: usar el nombre del servicio, no `localhost`.

### `ER_DUP_ENTRY` / `23505`
Intentaste registrar un email que ya existe. El filtro global lo transforma en `409 Conflict`.

### CORS blocked: ...
Agregá la URL al `FRONTEND_URL` (coma-separada si son varias).

### SQLite: `SQLITE_CANTOPEN`
Verificá permisos de escritura en la carpeta de `SQLITE_PATH`.

### TypeORM: `DataSourceOptions` error
Si falla al arrancar, probá `synchronize: false` y usar migraciones. Por defecto `synchronize` es `true` solo en `development`.

---

## Testing (esqueleto listo)

```bash
npm run test        # Unit tests (Jest)
npm run test:cov    # Coverage
npm run test:e2e    # E2E (requiere test/jest-e2e.json)
```

Agregar tests junto a cada archivo: `*.spec.ts`.

---

## Personalizar el nombre del proyecto

```json
// package.json
{ "name": "mi-api" }
```

```typescript
// src/main.ts — metadata de Swagger
.setTitle('Mi API')
.setDescription('Descripción de mi API')
```

---

## Dependencias — resumen de versiones

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `@nestjs/core` / `common` | ^11.1 | Core framework |
| `@nestjs/typeorm` | ^11 | Integración TypeORM |
| `typeorm` | ^0.3.27 | ORM |
| `@nestjs/jwt` | ^11 | Firma / verificación JWT |
| `@nestjs/passport` | ^11 | Passport integration |
| `passport-jwt` | ^4 | Estrategia JWT |
| `@nestjs/swagger` | ^11.2 | OpenAPI docs |
| `class-validator` | ^0.14 | Validación DTO |
| `class-transformer` | ^0.5 | Transformación payloads |
| `bcryptjs` | ^3 | Hash de passwords |
| `mysql2` | ^3.15 | Driver MySQL |
| `pg` | ^8.13 | Driver PostgreSQL |
| `better-sqlite3` | ^11 | Driver SQLite |
| `mongoose` + `@nestjs/mongoose` | ^8 / ^11 | Soporte Mongo (ver docs) |

---

## Referencias

- [NestJS Docs](https://docs.nestjs.com)
- [TypeORM Docs](https://typeorm.io)
- [Passport-JWT](http://www.passportjs.org/packages/passport-jwt/)
- [Swagger / OpenAPI](https://swagger.io/specification/)
- [class-validator](https://github.com/typestack/class-validator)
- [Repositorio next-starter (frontend)](https://github.com/maxshdev/next-starter)
- [Repositorio nest-starter](https://github.com/maxshdev/nest-starter)
