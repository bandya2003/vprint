
// No "use client" directive - this is a Server Component
import { DownloadStatsDisplay } from './DownloadStatsDisplay';

interface StatsData {
  today: number;
  thisWeek: number;
}

// This is an async Server Component that simulates fetching its own data
export async function DownloadStatsContainer() {
  // Simulate an asynchronous operation (like fetching data)
  // console.log("Simulating async data fetch in DownloadStatsContainer..."); // Server-side log
  await new Promise(resolve => setTimeout(resolve, 50)); 

  const stats: StatsData = {
    today: Math.floor(Math.random() * 10) + 1, // Dummy data
    thisWeek: Math.floor(Math.random() * 50) + 5, // Dummy data
  };
  // console.log("Simulated stats:", stats); // Server-side log

  return <DownloadStatsDisplay stats={stats} />;
}
