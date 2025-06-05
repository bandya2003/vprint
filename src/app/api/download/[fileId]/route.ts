
import { NextResponse } from 'next/server';
import { getFileById } from '@/lib/actions'; // Using actions to get file metadata from Supabase

export async function GET(
  request: Request,
  { params }: { params: { fileId: string } }
) {
  const fileId = params.fileId;
  if (!fileId) {
    return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
  }

  // Fetches metadata from Supabase DB, which includes the actual Supabase Storage public URL
  const fileMetadata = await getFileById(fileId);

  if (!fileMetadata || !fileMetadata.download_url) {
    return NextResponse.json({ error: 'File not found or download URL missing' }, { status: 404 });
  }

  try {
    // Fetch the actual file from Supabase Storage using its public URL
    const fileResponse = await fetch(fileMetadata.download_url);

    if (!fileResponse.ok) {
      const errorText = await fileResponse.text();
      console.error(`Error fetching file from Supabase Storage: ${fileResponse.status} ${fileResponse.statusText}`, errorText);
      return NextResponse.json({ error: `Failed to fetch file from storage. Status: ${fileResponse.status}` }, { status: fileResponse.status });
    }

    const fileBuffer = await fileResponse.arrayBuffer();

    // Return the file with correct headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': fileMetadata.file_type,
        'Content-Disposition': `attachment; filename="${fileMetadata.file_name}"`,
        'Content-Length': fileBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving file from Supabase Storage:', error);
    let errorMessage = 'Failed to serve file';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
