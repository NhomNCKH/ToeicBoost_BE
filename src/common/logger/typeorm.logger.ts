import { Logger as TypeOrmLogger, QueryRunner } from 'typeorm';

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m',
};

function ts(): string {
  return `${c.gray}${new Date().toLocaleTimeString('vi-VN', { hour12: false })}${c.reset}`;
}

function formatQuery(query: string): string {
  const q = query.trim().substring(0, 120);
  if (query.startsWith('SELECT')) return `${c.cyan}${q}${c.reset}`;
  if (query.startsWith('INSERT')) return `${c.green}${q}${c.reset}`;
  if (query.startsWith('UPDATE')) return `${c.yellow}${q}${c.reset}`;
  if (query.startsWith('DELETE')) return `${c.red}${q}${c.reset}`;
  if (query.startsWith('CREATE') || query.startsWith('ALTER')) return `${c.magenta}${q}${c.reset}`;
  return `${c.dim}${q}${c.reset}`;
}

function formatMs(time?: number): string {
  if (!time) return '';
  if (time < 100) return `${c.green}${time}ms${c.reset}`;
  if (time < 500) return `${c.yellow}${time}ms${c.reset}`;
  return `${c.red}${c.bold}${time}ms${c.reset}`;
}

export class CustomTypeOrmLogger implements TypeOrmLogger {
  logQuery(query: string, parameters?: unknown[], _queryRunner?: QueryRunner) {
    const params = parameters?.length ? `${c.gray} -- ${JSON.stringify(parameters).substring(0, 80)}${c.reset}` : '';
    console.log(`${ts()} ${c.green}⚡ DB${c.reset}    ${formatQuery(query)}${params}`);
  }

  logQueryError(error: string | Error, query: string, parameters?: unknown[], _queryRunner?: QueryRunner) {
    const params = parameters?.length ? `${c.gray} -- ${JSON.stringify(parameters).substring(0, 80)}${c.reset}` : '';
    console.log(`${ts()} ${c.bgRed}${c.bold} DB ERR ${c.reset} ${c.red}${query.substring(0, 120)}${c.reset}${params}`);
    console.log(`${ts()}          ${c.red}${error}${c.reset}`);
  }

  logQuerySlow(time: number, query: string, parameters?: unknown[], _queryRunner?: QueryRunner) {
    const params = parameters?.length ? `${c.gray} -- ${JSON.stringify(parameters).substring(0, 80)}${c.reset}` : '';
    console.log(`${ts()} ${c.bgYellow}${c.bold} SLOW ${c.reset}  ${c.yellow}${query.substring(0, 120)}${c.reset}${params} ${formatMs(time)}`);
  }

  logSchemaBuild(message: string) {
    console.log(`${ts()} ${c.magenta}🔧 SCHEMA${c.reset} ${c.magenta}${message}${c.reset}`);
  }

  logMigration(message: string) {
    console.log(`${ts()} ${c.magenta}📦 MIGR${c.reset}   ${c.magenta}${message}${c.reset}`);
  }

  log(level: 'log' | 'info' | 'warn', message: string) {
    if (level === 'warn') {
      console.log(`${ts()} ${c.bgYellow}${c.bold} WARN ${c.reset}  ${c.yellow}${message}${c.reset}`);
    } else {
      console.log(`${ts()} ${c.green}✔ DB${c.reset}    ${c.dim}${message}${c.reset}`);
    }
  }
}
