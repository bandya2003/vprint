
"use client";

import type { UploadedFile } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, FileImage, Download, File as FileIcon, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useTransition } from 'react';
import { recordFileDownload } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

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

export default function FileListItem({ file }: FileListItemProps) {
  let formattedDate = "Invalid Date";
  try {
    const uploadDateObject = parseISO(file.upload_date); // Supabase stores as ISO string
    formattedDate = format(uploadDateObject, 'MMM dd, yyyy HH:mm');
  } catch (e) {
    console.error("Error parsing date:", file.upload_date, e);
  }

  const [isDownloading, startDownloadTransition] = useTransition();
  const { toast } = useToast();

  // The download now points to our internal API route which will then fetch from Supabase
  const apiDownloadUrl = `/api/download/${file.id}`;

  const handleDownload = () => {
    startDownloadTransition(async () => {
      const result = await recordFileDownload(file.id); // Records download in Supabase DB

      if (result.success) {
        // Open our API route which will serve the file from Supabase Storage
        window.open(apiDownloadUrl, '_blank');
        toast({
          title: "Download Started",
          description: `"${file.file_name}" should begin downloading.`,
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
          {getFileIcon(file.file_type)}
        </div>
        <div className="flex-grow min-w-0">
          <p className="text-sm font-medium text-foreground truncate" title={file.file_name}>
            {file.file_name}
          </p>
          <p className="text-xs text-muted-foreground">
            Type: {file.file_type}
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
