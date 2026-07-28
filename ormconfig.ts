import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import path from 'path';

config();

const databaseUrl = process.env.DATABASE_URL;

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: [path.join(process.cwd(), 'src/lib/db/postgres.{js,ts}').replace(/\\/g, '/')],
  synchronize: false,
  logging: true,
  migrations: [path.join(process.cwd(), 'src/migrations/*.{js,ts}').replace(/\\/g, '/')],
  extra: {
    ssl: false
  },
});