
import { NextResponse } from 'next/server';
import { findFileById } from '@/lib/mock-db'; // Import from mock-db

export async function GET(
  request: Request,
  { params }: { params: { fileId: string } }
) {
  const fileId = params.fileId;
  if (!fileId) {
    return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
  }

  const file = findFileById(fileId);

  if (!file || !file.fileContentBase64) {
    return NextResponse.json({ error: 'File not found or content missing' }, { status: 404 });
  }

  try {
    const fileBuffer = Buffer.from(file.fileContentBase64, 'base64');

    // Ensure downloadTimestamps are updated via the UI flow which calls recordFileDownload action
    // We don't call recordFileDownloadInDb here directly to keep API GET idempotent and action-based state changes separate.
    // The FileListItem component should call the recordFileDownload server action before opening this URL.

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': file.fileType,
        'Content-Disposition': `attachment; filename="${file.fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}
