import { PaperPlaneLogo } from "@/components/paperplane/PaperPlaneLogo";
import { FileUploadForm } from "@/components/paperplane/FileUploadForm";
import { DownloadStats } from "@/components/paperplane/DownloadStats";
import { FileList } from "@/components/paperplane/FileList";
import { Separator } from "@/components/ui/separator";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 md:p-8 space-y-10 font-body">
      <header className="text-center space-y-3 pt-4 md:pt-2">
        <div className="flex justify-center items-center mb-2">
          <PaperPlaneLogo size={60} />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
          Welcome to PaperPlane
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl">
          A simple, secure way to quickly upload and retrieve documents for printing. No logins, just your files when you need them.
        </p>
      </header>

      <main className="w-full max-w-5xl space-y-10 flex flex-col items-center">
        <section id="upload" className="w-full flex justify-center px-2">
          <FileUploadForm />
        </section>

        <section id="stats" className="w-full flex justify-center px-2">
          <DownloadStats />
        </section>

        <Separator className="my-6 md:my-8" />

        <section id="retrieve" className="w-full flex justify-center px-2">
          <FileList />
        </section>
      </main>

      <footer className="w-full max-w-5xl text-center py-8 mt-auto">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} PaperPlane. Files are automatically deleted for your privacy (mock feature).
        </p>
      </footer>
    </div>
  );
}
