
import type { Timestamp } from 'firebase/firestore';

export interface UploadedFile {
  id: string; // Firestore document ID
  guestCode: string;
  fileName: string;
  fileType: string; // MIME type
  uploadDate: Timestamp; // Firestore Timestamp
  downloadUrl: string; // Firebase Storage download URL
  storagePath: string; // Path in Firebase Storage
  downloadTimestamps?: Timestamp[]; // Array of Firestore Timestamps
}

export interface FileUploadFormState {
  message: string;
  success: boolean;
  errors?: {
    guestCode?: string[];
    file?: string[];
    _form?: string[];
  };
  uploadedFileId?: string; // Store ID of uploaded file in Firestore
}
