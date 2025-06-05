
"use client";

import { useEffect, useRef, useTransition } from 'react'; // Added useTransition
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, Loader2 } from 'lucide-react';

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

const formSchema = z.object({
  guestCode: z.string()
    .min(3, "Guest code must be at least 3 characters.")
    .max(20, "Guest code cannot exceed 20 characters.")
    .regex(/^[a-zA-Z0-9_.-]*$/, "Guest code can only contain letters, numbers, underscore, dot, or hyphen."),
  file: z
    .custom<FileList>((val) => val instanceof FileList && val.length > 0, "File is required.")
    .refine((fileList) => fileList.length > 0 && fileList[0].size <= MAX_FILE_SIZE, `Max file size is ${MAX_FILE_SIZE / (1024*1024)}MB.`)
    .refine(
      (fileList) => fileList.length > 0 && ALLOWED_MIME_TYPES.includes(fileList[0].type),
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

export function FileUploadForm() {
  const { toast } = useToast();
  const [state, formAction] = useActionState<FileUploadFormState | undefined, FormData>(handleFileUpload, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition(); // Hook for starting a transition

  const { register, handleSubmit, formState: { errors }, reset: resetReactHookForm } = useForm<FormDataSchema>({
    resolver: zodResolver(formSchema),
    mode: "onChange", 
  });

  useEffect(() => {
    if (state?.success) {
      toast({
        title: "Success!",
        description: state.message,
      });
      formRef.current?.reset(); 
      resetReactHookForm(); 
    } else if (state?.message && !state.success) {
      const errorMessages = state.errors ? 
        Object.values(state.errors).flat().join("\n") : 
        state.message;
      toast({
        title: "Upload Failed",
        description: errorMessages || "An unknown error occurred.",
        variant: "destructive",
      });
    }
  }, [state, toast, resetReactHookForm]);

  const onFormSubmit = (data: FormDataSchema) => {
    const formData = new FormData();
    formData.append('guestCode', data.guestCode);
    if (data.file && data.file.length > 0) {
      formData.append('file', data.file[0]);
    }
    startTransition(() => { // Wrap the action call in startTransition
      formAction(formData);
    });
  };
  
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Upload Your File</CardTitle>
        <CardDescription>Enter a guest code and choose a file to upload. Your file will be available for a short period.</CardDescription>
      </CardHeader>
      <form ref={formRef} onSubmit={handleSubmit(onFormSubmit)} action={formAction} className="space-y-6">
        <CardContent className="space-y-4">
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
            <Label htmlFor="file">File</Label>
            <Input 
              id="file" 
              type="file"
              accept={ALLOWED_EXTENSIONS_DISPLAY}
              {...register("file")}
              className={`pt-2 ${errors.file ? "border-destructive" : ""}`}
            />
            <p className="text-xs text-muted-foreground">Max ${MAX_FILE_SIZE / (1024*1024)}MB. Accepted: {ALLOWED_EXTENSIONS_DISPLAY}</p>
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
