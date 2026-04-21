# MongoDB — Guía de uso con `nest-starter`

`nest-starter` soporta **MongoDB** de dos formas:

1. **Vía TypeORM** (habilitado por defecto con `DB_TYPE=mongodb`) — uso simple, mismas entidades, pero limitaciones conocidas (sin `PrimaryGeneratedColumn('uuid')`, sin `@OneToOne` relacional puro, soft delete manual).
2. **Vía Mongoose con `@nestjs/mongoose`** — recomendado si MongoDB es tu BD principal. Más idiomático, schemas nativos, mejor tipado.

Este documento cubre ambas y explica cuándo elegir cada una.

---

## Comparativa rápida

| Aspecto | TypeORM (Mongo) | Mongoose (`@nestjs/mongoose`) |
|---------|-----------------|-------------------------------|
| Entidades compartidas con SQL | ✅ Sí | ❌ No |
| Soporte de `@OneToOne` / `@ManyToOne` | ⚠️ Parcial | ❌ (usar refs manuales) |
| `@PrimaryGeneratedColumn('uuid')` | ❌ — usar `@ObjectIdColumn` | ❌ — usar `_id` automático |
| Soft delete (`@DeleteDateColumn`) | ⚠️ No nativo | Manual (plugin) |
| Madurez del driver | Buena | Excelente |
| Idioma Mongo (aggregations, índices) | Limitado | Completo |
| Comunidad | Pequeña | Grande |

**Recomendación:** Si vas a usar Mongo en producción, usá Mongoose. TypeORM-Mongo es útil como stepping stone para proyectos que ya usan SQL y necesitan almacenar algo en Mongo ocasionalmente.

---

## Opción 1 — TypeORM con MongoDB (default)

### Configuración

```bash
# .env
DB_TYPE=mongodb
MONGO_URI=mongodb://localhost:27017/nest_starter
RUN_SEEDS=false   # los seeds actuales son SQL-only
```

### Adaptación de entidades

Las entidades actuales usan `@PrimaryGeneratedColumn('uuid')` que **no funciona** en Mongo. Hay que adaptarlas:

```typescript
// src/common/entities/base.entity.ts  (variante Mongo)
import { ObjectIdColumn, Column } from 'typeorm';
import { ObjectId } from 'mongodb';

export abstract class BaseEntity {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  id: string;  // versión string del _id para el API

  @Column()
  created_at: Date;

  @Column()
  updated_at: Date;

  @Column({ nullable: true })
  deleted_at: Date | null;
}
```

En services, tras insertar, mapear `_id.toString() → id`.

### Limitaciones a tener presentes

- `synchronize` no existe para Mongo.
- Soft delete es manual (setear `deleted_at` y filtrar).
- Las relaciones `@OneToOne` / `@ManyToOne` funcionan como **referencias embebidas** (guardan el ObjectId), no joins.

---

## Opción 2 — Mongoose con `@nestjs/mongoose` (recomendado)

Esta es la ruta moderna y más limpia. Requiere **reescribir las entidades como schemas** y **cambiar los repositorios por modelos**.

### Instalación (ya incluida en package.json)

```bash
npm install @nestjs/mongoose mongoose
```

### 1. Config en `app.module.ts`

Reemplazar `TypeOrmModule.forRootAsync(...)` por:

```typescript
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI!),
    AuthModule,
    UsersModule,
    UserProfilesModule,
    RolesModule,
  ],
})
export class AppModule {}
```

### 2. Schema de ejemplo (User)

```typescript
// src/modules/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class User {
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: Types.ObjectId, ref: 'Role' })
  role?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'UserProfile' })
  profile?: Types.ObjectId;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function (next) {
  if (this.isModified('password') && !this.password.startsWith('$2')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});
```

### 3. Registrar el schema en el módulo

```typescript
// src/modules/users/users.module.ts
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  // ...
})
export class UsersModule {}
```

### 4. Service con `@InjectModel`

```typescript
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findAll() {
    return this.userModel.find().populate('role').populate('profile').exec();
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).populate('role').populate('profile').exec();
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async create(dto: CreateUserDto) {
    const user = new this.userModel(dto);
    return user.save();
  }
}
```

### 5. Schemas para Role y UserProfile

Análogos. `Role`:

```typescript
@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Role {
  @Prop({ required: true, unique: true, lowercase: true })
  name: string;
}
```

`UserProfile`:

```typescript
@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class UserProfile {
  @Prop() avatar_url?: string;
  @Prop() first_name?: string;
  @Prop() last_name?: string;
  @Prop() title?: string;
  @Prop() biography?: string;
  @Prop() website?: string;
  @Prop({ type: Object }) social_links?: Record<string, string>;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  user: Types.ObjectId;
}
```

---

## Seeds con Mongoose

Los seeds SQL (`src/database/seed/*.seed.ts`) usan `DataSource` de TypeORM. Para Mongoose, crear el equivalente:

```typescript
// src/database/seed/mongo/roles.seed.ts
import { Connection } from 'mongoose';

export async function seedRolesMongo(conn: Connection) {
  const Role = conn.model('Role');
  const names = ['superadmin', 'admin', 'user', 'guest'];
  for (const name of names) {
    await Role.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true });
  }
}
```

Y llamarlos desde `main.ts` tomando la `Connection` con `app.get(getConnectionToken())`.

---

## ¿Cuál elegir?

- **Proyecto nuevo con Mongo como BD única:** Mongoose (reescribí entidades → schemas siguiendo esta guía).
- **Proyecto SQL que agrega Mongo para una feature aislada:** TypeORM Mongo puntual.
- **Quiero probar Mongo rápido sin tocar código:** `DB_TYPE=mongodb` + ajustar `BaseEntity` a `@ObjectIdColumn`.

---

## Recursos

- [NestJS — MongoDB (Mongoose)](https://docs.nestjs.com/techniques/mongodb)
- [TypeORM — MongoDB](https://typeorm.io/mongodb)
- [Mongoose docs](https://mongoosejs.com/docs/)
