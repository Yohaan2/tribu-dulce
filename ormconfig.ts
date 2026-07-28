import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import path from 'path';

config();

const databaseUrl = process.env.DATABASE_URL;

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: [path.join(process.cwd(), 'lib/db/**/*.{js,ts}')],
  synchronize: false,
  logging: true,
  migrations: [path.join(process.cwd(), 'migrations/*.{js,ts}')],
  extra: {
    ssl: false
  },
});