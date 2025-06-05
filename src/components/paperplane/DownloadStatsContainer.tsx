
// No "use client" directive - this is a Server Component
import { supabase } from '@/lib/supabase';
import { isToday, isSameWeek, parseISO } from 'date-fns';
import { DownloadStatsDisplay } from './DownloadStatsDisplay';

interface StatsData {
  today: number;
  thisWeek: number;
}

// This is now an async Server Component that fetches its own data
export async function DownloadStatsContainer() {
  let todayCount = 0;
  let thisWeekCount = 0;
  const now = new Date();
  let stats: StatsData = { today: 0, thisWeek: 0 };

  try {
    const { data: allFiles, error } = await supabase
      .from('files')
      .select('download_timestamps');

    if (error) {
      console.error("Supabase error in DownloadStatsContainer:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      // In case of an error, we'll render with 0 stats
      // Optionally, you could pass an error message to DownloadStatsDisplay
    } else if (allFiles) {
      allFiles.forEach((file) => {
        if (file.download_timestamps && Array.isArray(file.download_timestamps)) {
          file.download_timestamps.forEach((timestamp: string | null) => {
            if (timestamp) { // Ensure timestamp is not null
              try {
                const downloadDate = parseISO(timestamp);
                if (isToday(downloadDate)) {
                  todayCount++;
                }
                // Ensure 'now' is passed as the second argument to isSameWeek
                if (isSameWeek(downloadDate, now, { weekStartsOn: 1 })) { 
                  thisWeekCount++;
                }
              } catch (parseError) {
                const pError = parseError as Error;
                console.warn("Could not parse timestamp for stats in DownloadStatsContainer:", timestamp, pError.message);
              }
            }
          });
        }
      });
      stats = { today: todayCount, thisWeek: thisWeekCount };
    }
  } catch (e) {
    const generalError = e as Error;
    console.error("General error in DownloadStatsContainer processing:", {
        message: generalError.message || "N/A",
        stack: generalError.stack || "N/A",
    });
    // Render with 0 stats on general error
  }

  return <DownloadStatsDisplay stats={stats} />;
}
