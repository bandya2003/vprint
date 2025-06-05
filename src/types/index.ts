
export interface UploadedFile {
  id: string; // Supabase will generate this UUID
  guest_code: string;
  file_name: string;
  file_type: string; // MIME type
  upload_date: string; // ISO 8601 string (e.g., from new Date().toISOString())
  download_url: string; // Public URL from Supabase Storage
  storage_path: string; // Path in Supabase Storage bucket, for deletion
  download_timestamps?: string[]; // Array of ISO 8601 strings
}

export interface FileUploadFormState {
  message: string;
  success: boolean;
  errors?: {
    guestCode?: string[];
    file?: string[];
    _form?: string[];
  };
  uploadedFileId?: string;
}
