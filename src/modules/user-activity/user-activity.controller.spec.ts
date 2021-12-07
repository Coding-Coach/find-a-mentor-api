import { Test, TestingModule } from '@nestjs/testing';
import { UserActivityController } from './user-activity.controller';
import { UserActivityService } from './user-activity.service';

describe('UserActivityController', () => {
  let controller: UserActivityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserActivityController],
      providers: [UserActivityService],
    }).compile();

    controller = module.get<UserActivityController>(UserActivityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
