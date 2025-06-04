import type { UploadedFile } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, FileImage, Download, File as FileIcon } from 'lucide-react';
import { format } from 'date-fns';

interface FileListItemProps {
  file: UploadedFile;
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) {
    return <FileImage className="h-8 w-8 text-accent" />;
  }
  if (fileType === 'application/pdf') {
    return <FileText className="h-8 w-8 text-red-500" />;
  }
  if (fileType.includes('word')) {
    return <FileText className="h-8 w-8 text-blue-500" />;
  }
  return <FileIcon className="h-8 w-8 text-muted-foreground" />;
}

export function FileListItem({ file }: FileListItemProps) {
  const formattedDate = format(new Date(file.uploadDate), 'MMM dd, yyyy HH:mm');

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
          asChild 
          variant="outline" 
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {/* In a real app, file.downloadUrl would point to the actual file in Firebase Storage */}
          {/* For this mock, we'll make it "download" a placeholder image */}
          <a href={`https://placehold.co/600x400.png?text=${encodeURIComponent(file.fileName)}`} download={file.fileName} target="_blank" rel="noopener noreferrer">
            <Download className="mr-2 h-4 w-4" />
            Download
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
