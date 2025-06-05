
import { PaperPlaneLogo } from "@/components/paperplane/PaperPlaneLogo";
import { FileUploadForm } from "@/components/paperplane/FileUploadForm";
import { DownloadStats } from "@/components/paperplane/DownloadStats";
import { FileList } from "@/components/paperplane/FileList";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UploadCloud } from "lucide-react";
import { ThemeToggleButton } from "@/components/theme-toggle-button";


export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 md:p-8 space-y-10">
      <div className="absolute top-4 right-4 md:top-6 md:right-6">
        <ThemeToggleButton />
      </div>
      <header className="text-center space-y-3 pt-4 md:pt-2">
        <div className="flex justify-center items-center mb-2">
          <PaperPlaneLogo size={60} />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
          Welcome to Vprint
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl">
          No more WhatsApp juggling. Quickly retrieve and print your documents.
        </p>
      </header>

      <main className="w-full max-w-5xl space-y-10 flex flex-col items-center">
        <section id="upload-trigger" className="w-full flex flex-col items-center justify-center px-2 space-y-4">
            <p className="text-center text-muted-foreground">
                Need to share a document? Click below to upload.
            </p>
            <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-6 text-lg shadow-md transition-transform hover:scale-105">
                <UploadCloud className="mr-2 h-6 w-6" /> Upload New File
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline">Upload Your File</DialogTitle>
                <DialogDescription>
                  Enter a guest code and choose a file. It will be available for a short period. Max 20MB.
                </DialogDescription>
              </DialogHeader>
              <div className="pt-4">
                <FileUploadForm />
              </div>
            </DialogContent>
          </Dialog>
        </section>

        <Separator className="my-6 md:my-8" />

        <section id="retrieve" className="w-full flex justify-center px-2">
          <FileList />
        </section>
        
        <Separator className="my-6 md:my-8" />

        <section id="stats" className="w-full flex justify-center px-2">
          <DownloadStats />
        </section>
      </main>

      <footer className="w-full max-w-5xl text-center py-8 mt-auto">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Vprint. Your files are automatically deleted for your privacy.
        </p>
      </footer>
    </div>
  );
}
