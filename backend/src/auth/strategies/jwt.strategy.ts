import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { required } from '../../common/config/env.config.js';
import { JWT_PURPOSE } from '../../common/constants/jwt-purpose.constant.js';

import { AppJwtService } from '../../jwt/jwt.service.js';
import { JwtPayload } from '../../jwt/types/jwt-payload.type.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  public constructor(private readonly jwtService: AppJwtService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: required('JWT_SECRET'),
    });
  }

  public validate(payload: JwtPayload): JwtPayload {
    this.jwtService.ensureExpectedPurpose(payload.purpose, JWT_PURPOSE.SESSION);
    return payload;
  }
}
