/**
 * All configuration in one place, with committed local defaults so a
 * fresh clone runs with no .env file. Every value can be overridden by
 * an environment variable ( the integration tests override DB_NAME ).
 */
export const appConfig = () => ({
  port: parseInt(process.env.PORT ?? "3000", 10),
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  database: {
    host: process.env.DB_HOST ?? "localhost",
    port: parseInt(process.env.DB_PORT ?? "5433", 10),
    username: process.env.DB_USER ?? "blog",
    password: process.env.DB_PASSWORD ?? "blog",
    name: process.env.DB_NAME ?? "blog",
  },
  jwt: {
    // dev-only secrets: fine for a local course app, never for production
    accessSecret: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES ?? "15m",
    refreshDays: parseInt(process.env.JWT_REFRESH_DAYS ?? "7", 10),
  },
  mail: {
    host: process.env.MAIL_HOST ?? "localhost",
    port: parseInt(process.env.MAIL_PORT ?? "1025", 10),
    from: process.env.MAIL_FROM ?? "no-reply@blog.local",
  },
});

export type AppConfig = ReturnType<typeof appConfig>;
