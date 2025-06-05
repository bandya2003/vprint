
import { getDownloadStats } from '@/lib/actions';
import { DownloadStatsDisplay } from './DownloadStatsDisplay'; // Import the renamed presentational component

// This is now an async Server Component
export async function DownloadStatsContainer() {
  const stats = await getDownloadStats();
  return <DownloadStatsDisplay stats={stats} />;
}
