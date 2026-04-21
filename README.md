# nest-starter

Plantilla de backend **NestJS** production-ready: autenticación (JWT + Google OAuth), usuarios, roles, perfiles, Swagger, validación, y **base de datos opcional** (MySQL, PostgreSQL, SQLite o MongoDB).

Diseñada como contraparte directa de [`next-starter`](https://github.com/maxshdev/next-starter). Implementa exactamente los endpoints que el frontend espera.

## Stack

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | NestJS | ^11.1 |
| Lenguaje | TypeScript | ^5.9 |
| ORM | TypeORM | ^0.3.27 |
| Auth | Passport + JWT | ^0.7 / ^11 |
| Validación | class-validator / class-transformer | ^0.14 / ^0.5 |
| Docs | Swagger (OpenAPI) | ^11 |
| Hash | bcryptjs | ^3.0 |
| DB opcional | MySQL • PostgreSQL • SQLite • MongoDB | — |

## Inicio rápido

```bash
git clone https://github.com/maxshdev/nest-starter.git mi-api
cd mi-api
npm install
cp .env.example .env
# Editar .env — elegir DB_TYPE y credenciales
npm run dev
```

Servidor en `http://localhost:4000/api`  
Swagger en `http://localhost:4000/api/docs`

## Base de datos (opcional según tu stack)

Elegí una en `.env` vía la variable `DB_TYPE`:

```bash
DB_TYPE=mysql     # MySQL / MariaDB
DB_TYPE=postgres  # PostgreSQL
DB_TYPE=sqlite    # SQLite (cero-config, ideal para empezar)
DB_TYPE=mongodb   # MongoDB (ver docs/MONGO.md)
```

| DB_TYPE | Driver | Variables usadas |
|---------|--------|------------------|
| `mysql` | `mysql2` | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` |
| `postgres` | `pg` | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` |
| `sqlite` | `better-sqlite3` | `SQLITE_PATH` |
| `mongodb` | `mongodb` (TypeORM) | `MONGO_URI` — ver `docs/MONGO.md` |

## Estructura

```
src/
├── main.ts                 # Bootstrap + CORS + Swagger + seeds
├── app.module.ts           # Módulo raíz
├── config/
│   └── database.config.ts  # Factory multi-DB
├── common/
│   ├── entities/           # BaseEntity
│   ├── filters/            # GlobalExceptionFilter
│   ├── guards/             # JwtAuthGuard, RolesGuard
│   └── decorators/         # @CurrentUser, @Roles
├── database/seed/          # Seeds de roles y usuarios
└── modules/
    ├── auth/               # JWT + Google OAuth
    ├── users/              # CRUD de usuarios
    ├── user-profiles/      # Perfil por userId
    └── roles/              # CRUD de roles
```

## Endpoints principales

| Método | Ruta | Auth |
|--------|------|------|
| POST | `/api/auth/register` | público |
| POST | `/api/auth/login` | público |
| POST | `/api/auth/google` | público |
| GET | `/api/auth/me` | Bearer |
| GET / POST / PATCH / DELETE | `/api/users` | Bearer |
| GET / PATCH | `/api/users-profiles/:userId` | Bearer |
| GET / POST / PATCH / DELETE | `/api/roles` | Bearer |

## Scripts

```bash
npm run dev       # Watch mode (puerto 4000)
npm run build     # Compilar a ./dist
npm run start     # Start sin watch
npm run prod      # node dist/main (producción)
npm run lint      # ESLint + Prettier
npm run test      # Jest
```

## Variables de entorno

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `NODE_ENV` | `development` / `production` | No |
| `PORT` | Puerto del servidor | No (4000) |
| `API_GLOBAL_PREFIX` | Prefijo de rutas | No (`api`) |
| `FRONTEND_URL` | URL(s) del frontend para CORS | No |
| `JWT_SECRET` | Secreto para firmar JWT | **Sí** |
| `JWT_EXPIRATION` | Expiración del token | No (`7d`) |
| `DB_TYPE` | `mysql`/`postgres`/`sqlite`/`mongodb` | **Sí** |
| `DB_HOST/PORT/USER/PASS/NAME` | Credenciales SQL | Depende |
| `SQLITE_PATH` | Ruta del archivo SQLite | Solo SQLite |
| `MONGO_URI` | URI de MongoDB | Solo Mongo |
| `RUN_SEEDS` | Ejecutar seeds al arrancar | No |

## Documentación

- **[INIT.md](./INIT.md)** — Guía completa de inicio para humanos y LLMs
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Arquitectura, patrones y decisiones
- **[docs/MONGO.md](./docs/MONGO.md)** — Implementación alternativa con MongoDB (Mongoose)

## Relación con `next-starter`

Este backend implementa exactamente los endpoints que el frontend [`next-starter`](https://github.com/maxshdev/next-starter) consume vía `NEXT_PUBLIC_API_URL`. Clonalos juntos para tener un full-stack listo:

```bash
git clone https://github.com/maxshdev/next-starter.git web
git clone https://github.com/maxshdev/nest-starter.git api
```

## Licencia

MIT
