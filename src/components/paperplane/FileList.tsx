
"use client";

import { useState, useTransition, FormEvent, ChangeEvent } from 'react';
import type { UploadedFile } from '@/types';
import { fetchFilesByGuestCode } from '@/lib/actions';
import FileListItem from './FileListItem'; // Changed import
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2, FileWarning } from 'lucide-react';

export default function FileList() {
  const [guestCode, setGuestCode] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [searched, setSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!guestCode.trim()) {
      setFiles([]);
      setSearched(false);
      return;
    }
    setSearched(false);
    startTransition(async () => {
      const fetchedFiles = await fetchFilesByGuestCode(guestCode);
      setFiles(fetchedFiles);
      setSearched(true);
    });
  };

  return (
    <Card className="w-full max-w-2xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Retrieve Your Files</CardTitle>
        <CardDescription>Enter your guest code to find your uploaded files.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex items-end space-x-2 mb-6">
          <div className="flex-grow space-y-1">
            <Label htmlFor="searchGuestCode">Guest Code</Label>
            <Input
              id="searchGuestCode"
              type="text"
              placeholder="Enter your guest code"
              value={guestCode}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setGuestCode(e.target.value)}
              className="w-full"
            />
          </div>
          <Button type="submit" disabled={isPending || !guestCode.trim()} className="bg-primary hover:bg-primary/90">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Search
          </Button>
        </form>

        {isPending && !searched && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Searching for files...</p>
          </div>
        )}

        {!isPending && searched && files.length === 0 && (
          <div className="text-center py-10">
            <FileWarning className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">No files found.</p>
            <p className="text-sm text-muted-foreground">
              No files match the guest code "{guestCode}". Please check the code or upload your files.
            </p>
          </div>
        )}

        {!isPending && files.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Your Files:</h3>
            {files.map((file) => (
              <FileListItem key={file.id} file={file} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
