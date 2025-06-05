
import type { UploadedFile } from '@/types';

// This is our in-memory "database"
export let mockFileDatabase: UploadedFile[] = [];

export function findFileById(fileId: string): UploadedFile | undefined {
  return mockFileDatabase.find(file => file.id === fileId);
}

export function addFileToDb(file: UploadedFile): void {
  mockFileDatabase.push(file);
}

export function getFilesByGuestCodeFromDb(guestCode: string): UploadedFile[] {
  if (!guestCode || guestCode.trim() === "") {
    return [];
  }
  const files = mockFileDatabase.filter(file => file.guestCode === guestCode.toLowerCase());
  return files.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
}

export function recordFileDownloadInDb(fileId: string): boolean {
  const fileIndex = mockFileDatabase.findIndex(f => f.id === fileId);
  if (fileIndex === -1) {
    return false;
  }
  if (!mockFileDatabase[fileIndex].downloadTimestamps) {
    mockFileDatabase[fileIndex].downloadTimestamps = [];
  }
  mockFileDatabase[fileIndex].downloadTimestamps!.push(new Date().toISOString());
  return true;
}

// Function to get download stats (could be more optimized if DB was real)
export function getDownloadStatsFromDb(): { today: number; thisWeek: number } {
  let todayCount = 0;
  let thisWeekCount = 0;
  const now = new Date();
  const { isToday, isSameWeek, parseISO } = require('date-fns'); // Keep require for server environment

  mockFileDatabase.forEach(file => {
    if (file.downloadTimestamps) {
      file.downloadTimestamps.forEach(timestampStr => {
        try {
          const timestamp = parseISO(timestampStr);
          if (isToday(timestamp)) {
            todayCount++;
          }
          if (isSameWeek(timestamp, now, { weekStartsOn: 1 })) {
            thisWeekCount++;
          }
        } catch (e) {
          console.error("Error parsing date for stats: ", timestampStr, e);
        }
      });
    }
  });
  return { today: todayCount, thisWeek: thisWeekCount };
}
