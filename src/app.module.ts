import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { AuthMiddleware } from './middlewares/auth.middleware';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [UsersModule]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: '/**', method: RequestMethod.ALL }
      );
  }
}
