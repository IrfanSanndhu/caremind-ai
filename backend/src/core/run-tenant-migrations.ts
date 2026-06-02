import { execSync } from 'child_process';
import path from 'path';
import { TenantError } from './errors.js';

/**
 * Applies prisma/tenant migrations to a newly created org database.
 * Schema datasource uses TENANT_DATABASE_URL (not DATABASE_URL).
 */
export function runTenantMigrations(dbUrl: string): void {
  const schemaPath = path.join(process.cwd(), 'prisma', 'tenant', 'schema.prisma');
  const cmd = `npx prisma migrate deploy --schema="${schemaPath}"`;

  try {
    execSync(cmd, {
      cwd: process.cwd(),
      env: { ...process.env, TENANT_DATABASE_URL: dbUrl },
      stdio: 'pipe',
      encoding: 'utf-8',
    });
  } catch (err: unknown) {
    const execErr = err as {
      message?: string;
      stdout?: string;
      stderr?: string;
    };
    const details = [execErr.stderr, execErr.stdout].filter(Boolean).join('\n').trim();
    const message = execErr.message ?? 'Unknown error';
    throw new TenantError(
      details
        ? `Failed to run tenant migrations: ${message}\n${details}`
        : `Failed to run tenant migrations: ${message}`,
    );
  }
}
