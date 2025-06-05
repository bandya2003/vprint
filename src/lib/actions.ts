
"use server";

import { z } from 'zod';
import type { FileUploadFormState, UploadedFile } from '@/types';
import { revalidatePath } from 'next/cache';
import { supabase } from './supabase'; // Using Supabase client
import { isToday, isSameWeek, parseISO } from 'date-fns';

const SUPABASE_BUCKET_NAME = 'vprint-files';

// --- Schemas ---
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (Supabase free tier allows larger, but good to have a limit)
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
  const normalizedGuestCode = guestCode.toLowerCase();
  const uniqueFileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`; // Ensure unique name, replace spaces
  const storagePath = `${normalizedGuestCode}/${uniqueFileName}`; // Path in Supabase storage

  try {
    // 1. Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(SUPABASE_BUCKET_NAME)
      .upload(storagePath, file, {
        cacheControl: '3600', // Optional: cache for 1 hour
        upsert: false, // Don't overwrite if somehow a file with the exact same path exists
      });

    if (uploadError) {
      console.error("Supabase Storage upload error:", {
        message: uploadError.message,
        error: uploadError.error,
        status: (uploadError as any).status, // For HttpError
        stack: uploadError.stack,
      });
      return {
        message: `Storage upload failed: ${uploadError.message}`,
        success: false,
        errors: { _form: [`Storage upload failed. Details: ${uploadError.message}`] }
      };
    }

    if (!uploadData || !uploadData.path) {
         return {
            message: "Storage upload failed: No path returned from Supabase.",
            success: false,
            errors: { _form: ["Storage upload failed: No path returned."] }
        };
    }

    // 2. Get public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from(SUPABASE_BUCKET_NAME)
      .getPublicUrl(storagePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      // Attempt to clean up storage if URL retrieval fails
      await supabase.storage.from(SUPABASE_BUCKET_NAME).remove([storagePath]);
      return {
        message: "Failed to get public URL for the uploaded file.",
        success: false,
        errors: { _form: ["Could not retrieve file URL after upload."] }
      };
    }
    const downloadUrl = publicUrlData.publicUrl;
    
    // 3. Insert file metadata into Supabase database
    const fileMetadataToInsert = {
      guest_code: normalizedGuestCode,
      file_name: file.name,
      file_type: file.type,
      upload_date: new Date().toISOString(),
      download_url: downloadUrl,
      storage_path: storagePath,
      download_timestamps: [] as string[],
    };

    const { data: dbData, error: dbError } = await supabase
      .from('files')
      .insert(fileMetadataToInsert)
      .select() // Important to get the inserted row back, especially the ID
      .single(); // We expect a single row to be inserted and returned

    if (dbError) {
      console.error("Supabase DB insert error:", {
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code,
      });
      // Attempt to clean up storage if DB insert fails
      await supabase.storage.from(SUPABASE_BUCKET_NAME).remove([storagePath]);
      return {
        message: `Database operation failed: ${dbError.message}`,
        success: false,
        errors: { _form: [`Database operation failed. Details: ${dbError.message}`] }
      };
    }
    
    revalidatePath('/');

    return {
      message: `File "${file.name}" uploaded successfully for guest code "${guestCode}".`,
      success: true,
      uploadedFileId: dbData?.id, // Supabase generates the ID
    };

  } catch (error) {
    console.error("Upload error (general catch):", error);
    let errorMessage = "An unexpected error occurred during file upload.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    // Attempt to clean up storage if a general error occurs, though path might not be defined
    if (storagePath) {
        try {
            await supabase.storage.from(SUPABASE_BUCKET_NAME).remove([storagePath]);
        } catch (cleanupError) {
            console.error("Cleanup error after general upload failure:", cleanupError);
        }
    }
    return {
      message: errorMessage,
      success: false,
      errors: { _form: ["Upload failed. Please try again. Details: " + errorMessage] }
    };
  }
}

export async function getFileById(fileId: string): Promise<UploadedFile | null> {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('id', fileId)
    .single();

  if (error) {
    console.error('Error fetching file by ID from Supabase:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    return null;
  }
  return data as UploadedFile | null;
}


export async function fetchFilesByGuestCode(guestCode: string): Promise<UploadedFile[]> {
  if (!guestCode || guestCode.trim() === "") {
    return [];
  }
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('guest_code', guestCode.toLowerCase())
    .order('upload_date', { ascending: false });

  if (error) {
    console.error('Error fetching files by guest code from Supabase:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    return [];
  }
  return data as UploadedFile[];
}


export async function recordFileDownload(fileId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const file = await getFileById(fileId);
    if (!file) {
      return { success: false, message: "File not found." };
    }

    const newTimestamps = [...(file.download_timestamps || []), new Date().toISOString()];

    const { error } = await supabase
      .from('files')
      .update({ download_timestamps: newTimestamps })
      .eq('id', fileId);

    if (error) {
      console.error('Error updating download timestamps in Supabase:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return { success: false, message: "Failed to record download in DB." };
    }
    
    revalidatePath('/'); // Revalidate if stats are shown on the same page
    return { success: true };
  } catch (e) {
    const error = e as Error;
    console.error("Error recording download (general catch):", error.message, error.stack);
    return { success: false, message: "Failed to record download." };
  }
}

export async function getDownloadStats(): Promise<{ today: number; thisWeek: number }> {
  let todayCount = 0;
  let thisWeekCount = 0;
  const now = new Date();
  
  try {
    const { data: allFiles, error } = await supabase
      .from('files')
      .select('download_timestamps');

    if (error) {
      console.error("Supabase error in getDownloadStats:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return { today: 0, thisWeek: 0 };
    }

    if (allFiles) {
      allFiles.forEach((file) => {
        if (file.download_timestamps && Array.isArray(file.download_timestamps)) {
          file.download_timestamps.forEach((timestamp: string) => {
            try {
              const downloadDate = parseISO(timestamp);
              if (isToday(downloadDate)) {
                todayCount++;
              }
              if (isSameWeek(downloadDate, now, { weekStartsOn: 1 })) {
                thisWeekCount++;
              }
            } catch (parseError) {
              const pError = parseError as Error;
              console.warn("Could not parse timestamp for stats:", timestamp, pError.message);
            }
          });
        }
      });
    }
  } catch (e) {
    const generalError = e as Error;
    console.error("General error in getDownloadStats processing:", {
        message: generalError.message || "N/A",
        stack: generalError.stack || "N/A",
    });
    return { today: 0, thisWeek: 0 }; // Ensure return in case of processing error
  }
  
  return { today: todayCount, thisWeek: thisWeekCount };
}
