// No "use client" directive - this is a Server Component
import { supabase } from '@/lib/supabase';
import { isToday, isSameWeek, parseISO } from 'date-fns';
import type { ReactNode } from 'react';

export interface StatsData {
  today: number;
  thisWeek: number;
}

async function fetchStatsData(): Promise<StatsData> {
  let todayCount = 0;
  let thisWeekCount = 0;
  const now = new Date();

  try {
    const { data: allFiles, error } = await supabase
      .from('files')
      .select('download_timestamps');

    if (error) {
      console.error("Supabase error in DownloadStatsDataFetcher/fetchStatsData:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
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
              console.warn("Could not parse timestamp for stats in DownloadStatsDataFetcher:", timestamp, pError.message);
            }
          });
        }
      });
    }
  } catch (e) {
    const generalError = e as Error;
    console.error("General error in DownloadStatsDataFetcher/fetchStatsData processing:", {
        message: generalError.message || "N/A",
        stack: generalError.stack || "N/A",
    });
    return { today: 0, thisWeek: 0 };
  }
  return { today: todayCount, thisWeek: thisWeekCount };
}

interface DownloadStatsDataFetcherProps {
  children: (stats: StatsData) => ReactNode;
}

export async function DownloadStatsDataFetcher({ children }: DownloadStatsDataFetcherProps) {
  const stats = await fetchStatsData();
  return <>{children(stats)}</>;
}
