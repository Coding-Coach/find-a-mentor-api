import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Request } from 'express';
import { ListsController } from '../lists.controller';
import { ListsService } from '../lists.service';
import { List } from '../interfaces/list.interface';
import { ListDto } from '../dto/list.dto';
import { UsersService } from '../../common/users.service';
import { Role, User } from '../../common/interfaces/user.interface';
import { UpdateList } from '../interfaces/updatelist.interface';

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
      listDto = new ListDto({});
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

  describe('myLists', () => {
    let userId: string;
    let request: any;
    const testUserList = [
      {
        public: true,
        isFavorite: false,
        _id: '1234',
        user: "testUser",
        name: 'Designers',
        mentors: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        public: false,
        isFavorite: false,
        _id: '12345',
        user: "testUser1",
        name: 'Python Mentors',
        mentors: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    beforeEach(() => {
      userId = '1234';
      request = { user: { auth0Id: '1234' } };
    });

    it('should throw an error when user is not found', async () => {
      usersService.findById = jest.fn(() => Promise.resolve(undefined));
      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(userId), roles: [Role.MEMBER] }));
      listsService.findByUserId = jest.fn(() => Promise.resolve(<List[]>testUserList));

      await expect(listsController.myList(<Request>request, userId))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should show all lists for a user both public and private if user is current user', async () => {
      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(userId), roles: [Role.MEMBER] }));
      usersService.findById = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(userId), roles: [Role.MEMBER] }));
      listsService.findByUserId = jest.fn(() => Promise.resolve(<List[]>testUserList));
      const response = await listsController.myList(<Request>request, userId);
      expect(response.success).toBe(true);
      expect(response.lists.length).toBe(2);
      expect(response.lists).toMatchObject(testUserList)
    });

    it('should show all lists for a user both public and private if user is current admin', async () => {
      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock('54367'), roles: [Role.ADMIN] }));
      usersService.findById = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(userId), roles: [Role.MEMBER] }));
      listsService.findByUserId = jest.fn(() => Promise.resolve(<List[]>testUserList));
      const response = await listsController.myList(<Request>request, userId);
      expect(response.success).toBe(true);
      expect(response.lists.length).toBe(2);
      expect(response.lists).toMatchObject(testUserList)
    })

    it('should show only public lists if user is not current user or admin', async () => {
      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock('54367'), roles: [Role.MEMBER] }));
      usersService.findById = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(userId), roles: [Role.MEMBER] }));
      listsService.findByUserId = jest.fn(() => Promise.resolve(<List[]>[testUserList[0]]));
      const response = await listsController.myList(<Request>request, userId);
      expect(response.success).toBe(true);
      expect(response.lists.length).toBe(1);
      expect(response.lists).toMatchObject([testUserList[0]])
    })
  })

  describe('updateList', () => {
    let userId: string;
    let listId: string;
    let request: any;
    const testUserList = [
      {
        public: true,
        isFavorite: true,
        _id: '1234',
        user: "testUser",
        name: 'Designers',
        mentors: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        public: false,
        isFavorite: false,
        _id: '12345',
        user: "testUser1",
        name: 'Python Mentors',
        mentors: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    beforeEach(() => {
      userId = '1234';
      listId = '12345';
      request = { user: { auth0Id: '1234' } };
    });
    it('should throw an error when name is not provided', async () => {
      usersService.findById = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(userId), roles: [Role.MEMBER] }));
      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(userId), roles: [Role.MEMBER] }));
      const data: UpdateList = {
        public: true
      }
      await expect(listsController.updateList(<Request>request, userId, listId, data))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw an error when user is not found', async () => {
      usersService.findById = jest.fn(() => Promise.resolve(undefined));
      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(userId), roles: [Role.MEMBER] }));
      const data: UpdateList = {
        name: 'some random name',
        public: true
      }
      await expect(listsController.updateList(<Request>request, userId, listId, data))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw an error when updating a list for other user', async () => {
      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock('1234'), roles: [Role.MEMBER] }));
      usersService.findById = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock('5678'), roles: [Role.MEMBER] }));

      const data: UpdateList = {
        name: 'some random name',
        public: true
      }
      await expect(listsController.updateList(<Request>request, userId, listId, data))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('should throw an error if list is not found', async () => {
      usersService.findById = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(userId), roles: [Role.MEMBER] }));
      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(userId), roles: [Role.MEMBER] }));
      listsService.findByUserId = jest.fn(() => Promise.resolve(<List[]>[]));
      const data: UpdateList = {
        name: 'some random name',
        public: true
      }
      await expect(listsController.updateList(<Request>request, userId, listId, data))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw an error if list is favorite', async () => {
      usersService.findById = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(userId), roles: [Role.MEMBER] }));
      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(userId), roles: [Role.MEMBER] }));
      listsService.findByUserId = jest.fn(() => Promise.resolve(<List[]>[testUserList[0]]));
      const data: UpdateList = {
        name: 'some random name',
        public: true
      }
      await expect(listsController.updateList(<Request>request, userId, listId, data))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should update a list succesfully', async () => {
      usersService.findById = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(userId), roles: [Role.MEMBER] }));
      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(userId), roles: [Role.MEMBER] }));
      listsService.findByUserId = jest.fn(() => Promise.resolve(<List[]>[testUserList[1]]));
      listsService.update = jest.fn(() => Promise.resolve());
      const data: UpdateList = {
        name: 'some random name',
        public: true
      };
      await listsController.updateList(<Request>request, userId, listId, data);
      expect(listsService.update).toBeCalledTimes(1);
      expect(listsService.update).toHaveBeenCalledWith({
        _id: listId,
        ...data
      });

    });
  })
});
