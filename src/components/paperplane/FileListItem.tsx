
"use client";

import type { UploadedFile } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, FileImage, Download, File as FileIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useTransition } from 'react';
import { recordFileDownload } from '@/lib/actions'; // Server action
import { useToast } from '@/hooks/use-toast';
import type { Timestamp } from 'firebase/firestore';

interface FileListItemProps {
  file: UploadedFile;
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) {
    return <FileImage className="h-8 w-8 text-accent" />;
  }
  if (fileType === 'application/pdf') {
    return <FileText className="h-8 w-8 text-primary" />;
  }
  if (fileType.includes('word')) {
    return <FileText className="h-8 w-8 text-primary" />;
  }
  return <FileIcon className="h-8 w-8 text-muted-foreground" />;
}

export function FileListItem({ file }: FileListItemProps) {
  // Convert Firestore Timestamp to JS Date for formatting
  const uploadDateObject = (file.uploadDate as Timestamp).toDate();
  const formattedDate = format(uploadDateObject, 'MMM dd, yyyy HH:mm');
  
  const [isDownloading, startDownloadTransition] = useTransition();
  const { toast } = useToast();

  // The download URL in file.downloadUrl now comes directly from Firebase Storage.
  // However, to record the download and maintain a consistent UX, we still route through our API.
  // The API route /api/download/[fileId] will handle fetching from the actual Firebase Storage URL.
  const apiDownloadUrl = `/api/download/${file.id}`;

  const handleDownload = () => {
    startDownloadTransition(async () => {
      const result = await recordFileDownload(file.id);
      
      if (result.success) {
        // Open the API route which will serve the file from Firebase Storage
        window.open(apiDownloadUrl, '_blank'); 
        toast({
          title: "Download Started",
          description: `"${file.fileName}" should begin downloading.`,
        });
      } else {
        toast({
          title: "Download Error",
          description: result.message || "Could not prepare file for download.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Card className="w-full overflow-hidden shadow-md transition-all hover:shadow-lg">
      <CardContent className="p-4 flex items-center space-x-4">
        <div className="flex-shrink-0">
          {getFileIcon(file.fileType)}
        </div>
        <div className="flex-grow min-w-0">
          <p className="text-sm font-medium text-foreground truncate" title={file.fileName}>
            {file.fileName}
          </p>
          <p className="text-xs text-muted-foreground">
            Type: {file.fileType}
          </p>
          <p className="text-xs text-muted-foreground">
            Uploaded: {formattedDate}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Download
        </Button>
      </CardContent>
    </Card>
  );
}
