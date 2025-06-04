import { getDownloadStats } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, CalendarCheck2, CheckSquare } from 'lucide-react';

export async function DownloadStats() {
  const stats = await getDownloadStats();

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-headline flex items-center">
          <TrendingUp className="mr-2 h-5 w-5 text-accent" />
          Print Activity
        </CardTitle>
        <CardDescription>
          Overview of files downloaded (interpreted as "printed").
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
          <div className="flex items-center">
            <CheckSquare className="mr-3 h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Files Printed Today:</span>
          </div>
          <span className="text-sm font-semibold text-primary">{stats.today}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
          <div className="flex items-center">
            <CalendarCheck2 className="mr-3 h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Files Printed This Week:</span>
          </div>
          <span className="text-sm font-semibold text-primary">{stats.thisWeek}</span>
        </div>
        <p className="text-xs text-muted-foreground pt-2 text-center">
          Note: "Printed" is based on file downloads. Stats are indicative and reset with server restarts in this mock version.
        </p>
      </CardContent>
    </Card>
  );
}
