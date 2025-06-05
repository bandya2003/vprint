
// This is now a Server Component
import { Suspense } from 'react';
import { PaperPlaneLogo } from "@/components/paperplane/PaperPlaneLogo";
import StatsSection from './stats-section'; 
import { Separator } from "@/components/ui/separator";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { DownloadStatsSkeleton } from '@/components/paperplane/DownloadStatsSkeleton';
import HomePageClientContent from './home-page-client-content';

export default function Page() {
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
        <HomePageClientContent /> {/* Client component for dialog and FileList */}
        
        <Separator className="my-6 md:my-8" />

        {/* StatsSection rendered by Server Component, wrapped in Suspense */}
        <Suspense fallback={<DownloadStatsSkeleton />}>
          <StatsSection />
        </Suspense>
      </main>

      <footer className="w-full max-w-5xl text-center py-8 mt-auto">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Vprint. Your files are automatically deleted for your privacy.
        </p>
      </footer>
    </div>
  );
}
