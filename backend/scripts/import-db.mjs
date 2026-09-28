import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ?? '',
    multipleStatements: true,
  });

  const schema = fs.readFileSync(path.join(root, 'sql', 'schema.sql'), 'utf8');
  const seed = fs.readFileSync(path.join(root, 'sql', 'seed.sql'), 'utf8');

  console.log('Applying schema…');
  await conn.query(schema);
  console.log('Seeding data…');
  await conn.query(seed);

  const [rooms] = await conn.query('SELECT COUNT(*) AS c FROM hub_1.rooms');
  const [vehicles] = await conn.query('SELECT COUNT(*) AS c FROM hub_1.vehicles');
  const [boats] = await conn.query('SELECT COUNT(*) AS c FROM hub_1.boats');
  const [places] = await conn.query('SELECT COUNT(*) AS c FROM hub_1.places');

  console.log('Done.', {
    rooms: rooms[0].c,
    vehicles: vehicles[0].c,
    boats: boats[0].c,
    places: places[0].c,
  });

  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
