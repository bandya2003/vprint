
export interface UploadedFile {
  id: string;
  guestCode: string;
  fileName: string;
  fileType: string;
  uploadDate: string; // ISO date string
  downloadUrl: string;
  storagePath: string; // Path in Firebase Storage or similar
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
