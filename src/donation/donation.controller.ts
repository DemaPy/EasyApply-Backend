import {
  Controller,
  Get,
  Query,
  Res,
  HttpException,
  HttpStatus,
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

  @Get('verify-payment')
  async verifyPayment(
    @Query('session_id') sessionId: string,
    @Res() res: Response,
  ) {
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

    res.cookie('sessionId', sessionId, {
      maxAge: 1000 * 60 * 30, // 30 min
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
    return res.json({
      success: true,
      canSubmitFeature: !hasSubmittedFeature,
      canVote: !hasVoted,
    });
  }
}
