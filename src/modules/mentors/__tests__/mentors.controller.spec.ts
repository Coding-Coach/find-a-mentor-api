import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MentorsController } from '../../mentors/mentors.controller';
import { UsersService } from '../../common/users.service';
import { EmailService } from '../../email/email.service';
import { MentorsService } from '../../common/mentors.service';
import { User } from '../../common/interfaces/user.interface';
import { Application } from '../../common/interfaces/application.interface';
import { MentorFiltersDto } from '../../common/dto/mentorfilters.dto';
import { ApplicationDto } from '../../common/dto/application.dto';
import { Request } from 'express';

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

describe('modules/mentors/MentorsController', () => {
  let mentorsController: MentorsController;
  let usersService: UsersService;
  let emailService: EmailService;
  let mentorsService: MentorsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [MentorsController],
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
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    mentorsController = module.get<MentorsController>(MentorsController);
    mentorsService = module.get<MentorsService>(MentorsService);
    emailService = module.get<EmailService>(EmailService);
  });
  describe('index', () => {
    it('should return all mentors', async () => {
      const testMentorsData = {
        filters: {
          countries: [],
          languages: [],
          technologies: [],
        },
        pagination: {
          total: 1,
          page: 1,
          limit: 20,
          hasMore: false,
        },
        mentors: [
          {
            spokenLanguages: [],
            tags: [],
            _id: '12345',
            email: 'test@mail.com',
            name: 'testmentor',
            avatar: 'ddfwdf',
            channels: [],
            createdAt: '',
          },
        ],
      };
      const req: any = {
        user: { auth0Id: '1234' },
      };
      const testFilters = {
        tags: '',
      };
      mentorsService.findAll = jest.fn(() => Promise.resolve(testMentorsData));
      const data = await mentorsController.index(
        req as Request,
        testFilters as MentorFiltersDto,
      );
      expect(data.data).toMatchObject(testMentorsData.mentors);
      expect(data.success).toBe(true);
      expect(data.pagination).toBeTruthy();
    });
  });

  describe('featured', () => {
    const testMentor = {
      id: '1234',
    };
    const req: any = {
      user: { auth0Id: '1234' },
    };
    it('should return a single random mentor', async () => {
      mentorsService.findRandomMentor = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(testMentor.id),
          auth0Id: 'abcd',
        } as User),
      );
      const data = await mentorsController.featured(req as Request);
      expect(data.success).toBe(true);
      expect(data.data.auth0Id).toBe('abcd');
    });
  });

  describe('applications', () => {
    const req: any = {
      user: { auth0Id: '1234' },
    };

    it('should throw an error if user is not admin', async () => {
      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(req.user.auth0Id),
          roles: [],
        } as User),
      );
      await expect(
        mentorsController.applications(req as Request, ''),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return all applications', async () => {
      const testApplication = [
        {
          _id: '1234',
          status: '',
          description: 'Pending',
          reason: 'test',
          user: 'test user',
        },
        {
          _id: '12345',
          status: '',
          description: 'Approved',
          reason: 'test',
          user: 'test user',
        },
      ];
      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(req.user.auth0Id),
          roles: ['Admin'],
        } as User),
      );
      mentorsService.findApplications = jest.fn(() =>
        Promise.resolve(testApplication as Application[]),
      );
      const data = await mentorsController.applications(req as Request, '');
      expect(data.success).toBe(true);
      expect(data.data.length).toBe(2);
    });

    it('should return applications by the given status', async () => {
      const testApplication = [
        {
          _id: '1234',
          status: '',
          description: 'Pending',
          reason: 'test',
          user: 'test user',
        },
      ];
      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(req.user.auth0Id),
          roles: ['Admin'],
        } as User),
      );
      mentorsService.findApplications = jest.fn(() =>
        Promise.resolve(testApplication as Application[]),
      );
      const data = await mentorsController.applications(
        req as Request,
        'Pending',
      );
      expect(data.success).toBe(true);
      expect(data.data.length).toBe(1);
    });
  });

  describe(':userId/applications', () => {
    const req: any = {
      user: { auth0Id: '1234' },
    };
    it('should throw an error if user is not found', async () => {
      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(req.user.auth0Id),
          roles: [],
        } as User),
      );
      usersService.findById = jest.fn(() => undefined);
      await expect(
        mentorsController.myApplications(req, '123', ''),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw an error if user is not current user or admin', async () => {
      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(req.user.auth0Id),
          roles: [],
        } as User),
      );
      usersService.findById = jest.fn(() =>
        Promise.resolve({ _id: new ObjectIdMock('123') } as User),
      );
      await expect(
        mentorsController.myApplications(req, '123', ''),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return applications by the given status', async () => {
      const testApplication = [
        {
          _id: '1234',
          status: '',
          description: 'Pending',
          reason: 'test',
          user: 'test user',
        },
      ];
      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(req.user.auth0Id),
          roles: [],
        } as User),
      );
      usersService.findById = jest.fn(() =>
        Promise.resolve({ _id: new ObjectIdMock('1234') } as User),
      );
      mentorsService.findApplications = jest.fn(() =>
        Promise.resolve(testApplication as Application[]),
      );
      const data = await mentorsController.myApplications(
        req,
        '1234',
        'Pending',
      );
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject(testApplication);
    });

    it('should return all applications', async () => {
      const testApplication = [
        {
          _id: '1234',
          status: '',
          description: 'Pending',
          reason: 'test',
          user: 'test user',
        },
      ];
      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(req.user.auth0Id),
          roles: [],
        } as User),
      );
      usersService.findById = jest.fn(() =>
        Promise.resolve({ _id: new ObjectIdMock('1234') } as User),
      );
      mentorsService.findApplications = jest.fn(() =>
        Promise.resolve(testApplication as Application[]),
      );
      const data = await mentorsController.myApplications(req, '1234', '');
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject(testApplication);
    });
  });

  describe('applications', () => {
    const req: any = {
      user: { auth0Id: '1234' },
    };
    it('should throw an error if user applies again and status is pending', async () => {
      const testApplication = {
        _id: '1234',
        status: 'Pending',
        description: 'this is test application',
        reason: 'test',
        user: 'test user',
      };
      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(req.user.auth0Id),
          roles: [],
        } as User),
      );
      mentorsService.findActiveApplicationByUser = jest.fn(() =>
        Promise.resolve(testApplication as Application),
      );
      await expect(
        mentorsController.applyToBecomeMentor(
          req,
          testApplication as ApplicationDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw an error if user applies again and status is approved', async () => {
      const testApplication = {
        _id: '1234',
        status: 'Approved',
        description: 'this is test application',
        reason: 'test',
        user: 'test user',
      };
      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(req.user.auth0Id),
          roles: [],
        } as User),
      );
      mentorsService.findActiveApplicationByUser = jest.fn(() =>
        Promise.resolve(testApplication as Application),
      );
      await expect(
        mentorsController.applyToBecomeMentor(
          req,
          testApplication as ApplicationDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create an application', async () => {
      const testApplication = {
        _id: '1234',
        status: 'Pending',
        description: 'this is test application',
        reason: 'test',
        user: 'test user',
      };
      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(req.user.auth0Id),
          roles: [],
        } as User),
      );
      mentorsService.findActiveApplicationByUser = jest.fn(() => undefined);
      mentorsService.createApplication = jest.fn(() =>
        Promise.resolve(testApplication as ApplicationDto),
      );
      emailService.sendLocalTemplate = jest.fn();
      const data = await mentorsController.applyToBecomeMentor(
        req,
        testApplication as ApplicationDto,
      );
      expect(emailService.sendLocalTemplate).toBeCalledTimes(1);
      expect(data.success).toBe(true);
    });
  });

  describe('applications/:id', () => {
    const req: any = {
      user: { auth0Id: '1234' },
    };
    it('should throw an error if user is not admin', async () => {
      const testApplication = {
        _id: '1234',
        status: 'Pending',
        description: 'this is test application',
        reason: 'test',
        user: 'test user',
      };
      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(req.user.auth0Id),
          roles: [],
        } as User),
      );
      await expect(
        mentorsController.reviewApplication(
          req,
          '1234',
          testApplication as ApplicationDto,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw an error if application does not exist', async () => {
      const testApplication = {
        _id: '1234',
        status: 'Pending',
        description: 'this is test application',
        reason: 'test',
        user: 'test user',
      };
      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(req.user.auth0Id),
          roles: ['Admin'],
        } as User),
      );
      mentorsService.findApplicationById = jest.fn(() => undefined);
      await expect(
        mentorsController.reviewApplication(
          req,
          '1234',
          testApplication as ApplicationDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw an error if application status is approved', async () => {
      const testApplication = {
        _id: '1234',
        status: 'Approved',
        description: 'this is test application',
        reason: 'test',
        user: 'test user',
      };
      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(req.user.auth0Id),
          roles: ['Admin'],
        } as User),
      );
      mentorsService.findApplicationById = jest.fn(() =>
        Promise.resolve(testApplication as Application),
      );
      await expect(
        mentorsController.reviewApplication(
          req,
          '1234',
          testApplication as ApplicationDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully update user when status is pending', async () => {
      const testApplication = {
        _id: '1234',
        status: 'Pending',
        description: 'this is test application',
        reason: 'test',
        user: 'test user',
      };
      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(req.user.auth0Id),
          roles: ['Admin'],
        } as User),
      );
      usersService.findById = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock('123'),
          roles: ['Member'],
        } as User),
      );
      mentorsService.findApplicationById = jest.fn(() =>
        Promise.resolve(testApplication as Application),
      );
      usersService.update = jest.fn();
      emailService.sendLocalTemplate = jest.fn();
      emailService.addMentor = jest.fn();
      mentorsService.updateApplication = jest.fn(() =>
        Promise.resolve({ ok: 1 }),
      );
      const data = await mentorsController.reviewApplication(
        req,
        '1234',
        testApplication as ApplicationDto,
      );
      expect(emailService.sendLocalTemplate).toBeCalledTimes(1);
      expect(emailService.addMentor).toBeCalledTimes(1);
      expect(data.success).toBe(true);
      expect(usersService.update).toBeCalledTimes(1);
    });

    it('should successfully update user when status is rejected', async () => {
      const testApplication = {
        _id: '1234',
        status: 'Rejected',
        description: 'this is test application',
        reason: 'test',
        user: 'test user',
      };
      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(req.user.auth0Id),
          roles: ['Admin'],
        } as User),
      );
      usersService.findById = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock('123'),
          roles: ['Member'],
        } as User),
      );
      mentorsService.findApplicationById = jest.fn(() =>
        Promise.resolve(testApplication as Application),
      );
      usersService.update = jest.fn();
      emailService.sendLocalTemplate = jest.fn();
      emailService.addMentor = jest.fn();
      mentorsService.updateApplication = jest.fn(() =>
        Promise.resolve({ ok: 1 }),
      );
      const data = await mentorsController.reviewApplication(
        req,
        '1234',
        testApplication as ApplicationDto,
      );
      expect(emailService.sendLocalTemplate).toBeCalledTimes(1);
      expect(emailService.addMentor).toBeCalledTimes(1);
      expect(data.success).toBe(true);
    });
  });
});
