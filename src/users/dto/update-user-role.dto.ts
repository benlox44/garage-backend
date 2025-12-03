import { IsIn } from 'class-validator';

import { ROLE, type Role } from '../../common/constants/role.constant.js';

export class UpdateUserRoleDto {
  @IsIn(Object.values(ROLE), {
    message: `role must be one of: ${Object.values(ROLE).join(', ')}`,
  })
  public role: Role;
}

