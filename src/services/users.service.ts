import { getDataSource, ProfileEntity } from '@/lib/db/postgres';
import { IsNull } from 'typeorm';
import { hashPassword } from '@/lib/auth/password';
import { z } from 'zod';
import { CreateUserSchema, UpdateUserSchema } from '@/schemas/user.schema';

export class UsersService {
  static format(profile: ProfileEntity) {
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      is_active: profile.is_active,
      deleted_at: profile.deleted_at?.toISOString() || null,
      created_at: profile.created_at.toISOString(),
    };
  }

  static async list() {
    const ds = await getDataSource();
    const profiles = await ds.getRepository(ProfileEntity).find({
      where: { deleted_at: IsNull() },
      order: { created_at: 'DESC' },
    });
    return profiles.map(this.format);
  }

  static async sellers() {
    const ds = await getDataSource();
    const profiles = await ds.getRepository(ProfileEntity).find({
      where: { role: 'EMPLOYEE' },
      order: { name: 'ASC' },
    });
    return profiles.map(({ id, name, is_active, deleted_at }) => ({ id, name, is_active, deleted_at: deleted_at?.toISOString() || null }));
  }

  static async create(input: z.infer<typeof CreateUserSchema>) {
    const ds = await getDataSource();
    const repo = ds.getRepository(ProfileEntity);
    if (await repo.findOne({ where: { email: input.email } })) throw new Error('El correo ya está registrado');
    const profile = await repo.save(repo.create({
      name: input.name, email: input.email, role: input.role,
      password_hash: await hashPassword(input.password), is_active: true,
    }));
    return this.format(profile);
  }

  static async update(id: string, input: z.infer<typeof UpdateUserSchema>) {
    const ds = await getDataSource();
    const repo = ds.getRepository(ProfileEntity);
    const profile = await repo.findOne({ where: { id } });
    if (!profile || profile.deleted_at || profile.role === 'SUPERADMIN') throw new Error('Usuario no disponible');
    if (input.email && input.email !== profile.email && await repo.findOne({ where: { email: input.email } })) {
      throw new Error('El correo ya está registrado');
    }
    if (input.name !== undefined) profile.name = input.name;
    if (input.email !== undefined) profile.email = input.email;
    if (input.role !== undefined) profile.role = input.role;
    if (input.is_active !== undefined) profile.is_active = input.is_active;
    if (input.password) profile.password_hash = await hashPassword(input.password);
    return this.format(await repo.save(profile));
  }

  static async remove(id: string) {
    const ds = await getDataSource();
    const repo = ds.getRepository(ProfileEntity);
    const profile = await repo.findOne({ where: { id } });
    if (!profile || profile.deleted_at || profile.role === 'SUPERADMIN') throw new Error('Usuario no disponible');
    profile.is_active = false;
    profile.deleted_at = new Date();
    return this.format(await repo.save(profile));
  }
}
