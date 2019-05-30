import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { AuthMiddleware } from './middlewares/auth.middleware';
import { MentorsModule } from './modules/mentors/mentors.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [MentorsModule, UsersModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: '/**', method: RequestMethod.ALL },
      );
  }
}
