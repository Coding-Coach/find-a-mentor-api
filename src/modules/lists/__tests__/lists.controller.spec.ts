import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Request } from 'express';
import { ListsController } from '../lists.controller';
import { ListsService } from '../lists.service';
import { List } from '../interfaces/list.interface';
import { ListDto } from '../dto/list.dto';
import { UsersService } from '../../common/users.service';
import { Role, User } from '../../common/interfaces/user.interface';

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
  let listsService: ListsService;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ListsController],
      providers: [{
        provide: UsersService,
        useValue: new ServiceMock(),
      }, {
        provide: ListsService,
        useValue: new ServiceMock(),
      }],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    listsService = module.get<ListsService>(ListsService);
    listsController = module.get<ListsController>(ListsController);
  });

  describe('store', () => {
    let userId: string;
    let listDto: ListDto;
    let request: any;
    let response: any;

    beforeEach(() => {
      userId = '1234'
      listDto = new ListDto();
      request = { user: { auth0Id: '1234' } };
      response = { success: true, list: { _id: '12345' } };
      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(userId), roles: [Role.MEMBER, Role.ADMIN] }));
      usersService.findById = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(userId), roles: [Role.MEMBER] }));
      listsService.createList = jest.fn(() => Promise.resolve(<List>{ _id: '12345' }));
    });

    it('should throw an error when user not found', async () => {
      usersService.findById = jest.fn(() => Promise.resolve(undefined));

      await expect(listsController.store(<Request>request, userId, listDto))
        .rejects
        .toThrow(BadRequestException);
    });
    
    it('should throw an error when creating a list for other user', async () => {
      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock('1234'), roles: [Role.MEMBER] }));
      usersService.findById = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock('5678'), roles: [Role.MEMBER] }));

      await expect(listsController.store(<Request>request, userId, listDto))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('should add a list for other users if current user is the Admin', async () => {
      const _id = new ObjectIdMock('5678');
      usersService.findById = jest.fn(() => Promise.resolve(<User>{ _id, roles: [Role.MEMBER] }));

      expect(await listsController.store(request, userId, listDto)).toEqual(response);
      expect(listsService.createList).toHaveBeenCalledTimes(1);
      expect(listsService.createList).toHaveBeenCalledWith({
        ...listDto,
        user: { _id },
      });
    });

    it('should add a list for same user', async () => {
      expect(await listsController.store(request, userId, listDto)).toEqual(response);
      expect(listsService.createList).toHaveBeenCalledTimes(1);
      expect(listsService.createList).toHaveBeenCalledWith({
        ...listDto,
        user: { _id: new ObjectIdMock(userId) }
      });
    });
  });
});