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

  async checkoutSessionWithCustomAmount(amount: string) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card', 'blik'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Custom payment',
              },
              unit_amount: Number(amount) * 100, // price in cents!
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url:
          process.env.CLIENT + '/thank-you?session={CHECKOUT_SESSION_ID}',
      });

      return session;
    } catch (error) {
      console.log(error);
      throw new HttpException('Session does not exist', HttpStatus.BAD_REQUEST);
    }
  }
}
