
import { NextResponse } from 'next/server';
import { getFileById } from '@/lib/actions'; // Using the local actions file

export async function GET(
  request: Request,
  { params }: { params: { fileId: string } }
) {
  const fileId = params.fileId;
  if (!fileId) {
    return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
  }

  const fileMetadata = await getFileById(fileId);

  if (!fileMetadata || !fileMetadata.fileContentBase64) {
    return NextResponse.json({ error: 'File not found or content missing' }, { status: 404 });
  }

  try {
    const fileBuffer = Buffer.from(fileMetadata.fileContentBase64, 'base64');

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': fileMetadata.fileType,
        'Content-Disposition': `attachment; filename="${fileMetadata.fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    let errorMessage = 'Failed to serve file';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
