import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Request } from 'express';
import { MentorshipsController } from '../mentorships.controller';
import { UsersService } from '../../common/users.service';
import { MentorsService } from '../../common/mentors.service';
import { MentorshipsService } from '../mentorships.service';
import { Role, User } from '../../common/interfaces/user.interface';
import { MentorshipDto } from '../dto/mentorship.dto';
import { Mentorship } from '../interfaces/mentorship.interface';

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
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    mentorsService = module.get<MentorsService>(MentorsService);
    mentorshipsService = module.get<MentorshipsService>(MentorshipsService);
    mentorshipsController = module.get<MentorshipsController>(
      MentorshipsController,
    );
  });

  describe('apply', () => {
    let mentorId: string;
    let mentorship: MentorshipDto;
    let request;

    beforeEach(() => {
      mentorId = '5678';
      request = { user: { auth0Id: '1234' } };
      mentorship = <MentorshipDto>{
        message: `Hi there! I'd like to learn from you!`,
      };
      usersService.findByAuth0Id = jest.fn(() =>
        Promise.resolve(<User>{
          _id: new ObjectIdMock(request.user.auth0Id),
          roles: [Role.MEMBER],
        }),
      );
      mentorsService.findById = jest.fn(() =>
        Promise.resolve(<User>{
          _id: new ObjectIdMock(mentorId),
          available: true,
          roles: [Role.MENTOR],
        }),
      );
      mentorshipsService.findMentorship = jest.fn(() => Promise.resolve(null));
      mentorshipsService.createMentorship = jest.fn(() => Promise.resolve());
    });

    it('should return a 400 error if mentor not found', async () => {
      mentorsService.findById = jest.fn(() => Promise.resolve(null));
      await expect(
        mentorshipsController.applyForMentorship(request, '123', mentorship),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return a 400 error if mentor is not available', async () => {
      mentorsService.findById = jest.fn(() =>
        Promise.resolve(<User>{
          _id: new ObjectIdMock(mentorId),
          available: false,
          roles: [Role.MENTOR],
        }),
      );
      await expect(
        mentorshipsController.applyForMentorship(request, mentorId, mentorship),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return a 400 error if a request already exist', async () => {
      mentorshipsService.findMentorship = jest.fn(() =>
        Promise.resolve(<Mentorship>{}),
      );
      await expect(
        mentorshipsController.applyForMentorship(request, '123', mentorship),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return a successful response', async () => {
      const data = await mentorshipsController.applyForMentorship(
        <Request>request,
        mentorId,
        mentorship,
      );
      expect(data.success).toBe(true);
    });
  });
});
