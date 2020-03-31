import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../../common/users.service';
import { EmailService } from '../../email/email.service';
import { MentorsService } from '../../common/mentors.service';
import { ListsService } from '../../lists/lists.service';
import { Auth0Service } from '../../common/auth0.service';
import { FileService } from '../../common/file.service';
import { UserDto } from '../../common/dto/user.dto';
import { User } from '../../common/interfaces/user.interface';

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

describe('modules/users/UsersController', () => {
  let usersController: UsersController;
  let usersService: UsersService;
  let emailService: EmailService;
  let mentorsService: MentorsService;
  let auth0Service: Auth0Service;
  let listService: ListsService;
  let fileService: FileService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: new ServiceMock(),
        },
        {
          provide: EmailService,
          useValue: new ServiceMock(),
        },
        {
          provide: MentorsService,
          useValue: new ServiceMock(),
        },
        {
          provide: Auth0Service,
          useValue: new ServiceMock(),
        },
        {
          provide: ListsService,
          useValue: new ServiceMock(),
        },
        {
          provide: FileService,
          useValue: new ServiceMock(),
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    usersController = module.get<UsersController>(UsersController);
    mentorsService = module.get<MentorsService>(MentorsService);
    auth0Service = module.get<Auth0Service>(Auth0Service);
    emailService = module.get<EmailService>(EmailService);
    listService = module.get<ListsService>(ListsService);
    fileService = module.get<FileService>(FileService);
  });

  describe('index', () => {
    it('should return all registered users', async () => {
      const data: User[] = [<User>{ _id: 123, name: 'Crysfel Villa' }];
      const response = { success: true, data };
      usersService.findAll = jest.fn(() => Promise.resolve(data));

      expect(await usersController.index()).toEqual(response);
    });
  });

  describe('currentUser', () => {
    let request;
    let data: User;
    let response;

    beforeEach(() => {
      request = { user: { auth0Id: '123' } };
      data = <User>{ _id: 123, name: 'Crysfel Villa' };
      response = { success: true, data };
    });

    it('should return the current user', async () => {
      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(data));

      expect(await usersController.currentUser(request)).toEqual(response);
    });

    it('should create a new user', async () => {
      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(undefined));
      usersService.findByEmail = jest.fn(() => Promise.resolve(undefined));
      usersService.create = jest.fn(() => Promise.resolve(data));
      emailService.send = jest.fn();
      listService.createList = jest.fn();
      auth0Service.getAdminAccessToken = jest.fn(() =>
        Promise.resolve({ access_token: 'abc' }),
      );
      auth0Service.getUserProfile = jest.fn(() =>
        Promise.resolve({ _id: '123' }),
      );

      expect(await usersController.currentUser(request)).toEqual(response);
      expect(usersService.create).toHaveBeenCalledTimes(1);
      expect(emailService.send).toHaveBeenCalledTimes(1);
      expect(listService.createList).toHaveBeenCalledTimes(1);
    });

    it('should link an existing mentor', async () => {
      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(undefined));
      usersService.findByEmail = jest.fn(() => Promise.resolve(data));
      usersService.update = jest.fn(() => Promise.resolve());
      emailService.send = jest.fn();
      auth0Service.getAdminAccessToken = jest.fn(() =>
        Promise.resolve({ access_token: 'abc' }),
      );
      auth0Service.getUserProfile = jest.fn(() =>
        Promise.resolve({ _id: '123' }),
      );

      expect(await usersController.currentUser(request)).toEqual(response);
      expect(usersService.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('show', () => {
    it('should return a user', async () => {
      const params = { id: 123 };
      const data: User = <User>{ _id: 123, name: 'Crysfel Villa' };
      const response = { success: true, data };

      usersService.findById = jest.fn(() => Promise.resolve(data));

      expect(await usersController.show(params)).toEqual(response);
      expect(usersService.findById).toHaveBeenCalledTimes(1);
      expect(usersService.findById).toHaveBeenCalledWith(params.id);
    });

    it('should throw an error when user not found', async () => {
      const params = { id: 123 };

      usersService.findById = jest.fn(() => Promise.resolve(undefined));

      await expect(usersController.show(params)).rejects.toThrow(
        BadRequestException,
      );
      expect(usersService.findById).toHaveBeenCalledTimes(1);
      expect(usersService.findById).toHaveBeenCalledWith(params.id);
    });
  });

  describe('update', () => {
    let request;
    let params;
    let data;
    let response;

    beforeEach(async () => {
      request = { user: { auth0Id: '123' } };
      params = { id: 123 };
      data = new UserDto({});
      response = { success: true };
    });

    it('should throw error if user not found', async () => {
      usersService.findByAuth0Id = jest.fn();
      usersService.findById = jest.fn();

      await expect(
        usersController.update(request, params, data),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if updating other user as a non Admin', async () => {
      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve(<User>{ _id: new ObjectIdMock('456'), roles: [] }),
      );
      usersService.findById = jest.fn(() =>
        Promise.resolve(<User>{ _id: new ObjectIdMock('123') }),
      );

      await expect(
        usersController.update(request, params, data),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should not update roles if not an Admin', async () => {
      const original = <User>{
        _id: new ObjectIdMock('123'),
        roles: ['Member'],
      };
      const data = new UserDto({
        name: 'Crysfel Villa',
        avatar: 'test.jpg',
        roles: ['Admin', 'SomethingElse'],
      });

      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve(<User>{
          _id: new ObjectIdMock('123'),
          roles: ['Member'],
        }),
      );
      usersService.findById = jest.fn(() => Promise.resolve(original));
      usersService.update = jest.fn(() => Promise.resolve({ ok: 1 }));

      expect(await usersController.update(request, params, data)).toEqual(
        response,
      );
      expect(usersService.update).toHaveBeenCalledTimes(1);
      expect(usersService.update).toHaveBeenCalledWith({
        ...original,
        avatar: 'test.jpg',
        name: 'Crysfel Villa',
      });
    });

    it('should update roles if is an admin', async () => {
      const request = { user: { auth0Id: '123' } };
      const response = { success: true };
      const params = { id: 123 };
      const original = <User>{
        _id: new ObjectIdMock('123'),
        roles: ['Member'],
      };
      const data = new UserDto({
        name: 'Crysfel Villa',
        avatar: 'test.jpg',
        roles: ['Member', 'Admin'],
      });

      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve(<User>{
          _id: new ObjectIdMock('123'),
          roles: ['Admin'],
        }),
      );
      usersService.findById = jest.fn(() => Promise.resolve(original));
      usersService.update = jest.fn(() => Promise.resolve({ ok: 1 }));

      expect(await usersController.update(request, params, data)).toEqual(
        response,
      );
      expect(usersService.update).toHaveBeenCalledTimes(1);
      expect(usersService.update).toHaveBeenCalledWith({
        ...original,
        avatar: 'test.jpg',
        name: 'Crysfel Villa',
        roles: ['Member', 'Admin'],
      });
    });

    it('should not update the email', async () => {
      const original = <User>{
        _id: new ObjectIdMock('123'),
        email: 'test@test.com',
        roles: ['Member'],
      };
      const data = new UserDto({
        name: 'Crysfel Villa',
        email: 'should@ignore.com',
        avatar: 'test.jpg',
        roles: ['Member', 'Admin'],
      });

      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve(<User>{
          _id: new ObjectIdMock('123'),
          roles: ['Admin'],
        }),
      );
      usersService.findById = jest.fn(() => Promise.resolve(original));
      usersService.update = jest.fn(() => Promise.resolve({ ok: 1 }));

      expect(await usersController.update(request, params, data)).toEqual(
        response,
      );
      expect(usersService.update).toHaveBeenCalledTimes(1);
      expect(usersService.update).toHaveBeenCalledWith({
        ...original,
        avatar: 'test.jpg',
        name: 'Crysfel Villa',
        roles: ['Member', 'Admin'],
      });
    });
  });

  describe('remove', () => {
    let request;
    let params;
    let response;

    beforeEach(() => {
      request = {
        user: { auth0Id: '1234' },
      };
      params = { id: '1234' };
      response = { success: true };
    });

    it('should return success when removing a valid user', async () => {
      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve(<User>{
          _id: new ObjectIdMock(request.user.auth0Id),
          roles: [],
        }),
      );
      usersService.findById = jest.fn(() =>
        Promise.resolve(<User>{ _id: new ObjectIdMock(params.id) }),
      );
      usersService.remove = jest.fn(() => Promise.resolve({ ok: 1 }));
      mentorsService.removeAllApplicationsByUserId = jest.fn(() =>
        Promise.resolve(),
      );
      auth0Service.getAdminAccessToken = jest.fn(() => Promise.resolve({}));
      auth0Service.deleteUser = jest.fn(() => Promise.resolve());

      expect(await usersController.remove(request, params)).toEqual(response);
    });

    it('should throw an error when user not found', async () => {
      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve(<User>{
          _id: new ObjectIdMock(request.user.auth0Id),
          roles: [],
        }),
      );
      usersService.findById = jest.fn(() => undefined);

      await expect(usersController.remove(request, params)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw an error if trying to remove other user', async () => {
      const params = { id: '5678' };

      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve(<User>{
          _id: new ObjectIdMock(request.user.auth0Id),
          roles: [],
        }),
      );
      usersService.findById = jest.fn(() =>
        Promise.resolve(<User>{ _id: new ObjectIdMock(params.id) }),
      );

      await expect(usersController.remove(request, params)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should remove other user if is admin', async () => {
      const params = { id: '5678' };

      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve(<User>{
          _id: new ObjectIdMock(request.user.auth0Id),
          roles: ['Admin'],
        }),
      );
      usersService.findById = jest.fn(() =>
        Promise.resolve(<User>{ _id: new ObjectIdMock(params.id) }),
      );
      usersService.remove = jest.fn(() => Promise.resolve({ ok: 1 }));
      emailService.send = jest.fn();
      mentorsService.removeAllApplicationsByUserId = jest.fn(() =>
        Promise.resolve(),
      );
      auth0Service.getAdminAccessToken = jest.fn(() => Promise.resolve({}));
      auth0Service.deleteUser = jest.fn(() => Promise.resolve());

      expect(await usersController.remove(request, params)).toEqual(response);
    });

    it('should remove all previous applications', async () => {
      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve(<User>{
          _id: new ObjectIdMock(request.user.auth0Id),
          roles: [],
        }),
      );
      usersService.findById = jest.fn(() =>
        Promise.resolve(<User>{ _id: new ObjectIdMock(params.id) }),
      );
      usersService.remove = jest.fn(() => Promise.resolve({ ok: 1 }));
      mentorsService.removeAllApplicationsByUserId = jest.fn(() =>
        Promise.resolve(),
      );
      auth0Service.getAdminAccessToken = jest.fn(() => Promise.resolve({}));
      auth0Service.deleteUser = jest.fn(() => Promise.resolve());

      await usersController.remove(request, params);

      expect(
        mentorsService.removeAllApplicationsByUserId,
      ).toHaveBeenCalledTimes(1);
      expect(mentorsService.removeAllApplicationsByUserId).toHaveBeenCalledWith(
        params.id,
      );
    });

    it('should remove user from database', async () => {
      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve(<User>{
          _id: new ObjectIdMock(request.user.auth0Id),
          roles: [],
        }),
      );
      usersService.findById = jest.fn(() =>
        Promise.resolve(<User>{ _id: new ObjectIdMock(params.id) }),
      );
      usersService.remove = jest.fn(() => Promise.resolve({ ok: 1 }));
      mentorsService.removeAllApplicationsByUserId = jest.fn(() =>
        Promise.resolve(),
      );
      auth0Service.getAdminAccessToken = jest.fn(() => Promise.resolve({}));
      auth0Service.deleteUser = jest.fn(() => Promise.resolve());

      await usersController.remove(request, params);

      expect(usersService.remove).toHaveBeenCalledTimes(1);
      expect(usersService.remove).toHaveBeenCalledWith(params.id);
    });

    it('should remove user from auth0', async () => {
      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve(<User>{
          _id: new ObjectIdMock(request.user.auth0Id),
          roles: [],
        }),
      );
      usersService.findById = jest.fn(() =>
        Promise.resolve(<User>{
          _id: new ObjectIdMock(params.id),
          auth0Id: 'abcd',
        }),
      );
      usersService.remove = jest.fn(() => Promise.resolve({ ok: 1 }));
      mentorsService.removeAllApplicationsByUserId = jest.fn(() =>
        Promise.resolve(),
      );
      auth0Service.getAdminAccessToken = jest.fn(() =>
        Promise.resolve({ access_token: '159' }),
      );
      auth0Service.deleteUser = jest.fn(() => Promise.resolve());

      await usersController.remove(request, params);

      expect(auth0Service.getAdminAccessToken).toHaveBeenCalledTimes(1);
      expect(auth0Service.deleteUser).toHaveBeenCalledTimes(1);
      expect(auth0Service.deleteUser).toHaveBeenCalledWith('159', 'abcd');
    });

    it('should return an error if something fails', async () => {
      const response = { success: false, error: 'Something failed' };

      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve(<User>{
          _id: new ObjectIdMock(request.user.auth0Id),
          roles: [],
        }),
      );
      usersService.findById = jest.fn(() =>
        Promise.resolve(<User>{
          _id: new ObjectIdMock(params.id),
          auth0Id: 'abcd',
        }),
      );
      usersService.remove = jest.fn(() => Promise.resolve({ ok: 1 }));
      mentorsService.removeAllApplicationsByUserId = jest.fn(() =>
        Promise.resolve(),
      );
      auth0Service.getAdminAccessToken = jest.fn(() =>
        Promise.resolve({ access_token: '159' }),
      );
      auth0Service.deleteUser = jest.fn(() => {
        throw new Error('Something failed');
      });

      expect(await usersController.remove(request, params)).toEqual(response);
    });
  });

  describe('uploadAvatar', () => {
    let request;
    let params;
    let response;
    let image;

    beforeEach(() => {
      request = {
        user: { auth0Id: '1234' },
      };
      params = { id: '1234' };
      response = { success: true };
      image = { filename: 'image.png' };

      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve(<User>{
          _id: new ObjectIdMock(request.user.auth0Id),
          roles: [],
        }),
      );
      usersService.findById = jest.fn(() =>
        Promise.resolve(<User>{ _id: new ObjectIdMock(params.id) }),
      );
      fileService.createThumbnail = jest.fn(() => Promise.resolve(true));
    });

    it('should throw an error if no valid image is received', async () => {
      await expect(
        usersController.uploadAvatar(request, params, undefined),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw an error if user not found', async () => {
      usersService.findById = jest.fn(() => Promise.resolve(undefined));

      await expect(
        usersController.uploadAvatar(request, params, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw an error if updating other member and NOT an admin', async () => {
      usersService.findById = jest.fn(() =>
        Promise.resolve(<User>{ _id: new ObjectIdMock('432534') }),
      );

      await expect(
        usersController.uploadAvatar(request, params, {}),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should update the users image', async () => {
      usersService.update = jest.fn(() => Promise.resolve({ ok: 1 }));

      expect(
        await usersController.uploadAvatar(request, params, image),
      ).toEqual(response);
      expect(usersService.update).toHaveBeenCalledTimes(1);
      expect(fileService.createThumbnail).toHaveBeenCalledTimes(1);
    });

    it('should remove previous image', async () => {
      usersService.findById = jest.fn(() =>
        Promise.resolve(<User>{ _id: new ObjectIdMock(params.id), image: {} }),
      );
      fileService.removeFile = jest.fn(() => Promise.resolve(true));
      usersService.update = jest.fn(() => Promise.resolve({ ok: 1 }));

      expect(
        await usersController.uploadAvatar(request, params, image),
      ).toEqual(response);
      expect(fileService.removeFile).toHaveBeenCalledTimes(2);
      expect(usersService.update).toHaveBeenCalledTimes(1);
      expect(fileService.createThumbnail).toHaveBeenCalledTimes(1);
    });
  });
});
