export interface RawProjectQueryResult {
  id: string | null;
  name: string | null;
  remote: string | null;
  activeSeconds: string | number | null;
  avgFocus: string | number | null;
  sessionsCount: string | number | null;
  lastActive: Date | string | null;
}
