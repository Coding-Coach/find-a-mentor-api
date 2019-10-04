import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../../common/users.service';
import { EmailService } from '../../email/email.service';
import { MentorsService } from '../../common/mentors.service';
import { Auth0Service } from '../../common/auth0.service';
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
    mentorsService = module.get<MentorsService>(MentorsService);
    auth0Service = module.get<Auth0Service>(Auth0Service);
    emailService = module.get<EmailService>(EmailService);
  });

  describe('index', () => {
    it('should return all registered users', async () => {
      const data: User[] = [<User>({ _id: 123, name: 'Crysfel Villa'})];
      const response = { success: true, data };
      usersService.findAll = jest.fn(() => Promise.resolve(data));

      expect(await usersController.index()).toEqual(response);
    })
  });
  
  describe('currentUser', () => {
    it('should return the current user', async () => {
      const request = { user: { auth0Id: '123' } };
      const data: User = <User>({ _id: 123, name: 'Crysfel Villa'});
      const response = { success: true, data };
      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(data));

      expect(await usersController.currentUser(request)).toEqual(response);
    });

    it('should create a new user', async () => {
      const request = { user: { auth0Id: '123' } };
      const data: User = <User>({ _id: '123', name: 'Crysfel Villa' });
      const response = { success: true, data };

      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(undefined));
      usersService.findByEmail = jest.fn(() => Promise.resolve(undefined));
      usersService.create = jest.fn(() => Promise.resolve(data));
      emailService.send = jest.fn();
      auth0Service.getAdminAccessToken = jest.fn(() => Promise.resolve({ access_token: 'abc' }));
      auth0Service.getUserProfile = jest.fn(() => Promise.resolve({ _id: '123' }));

      expect(await usersController.currentUser(request)).toEqual(response);
      expect(usersService.create).toHaveBeenCalled();
      expect(emailService.send).toHaveBeenCalled();
    });
    
    it('should link an existing mentor', async () => {
      const request = { user: { auth0Id: '123' } };
      const data: User = <User>({ _id: '123', name: 'Crysfel Villa' });
      const response = { success: true, data };

      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(undefined));
      usersService.findByEmail = jest.fn(() => Promise.resolve(data));
      usersService.update = jest.fn(() => Promise.resolve());
      emailService.send = jest.fn();
      auth0Service.getAdminAccessToken = jest.fn(() => Promise.resolve({ access_token: 'abc' }));
      auth0Service.getUserProfile = jest.fn(() => Promise.resolve({ _id: '123' }));

      expect(await usersController.currentUser(request)).toEqual(response);
      expect(usersService.update).toHaveBeenCalled();
    });
  });

  describe('show', () => {
    it('should return a user', async () => {
      const params = { id: 123 };
      const data: User = <User>({ _id: 123, name: 'Crysfel Villa' });
      const response = { success: true, data };

      usersService.findById = jest.fn(() => Promise.resolve(data));

      expect(await usersController.show(params)).toEqual(response);
      expect(usersService.findById).toHaveBeenCalled();
      expect(usersService.findById).toHaveBeenCalledWith(params.id);
    });

    it('should throw an error when user not found', async () => {
      const params = { id: 123 };

      usersService.findById = jest.fn(() => Promise.resolve(undefined));

      await expect(usersController.show(params))
        .rejects
        .toThrow(BadRequestException);
      expect(usersService.findById).toHaveBeenCalled();
      expect(usersService.findById).toHaveBeenCalledWith(params.id);
    });
  })

  describe('update', () => {
    it('should throw error if user not found', async () => {
      const request = { user: { auth0Id: '123' } };
      const params = { id: 123 };
      const data = new UserDto({});

      usersService.findByAuth0Id = jest.fn();
      usersService.findById = jest.fn();

      await expect(usersController.update(request, params, data))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw error if updating other user as a non Admin', async () => {
      const request = { user: { auth0Id: '123' } };
      const params = { id: 123 };
      const data = new UserDto({});

      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock('456'), roles: []}));
      usersService.findById = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock('123'), }));

      await expect(usersController.update(request, params, data))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('should not update roles if not an Admin', async () => {
      const request = { user: { auth0Id: '123' } };
      const response = { success: true }
      const params = { id: 123 };
      const original = <User>{ _id: new ObjectIdMock('123'), roles: ['Member'] }
      const data = new UserDto({ name: 'Crysfel Villa', avatar: 'test.jpg', roles: ['Admin', 'SomethingElse'] });

      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock('123'), roles: ['Member'] }));
      usersService.findById = jest.fn(() => Promise.resolve(original));
      usersService.update = jest.fn(() => Promise.resolve({ ok: 1 }));

      expect(await usersController.update(request, params, data)).toEqual(response);
      expect(usersService.update).toHaveBeenCalled();
      expect(usersService.update).toHaveBeenCalledWith({
        ...original,
        avatar: 'test.jpg',
        name: 'Crysfel Villa',
      });
    });

    it('should update roles if is an admin', async () => {
      const request = { user: { auth0Id: '123' } };
      const response = { success: true }
      const params = { id: 123 };
      const original = <User>{ _id: new ObjectIdMock('123'), roles: ['Member'] }
      const data = new UserDto({ name: 'Crysfel Villa', avatar: 'test.jpg', roles: ['Member', 'Admin'] });

      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock('123'), roles: ['Admin'] }));
      usersService.findById = jest.fn(() => Promise.resolve(original));
      usersService.update = jest.fn(() => Promise.resolve({ ok: 1 }));

      expect(await usersController.update(request, params, data)).toEqual(response);
      expect(usersService.update).toHaveBeenCalled();
      expect(usersService.update).toHaveBeenCalledWith({
        ...original,
        avatar: 'test.jpg',
        name: 'Crysfel Villa',
        roles: ['Member', 'Admin'],
      });
    });

    it('should not update the email', async () => {
      const request = { user: { auth0Id: '123' } };
      const response = { success: true }
      const params = { id: 123 };
      const original = <User>{ _id: new ObjectIdMock('123'), email: 'test@test.com', roles: ['Member'] }
      const data = new UserDto({ name: 'Crysfel Villa', email: 'should@ignore.com', avatar: 'test.jpg', roles: ['Member', 'Admin'] });

      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock('123'), roles: ['Admin'] }));
      usersService.findById = jest.fn(() => Promise.resolve(original));
      usersService.update = jest.fn(() => Promise.resolve({ ok: 1 }));

      expect(await usersController.update(request, params, data)).toEqual(response);
      expect(usersService.update).toHaveBeenCalled();
      expect(usersService.update).toHaveBeenCalledWith({
        ...original,
        avatar: 'test.jpg',
        name: 'Crysfel Villa',
        roles: ['Member', 'Admin'],
      });
    });
  })

  describe('remove', () => {
    it('should return success when removing a valid user', async () => {
      const request = {
        user: { auth0Id: '1234' },
      };
      const params = { id: '1234' };
      const response = { success: true };

      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(request.user.auth0Id), roles: [] }));
      usersService.findById = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(params.id) }));
      usersService.remove = jest.fn(() => Promise.resolve({ ok: 1 }));
      mentorsService.removeAllApplicationsByUserId = jest.fn(() => Promise.resolve());
      auth0Service.getAdminAccessToken = jest.fn(() => Promise.resolve({}));
      auth0Service.deleteUser = jest.fn(() => Promise.resolve());

      expect(await usersController.remove(request, params)).toEqual(response);
    });
    
    it('should throw an error when user not found', async () => {
      const request = {
        user: { auth0Id: '1234' },
      };
      const params = { id: '1234' };

      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(request.user.auth0Id), roles: [] }));
      usersService.findById = jest.fn(() => undefined);

      await expect(usersController.remove(request, params))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw an error if trying to remove other user', async () => {
      const request = {
        user: { auth0Id: '1234' },
      };
      const params = { id: '5678' };

      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(request.user.auth0Id), roles: [] }));
      usersService.findById = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(params.id) }));

      await expect(usersController.remove(request, params))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('should remove other user if is admin', async () => {
      const request = {
        user: { auth0Id: '1234' },
      };
      const params = { id: '5678' };
      const response = { success: true };

      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(request.user.auth0Id), roles: ['Admin'] }));
      usersService.findById = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(params.id) }));
      usersService.remove = jest.fn(() => Promise.resolve({ ok: 1 }));
      mentorsService.removeAllApplicationsByUserId = jest.fn(() => Promise.resolve());
      auth0Service.getAdminAccessToken = jest.fn(() => Promise.resolve({}));
      auth0Service.deleteUser = jest.fn(() => Promise.resolve());

      expect(await usersController.remove(request, params)).toEqual(response);
    });

    it('should remove all previous applications', async () => {
      const request = {
        user: { auth0Id: '1234' },
      };
      const params = { id: '1234' };

      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(request.user.auth0Id), roles: [] }));
      usersService.findById = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(params.id) }));
      usersService.remove = jest.fn(() => Promise.resolve({ ok: 1 }));
      mentorsService.removeAllApplicationsByUserId = jest.fn(() => Promise.resolve());
      auth0Service.getAdminAccessToken = jest.fn(() => Promise.resolve({}));
      auth0Service.deleteUser = jest.fn(() => Promise.resolve());

      await usersController.remove(request, params)

      expect(mentorsService.removeAllApplicationsByUserId).toHaveBeenCalled();
      expect(mentorsService.removeAllApplicationsByUserId).toHaveBeenCalledWith(params.id);
    });

    it('should remove user from database', async () => {
      const request = {
        user: { auth0Id: '1234' },
      };
      const params = { id: '1234' };

      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(request.user.auth0Id), roles: [] }));
      usersService.findById = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(params.id) }));
      usersService.remove = jest.fn(() => Promise.resolve({ ok: 1 }));
      mentorsService.removeAllApplicationsByUserId = jest.fn(() => Promise.resolve());
      auth0Service.getAdminAccessToken = jest.fn(() => Promise.resolve({}));
      auth0Service.deleteUser = jest.fn(() => Promise.resolve());

      await usersController.remove(request, params)

      expect(usersService.remove).toHaveBeenCalled();
      expect(usersService.remove).toHaveBeenCalledWith(params.id);
    });

    it('should remove user from auth0', async () => {
      const request = {
        user: { auth0Id: '1234' },
      };
      const params = { id: '1234' };

      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(request.user.auth0Id), roles: [] }));
      usersService.findById = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(params.id), auth0Id: 'abcd' }));
      usersService.remove = jest.fn(() => Promise.resolve({ ok: 1 }));
      mentorsService.removeAllApplicationsByUserId = jest.fn(() => Promise.resolve());
      auth0Service.getAdminAccessToken = jest.fn(() => Promise.resolve({ access_token: '159' }));
      auth0Service.deleteUser = jest.fn(() => Promise.resolve());

      await usersController.remove(request, params)

      expect(auth0Service.getAdminAccessToken).toHaveBeenCalled();
      expect(auth0Service.deleteUser).toHaveBeenCalled();
      expect(auth0Service.deleteUser).toHaveBeenCalledWith('159', 'abcd');
    });

    it('should return an error if something fails', async () => {
      const request = {
        user: { auth0Id: '1234' },
      };
      const params = { id: '1234' };
      const response = { success: false, error: 'Something failed' };

      usersService.findByAuth0Id = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(request.user.auth0Id), roles: [] }));
      usersService.findById = jest.fn(() => Promise.resolve(<User>{ _id: new ObjectIdMock(params.id), auth0Id: 'abcd' }));
      usersService.remove = jest.fn(() => Promise.resolve({ ok: 1 }));
      mentorsService.removeAllApplicationsByUserId = jest.fn(() => Promise.resolve());
      auth0Service.getAdminAccessToken = jest.fn(() => Promise.resolve({ access_token: '159' }));
      auth0Service.deleteUser = jest.fn(() => { throw new Error('Something failed') });

      expect(await usersController.remove(request, params)).toEqual(response);
    });
  });
});