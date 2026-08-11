import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

async function main() {
  const name = process.argv[2] || process.env.SUPERADMIN_NAME;
  const email = process.argv[3] || process.env.SUPERADMIN_EMAIL;
  const password = process.argv[4] || process.env.SUPERADMIN_PASSWORD;

  if (!name || !email || !password) {
    console.error('Argumentos requeridos: nombre, email y contraseña.');
    console.error('Ejemplo:');
    console.error('  npx ts-node --transpile-only scripts/create-superadmin.ts "Yohan" "admin@admin.com" "admin123"');
    console.error('También puedes definir SUPERADMIN_NAME, SUPERADMIN_EMAIL y SUPERADMIN_PASSWORD.');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL no está definida en el entorno.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const existing = await pool.query('SELECT id FROM profiles WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.error(`El email ${email} ya está registrado.`);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO profiles (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email, passwordHash, 'SUPERADMIN']
    );

    console.log('Superadmin creado exitosamente:');
    console.log(result.rows[0]);
  } catch (error) {
    console.error('Error al crear superadmin:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
