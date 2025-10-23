import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminGuard } from '../auth/guards/admin.guard.js';
import { MailModule } from '../mail/mail.module.js';

import { User } from './entities/user.entity.js';
import { UserCleanupService } from './tasks/user-cleanup.task.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [MailModule, TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, UserCleanupService, AdminGuard],
  exports: [UsersService],
})
export class UsersModule {}
