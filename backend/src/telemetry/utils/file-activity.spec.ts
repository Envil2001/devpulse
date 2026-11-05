import { describe, expect, it } from '@jest/globals';

import {
  addFileActivity,
  getFileActivityDeltaSeconds,
  MAX_FILE_PATH_LENGTH,
  normalizeWorkspaceFilePath,
} from './file-activity';

describe('file activity helpers', () => {
  describe('normalizeWorkspaceFilePath', () => {
    it('normalizes workspace-relative paths', () => {
      expect(normalizeWorkspaceFilePath(String.raw`.\src\auth\auth.service.ts`)).toBe(
        'src/auth/auth.service.ts',
      );
    });

    it.each(['/etc/passwd', 'C:/Users/dev/secret.ts', '../secret.ts', 'src/../../secret.ts'])(
      'rejects unsafe path %s',
      (filePath) => {
        expect(normalizeWorkspaceFilePath(filePath)).toBeNull();
      },
    );

    it('rejects paths that exceed the storage limit', () => {
      expect(normalizeWorkspaceFilePath('a'.repeat(MAX_FILE_PATH_LENGTH + 1))).toBeNull();
    });
  });

  describe('addFileActivity', () => {
    it('adds time without mutating the original buckets', () => {
      const original = { 'src/main.ts': 60 };

      expect(addFileActivity(original, 'src/main.ts', 30)).toEqual({ 'src/main.ts': 90 });
      expect(original).toEqual({ 'src/main.ts': 60 });
    });
  });

  describe('getFileActivityDeltaSeconds', () => {
    it('caps an uninterrupted interval at five minutes', () => {
      const previousAt = new Date('2026-11-05T10:00:00.000Z');
      const nextAt = new Date('2026-11-05T11:00:00.000Z');

      expect(getFileActivityDeltaSeconds(previousAt, nextAt)).toBe(300);
    });

    it('does not return a negative interval for out-of-order events', () => {
      const previousAt = new Date('2026-11-05T11:00:00.000Z');
      const nextAt = new Date('2026-11-05T10:00:00.000Z');

      expect(getFileActivityDeltaSeconds(previousAt, nextAt)).toBe(0);
    });
  });
});
