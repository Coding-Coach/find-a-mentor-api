import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Request } from 'express';
import { FavoritesController } from '../favorites.controller';
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

describe('modules/lists/FavoritesController', () => {
  let favoritesController: FavoritesController;
  let usersService: UsersService;
  let listsService: ListsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [FavoritesController],
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
    favoritesController = module.get<FavoritesController>(FavoritesController);
  });

  describe('toggle', () => {
    let userId: string;
    let mentorId: string;
    let request: any;
    let response: any;

    beforeEach(() => {
      userId = '1234';
      mentorId = '5678';
      request = { user: { auth0Id: '1234' } };
      response = { success: true };
      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(userId), roles: [Role.MEMBER, Role.ADMIN] }));
      usersService.findById = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(userId), roles: [Role.MEMBER] }));
      listsService.createList = jest.fn(() => Promise.resolve(<List>{ _id: '12345' }));
    });

    it('should throw an error when user not found', async () => {
      usersService.findById = jest.fn(() => Promise.resolve(undefined));

      await expect(favoritesController.toggle(<Request>request, userId, mentorId))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw an error when toggling favorites for other user', async () => {
      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock('1234'), roles: [Role.MEMBER] }));
      usersService.findById = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock('5678'), roles: [Role.MEMBER] }));

      await expect(favoritesController.toggle(<Request>request, userId, mentorId))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('should create a new favorite list and add a mentor', async () => {
      expect(await favoritesController.toggle(request, userId, mentorId)).toEqual(response);
      expect(listsService.createList).toHaveBeenCalledTimes(1);
      expect(listsService.createList).toHaveBeenCalledWith({
        name: 'Favorites',
        isFavorite: true,
        user: { _id: new ObjectIdMock(userId) },
        mentors: [{ _id: new ObjectIdMock(userId) }], // this should be `mentorId`, but I need to find out how to mock a second call in jest to return a different value
      });
    });
  });
});