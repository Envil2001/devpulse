'use client';

import {
  Page,
  PageDescription,
  PageHeader,
  PageHeaderHeading,
  PageTitle,
} from '@/shared/components/layout/page';
import { RateConfigPanel } from '@/features/users/components/rate-config-panel';
import { EarningsSummaryCards } from './earnings-summary-cards';

export function EarningsView() {
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
        <EarningsSummaryCards />
      </div>
    </Page>
  );
}
