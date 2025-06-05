
// This is a Server Component (no 'use client' directive)
import { Suspense } from 'react';
import { DownloadStatsDataFetcher, type StatsData } from '@/components/paperplane/DownloadStatsDataFetcher';
import { DownloadStatsDisplay } from '@/components/paperplane/DownloadStatsDisplay';
import { DownloadStatsSkeleton } from '@/components/paperplane/DownloadStatsSkeleton';

export default function StatsSection() {
  return (
    <section id="stats" className="w-full flex justify-center px-2">
      <Suspense fallback={<DownloadStatsSkeleton />}>
        <DownloadStatsDataFetcher>
          {(stats: StatsData) => <DownloadStatsDisplay stats={stats} />}
        </DownloadStatsDataFetcher>
      </Suspense>
    </section>
  );
}
