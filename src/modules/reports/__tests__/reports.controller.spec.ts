import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ReportsController } from '../reports.controller';
import { UsersService } from '../../common/users.service';
import { User, Role } from '../../common/interfaces/user.interface';

class ServiceMock { }

class ObjectIdMock {
  current: string;

  constructor(current: string) {
    this.current = current;
  }
  equals(value) {
    return this.current === value.current;
  }
}

describe('modules/reports/ReportsController', () => {
  let reportsController: ReportsController;
  let usersService: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [{
        provide: UsersService,
        useValue: new ServiceMock(),
      }],
    }).compile();

    reportsController = module.get<ReportsController>(ReportsController);
    usersService = module.get<UsersService>(UsersService);
  });

  describe('users', () => {
    let request;

    beforeEach(() => {
      request = { user: { auth0Id: '123' } };
      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock('123'), roles: [Role.MEMBER, Role.ADMIN] }));
    });

    it('should throw an error if is not an admin', async () => {
      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock('123'), roles: [Role.MEMBER] }));
      
      await expect(reportsController.users(request))
        .rejects
        .toThrow(UnauthorizedException);
    })
    
    it('should return total number of users', async () => {
      const data = {
        total: 2500,
        members: 2000,
        mentors: 500,
      };
      const response = { success: true, data };

      usersService.totalsByRole = jest.fn(() => Promise.resolve(data));

      expect(await reportsController.users(request)).toEqual(response);
    })
  });

});
