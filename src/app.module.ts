import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StripeService } from './stripe/stripe.service';
import { StripeModule } from './stripe/stripe.module';
import { DonationController } from './donation/donation.controller';
import { ConfigModule } from '@nestjs/config';
import { VotingModule } from './voting/voting.module';
import { DonationAuthMiddleware } from './donation/middleware/donation-auth';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [ConfigModule.forRoot(), StripeModule, VotingModule],
  controllers: [AppController, DonationController],
  providers: [AppService, StripeService, PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(DonationAuthMiddleware)
      .forRoutes({ path: 'api/features/:id/like', method: RequestMethod.POST });
  }
}
