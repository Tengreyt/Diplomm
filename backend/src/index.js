import { app } from './app.js';
import { formatDatabaseError } from './db/errorMessage.js';
import { migrateDatabase } from './db/migrate.js';
import sessionsRepo from './repo/sessionsRepo.js';
import trainingRepo from './repo/trainingRepo.js';

const port = process.env.PORT || 4001;

migrateDatabase()
  .then(async () => {
    await sessionsRepo.deleteExpiredSessions();
    await trainingRepo.deleteStaleAttempts();

    app.listen(port, () => {
      console.log(`Backend started on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Backend startup failed:\n%s', formatDatabaseError(error));
    process.exitCode = 1;
  });
