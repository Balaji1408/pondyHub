import { app } from './app.js';
import { ensureSchema } from './db.js';

const PORT = Number(process.env.PORT || 4000);

ensureSchema()
  .catch((err) => console.error('Schema migration failed', err))
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`Pondy Hub API on http://localhost:${PORT}`);
    });
  });
