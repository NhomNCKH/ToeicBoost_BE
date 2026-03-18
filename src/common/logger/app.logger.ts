import { ConsoleLogger } from '@nestjs/common';

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgCyan: '\x1b[46m',
};

function timestamp(): string {
  return `${colors.gray}${new Date().toLocaleTimeString('vi-VN', { hour12: false })}${colors.reset}`;
}

export class AppLogger extends ConsoleLogger {
  private readonly logContext: string;

  constructor(context?: string) {
    super(context ?? 'App');
    this.logContext = context ?? 'App';
  }

  log(message: string, context?: string) {
    const ctx = context || this.logContext;
    console.log(
      `${timestamp()} ${colors.green}✔ LOG${colors.reset}  ${colors.cyan}[${ctx}]${colors.reset} ${colors.green}${message}${colors.reset}`,
    );
  }

  warn(message: string, context?: string) {
    const ctx = context || this.logContext;
    console.log(
      `${timestamp()} ${colors.bgYellow}${colors.bold} WARN ${colors.reset} ${colors.cyan}[${ctx}]${colors.reset} ${colors.yellow}${message}${colors.reset}`,
    );
  }

  error(message: string, stack?: string, context?: string) {
    const ctx = context || this.logContext;
    console.log(
      `${timestamp()} ${colors.bgRed}${colors.bold} ERROR ${colors.reset} ${colors.cyan}[${ctx}]${colors.reset} ${colors.red}${message}${colors.reset}`,
    );
    if (stack) {
      console.log(`${colors.dim}${stack}${colors.reset}`);
    }
  }

  debug(message: string, context?: string) {
    const ctx = context || this.logContext;
    console.log(
      `${timestamp()} ${colors.gray}⚙ DEBUG${colors.reset} ${colors.cyan}[${ctx}]${colors.reset} ${colors.gray}${message}${colors.reset}`,
    );
  }

  verbose(message: string, context?: string) {
    const ctx = context || this.logContext;
    console.log(
      `${timestamp()} ${colors.dim}… VERBOSE${colors.reset} ${colors.cyan}[${ctx}]${colors.reset} ${colors.dim}${message}${colors.reset}`,
    );
  }
}
