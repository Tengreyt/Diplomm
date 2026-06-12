export function formatDatabaseError(error) {
  if (error?.code === 'ECONNREFUSED') {
    return [
      'PostgreSQL is not available.',
      '',
      'Check that the database is running and DATABASE_URL points to it.',
      'For local Docker setup:',
      '  1. Start Docker Desktop',
      '  2. Run: docker compose up -d postgres',
      '  3. Run: cd backend && npm run db:migrate',
      '',
      `Current DATABASE_URL: ${process.env.DATABASE_URL ?? '(not set)'}`
    ].join('\n');
  }

  if (error?.code === 'ENOTFOUND') {
    return [
      'PostgreSQL host was not found.',
      '',
      'Check DATABASE_URL host and network access.',
      `Current DATABASE_URL: ${process.env.DATABASE_URL ?? '(not set)'}`
    ].join('\n');
  }

  return error;
}

export default formatDatabaseError;
