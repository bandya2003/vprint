
"use client";

import { useEffect, useRef, useTransition } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { handleFileUpload } from '@/lib/actions';
import type { FileUploadFormState } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, Loader2 } from 'lucide-react';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
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

const formSchema = z.object({
  guestCode: z.string()
    .min(3, "Guest code must be at least 3 characters.")
    .max(20, "Guest code cannot exceed 20 characters.")
    .regex(/^[a-zA-Z0-9_.-]*$/, "Guest code can only contain letters, numbers, underscore, dot, or hyphen."),
  file: z
    .custom<FileList>((val) => val instanceof FileList && val.length > 0, "File is required.")
    .transform((fileList) => fileList.item(0)) // Take the first file
    .refine((file): file is File => file instanceof File && file.size > 0, "File cannot be empty.")
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 20MB.`)
    .refine(
      (file) => ALLOWED_MIME_TYPES.includes(file.type),
      `Invalid file type. Only ${ALLOWED_EXTENSIONS_DISPLAY} files are accepted.`
    ),
});

type FormDataSchema = z.infer<typeof formSchema>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
      Upload File
    </Button>
  );
}

interface FileUploadFormProps {
  onSuccess?: () => void;
}

export function FileUploadForm({ onSuccess }: FileUploadFormProps) {
  const { toast } = useToast();
  const [state, formAction, isActionPending] = useActionState<FileUploadFormState | undefined, FormData>(handleFileUpload, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [isTransitionPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors }, reset: resetReactHookForm, setValue } = useForm<FormDataSchema>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
  });

  useEffect(() => {
    if (!isActionPending && state?.success) {
      toast({
        title: "Success!",
        description: state.message,
        duration: 5000, // Auto-dismiss after 5 seconds
      });
      formRef.current?.reset();
      resetReactHookForm();
      // Clear the file input visually by resetting its value through react-hook-form
      // This assumes your file input is registered with the name "file"
      setValue('file', new DataTransfer().files, { shouldValidate: false, shouldDirty: false });


      if (onSuccess) {
        onSuccess();
      }
    } else if (!isActionPending && state?.message && !state.success) {
      const errorMessages = state.errors ?
        Object.values(state.errors).flat().join("\n") :
        state.message;
      toast({
        title: "Upload Failed",
        description: errorMessages || "An unknown error occurred.",
        variant: "destructive",
      });
    }
  }, [state, toast, resetReactHookForm, isActionPending, onSuccess, setValue]);

  const onValidSubmit = (data: FormDataSchema) => {
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      // Ensure only the first file is appended if multiple were selected by the user
      // This aligns with the schema taking only the first file.
      // Note: 'data.file' here is the single File object processed by Zod.
      // If the input element itself still holds multiple files,
      // we need to ensure FormData reflects that only one is intended.
      // However, HTML FormData with a file input named "file" that has selected multiple files
      // and then `new FormData(formRef.current)` will include all those files under the same name.
      // The server action `handleFileUpload` also expects a single file.
      // The schema already transforms to take the first file.
      // We need to make sure the FormData passed to the action contains only that one file.

      const singleFileFormData = new FormData();
      singleFileFormData.append('guestCode', data.guestCode);
      if (data.file) { // data.file is the single File object from Zod
        singleFileFormData.append('file', data.file, data.file.name);
      }


      startTransition(() => {
        formAction(singleFileFormData);
      });
    }
  };

  return (
    <Card className="w-full border-none shadow-none">
      <form ref={formRef} onSubmit={handleSubmit(onValidSubmit)} className="space-y-6">
        <CardContent className="space-y-4 pb-0">
          <div className="space-y-2">
            <Label htmlFor="guestCode">Guest Code</Label>
            <Input
              id="guestCode"
              type="text"
              placeholder="e.g., john123"
              {...register("guestCode")}
              className={errors.guestCode ? "border-destructive" : ""}
            />
            {errors.guestCode && <p className="text-sm text-destructive">{errors.guestCode.message}</p>}
            {state?.errors?.guestCode && <p className="text-sm text-destructive">{state.errors.guestCode.join(', ')}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload-input">File</Label> {/* Changed id for clarity */}
            <Input
              id="file-upload-input" // Match label's htmlFor
              type="file"
              accept={ALLOWED_EXTENSIONS_DISPLAY}
              multiple // Allow multiple file selection in browser dialog
              {...register("file")} // react-hook-form will handle the FileList
              className={`pt-2 ${errors.file ? "border-destructive" : ""}`}
            />
            <p className="text-xs text-muted-foreground">Max 20MB. Accepted: {ALLOWED_EXTENSIONS_DISPLAY}</p>
            {errors.file && <p className="text-sm text-destructive">{errors.file.message}</p>}
            {state?.errors?.file && <p className="text-sm text-destructive">{state.errors.file.join(', ')}</p>}
          </div>
          {state?.errors?._form && <p className="text-sm text-destructive">{state.errors._form.join(', ')}</p>}
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}

    