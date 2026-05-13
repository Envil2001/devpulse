import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { type TypeId } from '@devpulse/lib';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { type AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

import { type GetAnalyticsBranchesResponseDto } from './dto/get-analytics-branches-response.dto';
import { type GetAnalyticsDashboardResponseDto } from './dto/get-analytics-dashboard-response.dto';
import { GetAnalyticsRangeRequestDto } from './dto/get-analytics-range-request.dto';
import { type GetAnalyticsTimeseriesResponseDto } from './dto/get-analytics-timeseries-response.dto';
import { AnalyticsService } from './analytics.service';

@Controller({ path: 'analytics', version: '1' })
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  public async getDashboard(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetAnalyticsRangeRequestDto,
  ): Promise<GetAnalyticsDashboardResponseDto> {
    return this.analyticsService.getDashboardSummary(user.id as TypeId<'users'>, query);
  }

  @Get('branches')
  public async getBranches(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetAnalyticsRangeRequestDto,
  ): Promise<GetAnalyticsBranchesResponseDto> {
    return this.analyticsService.getBranchesBreakdown(user.id as TypeId<'users'>, query);
  }

  @Get('timeseries')
  public async getTimeseries(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetAnalyticsRangeRequestDto,
  ): Promise<GetAnalyticsTimeseriesResponseDto> {
    return this.analyticsService.getTimeseries(user.id as TypeId<'users'>, query);
  }
}
