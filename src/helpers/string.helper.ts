import { v4 as uuidv4 } from 'uuid';

export class StringHelper {
  static generateUuid(): string {
    return uuidv4();
  }

  static slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
  }

  static maskEmail(email: string): string {
    const [name, domain] = email.split('@');
    const masked =
      name.length > 2 ? name[0] + '***' + name[name.length - 1] : '***';
    return `${masked}@${domain}`;
  }
}
