
"use client"; 

import type { ReactNode } from 'react';
import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { FileUploadForm } from "@/components/paperplane/FileUploadForm";
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

// Dynamically import FileList component
const FileList = dynamic(() => import('@/components/paperplane/FileList'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center py-10 w-full max-w-2xl">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-2 text-muted-foreground">Loading file list...</p>
    </div>
  ),
});

export default function HomePageClientContent() {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const handleUploadSuccess = useCallback(() => {
    setIsUploadDialogOpen(false);
  }, [setIsUploadDialogOpen]); 

  return (
    <>
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

      {/* The Separator that was here will be rendered by the parent page.tsx Server Component */}

      <section id="retrieve" className="w-full flex justify-center px-2">
        <FileList />
      </section>
    </>
  );
}
