import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';

interface SessionRequest extends Request {
  cookies: {
    sessionId: string;
  };
}

const CHARS_LIMIT = 300;

@Controller('api')
export class VotingController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('/features')
  // TODO: move get all features to Feature module
  async getAll() {
    try {
      return await this.prisma.feature.findMany({
        select: {
          id: true,
          title: true,
          upvotes: true,
        },
        orderBy: {
          upvotes: 'desc',
        },
      });
    } catch (error) {
      console.log(error);
      throw new BadRequestException();
    }
  }

  // TODO: move feature create to Feature module
  @Post('/features')
  async create(
    @Body() body: { title: string },
    @Req() req: SessionRequest,
    @Res() res: Response,
  ) {
    const sessionId = req.cookies['sessionId'];
    if (!sessionId) {
      throw new ConflictException('No valid donation session found');
    }
    const { title } = body;
    if (!title || title.length > CHARS_LIMIT) {
      throw new BadRequestException('Valid title required to create feature');
    }

    const hasSubmittedFeature = await this.prisma.feature.findFirst({
      where: {
        sessionId,
      },
    });
    if (hasSubmittedFeature) {
      throw new BadRequestException('Feature has been already submitted');
    }

    try {
      await this.prisma.feature.create({
        data: {
          title,
          sessionId,
        },
      });
      return res.json({ success: true });
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Something went wrong');
    }
  }

  @Post('features/:id/like')
  async likeFeature(
    @Param('id') id: string,
    @Req() req: SessionRequest,
    @Res() res: Response,
  ) {
    const sessionId = req.cookies['sessionId'];
    if (!sessionId) {
      throw new ConflictException('No valid donation session found');
    }

    const alreadyLikedFeature = await this.prisma.feature.findUnique({
      where: {
        sessionId,
      },
    });
    if (alreadyLikedFeature) {
      throw new BadRequestException('You cannot upvote Your feature twice');
    }

    try {
      await this.prisma.featureLike.create({
        data: {
          featureId: id,
          sessionId,
        },
      });

      await this.prisma.feature.update({
        where: { id },
        data: {
          upvotes: { increment: 1 },
        },
      });

      return res.json({ success: true });
    } catch (error: unknown) {
      console.log(error);
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new BadRequestException('Feature does not exist');
        }
        if (error.code === 'P2002') {
          throw new BadRequestException('You have already voted');
        }
      }
      throw new ConflictException('You already liked this feature');
    }
  }
}
