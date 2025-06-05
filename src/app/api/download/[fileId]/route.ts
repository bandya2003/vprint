
import { NextResponse } from 'next/server';
import { getFileByIdFromFirestore } from '@/lib/actions'; // Updated import path

export async function GET(
  request: Request,
  { params }: { params: { fileId: string } }
) {
  const fileId = params.fileId;
  if (!fileId) {
    return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
  }

  const fileMetadata = await getFileByIdFromFirestore(fileId);

  if (!fileMetadata || !fileMetadata.downloadUrl) {
    return NextResponse.json({ error: 'File not found or download URL missing' }, { status: 404 });
  }

  try {
    // Fetch the file from the Firebase Storage URL
    const fileResponse = await fetch(fileMetadata.downloadUrl);

    if (!fileResponse.ok) {
      console.error('Error fetching file from storage:', fileResponse.status, await fileResponse.text());
      return NextResponse.json({ error: 'Failed to fetch file from storage' }, { status: fileResponse.status });
    }

    const fileBuffer = await fileResponse.arrayBuffer();

    return new NextResponse(Buffer.from(fileBuffer), {
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
