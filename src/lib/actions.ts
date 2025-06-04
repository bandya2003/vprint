"use server";

import { z } from 'zod';
import type { UploadedFile, FileUploadFormState } from '@/types';
import { revalidatePath } from 'next/cache';

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
// In a real app, this would interact with Firebase Firestore and Storage.
// Auto-cleanup (deleting files after 2-7 days) would be a separate scheduled Firebase Cloud Function.
// This function would query Firestore for records with an 'uploadDate' older than the threshold
// and then delete the corresponding file from Firebase Storage and the record from Firestore.
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
    // Simulate file upload to storage (e.g., Firebase Storage)
    // In a real scenario, you'd get a downloadURL and storagePath from the storage service.
    const fileName = file.name;
    const fileType = file.type;
    
    // Simulate saving metadata to database (e.g., Firestore)
    const newFile: UploadedFile = {
      id: Math.random().toString(36).substring(2, 15), // Mock ID
      guestCode: guestCode.toLowerCase(), // Store guest code in lowercase for case-insensitive search
      fileName,
      fileType,
      uploadDate: new Date().toISOString(),
      // In a real app, this URL would come from Firebase Storage after upload.
      // For this mock, we'll use a placeholder that indicates it's a mock.
      downloadUrl: `mock://download/${guestCode}/${fileName}`, 
      storagePath: `uploads/${guestCode}/${Date.now()}-${fileName}`, // Mock storage path
    };

    mockFileDatabase.push(newFile);
    
    // Revalidate the path to update any displayed file lists
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
  // Filter mock database. In a real app, this would query Firestore.
  // Guest codes are stored and searched in lowercase.
  const files = mockFileDatabase.filter(file => file.guestCode === guestCode.toLowerCase());
  
  // Sort by upload date, newest first
  return files.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
}
