const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  CLINIC_TZ: z.string().default('Asia/Hebron'),
  COOKIE_SECURE: z.enum(['true', 'false']).transform((val) => val === 'true'),
  CLIENT_ORIGIN: z.string().url(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const invalidKeys = [...new Set(result.error.issues.map((issue) => issue.path.join('.')))];
  throw new Error(`Invalid environment variables: ${invalidKeys.join(', ')}`);
}

const env = Object.freeze(result.data);

module.exports = env;
