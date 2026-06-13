export function createRateLimit({ windowMs, max, message }) {
  const entries = new Map();

  return (request, response, next) => {
    const now = Date.now();
    if (entries.size > 10000) {
      for (const [entryKey, entry] of entries) {
        if (entry.resetAt <= now) entries.delete(entryKey);
      }
    }

    const key = request.ip || request.socket.remoteAddress || 'unknown';
    const current = entries.get(key);

    if (!current || current.resetAt <= now) {
      entries.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;
    if (current.count > max) {
      response.set('Retry-After', String(Math.ceil((current.resetAt - now) / 1000)));
      return response.status(429).json({ message });
    }

    next();
  };
}

export default { createRateLimit };
