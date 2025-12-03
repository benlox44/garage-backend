export const ROLE = {
  ADMIN: 'ADMIN',
  CLIENT: 'CLIENT',
  MECHANIC: 'MECHANIC',
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];
