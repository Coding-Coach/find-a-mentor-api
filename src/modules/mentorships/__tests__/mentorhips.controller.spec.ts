import { Test } from '@nestjs/testing';
import { MentorshipsController } from '../mentorships.controller';
import { UsersService } from '../../common/users.service';
import { MentorsService } from '../../common/mentors.service';
import { MentorFiltersDto } from '../../common/dto/mentorfilters.dto';
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
    it('should return a successful response', async () => {
      const mentorId = '9876';
      const req: any = {
        user: { auth0Id: '1234' },
      };
      const data = await mentorshipsController.apply(<Request>req, mentorId);
      expect(data.success).toBe(true);
    });
  });
});
