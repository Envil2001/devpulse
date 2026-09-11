import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { type AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { GetAnalyticsRangeRequestDto } from '../dto/request/get-analytics-range-request.dto';
import { GetAnalyticsBranchesResponseDto } from '../dto/response/get-analytics-branches-response.dto';
import { GetAnalyticsDashboardResponseDto } from '../dto/response/get-analytics-dashboard-response.dto';
import { GetAnalyticsTimeseriesResponseDto } from '../dto/response/get-analytics-timeseries-response.dto';
import { AnalyticsService } from '../services/analytics.service';
import { AnalyticsExportService } from '../services/analytics-export.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly analyticsExportService: AnalyticsExportService,
  ) {}

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

  @Get('export')
  @HttpCode(HttpStatus.OK)
  public async exportSessions(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetAnalyticsRangeRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.analyticsExportService.exportSessions(user.id, query);

    res.set({
      'Content-Type': file.contentType,
      'Content-Disposition': `attachment; filename="${file.filename}"`,
    });

    return new StreamableFile(Buffer.from(file.content, 'utf8'));
  }
}
