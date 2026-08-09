import { Controller, Get, HttpCode, HttpStatus, Param, UseGuards } from '@nestjs/common';

import { type TypeId } from '@devpulse/lib';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { type AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { ProjectsService, ProjectSummaryDto } from '../services/projects.service';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  public async getMyProjects(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Array<ProjectSummaryDto>> {
    return this.projectsService.getUserProjects(user.id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  public async getProject(
    @Param('id') id: TypeId<'projects'>,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectSummaryDto> {
    return this.projectsService.getProjectById(user.id, id);
  }
}
