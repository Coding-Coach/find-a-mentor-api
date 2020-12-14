import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MentorshipsController } from '../mentorships.controller';
import { UsersService } from '../../common/users.service';
import { MentorsService } from '../../common/mentors.service';
import { Role, User } from '../../common/interfaces/user.interface';
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

describe('modules/mentorships/MentorshipsController', () => {
  let mentorshipsController: MentorshipsController;
  let usersService: UsersService;
  let mentorsService: MentorsService;

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
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    mentorsService = module.get<MentorsService>(MentorsService);
    mentorshipsController = module.get<MentorshipsController>(
      MentorshipsController,
    );
  });

  describe('apply', () => {
    let mentorId;
    let request;

    beforeEach(() => {
      mentorId = '5678';
      request = { user: { auth0Id: '1234' } };
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
    });

    it('should return a 400 error if mentor not found', async () => {
      mentorsService.findById = jest.fn(() => Promise.resolve(null));
      await expect(mentorshipsController.apply(request, '123')).rejects.toThrow(
        BadRequestException,
      );
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
        mentorshipsController.apply(request, mentorId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return a successful response', async () => {
      const data = await mentorshipsController.apply(
        <Request>request,
        mentorId,
      );
      expect(data.success).toBe(true);
    });
  });
});
