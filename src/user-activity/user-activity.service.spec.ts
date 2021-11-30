import { Test, TestingModule } from '@nestjs/testing';
import { UserActivityService } from './user-activity.service';

describe('UserActivityService', () => {
  let service: UserActivityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserActivityService],
    }).compile();

    service = module.get<UserActivityService>(UserActivityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
