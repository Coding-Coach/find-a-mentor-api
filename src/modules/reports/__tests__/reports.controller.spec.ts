import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ReportsController } from '../reports.controller';
import { UsersService } from '../../common/users.service';
import { ReportsService } from '../reports.service';
import { User, Role } from '../../common/interfaces/user.interface';
import { Totals } from '../interfaces/totals.interface';

class ServiceMock {}

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
  let reportsService: ReportsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: UsersService,
          useValue: new ServiceMock(),
        },
        {
          provide: ReportsService,
          useValue: new ServiceMock(),
        },
      ],
    }).compile();

    reportsController = module.get<ReportsController>(ReportsController);
    usersService = module.get<UsersService>(UsersService);
    reportsService = module.get<ReportsService>(ReportsService);
  });

  describe('users', () => {
    let request;

    beforeEach(() => {
      request = { user: { auth0Id: '123' } };
      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock('123'),
          roles: [Role.MEMBER, Role.ADMIN],
        } as User),
      );
    });

    it('should throw an error if is not an admin', async () => {
      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock('123'),
          roles: [Role.MEMBER],
        } as User),
      );

      await expect(reportsController.users(request, '', '')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return total number of users', async () => {
      const data: Totals = {
        total: 2500,
        admins: 2,
        members: 2000,
        mentors: 500,
      };
      const response = { success: true, data };

      reportsService.totalsByRole = jest.fn(() => Promise.resolve(data));

      expect(await reportsController.users(request, '', '')).toEqual(response);
    });

    it('should return total number of users by date range', async () => {
      const data: Totals = {
        total: 2500,
        admins: 2,
        members: 2000,
        mentors: 500,
      };
      const response = { success: true, data };

      reportsService.totalsByRole = jest.fn(() => Promise.resolve(data));

      expect(
        await reportsController.users(request, '2019-01-01', '2019-01-31'),
      ).toEqual(response);
    });
  });
});
