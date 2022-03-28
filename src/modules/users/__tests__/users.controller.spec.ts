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
import { User, Role } from '../../common/interfaces/user.interface';
import { MentorshipsService } from '../../mentorships/mentorships.service';

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
  let mentorshipsService: MentorshipsService;

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
        {
          provide: MentorshipsService,
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
    mentorshipsService = module.get<MentorshipsService>(MentorshipsService);
  });

  describe('index', () => {
    it('should return an error if current user is not an admin', async () => {
      const request = { user: { auth0Id: '123' } };

      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({ _id: new ObjectIdMock('123'), roles: [] } as User),
      );
      usersService.findAll = jest.fn(() => Promise.resolve([]));

      await expect(usersController.index(request)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return all registered users', async () => {
      const request = { user: { auth0Id: '123' } };
      const data: User[] = [{ _id: 123, name: 'Crysfel Villa' } as User];
      const response = { success: true, data };

      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock('123'),
          roles: [Role.ADMIN],
        } as User),
      );
      usersService.findAll = jest.fn(() => Promise.resolve(data));

      expect(await usersController.index(request)).toEqual(response);
    });
  });

  describe('currentUser', () => {
    let request;
    let data: User;
    let response;

    beforeEach(() => {
      request = { user: { auth0Id: '123' } };
      data = { _id: 123, name: 'Crysfel Villa' } as User;
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
      emailService.sendLocalTemplate = jest.fn();
      listService.createList = jest.fn();
      auth0Service.getAdminAccessToken = jest.fn(() =>
        Promise.resolve({ access_token: 'abc' }),
      );
      auth0Service.getUserProfile = jest.fn(() =>
        Promise.resolve({ _id: '123' }),
      );

      expect(await usersController.currentUser(request)).toEqual(response);
      expect(usersService.create).toHaveBeenCalledTimes(1);
      expect(emailService.sendLocalTemplate).toHaveBeenCalledTimes(1);
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
      const data: User = {
        _id: 123,
        name: 'Crysfel Villa',
        email: 'test@testing.com',
        channels: [],
      } as User;
      const response = { success: true, data };
      const request = { user: { auth0Id: '456' } };

      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock('456'),
          roles: [Role.ADMIN],
        } as User),
      );
      usersService.findById = jest.fn(() => Promise.resolve(data));
      mentorshipsService.findMentorshipsByUser = jest.fn(() =>
        Promise.resolve([]),
      );

      expect(await usersController.show(request, params)).toEqual(response);
      expect(usersService.findById).toHaveBeenCalledTimes(1);
      expect(usersService.findById).toHaveBeenCalledWith(params.id);
    });

    it('should hide email if not admin or own user', async () => {
      const params = { id: 123 };
      const data: User = {
        _id: 123,
        name: 'Crysfel Villa',
        email: 'test@testing.com',
      } as User;
      const request = { user: { auth0Id: '456' } };

      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock('456'),
          roles: [Role.MEMBER],
        } as User),
      );
      usersService.findById = jest.fn(() => Promise.resolve(data));
      mentorshipsService.findMentorshipsByUser = jest.fn(() =>
        Promise.resolve([]),
      );

      expect(await usersController.show(request, params)).toEqual({
        success: true,
        data: {
          _id: 123,
          name: 'Crysfel Villa',
          channels: [],
          email: undefined,
        },
      });
      expect(usersService.findById).toHaveBeenCalledTimes(1);
      expect(usersService.findById).toHaveBeenCalledWith(params.id);
    });

    it('should throw an error when user not found', async () => {
      const params = { id: 123 };
      const request = { user: { auth0Id: '123' } };

      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock('123'),
          roles: [Role.ADMIN],
        } as User),
      );
      usersService.findById = jest.fn(() => Promise.resolve(undefined));

      await expect(usersController.show(request, params)).rejects.toThrow(
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
        Promise.resolve({ _id: new ObjectIdMock('456'), roles: [] } as User),
      );
      usersService.findById = jest.fn(() =>
        Promise.resolve({ _id: new ObjectIdMock('123') } as User),
      );

      await expect(
        usersController.update(request, params, data),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should not update roles if not an Admin', async () => {
      const original = {
        _id: new ObjectIdMock('123'),
        roles: ['Member'],
      } as User;
      const data = new UserDto({
        name: 'Crysfel Villa',
        avatar: 'test.jpg',
        roles: [Role.ADMIN, Role.MENTOR],
      });

      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock('123'),
          roles: ['Member'],
        } as User),
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
      const original = {
        _id: new ObjectIdMock('123'),
        roles: ['Member'],
      } as User;
      const data = new UserDto({
        name: 'Crysfel Villa',
        avatar: 'test.jpg',
        roles: [Role.MEMBER, Role.ADMIN],
      });

      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock('123'),
          roles: ['Admin'],
        } as User),
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
      const original = {
        _id: new ObjectIdMock('123'),
        email: 'test@test.com',
        roles: ['Member'],
      } as User;
      const data = new UserDto({
        name: 'Crysfel Villa',
        email: 'should@ignore.com',
        avatar: 'test.jpg',
        roles: [Role.MEMBER, Role.ADMIN],
      });

      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock('123'),
          roles: ['Admin'],
        } as User),
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
        Promise.resolve({
          _id: new ObjectIdMock(request.user.auth0Id),
          roles: [],
        } as User),
      );
      usersService.findById = jest.fn(() =>
        Promise.resolve({ _id: new ObjectIdMock(params.id) } as User),
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
        Promise.resolve({
          _id: new ObjectIdMock(request.user.auth0Id),
          roles: [],
        } as User),
      );
      usersService.findById = jest.fn(() => undefined);

      await expect(usersController.remove(request, params)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw an error if trying to remove other user', async () => {
      const params = { id: '5678' };

      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(request.user.auth0Id),
          roles: [],
        } as User),
      );
      usersService.findById = jest.fn(() =>
        Promise.resolve({ _id: new ObjectIdMock(params.id) } as User),
      );

      await expect(usersController.remove(request, params)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should remove other user if is admin', async () => {
      const params = { id: '5678' };

      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(request.user.auth0Id),
          roles: ['Admin'],
        } as User),
      );
      usersService.findById = jest.fn(() =>
        Promise.resolve({ _id: new ObjectIdMock(params.id) } as User),
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
        Promise.resolve({
          _id: new ObjectIdMock(request.user.auth0Id),
          roles: [],
        } as User),
      );
      usersService.findById = jest.fn(() =>
        Promise.resolve({ _id: new ObjectIdMock(params.id) } as User),
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
        Promise.resolve({
          _id: new ObjectIdMock(request.user.auth0Id),
          roles: [],
        } as User),
      );
      usersService.findById = jest.fn(() =>
        Promise.resolve({ _id: new ObjectIdMock(params.id) } as User),
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
        Promise.resolve({
          _id: new ObjectIdMock(request.user.auth0Id),
          roles: [],
        } as User),
      );
      usersService.findById = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(params.id),
          auth0Id: 'abcd',
        } as User),
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
        Promise.resolve({
          _id: new ObjectIdMock(request.user.auth0Id),
          roles: [],
        } as User),
      );
      usersService.findById = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(params.id),
          auth0Id: 'abcd',
        } as User),
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
        Promise.resolve({
          _id: new ObjectIdMock(request.user.auth0Id),
          roles: [],
        } as User),
      );
      usersService.findById = jest.fn(() =>
        Promise.resolve({ _id: new ObjectIdMock(params.id) } as User),
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
        Promise.resolve({ _id: new ObjectIdMock('432534') } as User),
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
        Promise.resolve({
          _id: new ObjectIdMock(params.id),
          image: {},
        } as User),
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
