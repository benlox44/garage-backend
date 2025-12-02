import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import { AuthService } from './auth.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto.js';
import { RequestUnlockDto } from './dto/request-unlock.dto.js';
import { ResetPasswordAfterRevertDto } from './dto/reset-password-after-revert.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

/**
 * AuthController
 *
 * Controller responsible for handling authentication and authorization flows.
 *
 * Exposes endpoints organized by HTTP method:
 * - POST METHODS: Register, login, request password reset, reset password, request unlock.
 * - GET METHODS: Confirm email, revert email, unlock account using tokens.
 *
 * Routes manage user sessions and account recovery processes.
 */
@Controller('auth')
export class AuthController {
  public constructor(private readonly authService: AuthService) {}

  // ===== POST METHODS =====

  @Post()
  public async create(
    @Body() dto: CreateUserDto,
  ): Promise<{ message: string }> {
    await this.authService.create(dto);
    return { message: 'Confirmation email sent to ' + dto.email };
  }

  @Post('login')
  public async login(@Body() dto: LoginDto): Promise<{ access_token: string; user: any }> {
    const { accessToken, user } = await this.authService.login(dto);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;
    return { access_token: accessToken, user: safeUser };
  }

  @Post('request-password-reset')
  public async requestPasswordReset(
    @Body() dto: RequestPasswordResetDto,
  ): Promise<{ message: string }> {
    await this.authService.requestPasswordReset(dto);
    return {
      message: 'If your email is registered and is confirmed, a link was sent',
    };
  }

  @Post('reset-password')
  public async resetPassword(
    @Query('token') token: string,
    @Body() dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.resetPassword(token, dto);
    return { message: 'Password changed successfully' };
  }

  @Post('reset-password-after-revert')
  public async resetPasswordAfterRevert(
    @Query('token') token: string,
    @Body() dto: ResetPasswordAfterRevertDto,
  ): Promise<{ message: string }> {
    await this.authService.resetPasswordAfterRevert(token, dto);
    return { message: 'Password changed successfully' };
  }

  @Post('request-unlock')
  public async requestUnlock(
    @Body() dto: RequestUnlockDto,
  ): Promise<{ message: string }> {
    await this.authService.requestUnlock(dto);
    return {
      message: 'If your email is registered and is locked, a link was sent',
    };
  }

  // ===== GET METHODS =====

  @Get('confirm-email')
  public async confirmEmail(
    @Query('token') token: string,
  ): Promise<{ message: string }> {
    await this.authService.confirmEmail(token);
    return { message: 'Email confirmed successfuly' };
  }

  @Get('confirm-email-update')
  public async confirmEmailUpdate(
    @Query('token') token: string,
  ): Promise<{ message: string }> {
    await this.authService.confirmEmailUpdate(token);
    return { message: 'Email changed successfully' };
  }

  @Get('revert-email')
  public async revertEmail(
    @Query('token') token: string,
  ): Promise<{ reset_token: string }> {
    const reset_token = await this.authService.revertEmail(token);
    return { reset_token };
  }

  @Get('unlock-account')
  public async unlockAccount(
    @Query('token') token: string,
  ): Promise<{ message: string }> {
    await this.authService.unlockAccount(token);
    return { message: 'Your account has been unlocked. You can now log in' };
  }
}
