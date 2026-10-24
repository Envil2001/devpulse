import { IsBoolean, IsIn, IsOptional, Matches } from 'class-validator';

import type { WorklogFormat, WorklogLanguage } from '../constants/worklog.constants';
import { DATE_PATTERN, WORKLOG_FORMATS, WORKLOG_LANGUAGES } from '../constants/worklog.constants';

const DATE_MESSAGE = 'must be in YYYY-MM-DD format';

export class WorklogPlanQueryDto {
  @Matches(DATE_PATTERN, { message: `startDate ${DATE_MESSAGE}` })
  public startDate!: string;

  @Matches(DATE_PATTERN, { message: `endDate ${DATE_MESSAGE}` })
  public endDate!: string;
}

export class GenerateDayDto {
  @Matches(DATE_PATTERN, { message: `date ${DATE_MESSAGE}` })
  public date!: string;

  @IsIn(WORKLOG_FORMATS)
  public format!: WorklogFormat;

  @IsIn(WORKLOG_LANGUAGES)
  public language!: WorklogLanguage;

  @IsOptional()
  @IsBoolean()
  public force?: boolean;
}
