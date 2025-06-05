'use client'; // This component is for UI fallback and uses UI components.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';

export function DownloadStatsSkeleton() {
  return (
    <Card className="w-full max-w-2xl shadow-lg animate-pulse">
      <CardHeader>
        <CardTitle className="text-xl font-headline flex items-center text-accent">
          <TrendingUp className="mr-2 h-5 w-5 text-accent" />
          Print Activity
        </CardTitle>
        <CardDescription>
          Loading download statistics...
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <Skeleton className="h-6 w-3/5" />
          <Skeleton className="h-6 w-1/5" />
        </div>
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <Skeleton className="h-6 w-3/5" />
          <Skeleton className="h-6 w-1/5" />
        </div>
         <p className="text-xs text-muted-foreground pt-2 text-center">
          Note: "Printed" is based on file downloads. Stats are fetched from Supabase.
        </p>
      </CardContent>
    </Card>
  );
}
