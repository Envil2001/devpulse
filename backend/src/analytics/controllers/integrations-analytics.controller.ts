import { Controller, Get, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { type TypeId } from '@devpulse/lib';

import { RequireScopes } from '../../api-keys/decorators/require-scopes.decorator';
import { ApiKeyScope } from '../../api-keys/enums/api-key.enums';
import { ApiKeyGuard } from '../../api-keys/guards/api-key.guard';
import { ScopesGuard } from '../../api-keys/guards/scopes.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ProjectsService, ProjectSummaryDto } from '../../projects/services/projects.service';
import { User } from '../../users/entities/user.entity';
import { GetIntegrationLanguagesResponseDto } from '../dto/response/get-integration-languages-response.dto';
import { GetIntegrationSessionItemDto } from '../dto/response/get-integration-sessions-response.dto';
import { GetIntegrationStatusResponseDto } from '../dto/response/get-integration-status-response.dto';
import { GetIntegrationTodayResponseDto } from '../dto/response/get-integration-today-response.dto';
import { IntegrationsAnalyticsService } from '../services/integrations-analytics.service';

@ApiTags('Integrations Analytics')
@ApiSecurity('ApiKeyAuth')
@Controller('integrations/analytics')
@UseGuards(ApiKeyGuard, ScopesGuard)
export class IntegrationsAnalyticsController {
  constructor(
    private readonly analyticsService: IntegrationsAnalyticsService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Get('ping')
  @RequireScopes(ApiKeyScope.ANALYTICS_READ)
  @ApiSecurity('ApiKeyAuth', [ApiKeyScope.ANALYTICS_READ])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify connection and API key scopes' })
  public ping(@CurrentUser() user: User): {
    success: true;
    message: string;
    userId: TypeId<'users'>;
  } {
    return { success: true, message: 'Integration access granted', userId: user.id };
  }

  @Get('today')
  @RequireScopes(ApiKeyScope.ANALYTICS_READ)
  @ApiSecurity('ApiKeyAuth', [ApiKeyScope.ANALYTICS_READ])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get summary metrics for today (based on user timezone)' })
  @ApiResponse({ status: HttpStatus.OK, type: GetIntegrationTodayResponseDto })
  public async getToday(@CurrentUser() user: User): Promise<GetIntegrationTodayResponseDto> {
    return this.analyticsService.getTodaySummary(user);
  }

  @Get('sessions')
  @RequireScopes(ApiKeyScope.ANALYTICS_READ)
  @ApiSecurity('ApiKeyAuth', [ApiKeyScope.ANALYTICS_READ])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a list of recent work sessions' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: [GetIntegrationSessionItemDto] })
  public async getSessions(
    @CurrentUser() user: User,
    @Query('limit') limit?: string,
  ): Promise<Array<GetIntegrationSessionItemDto>> {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : 10;
    const safeLimit = Math.min(Math.max(parsedLimit, 1), 50);

    return this.analyticsService.getRecentSessions(user.id, safeLimit);
  }

  @Get('status')
  @RequireScopes(ApiKeyScope.ANALYTICS_READ)
  @ApiSecurity('ApiKeyAuth', [ApiKeyScope.ANALYTICS_READ])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get live status: is user coding right now?' })
  @ApiResponse({ status: HttpStatus.OK, type: GetIntegrationStatusResponseDto })
  public async getLiveStatus(@CurrentUser() user: User): Promise<GetIntegrationStatusResponseDto> {
    return this.analyticsService.getLiveStatus(user.id);
  }

  @Get('languages')
  @RequireScopes(ApiKeyScope.ANALYTICS_READ)
  @ApiSecurity('ApiKeyAuth', [ApiKeyScope.ANALYTICS_READ])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get programming languages usage breakdown' })
  @ApiResponse({ status: HttpStatus.OK, type: GetIntegrationLanguagesResponseDto })
  public async getLanguages(
    @CurrentUser() user: User,
  ): Promise<GetIntegrationLanguagesResponseDto> {
    return this.analyticsService.getLanguagesBreakdown(user.id);
  }

  @Get('projects')
  @RequireScopes(ApiKeyScope.ANALYTICS_READ)
  @ApiSecurity('ApiKeyAuth', [ApiKeyScope.ANALYTICS_READ])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get stats and time spent per project' })
  public async getProjects(@CurrentUser() user: User): Promise<Array<ProjectSummaryDto>> {
    return this.projectsService.getUserProjects(user.id);
  }
}
