import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';

import { CreateUserDto } from './dto/create-user.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto.js';
import { RequestUnlockDto } from './dto/request-unlock.dto.js';
import { ResetPasswordAfterRevertDto } from './dto/reset-password-after-revert.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

import { JWT_EXPIRES_IN } from '../common/constants/jwt-expires-in.constant.js';
import { JWT_PURPOSE } from '../common/constants/jwt-purpose.constant.js';
import { LOGIN_BLOCK } from '../common/constants/login-block.constant.js';
import { ROLE } from '../common/constants/role.constant.js';
import { AppJwtService } from '../jwt/jwt.service.js';
import { MailService } from '../mail/mail.service.js';
import { UsersRedisService } from '../redis/services/users-redis.service.js';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';


/**
 * AuthService
 *
 * Service responsible for authentication, registration,
 * password recovery, and email confirmation workflows.
 *
 * Provides methods grouped by type:
 * - GET methods: Handle token-based confirmations.
 * - POST methods: Handle login, registration and account recovery.
 * - AUXILIARY methods: Internal logic for validating credentials and generating tokens.
 */

@Injectable()
export class AuthService {
  public constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: AppJwtService,
    private readonly mailService: MailService,
    private readonly usersRedisService: UsersRedisService,
  ) {}

  // ===== GET METHODS (Token-based actios) =====

  public async confirmEmail(token: string): Promise<void> {
    const payload = await this.jwtService.verify(
      token,
      JWT_PURPOSE.CONFIRM_EMAIL,
    );
    const user = await this.usersService.findByIdOrThrow(payload.sub);

    if (user.isEmailConfirmed)
      throw new BadRequestException('Email Already confirmed');

    user.isEmailConfirmed = true;
    await this.usersService.save(user);
    await this.jwtService.markAsUsed(payload.jti, JWT_EXPIRES_IN.CONFIRM_EMAIL);
  }

  public async confirmEmailUpdate(token: string): Promise<void> {
    const payload = await this.jwtService.verify(
      token,
      JWT_PURPOSE.CONFIRM_EMAIL_UPDATE,
    );
    const user = await this.usersService.findByIdOrThrow(payload.sub);

    if (user.newEmail !== payload.email)
      throw new BadRequestException(
        'This confirmation link is no longer valid',
      );

    user.oldEmail = user.email;
    user.email = user.newEmail!;
    user.newEmail = null;
    user.emailChangedAt = new Date();
    await this.usersService.save(user);

    const revertToken = this.jwtService.sign(
      { purpose: JWT_PURPOSE.REVERT_EMAIL, sub: user.id, email: user.oldEmail },
      JWT_EXPIRES_IN.REVERT_EMAIL,
    );
    await this.mailService.sendRevertEmailChange(user.oldEmail, revertToken);
    await this.jwtService.markAsUsed(
      payload.jti,
      JWT_EXPIRES_IN.CONFIRM_EMAIL_UPDATE,
    );
  }

  public async revertEmail(token: string): Promise<string> {
    const payload = await this.jwtService.verify(
      token,
      JWT_PURPOSE.REVERT_EMAIL,
    );
    const user = await this.usersService.findByIdOrThrow(payload.sub);

    /** Token expires in 30d, and change is allowed only once per 30d
    no extra checks needed */
    user.email = user.oldEmail!;
    user.oldEmail = null;
    user.emailChangedAt = null;

    await this.usersService.save(user);
    await this.jwtService.markAsUsed(payload.jti, JWT_EXPIRES_IN.REVERT_EMAIL);

    return this.jwtService.sign(
      {
        purpose: JWT_PURPOSE.RESET_PASSWORD_AFTER_REVERT,
        sub: user.id,
        email: user.email,
      },
      JWT_EXPIRES_IN.RESET_PASSWORD,
    );
  }

  public async unlockAccount(token: string): Promise<void> {
    const payload = await this.jwtService.verify(
      token,
      JWT_PURPOSE.UNLOCK_ACCOUNT,
    );
    const user = await this.usersService.findByIdOrThrow(payload.sub);

    if (!user.isLocked) {
      throw new BadRequestException('Account is already unlocked');
    }

    user.isLocked = false;
    await this.usersService.save(user);

    await this.jwtService.markAsUsed(
      payload.jti,
      JWT_EXPIRES_IN.UNLOCK_ACCOUNT,
    );
  }

  // ===== POST METHODS (Credentials, registration & recovery) =====

  public async create(dto: CreateUserDto): Promise<void> {
    await this.usersService.ensureEmailIsAvailable(dto.email);

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const isAdmin = this.isAdminEmail(dto.email);
    const user = await this.usersService.save({
      // Pick only allowed fields explicitly to avoid role injection
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      // Auto-assign ADMIN role if email is in ADMIN_EMAILS
      role: isAdmin ? ROLE.ADMIN : undefined,
    } as User);

    const token = this.jwtService.sign(
      { purpose: JWT_PURPOSE.CONFIRM_EMAIL, sub: user.id, email: user.email },
      JWT_EXPIRES_IN.CONFIRM_EMAIL,
    );
    await this.mailService.sendConfirmationEmail(user.email, token);
  }

  public async login(dto: LoginDto): Promise<string> {
    const user = await this.validateUserCredentials(dto);

    // Promote to ADMIN if email matches ADMIN_EMAILS
    if (user.role !== ROLE.ADMIN && this.isAdminEmail(user.email)) {
      await this.usersService.promoteToAdmin(user.id);
    }

    const accesToken = this.jwtService.sign(
      { purpose: JWT_PURPOSE.SESSION, sub: user.id, email: user.email },
      JWT_EXPIRES_IN.SESSION,
    );
    return accesToken;
  }

  // Removed: requestConfirmationEmail. Tokens last 1 day; accounts older than
  // 24h and unconfirmed are deleted automatically on startup.

  public async requestPasswordReset(
    dto: RequestPasswordResetDto,
  ): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.isEmailConfirmed) return;

    const token = this.jwtService.sign(
      {
        purpose: JWT_PURPOSE.RESET_PASSWORD,
        sub: user.id,
        email: user.email,
      },
      JWT_EXPIRES_IN.RESET_PASSWORD,
    );
    await this.mailService.sendPasswordReset(user.email, token);
  }

  public async resetPassword(
    token: string,
    dto: ResetPasswordDto,
  ): Promise<void> {
    const payload = await this.jwtService.verify(
      token,
      JWT_PURPOSE.RESET_PASSWORD,
    );
    const user = await this.usersService.findByIdOrThrow(payload.sub);

    const match = await bcrypt.compare(dto.newPassword, user.password);
    if (match)
      throw new ConflictException(
        'New password must be different from the current one',
      );

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.save(user);
    await this.jwtService.markAsUsed(
      payload.jti,
      JWT_EXPIRES_IN.RESET_PASSWORD,
    );
  }

  public async resetPasswordAfterRevert(
    token: string,
    dto: ResetPasswordAfterRevertDto,
  ): Promise<void> {
    const payload = await this.jwtService.verify(
      token,
      JWT_PURPOSE.RESET_PASSWORD_AFTER_REVERT,
    );
    const user = await this.usersService.findByIdOrThrow(payload.sub);

    const match = await bcrypt.compare(dto.newPassword, user.password);
    if (match)
      throw new ConflictException(
        'New password must be different from the current one',
      );

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.save(user);
    await this.jwtService.markAsUsed(
      payload.jti,
      JWT_EXPIRES_IN.RESET_PASSWORD,
    );
  }

  public async requestUnlock(dto: RequestUnlockDto): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.isLocked) return;

    const token = this.jwtService.sign(
      {
        purpose: JWT_PURPOSE.UNLOCK_ACCOUNT,
        sub: user.id,
        email: user.email,
      },
      JWT_EXPIRES_IN.UNLOCK_ACCOUNT,
    );
    await this.mailService.sendUnlockAccount(user.email, token);
  }

  // ===== AUXILIARY METHODS =====

  private async validateUserCredentials(dto: LoginDto): Promise<User> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (user.isLocked) throw new ForbiddenException('Account is locked');

    const match = await bcrypt.compare(dto.password, user.password);

    if (!match) {
      const failures = await this.usersRedisService.incrementFailures(
        user.email,
      );

      if (failures >= LOGIN_BLOCK.MAX_FAILURES) {
        await this.usersService.lock(user.id);
        throw new ForbiddenException(
          'Account has been locked due to failed attempts',
        );
      }
      throw new UnauthorizedException('Invalid credentials');
    }
    await this.usersRedisService.resetFailures(user.email);

    if (!user.isEmailConfirmed)
      throw new ForbiddenException('Email not confirmed');
    return user;
  }

  // ===== INTERNAL UTILS =====
  private isAdminEmail(email: string): boolean {
    const raw = process.env.ADMIN_EMAILS || '';
    if (!raw) return false;
    const list = raw
      .split(/[\s,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    return list.includes(email.toLowerCase());
  }
}
