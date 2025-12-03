import { JwtPurpose } from '../../common/constants/jwt-purpose.constant.js';

export type JwtPayloadBase = {
  purpose: JwtPurpose;
  sub: number;
  email: string;
  role?: string;
};

// Session tokens require role for authorization
export type JwtPayload = JwtPayloadBase & {
  jti: string;
  role: string;
};
