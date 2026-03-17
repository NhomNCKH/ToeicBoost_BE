import { randomInt } from 'crypto';

export class OtpHelper {
  static generate(length = 6): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return randomInt(min, max).toString();
  }

  static isExpired(createdAt: Date, expiryMinutes: number): boolean {
    const now = new Date();
    const diff = (now.getTime() - createdAt.getTime()) / 1000 / 60;
    return diff > expiryMinutes;
  }
}
