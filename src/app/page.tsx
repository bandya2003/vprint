
"use client"; // Required for useState, useEffect, useCallback

import { useState, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { PaperPlaneLogo } from "@/components/paperplane/PaperPlaneLogo";
import { FileUploadForm } from "@/components/paperplane/FileUploadForm";
import { DownloadStatsDataFetcher, type StatsData } from '@/components/paperplane/DownloadStatsDataFetcher';
import { DownloadStatsDisplay } from '@/components/paperplane/DownloadStatsDisplay';
import { DownloadStatsSkeleton } from '@/components/paperplane/DownloadStatsSkeleton';
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UploadCloud, Loader2 } from "lucide-react";
import { ThemeToggleButton } from "@/components/theme-toggle-button";

// Dynamically import FileList component, adjusting for default export
const FileList = dynamic(() => import('@/components/paperplane/FileList'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center py-10 w-full max-w-2xl">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-2 text-muted-foreground">Loading file list...</p>
    </div>
  ),
});


export default function HomePage() {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const handleUploadSuccess = useCallback(() => {
    setIsUploadDialogOpen(false);
  }, [setIsUploadDialogOpen]); // Include setIsUploadDialogOpen in dependencies for completeness, though it's stable

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 md:p-8 space-y-10">
      <div className="absolute top-4 right-4 md:top-6 md:right-6">
        <ThemeToggleButton />
      </div>
      <header className="text-center space-y-3 pt-4 md:pt-2">
        <div className="flex justify-center items-center mb-2">
          <PaperPlaneLogo size={60} />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
          Welcome to Vprint
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl">
          No more WhatsApp juggling. Quickly retrieve and print your documents.
        </p>
      </header>

      <main className="w-full max-w-5xl space-y-10 flex flex-col items-center">
        <section id="upload-trigger" className="w-full flex flex-col items-center justify-center px-2 space-y-4">
            <p className="text-center text-muted-foreground">
                Need to share a document? Click below to upload. Only the first file will be processed if multiple are selected.
            </p>
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsUploadDialogOpen(true)} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-6 text-lg shadow-md transition-transform hover:scale-105">
                <UploadCloud className="mr-2 h-6 w-6" /> Upload New File
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline">Upload Your File</DialogTitle>
                <DialogDescription>
                  Enter a guest code and choose a file. Only the first file will be processed if multiple are selected. Max 20MB.
                </DialogDescription>
              </DialogHeader>
              <div className="pt-4">
                <FileUploadForm onSuccess={handleUploadSuccess} />
              </div>
            </DialogContent>
          </Dialog>
        </section>

        <Separator className="my-6 md:my-8" />

        <section id="retrieve" className="w-full flex justify-center px-2">
          <FileList />
        </section>
        
        <Separator className="my-6 md:my-8" />

        <section id="stats" className="w-full flex justify-center px-2">
           <Suspense fallback={<DownloadStatsSkeleton />}>
            <DownloadStatsDataFetcher>
              {(stats: StatsData) => <DownloadStatsDisplay stats={stats} />}
            </DownloadStatsDataFetcher>
          </Suspense>
        </section>
      </main>

      <footer className="w-full max-w-5xl text-center py-8 mt-auto">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Vprint. Your files are automatically deleted for your privacy.
        </p>
      </footer>
    </div>
  );
}
