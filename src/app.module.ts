import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AuthMiddleware } from './middlewares/auth.middleware';
import { MentorsModule } from './modules/mentors/mentors.module';
import { MentorshipsModule } from './modules/mentorships/mentorships.module';
import { ListsModule } from './modules/lists/lists.module';
import { UsersModule } from './modules/users/users.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    MentorsModule,
    MentorshipsModule,
    ListsModule,
    UsersModule,
    ReportsModule,
    AdminModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: '/**', method: RequestMethod.ALL });
  }
}
