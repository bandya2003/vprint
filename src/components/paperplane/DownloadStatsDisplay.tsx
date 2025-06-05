'use client'; // This component uses UI elements and receives props, making it a Client Component.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, CalendarCheck2, CheckSquare } from 'lucide-react';
import type { StatsData } from './DownloadStatsDataFetcher'; // Import the shared interface

export function DownloadStatsDisplay({ stats }: { stats: StatsData }) {
  return (
    <Card className="w-full max-w-2xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-headline flex items-center text-accent">
          <TrendingUp className="mr-2 h-5 w-5 text-accent" />
          Print Activity
        </CardTitle>
        <CardDescription>
          Overview of files downloaded (interpreted as "printed").
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center">
            <CheckSquare className="mr-3 h-6 w-6 text-primary" />
            <span className="text-sm font-medium text-foreground">Files Printed Today:</span>
          </div>
          <span className="text-lg font-bold text-primary">{stats.today}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center">
            <CalendarCheck2 className="mr-3 h-6 w-6 text-primary" />
            <span className="text-sm font-medium text-foreground">Files Printed This Week:</span>
          </div>
          <span className="text-lg font-bold text-primary">{stats.thisWeek}</span>
        </div>
        <p className="text-xs text-muted-foreground pt-2 text-center">
          Note: "Printed" is based on file downloads. Stats are fetched from Supabase.
        </p>
      </CardContent>
    </Card>
  );
}
