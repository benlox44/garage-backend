import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { UsersService } from '../users.service.js';

@Injectable()
export class UserCleanupService implements OnModuleInit {
  private readonly logger = new Logger(UserCleanupService.name);

  public constructor(private readonly usersService: UsersService) {}

  public async onModuleInit(): Promise<void> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await this.usersService.deleteUnconfirmedOlderThan(oneDayAgo);
    this.logger.log(
      `🧹 [Init] Deleted unconfirmed users older than 24h: ${result.affected}`,
    );
  }
}
