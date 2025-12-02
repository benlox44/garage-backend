import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory/inventory.service';
import { InventoryItem } from './inventory/entities/inventory-item.entity';
import { NotificationsService } from './notifications/notifications.service';
import { UsersService } from './users/users.service';
import { AuthService } from './auth/auth.service';
import { AppJwtService } from './jwt/jwt.service';
import { MailService } from './mail/mail.service';
import { UsersRedisService } from './redis/services/users-redis.service';
import { User } from './users/entities/user.entity';
import { NOTIFICATION_TYPE } from './common/constants/notification-type.constant';
import { ROLE } from './common/constants/role.constant';
import { LOGIN_BLOCK } from './common/constants/login-block.constant';
import bcrypt from 'bcryptjs';

// Mock MailService to avoid import.meta.url issues in Jest/CJS environment
jest.mock('./mail/mail.service', () => {
  return {
    MailService: class MockMailService {}
  };
});

describe('Requirements Verification', () => {
  let inventoryService: InventoryService;
  let authService: AuthService;
  
  // Mocks
  let inventoryRepo: any;
  let notificationsService: any;
  let usersService: any;
  let jwtService: any;
  let mailService: any;
  let usersRedisService: any;

  beforeEach(async () => {
    // Reset mocks
    inventoryRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    notificationsService = {
      createNotification: jest.fn(),
    };
    usersService = {
      findAdmins: jest.fn(),
      findByEmail: jest.fn(),
      findByIdOrThrow: jest.fn(),
      save: jest.fn(),
      lock: jest.fn(),
      ensureEmailIsAvailable: jest.fn(),
    };
    jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
      markAsUsed: jest.fn(),
    };
    mailService = {
      sendConfirmationEmail: jest.fn(),
      sendRevertEmailChange: jest.fn(),
    };
    usersRedisService = {
      incrementFailures: jest.fn(),
      resetFailures: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        AuthService,
        { provide: getRepositoryToken(InventoryItem), useValue: inventoryRepo },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: UsersService, useValue: usersService },
        { provide: AppJwtService, useValue: jwtService },
        { provide: MailService, useValue: mailService },
        { provide: UsersRedisService, useValue: usersRedisService },
      ],
    }).compile();

    inventoryService = module.get<InventoryService>(InventoryService);
    authService = module.get<AuthService>(AuthService);
  });

  describe('Requirement 1: Critical Stock Notification', () => {
    it('should notify admins when stock drops below minStock', async () => {
      const item = {
        id: 1,
        name: 'Brake Pad',
        sku: 'BP-001',
        quantity: 10,
        minStock: 5,
      } as InventoryItem;

      const adminUser = { id: 99, email: 'admin@test.com', role: ROLE.ADMIN } as User;

      inventoryRepo.findOne.mockResolvedValue(item);
      // Simulate save returning the updated item
      inventoryRepo.save.mockImplementation((i: any) => Promise.resolve(i));
      usersService.findAdmins.mockResolvedValue([adminUser]);

      // Act: Reduce stock by 6 (10 - 6 = 4), which is < 5
      await inventoryService.updateStock(1, -6);

      // Assert
      expect(inventoryRepo.save).toHaveBeenCalled();
      expect(item.quantity).toBe(4);
      expect(usersService.findAdmins).toHaveBeenCalled();
      expect(notificationsService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 99,
          type: NOTIFICATION_TYPE.INVENTORY_LOW_STOCK,
          title: 'Alerta de Stock Crítico',
        })
      );
    });

    it('should NOT notify if stock remains above minStock', async () => {
      const item = {
        id: 1,
        name: 'Oil Filter',
        quantity: 20,
        minStock: 5,
      } as InventoryItem;

      inventoryRepo.findOne.mockResolvedValue(item);
      inventoryRepo.save.mockImplementation((i: any) => Promise.resolve(i));

      // Act: Reduce stock by 1 (20 - 1 = 19) > 5
      await inventoryService.updateStock(1, -1);

      // Assert
      expect(notificationsService.createNotification).not.toHaveBeenCalled();
    });
  });

  describe('Requirement 2: Login Security (Block after 5 failures)', () => {
    it('should lock account after MAX_FAILURES reached', async () => {
      const user = {
        id: 1,
        email: 'user@test.com',
        password: 'hashedPassword',
        isLocked: false,
        isEmailConfirmed: true,
      } as User;

      usersService.findByEmail.mockResolvedValue(user);
      // Mock bcrypt to fail
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));
      
      // Mock redis to return MAX_FAILURES (5)
      usersRedisService.incrementFailures.mockResolvedValue(LOGIN_BLOCK.MAX_FAILURES);

      // Act & Assert
      await expect(authService.login({ email: 'user@test.com', password: 'wrong' }))
        .rejects.toThrow(ForbiddenException); // 'Account has been locked...'

      expect(usersService.lock).toHaveBeenCalledWith(user.id);
    });

    it('should just throw Unauthorized if failures < MAX_FAILURES', async () => {
      const user = {
        id: 1,
        email: 'user@test.com',
        password: 'hashedPassword',
        isLocked: false,
        isEmailConfirmed: true,
      } as User;

      usersService.findByEmail.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));
      
      // Mock redis to return 1 failure
      usersRedisService.incrementFailures.mockResolvedValue(1);

      // Act & Assert
      await expect(authService.login({ email: 'user@test.com', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException); // 'Invalid credentials'

      expect(usersService.lock).not.toHaveBeenCalled();
    });
  });

  describe('Requirement 3: Email Change Reversion', () => {
    it('should save oldEmail and send revert token when confirming email update', async () => {
      const user = {
        id: 1,
        email: 'old@test.com',
        newEmail: 'new@test.com',
        oldEmail: null,
        emailChangedAt: null,
      } as User;

      const token = 'valid-token';
      const payload = { sub: 1, email: 'new@test.com' };

      jwtService.verify.mockResolvedValue(payload);
      usersService.findByIdOrThrow.mockResolvedValue(user);
      jwtService.sign.mockReturnValue('revert-token-123');

      // Act
      await authService.confirmEmailUpdate(token);

      // Assert
      expect(user.oldEmail).toBe('old@test.com');
      expect(user.email).toBe('new@test.com');
      expect(user.newEmail).toBeNull();
      expect(user.emailChangedAt).toBeInstanceOf(Date);
      
      expect(usersService.save).toHaveBeenCalledWith(user);
      
      expect(mailService.sendRevertEmailChange).toHaveBeenCalledWith(
        'old@test.com',
        'revert-token-123'
      );
    });
  });
});
