import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../../common/users.service';
import { EmailService } from '../../email/email.service';
import { MentorsService } from '../../common/mentors.service';
import { Auth0Service } from '../../common/auth0.service';
import { User } from '../../common/interfaces/user.interface';

class ServiceMock {}

describe('modules/users/UsersController', () => {
  let usersController: UsersController;
  let usersService: UsersService;
  let emailService: EmailService;
  let mentorsService: MentorsService;
  let auth0Service: Auth0Service;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{
          provide: UsersService,
          useValue: new ServiceMock(),
      }, {
        provide: EmailService,
        useValue: new ServiceMock(),
      }, {
        provide: MentorsService,
        useValue: new ServiceMock(),
      }, {
        provide: Auth0Service,
        useValue: new ServiceMock(),
      }],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    usersController = module.get<UsersController>(UsersController);
  });

  it('should return success when removing a valid user', async () => {
    usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: '123' }));
    usersService.findById = jest.fn(() => Promise.resolve(<User>{ _id: '123' }));

    const request = {
      user: { auth0Id: '1234' },
    };
    const params = { id: '123' };
    const response = { success: true };

    expect(await usersController.remove(request, params)).toEqual(response);
  });
  
  it('should throw an error when user not found', async () => {
    usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: '123' }));
    usersService.findById = jest.fn(() => undefined);

    const request = {
      user: { auth0Id: '1234' },
    };
    const params = { id: '123' };

    await expect(usersController.remove(request, params))
      .rejects
      .toThrow(BadRequestException);
  });
});