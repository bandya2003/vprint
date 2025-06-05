
"use server";

import { z } from 'zod';
import type { FileUploadFormState, UploadedFile } from '@/types';
import { revalidatePath } from 'next/cache';
import { mockFileDatabase } from './mock-db'; // Using mock DB
import { isToday, isSameWeek, fromUnixTime } from 'date-fns';

// --- Schemas ---
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'text/plain',
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

// Helper function to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer) {
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
    const fileBuffer = await file.arrayBuffer();
    const fileContentBase64 = arrayBufferToBase64(fileBuffer);
    
    const newFileId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newFile: UploadedFile = {
      id: newFileId,
      guestCode: guestCode.toLowerCase(),
      fileName: file.name,
      fileType: file.type,
      uploadDate: Date.now(), // JS Timestamp
      downloadUrl: `/api/download/${newFileId}`, // Points to our API route
      fileContentBase64: fileContentBase64,
      downloadTimestamps: [],
    };

    mockFileDatabase.push(newFile);
    
    revalidatePath('/');

    return {
      message: `File "${file.name}" uploaded successfully for guest code "${guestCode}".`,
      success: true,
      uploadedFileId: newFile.id,
    };

  } catch (error) {
    console.error("Upload error:", error);
    let errorMessage = "An unexpected error occurred during file upload.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return {
      message: errorMessage,
      success: false,
      errors: { _form: ["Upload failed. Please try again. Details: " + errorMessage] }
    };
  }
}

async function getFileById(fileId: string): Promise<UploadedFile | null> {
  const file = mockFileDatabase.find(f => f.id === fileId);
  return file || null;
}


export async function fetchFilesByGuestCode(guestCode: string): Promise<UploadedFile[]> {
  if (!guestCode || guestCode.trim() === "") {
    return [];
  }
  const files = mockFileDatabase
    .filter(f => f.guestCode === guestCode.toLowerCase())
    .sort((a, b) => b.uploadDate - a.uploadDate); // Sort by newest first
  return files;
}


export async function recordFileDownload(fileId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const fileIndex = mockFileDatabase.findIndex(f => f.id === fileId);
    if (fileIndex === -1) {
      return { success: false, message: "File not found." };
    }
    if (!mockFileDatabase[fileIndex].downloadTimestamps) {
      mockFileDatabase[fileIndex].downloadTimestamps = [];
    }
    mockFileDatabase[fileIndex].downloadTimestamps?.push(Date.now());
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Error recording download:", error);
    return { success: false, message: "Failed to record download." };
  }
}

export async function getDownloadStats(): Promise<{ today: number; thisWeek: number }> {
  let todayCount = 0;
  let thisWeekCount = 0;
  const now = new Date();
  
  try {
    mockFileDatabase.forEach((file) => {
      if (file.downloadTimestamps && Array.isArray(file.downloadTimestamps)) {
        file.downloadTimestamps.forEach((timestamp: number) => {
          const downloadDate = new Date(timestamp); // JS Date from timestamp
          if (isToday(downloadDate)) {
            todayCount++;
          }
          if (isSameWeek(downloadDate, now, { weekStartsOn: 1 })) { // Assuming week starts on Monday
            thisWeekCount++;
          }
        });
      }
    });
  } catch (error) {
    console.error("Error fetching download stats:", error);
  }
  
  return { today: todayCount, thisWeek: thisWeekCount };
}

// Export getFileById for use in the API route
export { getFileById };
