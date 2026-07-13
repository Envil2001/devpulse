import { Controller, UseGuards, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetAnalyticsRangeRequestDto } from '../dto/request/get-analytics-range-request.dto';
import { GetAnalyticsDashboardResponseDto } from '../dto/response/get-analytics-dashboard-response.dto';
import { AnalyticsService } from '../services/analytics.service';
import { GetAnalyticsTimeseriesResponseDto } from '../dto/response/get-analytics-timeseries-response.dto';
import { GetAnalyticsBranchesResponseDto } from '../dto/response/get-analytics-branches-response.dto';
import { type AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  public async getDashboard(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetAnalyticsRangeRequestDto,
  ): Promise<GetAnalyticsDashboardResponseDto> {
    return this.analyticsService.getDashboardStats(user.id, query);
  }

  @Get('timeseries')
  @HttpCode(HttpStatus.OK)
  public async getTimeseries(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetAnalyticsRangeRequestDto,
  ): Promise<GetAnalyticsTimeseriesResponseDto> {
    return this.analyticsService.getTimeseries(user.id, query);
  }

  @Get('branches')
  @HttpCode(HttpStatus.OK)
  public async getBranches(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetAnalyticsRangeRequestDto,
  ): Promise<GetAnalyticsBranchesResponseDto> {
    return this.analyticsService.getBranchesDistribution(user.id, query);
  }
}
