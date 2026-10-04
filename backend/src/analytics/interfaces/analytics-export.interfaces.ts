export interface ExportedFile {
  content: string;
  contentType: string;
  filename: string;
}

export interface SessionExportRaw {
  date: Date | string;
  projectName: string | null;
  gitBranch: string | null;
  activeSeconds: string | null;
  focusScore: string | null;
  earnedMoney: string | null;
  primaryLanguage: string | null;
}
