import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { type AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { GenerateDayDto, WorklogPlanQueryDto } from '../dto/worklog.dto';
import { WorklogDayResult, WorklogPlan } from '../interfaces/worklog-results.interface';
import { WorklogService } from '../services/worklog.service';

@ApiTags('Worklog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('worklog')
export class WorklogController {
  constructor(private readonly worklogService: WorklogService) {}

  @Get('plan')
  @ApiOperation({
    summary: 'List the days with activity in a period and check the provider limit',
    description: 'Makes no LLM requests. Call it before generating.',
  })
  @ApiQuery({ name: 'startDate', required: true, type: String, example: '2026-10-01' })
  @ApiQuery({ name: 'endDate', required: true, type: String, example: '2026-10-07' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Plan for the selected period' })
  public async getPlan(
    @CurrentUser() reqUser: AuthenticatedUser,
    @Query() query: WorklogPlanQueryDto,
  ): Promise<WorklogPlan> {
    return this.worklogService.getPlan(reqUser.id, query.startDate, query.endDate);
  }

  @Post('day')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate (or return the cached) worklog text for one day' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Worklog text for the day' })
  public async generateDay(
    @CurrentUser() reqUser: AuthenticatedUser,
    @Body() body: GenerateDayDto,
  ): Promise<WorklogDayResult> {
    return this.worklogService.generateDay(reqUser.id, body);
  }
}
