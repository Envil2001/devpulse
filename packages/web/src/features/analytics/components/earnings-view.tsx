'use client';

import { type JSX } from 'react/jsx-runtime';

import { RateConfigPanel } from '@/features/users/components/rate-config-panel';
import {
  Page,
  PageDescription,
  PageHeader,
  PageHeaderHeading,
  PageTitle,
} from '@/shared/components/layout/page';

import type { DateRange } from '../hooks';
import { EarningsSummaryCards } from './earnings-summary-cards';

interface EarningsViewProps {
  range30d: DateRange;
  range7d: DateRange;
}

export function EarningsView({ range30d, range7d }: EarningsViewProps): JSX.Element {
  return (
    <Page>
      <PageHeader>
        <div>
          <PageHeaderHeading>
            <PageTitle>Earnings</PageTitle>
          </PageHeaderHeading>
          <PageDescription>Set your rate and see how much your focus is worth</PageDescription>
        </div>
      </PageHeader>

      <div data-tour="earnings-rate">
        <RateConfigPanel />
      </div>
      <div data-tour="earnings-summary">
        <EarningsSummaryCards range30d={range30d} range7d={range7d} />
      </div>
    </Page>
  );
}
