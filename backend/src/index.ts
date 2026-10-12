import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ensureSchema, pingDb } from './db.js';
import roomsRouter from './routes/rooms.js';
import vehiclesRouter from './routes/vehicles.js';
import boatsRouter from './routes/boats.js';
import placesRouter from './routes/places.js';
import bookingsRouter from './routes/bookings.js';
import adminRouter from './routes/admin.js';
import googlePhotoRouter from './routes/googlePhoto.js';
import pricesRouter from './routes/prices.js';
import { requireAdmin } from './auth.js';
import { UPLOAD_DIR, UPLOAD_URL_PREFIX } from './uploads.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors());
// Photo uploads arrive as base64 JSON, so only authenticated admins get the larger body limit.
app.use('/api/admin/rooms', requireAdmin, express.json({ limit: '8mb' }));
app.use(express.json());
app.use(UPLOAD_URL_PREFIX, express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true }));

app.get('/api/health', async (_req, res) => {
  try {
    await pingDb();
    res.json({ ok: true, db: 'hub_1' });
  } catch (err) {
    console.error(err);
    res.status(503).json({ ok: false, error: 'Database unreachable' });
  }
});

app.use('/api/rooms', roomsRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/boats', boatsRouter);
app.use('/api/places', placesRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/google-photo', googlePhotoRouter);
app.use('/api/prices', pricesRouter);

ensureSchema()
  .catch((err) => console.error('Schema migration failed', err))
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`Pondy Hub API on http://localhost:${PORT}`);
    });
  });
