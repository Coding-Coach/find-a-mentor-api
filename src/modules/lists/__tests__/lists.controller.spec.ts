import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Request } from 'express';
import { ListsController } from '../lists.controller';
import { UsersService } from '../../common/users.service';
import { User } from '../../common/interfaces/user.interface';

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

describe('modules/lists/ListsController', () => {
  let listsController: ListsController;
  let usersService: UsersService;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ListsController],
      providers: [{
        provide: UsersService,
        useValue: new ServiceMock(),
      }],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    listsController = module.get<ListsController>(ListsController);
  });

  describe('store', () => {
    let userId: string;
    let request: any;

    beforeEach(() => {
      userId = '1234'
      request = { user: { auth0Id: '1234' } };
      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock('1234') }));
    });

    it('should throw an error when user not found', async () => {
      usersService.findById = jest.fn(() => Promise.resolve(undefined));

      await expect(listsController.store(<Request>request, userId))
        .rejects
        .toThrow(BadRequestException);
    });
    
    it('should throw an error when creating a list for other user', async () => {
      usersService.findById = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock('5678'), roles: ['Member'] }));

      await expect(listsController.store(<Request>request, userId))
        .rejects
        .toThrow(UnauthorizedException);
    });
  });
});