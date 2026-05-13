import * as fs from 'node:fs';
import * as path from 'node:path';

function getProjectRoot() {
  return path.resolve(__dirname, '..', '..');
}

export function getEnvFilePaths(nodeEnv = process.env.NODE_ENV): string[] {
  const normalizedEnv = nodeEnv?.trim().toLowerCase() || 'development';
  const rootDir = getProjectRoot();
  const candidates = [
    `.env.${normalizedEnv}.local`,
    normalizedEnv === 'test' ? null : '.env.local',
    `.env.${normalizedEnv}`,
    '.env',
  ]
    .filter((value): value is string => Boolean(value))
    .map((fileName) => path.join(rootDir, fileName));

  const existingFiles = Array.from(new Set(candidates)).filter((filePath) =>
    fs.existsSync(filePath),
  );

  return existingFiles.length > 0
    ? existingFiles
    : [path.join(rootDir, '.env')];
}
