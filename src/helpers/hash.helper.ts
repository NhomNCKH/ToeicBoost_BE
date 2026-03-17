import * as bcrypt from 'bcrypt';
import { APP_CONSTANTS } from '../common/constants/app.constant';

export class HashHelper {
  static async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, APP_CONSTANTS.BCRYPT_SALT_ROUNDS);
  }

  static async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
