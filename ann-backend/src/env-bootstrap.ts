import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Must run before `AppModule` is imported: `ConfigModule.forRoot()` executes at module
 * load time. Loading `.env` only in `main()` runs too late; OS env can leave JWT_SECRET empty.
 */
const candidates = [
  resolve(process.cwd(), '.env'),
  resolve(__dirname, '..', '.env'),
];
for (const envPath of candidates) {
  if (existsSync(envPath)) {
    loadEnv({ path: envPath, override: true });
    break;
  }
}
