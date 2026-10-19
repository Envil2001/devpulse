import { Controller, Get, HttpCode, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { type TypeId } from '@devpulse/lib';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { type AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { ProjectSummaryDto } from '../dto/response/project-summary.dto';
import { ProjectsService } from '../services/projects.service';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all user projects' })
  @ApiResponse({ status: HttpStatus.OK, type: [ProjectSummaryDto] })
  public async getMyProjects(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Array<ProjectSummaryDto>> {
    return this.projectsService.getUserProjects(user.id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get specific project details' })
  @ApiResponse({ status: HttpStatus.OK, type: ProjectSummaryDto })
  public async getProject(
    @Param('id') id: TypeId<'projects'>,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectSummaryDto> {
    return this.projectsService.getProjectById(user.id, id);
  }
}
