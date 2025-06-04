import { PaperPlaneLogo } from "@/components/paperplane/PaperPlaneLogo";
import { FileUploadForm } from "@/components/paperplane/FileUploadForm";
import { FileList } from "@/components/paperplane/FileList";
import { Separator } from "@/components/ui/separator";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 md:p-8 space-y-12 font-body">
      <header className="text-center space-y-2">
        <div className="flex justify-center">
          <PaperPlaneLogo size={48} />
        </div>
        <p className="text-lg text-muted-foreground max-w-xl">
          A simple, secure way to quickly upload and retrieve documents for printing. No logins, just your files when you need them.
        </p>
      </header>

      <main className="w-full max-w-5xl space-y-12 flex flex-col items-center">
        <section id="upload" className="w-full flex justify-center">
          <FileUploadForm />
        </section>

        <Separator className="my-8 md:my-12" />

        <section id="retrieve" className="w-full flex justify-center">
          <FileList />
        </section>
      </main>

      <footer className="w-full max-w-5xl text-center py-8 mt-auto">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} PaperPlane. Files are automatically deleted for your privacy.
        </p>
      </footer>
    </div>
  );
}
