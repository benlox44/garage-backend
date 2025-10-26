import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity.js';
import { UserCleanupService } from './tasks/user-cleanup.task.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

import { MailModule } from '../mail/mail.module.js';

@Module({
  imports: [MailModule, TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, UserCleanupService],
  exports: [UsersService],
})
export class UsersModule {}
