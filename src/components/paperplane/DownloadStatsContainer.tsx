
// No "use client" directive - this is a Server Component
import { DownloadStatsDisplay } from './DownloadStatsDisplay';
import { supabase } from '@/lib/supabase';
import { isToday, isSameWeek, parseISO } from 'date-fns';

interface StatsData {
  today: number;
  thisWeek: number;
}

// This function fetches data on the server.
async function fetchServerSideStats(): Promise<StatsData> {
  let todayCount = 0;
  let thisWeekCount = 0;
  const now = new Date();

  try {
    const { data: allFiles, error } = await supabase
      .from('files')
      .select('download_timestamps');

    if (error) {
      console.error("Supabase error in DownloadStatsContainer/fetchServerSideStats:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      // Return zero stats on error to prevent breaking the page
      return { today: 0, thisWeek: 0 };
    }

    if (allFiles) {
      allFiles.forEach((file) => {
        if (file.download_timestamps && Array.isArray(file.download_timestamps)) {
          file.download_timestamps.forEach((timestamp: string) => {
            try {
              const downloadDate = parseISO(timestamp);
              if (isToday(downloadDate)) {
                todayCount++;
              }
              if (isSameWeek(downloadDate, now, { weekStartsOn: 1 })) {
                thisWeekCount++;
              }
            } catch (parseError) {
              const pError = parseError as Error;
              console.warn("Could not parse timestamp for stats in DownloadStatsContainer:", timestamp, pError.message);
            }
          });
        }
      });
    }
  } catch (e) {
    const generalError = e as Error;
    console.error("General error in DownloadStatsContainer/fetchServerSideStats processing:", {
        message: generalError.message || "N/A",
        stack: generalError.stack || "N/A",
    });
    // Return zero stats on error
    return { today: 0, thisWeek: 0 };
  }
  return { today: todayCount, thisWeek: thisWeekCount };
}

// This is an async Server Component.
export async function DownloadStatsContainer() {
  const stats = await fetchServerSideStats();
  // DownloadStatsDisplay is now correctly marked as 'use client'
  return <DownloadStatsDisplay stats={stats} />;
}
