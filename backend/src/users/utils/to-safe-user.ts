import { User } from '../entities/user.entity.js';
import { SafeUser } from '../types/safe-user.type.js';

export function toSafeUser(user: User): SafeUser {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}
