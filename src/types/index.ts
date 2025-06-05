
export interface UploadedFile {
  id: string;
  guestCode: string;
  fileName: string;
  fileType: string; // MIME type
  uploadDate: number; // JS Timestamp (Date.now())
  downloadUrl: string; // Will be /api/download/[id]
  fileContentBase64?: string; // Base64 encoded file content for in-memory storage
  downloadTimestamps?: number[]; // Array of JS Timestamps
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
