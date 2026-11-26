type LogDetails = unknown[];

const redact = (value: unknown): string => {
  if (value instanceof Error) {
    return value.message;
  }

  if (typeof value === 'string') {
    return value
      .replace(/(token|password|secret|authorization)\s*[=:]\s*["']?[^\s,"']+/gi, '$1=[REDACTED]')
      .replace(/Bearer\s+[A-Za-z0-9._~+\/=-]+/gi, 'Bearer=[REDACTED]');
  }

  if (typeof value === 'object' && value !== null) {
    try {
      return JSON.stringify(value, (key, nestedValue) => {
        if (/password|secret|token|authorization/i.test(key)) return '[REDACTED]';
        return nestedValue;
      }).slice(0, 1000);
    } catch {
      return '[Unserializable]';
    }
  }

  return String(value);
};

async function send(level: 'error' | 'warn' | 'info', message: string, details: LogDetails): Promise<void> {
  if (typeof window === 'undefined') return;

  const safeDetails = details.map(redact).join(' ').slice(0, 2000);
  const payload = {
    level,
    message: redact(message).slice(0, 500),
    details: safeDetails,
    url: `${window.location.pathname}${window.location.search}`,
    user_agent: navigator.userAgent,
  };

  try {
    const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
    await fetch(`${apiBase}/logs/client-error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Ne jamais dégrader l'expérience ou écrire dans la console navigateur.
  }
}

export const logger = {
  debug(_message: string, ..._details: LogDetails): void {},
  info(message: string, ...details: LogDetails): void {
    void send('info', message, details);
  },
  warn(message: string, ...details: LogDetails): void {
    void send('warn', message, details);
  },
  error(message: string, ...details: LogDetails): void {
    void send('error', message, details);
  },
};
