import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from 'src/types';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  constructor(private configService: ConfigService<EnvironmentVariables>) {}

  private stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2025-05-28.basil',
  });

  async verifySession(sessionId: string) {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      return session?.payment_status === 'paid';
    } catch (error) {
      console.log(error);
      throw new HttpException('Session does not exist', HttpStatus.BAD_REQUEST);
    }
  }
}
