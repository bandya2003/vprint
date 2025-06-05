
export interface UploadedFile {
  id: string;
  guestCode: string;
  fileName: string;
  fileType: string; // MIME type
  uploadDate: string; // ISO date string
  downloadUrl: string; // Will point to our API route
  storagePath: string; // Conceptual path, less relevant for in-memory
  downloadTimestamps?: string[];
  fileContentBase64?: string; // Stores the actual file content as Base64
}

export interface FileUploadFormState {
  message: string;
  success: boolean;
  errors?: {
    guestCode?: string[];
    file?: string[];
    _form?: string[];
  };
  uploadedFile?: UploadedFile;
}
