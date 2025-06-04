"use server";

import { z } from 'zod';
import type { UploadedFile, FileUploadFormState } from '@/types';
import { revalidatePath } from 'next/cache';
import { isToday, isSameWeek, parseISO } from 'date-fns';

// --- Schemas ---
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/jpg',
];
const ALLOWED_EXTENSIONS_DISPLAY = ".pdf, .doc, .docx, .png, .jpg, .jpeg";

const FileUploadSchema = z.object({
  guestCode: z.string()
    .min(3, "Guest code must be at least 3 characters.")
    .max(20, "Guest code cannot exceed 20 characters.")
    .regex(/^[a-zA-Z0-9_.-]*$/, "Guest code can only contain letters, numbers, underscore, dot, or hyphen."),
  file: z
    .instanceof(File, { message: "File is required."})
    .refine((file) => file.size > 0, "File cannot be empty.")
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 10MB.`)
    .refine(
      (file) => ALLOWED_MIME_TYPES.includes(file.type),
      `Invalid file type. Only ${ALLOWED_EXTENSIONS_DISPLAY} files are accepted.`
    ),
});

// --- Mock Database and Storage ---
let mockFileDatabase: UploadedFile[] = [];

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
    
    const newFile: UploadedFile = {
      id: Math.random().toString(36).substring(2, 15),
      guestCode: guestCode.toLowerCase(),
      fileName,
      fileType,
      uploadDate: new Date().toISOString(),
      downloadUrl: `https://placehold.co/800x600.png?text=${encodeURIComponent('File: ' + fileName)}`, // Updated placeholder
      storagePath: `uploads/${guestCode}/${Date.now()}-${fileName}`,
      downloadTimestamps: [],
    };

    mockFileDatabase.push(newFile);
    revalidatePath('/');

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
  if (!guestCode || guestCode.trim() === "") {
    return [];
  }
  const files = mockFileDatabase.filter(file => file.guestCode === guestCode.toLowerCase());
  return files.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
}

export async function recordFileDownload(fileId: string): Promise<{ success: boolean; message?: string }> {
  const fileIndex = mockFileDatabase.findIndex(f => f.id === fileId);
  if (fileIndex === -1) {
    return { success: false, message: "File not found." };
  }
  if (!mockFileDatabase[fileIndex].downloadTimestamps) {
    mockFileDatabase[fileIndex].downloadTimestamps = [];
  }
  mockFileDatabase[fileIndex].downloadTimestamps!.push(new Date().toISOString());
  revalidatePath('/'); // To update stats if they are on the same page
  return { success: true };
}

export async function getDownloadStats(): Promise<{ today: number; thisWeek: number }> {
  let todayCount = 0;
  let thisWeekCount = 0;
  const now = new Date();

  mockFileDatabase.forEach(file => {
    if (file.downloadTimestamps) {
      file.downloadTimestamps.forEach(timestampStr => {
        try {
          const timestamp = parseISO(timestampStr);
          if (isToday(timestamp)) {
            todayCount++;
          }
          // isSameWeek by default considers Sunday as the start of the week.
          // For Monday as start: isSameWeek(timestamp, now, { weekStartsOn: 1 })
          if (isSameWeek(timestamp, now, { weekStartsOn: 1 })) {
            thisWeekCount++;
          }
        } catch (e) {
          console.error("Error parsing date for stats: ", timestampStr, e);
        }
      });
    }
  });
  return { today: todayCount, thisWeek: thisWeekCount };
}
