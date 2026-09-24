import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { type AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { User } from '../../users/entities/user.entity';
import { WorklogService } from '../services/worklog.service';

@UseGuards(JwtAuthGuard)
@Controller('worklog')
export class WorklogController {
  constructor(
    private readonly worklogService: WorklogService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  @Get('generate')
  public async generateSummary(
    @CurrentUser() reqUser: AuthenticatedUser,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<{ date: string; summary: string }> {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      throw new BadRequestException('Date format must be YYYY-MM-DD');
    }

    const userWithKey = await this.userRepo
      .createQueryBuilder('user')
      .select(['user.id', 'user.openaiKey'])
      .where('user.id = :userId', { userId: reqUser.id })
      .getOne();

    if (!userWithKey) {
      throw new BadRequestException('User not found');
    }

    return this.worklogService.generatePeriodWorklog(userWithKey, startDate, endDate);
  }
}
