
import { Suspense } from 'react';
import { DownloadStats } from './DownloadStats'; // The async Server Component
import { DownloadStatsSkeleton } from './DownloadStatsSkeleton'; // The fallback

export function DownloadStatsContainer() {
  return (
    <Suspense fallback={<DownloadStatsSkeleton />}>
      <DownloadStats />
    </Suspense>
  );
}
