import { User } from '../entities/user.entity.js';

export type SafeUser = Omit<User, 'password'>;
