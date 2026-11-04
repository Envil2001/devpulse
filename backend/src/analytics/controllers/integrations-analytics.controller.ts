import { Controller, Get, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { RequireScopes } from '../../api-keys/decorators/require-scopes.decorator';
import { ApiKeyScope } from '../../api-keys/enums/api-key.enums';
import { ApiKeyGuard } from '../../api-keys/guards/api-key.guard';
import { ScopesGuard } from '../../api-keys/guards/scopes.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ProjectSummaryDto } from '../../projects/dto/response/project-summary.dto';
import { ProjectsService } from '../../projects/services/projects.service';
import { User } from '../../users/entities/user.entity';
import { GetIntegrationSessionsRequestDto } from '../dto/request/get-integration-sessions-request.dto';
import { GetIntegrationLanguagesResponseDto } from '../dto/response/get-integration-languages-response.dto';
import { GetIntegrationSessionItemDto } from '../dto/response/get-integration-sessions-response.dto';
import { GetIntegrationStatusResponseDto } from '../dto/response/get-integration-status-response.dto';
import { IntegrationPingResponseDto } from '../dto/response/integration-ping-response.dto';
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
  @ApiResponse({ status: HttpStatus.OK, type: IntegrationPingResponseDto })
  public ping(@CurrentUser() user: User): IntegrationPingResponseDto {
    return { success: true, message: 'Integration access granted', userId: user.id };
  }

  @Get('sessions')
  @RequireScopes(ApiKeyScope.ANALYTICS_READ)
  @ApiSecurity('ApiKeyAuth', [ApiKeyScope.ANALYTICS_READ])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a list of recent work sessions' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of recent sessions (minimum 1, values above 50 are capped)',
    minimum: 1,
    maximum: 50,
    example: 10,
  })
  @ApiResponse({ status: HttpStatus.OK, type: [GetIntegrationSessionItemDto] })
  public async getSessions(
    @CurrentUser() user: User,
    @Query() query: GetIntegrationSessionsRequestDto,
  ): Promise<Array<GetIntegrationSessionItemDto>> {
    return this.analyticsService.getRecentSessions(user.id, Math.min(query.limit ?? 10, 50));
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
  @ApiResponse({ status: HttpStatus.OK, type: [ProjectSummaryDto] })
  public async getProjects(@CurrentUser() user: User): Promise<Array<ProjectSummaryDto>> {
    return this.projectsService.getUserProjects(user.id);
  }
}
