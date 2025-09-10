import { IsIn } from 'class-validator';

import { ROLE, type Role } from 'src/common/constants/role.constant';

export class UpdateUserRoleDto {
  @IsIn(Object.values(ROLE), {
    message: `role must be one of: ${Object.values(ROLE).join(', ')}`,
  })
  public role: Role;
}

