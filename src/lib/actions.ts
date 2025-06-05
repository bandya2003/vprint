
"use server";

import { z } from 'zod';
import type { FileUploadFormState, UploadedFile } from '@/types';
import { revalidatePath } from 'next/cache';
import { 
  addFileToDb, 
  getFilesByGuestCodeFromDb, 
  recordFileDownloadInDb,
  getDownloadStatsFromDb
} from './mock-db'; // Import from mock-db

// --- Schemas ---
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'text/plain', // Added for simpler testing
];
const ALLOWED_EXTENSIONS_DISPLAY = ".pdf, .doc, .docx, .png, .jpg, .jpeg, .txt";

const FileUploadSchema = z.object({
  guestCode: z.string()
    .min(3, "Guest code must be at least 3 characters.")
    .max(20, "Guest code cannot exceed 20 characters.")
    .regex(/^[a-zA-Z0-9_.-]*$/, "Guest code can only contain letters, numbers, underscore, dot, or hyphen."),
  file: z
    .instanceof(File, { message: "File is required."})
    .refine((file) => file.size > 0, "File cannot be empty.")
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is ${MAX_FILE_SIZE / (1024*1024)}MB.`)
    .refine(
      (file) => ALLOWED_MIME_TYPES.includes(file.type),
      `Invalid file type. Only ${ALLOWED_EXTENSIONS_DISPLAY} files are accepted.`
    ),
});

async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  const blob = new Blob([file]);
  return await blob.arrayBuffer();
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function handleFileUpload(prevState: FileUploadFormState | undefined, formData: FormData): Promise<FileUploadFormState> {
  const rawFormData = {
    guestCode: formData.get('guestCode'),
    file: formData.get('file'),
  };

  const validatedFields = FileUploadSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      message: "Validation failed. Please check your inputs.",
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { guestCode, file } = validatedFields.data;

  try {
    const fileName = file.name;
    const fileType = file.type;
    
    const arrayBuffer = await fileToArrayBuffer(file);
    const base64Content = arrayBufferToBase64(arrayBuffer);

    const newFileId = Math.random().toString(36).substring(2, 15);
    const newFile: UploadedFile = {
      id: newFileId,
      guestCode: guestCode.toLowerCase(),
      fileName,
      fileType,
      uploadDate: new Date().toISOString(),
      downloadUrl: `/api/download/${newFileId}`, // Points to our new API route
      storagePath: `uploads/mock/${guestCode}/${Date.now()}-${fileName}`, // Conceptual
      downloadTimestamps: [],
      fileContentBase64: base64Content,
    };

    addFileToDb(newFile);
    revalidatePath('/'); // Revalidate to update lists and stats

    return {
      message: `File "${fileName}" uploaded successfully for guest code "${guestCode}".`,
      success: true,
      uploadedFile: newFile,
    };

  } catch (error) {
    console.error("Upload error:", error);
    return {
      message: "An unexpected error occurred during file upload.",
      success: false,
      errors: { _form: ["Upload failed. Please try again."] }
    };
  }
}

export async function fetchFilesByGuestCode(guestCode: string): Promise<UploadedFile[]> {
  return getFilesByGuestCodeFromDb(guestCode);
}

export async function recordFileDownload(fileId: string): Promise<{ success: boolean; message?: string }> {
  const success = recordFileDownloadInDb(fileId);
  if (!success) {
    return { success: false, message: "File not found for recording download." };
  }
  revalidatePath('/'); // To update stats if they are on the same page
  return { success: true };
}

export async function getDownloadStats(): Promise<{ today: number; thisWeek: number }> {
  return getDownloadStatsFromDb();
}
