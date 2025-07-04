import {
  Controller,
  Get,
  Query,
  Res,
  HttpException,
  HttpStatus,
  Post,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { StripeService } from 'src/stripe/stripe.service';

@Controller('api')
export class DonationController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('custom-amount')
  async customAmountStripeSession(
    @Body() body: { amount: string },
    @Res() res: Response,
  ) {
    try {
      const { amount } = body;

      if (!amount) {
        throw new BadRequestException('Amount required.');
      }
      const session =
        await this.stripeService.checkoutSessionWithCustomAmount(amount);

      return res.json({
        redirect_url: session.url,
      });
    } catch (error) {
      console.log(error);
      throw new BadRequestException();
    }
  }

  @Get('verify-payment')
  async verifyPayment(
    @Query('session_id') sessionId: string,
    @Res() res: Response,
  ) {
    try {
      if (!sessionId) {
        throw new HttpException('Missing session_id', HttpStatus.BAD_REQUEST);
      }
      const isValid = await this.stripeService.verifySession(sessionId);
      if (!isValid) {
        return res.status(403).json({ success: false });
      }
      const hasSubmittedFeature = await this.prisma.feature.findUnique({
        where: {
          sessionId,
        },
      });

      const hasVoted = await this.prisma.featureLike.findUnique({
        where: {
          sessionId,
        },
      });
      if (hasSubmittedFeature && hasVoted) {
        res.clearCookie('sessionId');
      } else {
        res.cookie('sessionId', sessionId, {
          maxAge: 1000 * 60 * 30, // 30 min
          httpOnly: true,
          secure: true,
          sameSite: 'none',
        });
      }

      return res.json({
        success: true,
        canSubmitFeature: !hasSubmittedFeature,
        canVote: !hasVoted,
      });
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
