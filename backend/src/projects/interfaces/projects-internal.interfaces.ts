import { type TypeId } from '@devpulse/lib';

export interface RawProjectQueryResult {
  id: TypeId<'projects'>;
  name: string;
  remote: string | null;
  activeSeconds: string | number;
  avgFocus: string | number;
  sessionsCount: string | number;
  lastActive: string | Date | null;
}
