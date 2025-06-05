
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
    .refine((fileList) => fileList.length > 0 && fileList[0].size <= MAX_FILE_SIZE, `Max file size is 20MB.`)
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

interface FileUploadFormProps {
  onSuccess?: () => void;
}

export function FileUploadForm({ onSuccess }: FileUploadFormProps) {
  const { toast } = useToast();
  // Renamed isPending to isActionPending for clarity
  const [state, formAction, isActionPending] = useActionState<FileUploadFormState | undefined, FormData>(handleFileUpload, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [isTransitionPending, startTransition] = useTransition(); // For wrapping the action call

  const { register, handleSubmit, formState: { errors }, reset: resetReactHookForm } = useForm<FormDataSchema>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
  });

  useEffect(() => {
    // Effect should depend on isActionPending (from useActionState) to react after the server action completes.
    if (!isActionPending && state?.success) {
      toast({
        title: "Success!",
        description: state.message,
      });
      formRef.current?.reset();
      resetReactHookForm();
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
  }, [state, toast, resetReactHookForm, isActionPending, onSuccess]);

  // This handler is called by react-hook-form's handleSubmit after successful client-side validation
  const onValidSubmit = (data: FormDataSchema) => {
    if (formRef.current) {
      const formData = new FormData(formRef.current); // Get current form data
      startTransition(() => { // Wrap the call to formAction in a transition
        formAction(formData);
      });
    }
  };

  return (
    <Card className="w-full border-none shadow-none">
      {/* react-hook-form's handleSubmit will call onValidSubmit if validation passes */}
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
            <Label htmlFor="file">File</Label>
            <Input
              id="file"
              type="file"
              accept={ALLOWED_EXTENSIONS_DISPLAY}
              {...register("file")}
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
