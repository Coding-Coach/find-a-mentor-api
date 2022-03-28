import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Request } from 'express';
import { MentorshipsController } from '../mentorships.controller';
import { UsersService } from '../../common/users.service';
import { MentorsService } from '../../common/mentors.service';
import { EmailService } from '../../email/email.service';
import { MentorshipsService } from '../mentorships.service';
import { Role, User } from '../../common/interfaces/user.interface';
import { MentorshipDto } from '../dto/mentorship.dto';
import { Mentorship, Status } from '../interfaces/mentorship.interface';

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

describe('modules/mentorships/MentorshipsController', () => {
  let mentorshipsController: MentorshipsController;
  let usersService: UsersService;
  let mentorsService: MentorsService;
  let mentorshipsService: MentorshipsService;
  let emailService: EmailService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [MentorshipsController],
      providers: [
        {
          provide: UsersService,
          useValue: new ServiceMock(),
        },
        {
          provide: MentorsService,
          useValue: new ServiceMock(),
        },
        {
          provide: MentorshipsService,
          useValue: new ServiceMock(),
        },
        {
          provide: EmailService,
          useValue: new ServiceMock(),
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    mentorsService = module.get<MentorsService>(MentorsService);
    mentorshipsService = module.get<MentorshipsService>(MentorshipsService);
    emailService = module.get<EmailService>(EmailService);
    mentorshipsController = module.get<MentorshipsController>(
      MentorshipsController,
    );
  });

  describe('apply', () => {
    let mentorId: string;
    let menteeId: string;
    let mentorship: MentorshipDto;
    let request;

    beforeEach(() => {
      mentorId = '5678';
      menteeId = '91011';
      request = { user: { auth0Id: '1234' } };
      mentorship = {
        message: `Hi there! I'd like to learn from you!`,
      } as MentorshipDto;
      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(request.user.auth0Id),
          roles: [Role.MEMBER],
        } as User),
      );
      mentorsService.findById = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(mentorId),
          available: true,
          roles: [Role.MENTOR],
        } as User),
      );
      mentorshipsService.findMentorship = jest.fn(() => Promise.resolve(null));
      mentorshipsService.createMentorship = jest.fn(() =>
        Promise.resolve(null),
      );
      emailService.sendLocalTemplate = jest.fn(() => Promise.resolve(null));
    });

    it('should return a 400 error if mentor not found', async () => {
      mentorsService.findById = jest.fn(() => Promise.resolve(null));
      await expect(
        mentorshipsController.applyForMentorship(request, '123', mentorship),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return a 400 error if mentor is not available', async () => {
      mentorsService.findById = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(mentorId),
          available: false,
          roles: [Role.MENTOR],
        } as User),
      );
      await expect(
        mentorshipsController.applyForMentorship(request, mentorId, mentorship),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return a 400 error if a request already exist', async () => {
      mentorshipsService.findMentorship = jest.fn(() =>
        Promise.resolve({} as Mentorship),
      );
      await expect(
        mentorshipsController.applyForMentorship(request, '123', mentorship),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return a 400 error if the user exceeded the allowed open requests', async () => {
      mentorshipsService.getOpenRequestsCount = jest.fn(() =>
        Promise.resolve(5),
      );

      await expect(
        mentorshipsController.applyForMentorship(
          <Request>request,
          mentorId,
          mentorship,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return a successful response', async () => {
      mentorshipsService.getOpenRequestsCount = jest.fn(() =>
        Promise.resolve(3),
      );
      const data = await mentorshipsController.applyForMentorship(
        request as Request,
        mentorId,
        mentorship,
      );
      expect(data.success).toBe(true);
    });

    it('should return mentorship requests for a given mentor', async () => {
      request = { user: { _id: mentorId, auth0Id: '1234' } };

      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(mentorId),
          roles: [Role.MENTOR],
        } as User),
      );

      usersService.findById = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(mentorId),
          roles: [Role.MENTOR],
        } as User),
      );

      mentorshipsService.findMentorshipsByUser = jest.fn(() =>
        Promise.resolve([
          {
            _id: new ObjectIdMock('1'),
            mentor: new ObjectIdMock(mentorId),
            mentee: new ObjectIdMock('ANYMENTEEID'),
            status: Status.NEW,
            goals: [],
            message: 'MESSAGE',
            expectation: 'EXPECTATION',
            background: 'BACKGROUND',
            reason: 'REASON',
            updatedAt: new Date(),
            createdAt: new Date(),
          } as Mentorship,
        ]),
      );

      const response = await mentorshipsController.getMentorshipRequests(
        request as Request,
        mentorId,
      );

      expect(response.success).toBe(true);
      expect(response.data.length).toBe(1);
      expect(response.data[0].isMine).toBe(false);
    });

    it('should filter out requests of deleted users', async () => {
      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(mentorId),
          roles: [Role.MENTOR],
        } as User),
      );

      usersService.findById = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(mentorId),
          roles: [Role.MENTOR],
        } as User),
      );

      mentorshipsService.findMentorshipsByUser = jest.fn(() =>
        Promise.resolve([
          {
            _id: new ObjectIdMock('1'),
            mentor: new ObjectIdMock('ANYMENTORID'),
            mentee: null,
            status: Status.NEW,
            goals: [],
            message: 'MESSAGE',
            expectation: 'EXPECTATION',
            background: 'BACKGROUND',
            reason: 'REASON',
            updatedAt: new Date(),
            createdAt: new Date(),
          } as Mentorship,
        ]),
      );

      const response = await mentorshipsController.getMentorshipRequests(
        request as Request,
        mentorId,
      );

      expect(response.data.length).toBe(1);
      expect(response.data[0].mentee).toEqual(null);
    });

    it('should return mentorship applications for a given mentee', async () => {
      request = { user: { _id: menteeId, auth0Id: '1234' } };

      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(menteeId),
          roles: [Role.MEMBER],
        } as User),
      );

      usersService.findById = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(menteeId),
          roles: [Role.MEMBER],
        } as User),
      );

      mentorshipsService.findMentorshipsByUser = jest.fn(() =>
        Promise.resolve([
          {
            _id: new ObjectIdMock('1'),
            mentor: new ObjectIdMock('ANYMENTORID'),
            mentee: new ObjectIdMock(menteeId),
            status: Status.NEW,
            goals: [],
            message: 'MESSAGE',
            expectation: 'EXPECTATION',
            background: 'BACKGROUND',
            reason: 'REASON',
            updatedAt: new Date(),
            createdAt: new Date(),
          } as Mentorship,
        ]),
      );

      const response = await mentorshipsController.getMentorshipRequests(
        request as Request,
        menteeId,
      );

      expect(response.success).toBe(true);
      expect(response.data.length).toBe(1);
      expect(response.data[0].isMine).toBe(true);
    });

    it('should return unauthorised if user is not admin and requesting another user\'s applications', async () => {
      request = { user: { _id: menteeId, auth0Id: '1234' } };

      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(menteeId),
          roles: [Role.MEMBER],
        } as User),
      );

      usersService.findById = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(mentorId),
          roles: [Role.MENTOR],
        } as User),
      );

      await expect(
        mentorshipsController.getMentorshipRequests(
          request as Request,
          mentorId,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return mentorship applications for any given mentor/mentee if user is admin', async () => {
      const adminId = '0000';
      request = { user: { _id: adminId, auth0Id: '1234' } };

      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(adminId),
          roles: [Role.ADMIN],
        } as User),
      );

      usersService.findById = jest.fn(() =>
        Promise.resolve({
          _id: new ObjectIdMock(mentorId),
          roles: [Role.MENTOR],
        } as User),
      );

      mentorshipsService.findMentorshipsByUser = jest.fn(() =>
        Promise.resolve([
          {
            _id: new ObjectIdMock('1'),
            mentor: new ObjectIdMock(mentorId),
            mentee: new ObjectIdMock(menteeId),
            status: Status.NEW,
            goals: [],
            message: 'MESSAGE',
            expectation: 'EXPECTATION',
            background: 'BACKGROUND',
            reason: 'REASON',
            updatedAt: new Date(),
            createdAt: new Date(),
          } as Mentorship,
        ]),
      );

      const response = await mentorshipsController.getMentorshipRequests(
        request as Request,
        mentorId,
      );

      expect(response.success).toBe(true);
      expect(response.data.length).toBe(1);
      expect(response.data[0].isMine).toBe(false);
    });
  });
});
