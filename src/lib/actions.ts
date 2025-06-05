
"use server";

import { z } from 'zod';
import type { FileUploadFormState, UploadedFile } from '@/types';
import { revalidatePath } from 'next/cache';
import { db, storage } from './firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  arrayUnion, 
  Timestamp,
  orderBy,
  getDoc
} from 'firebase/firestore';
import { 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { isToday, isSameWeek, parseISO } from 'date-fns';


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
    const uniqueFileName = `${Date.now()}-${file.name}`;
    const filePath = `uploads/${guestCode.toLowerCase()}/${uniqueFileName}`;
    const fileStorageRef = storageRef(storage, filePath);

    await uploadBytes(fileStorageRef, fileBuffer, { contentType: file.type });
    const downloadUrl = await getDownloadURL(fileStorageRef);

    const fileDocRef = await addDoc(collection(db, "files"), {
      guestCode: guestCode.toLowerCase(),
      fileName: file.name,
      fileType: file.type,
      uploadDate: Timestamp.now(),
      downloadUrl: downloadUrl,
      storagePath: filePath,
      downloadTimestamps: [],
    });
    
    revalidatePath('/');

    return {
      message: `File "${file.name}" uploaded successfully for guest code "${guestCode}".`,
      success: true,
      uploadedFileId: fileDocRef.id,
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

async function getFileByIdFromFirestore(fileId: string): Promise<UploadedFile | null> {
  const fileDocRef = doc(db, "files", fileId);
  const fileSnap = await getDoc(fileDocRef);

  if (fileSnap.exists()) {
    const data = fileSnap.data();
    return {
      id: fileSnap.id,
      guestCode: data.guestCode,
      fileName: data.fileName,
      fileType: data.fileType,
      uploadDate: data.uploadDate, // Firestore Timestamp
      downloadUrl: data.downloadUrl,
      storagePath: data.storagePath,
      downloadTimestamps: data.downloadTimestamps || [], // Firestore Timestamp array
    };
  } else {
    return null;
  }
}


export async function fetchFilesByGuestCode(guestCode: string): Promise<UploadedFile[]> {
  if (!guestCode || guestCode.trim() === "") {
    return [];
  }
  const filesCollection = collection(db, "files");
  const q = query(
    filesCollection, 
    where("guestCode", "==", guestCode.toLowerCase()),
    orderBy("uploadDate", "desc")
  );

  const querySnapshot = await getDocs(q);
  const files: UploadedFile[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    files.push({
      id: doc.id,
      guestCode: data.guestCode,
      fileName: data.fileName,
      fileType: data.fileType,
      uploadDate: data.uploadDate, // Firestore Timestamp
      downloadUrl: data.downloadUrl, // This is the Firebase Storage URL
      storagePath: data.storagePath,
      downloadTimestamps: data.downloadTimestamps || [], // Firestore Timestamp array
    });
  });
  return files;
}


export async function recordFileDownload(fileId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const fileDocRef = doc(db, "files", fileId);
    await updateDoc(fileDocRef, {
      downloadTimestamps: arrayUnion(Timestamp.now())
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Error recording download:", error);
    return { success: false, message: "Failed to record download in Firestore." };
  }
}

export async function getDownloadStats(): Promise<{ today: number; thisWeek: number }> {
  let todayCount = 0;
  let thisWeekCount = 0;
  const now = new Date();
  
  try {
    const filesCollection = collection(db, "files");
    const q = query(filesCollection); // Potentially add date range filters for performance
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.downloadTimestamps && Array.isArray(data.downloadTimestamps)) {
        data.downloadTimestamps.forEach((timestamp: Timestamp) => {
          const downloadDate = timestamp.toDate(); // Convert Firestore Timestamp to JS Date
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
    // Return 0 counts on error or handle appropriately
  }
  
  return { today: todayCount, thisWeek: thisWeekCount };
}

export { getFileByIdFromFirestore };
