
# PaperPlane Deployment Guide

This guide provides basic instructions for deploying your PaperPlane Next.js application to Vercel or Netlify, using Supabase for backend services.

## Prerequisites

1.  **Git Repository**: Your project code should be hosted on a Git provider like GitHub, GitLab, or Bitbucket.
2.  **Supabase Project**: You need a Supabase project for database and file storage.
    *   Get your Project URL and Anon Key from your Supabase project settings (API section).
    *   **Storage Bucket**: Create a Storage bucket (e.g., `vprint-files`). For production, ensure its access policies are appropriately configured. If using public URLs directly, the bucket needs public read access. If serving files through your API (as this app does), the bucket can be private, and your server-side functions will use the service_role key for access.
    *   **`files` Table**: Create a `files` table in your Supabase database with the following schema:
        *   `id` (uuid, primary key, default: `gen_random_uuid()`)
        *   `created_at` (timestamptz, default: `now()`)
        *   `guest_code` (text)
        *   `file_name` (text)
        *   `file_type` (text)
        *   `upload_date` (timestamptz)
        *   `download_url` (text) - Public URL from Supabase Storage.
        *   `storage_path` (text) - Path in the Supabase bucket, for deletion.
        *   `download_timestamps` (jsonb, array, nullable)
    *   **Row Level Security (RLS) for `files` table (CRITICAL FOR PRODUCTION)**:
        *   Ensure RLS is **ENABLED** on your `files` table.
        *   Create the following policies for the `anon` role (or adjust based on your authentication strategy if you add user logins):
            1.  **Policy: Allow public inserts for files**
                *   Operation: `INSERT`
                *   Target roles: `anon`
                *   USING expression: `true`
                *   WITH CHECK expression: `true`
            2.  **Policy: Allow public reads for files**
                *   Operation: `SELECT`
                *   Target roles: `anon`
                *   USING expression: `true`
            3.  **Policy: Allow public updates to download_timestamps**
                *   Operation: `UPDATE`
                *   Target roles: `anon`
                *   USING expression: `true`
                *   WITH CHECK expression: `true`
        *   These policies assume an anonymous access model. If you implement user authentication, revise these policies to use `auth.uid()` to restrict access to authenticated users and their own data.
3.  **Vercel/Netlify Account**: You'll need an account on Vercel or Netlify.

## General Steps (Applicable to both Vercel & Netlify)

1.  **Push to Git**: Ensure your latest code is pushed to your Git repository.
2.  **Import Project**:
    *   **Vercel**: Go to your Vercel dashboard, click "Add New..." -> "Project". Connect your Git provider and select your PaperPlane repository.
    *   **Netlify**: Go to your Netlify dashboard, click "Add new site" -> "Import an existing project". Connect your Git provider and select your PaperPlane repository.
3.  **Configure Build Settings**:
    *   Both platforms usually auto-detect Next.js projects and configure build settings correctly.
    *   **Framework Preset**: Should be `Next.js`.
    *   **Build Command**: Typically `next build` or `npm run build`.
    *   **Output Directory / Publish Directory**: Typically `.next`.
4.  **Environment Variables (Important for Supabase Integration)**:
    *   You **must** configure these environment variables in your Vercel/Netlify project settings:
        *   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
        *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon (public) key.
    *   These variables are added in the project settings on Vercel/Netlify (usually under "Environment Variables" or "Deploy settings").

5.  **Deploy**:
    *   Click the "Deploy" button. Vercel/Netlify will build and deploy your application.
    *   You'll receive a unique URL for your deployed site.

## Auto-Deletion Cron Job / Scheduled Function (ESSENTIAL FOR PRODUCTION PRIVACY)

The automatic file deletion feature (e.g., after 2-7 days) is a core privacy aspect of Vprint and **requires a scheduled task**. This is not handled by the frontend deployment.

*   **Supabase**: You can use Supabase Edge Functions triggered by a cron job (using `pg_cron` or a third-party scheduler like GitHub Actions or a service like EasyCron).
    *   The Edge Function would:
        1.  Query the `files` table for records where `upload_date` is older than your retention period (e.g., 7 days ago).
        2.  For each old record, delete the corresponding file from Supabase Storage using its `storage_path`. **This function must use the Supabase `service_role` key to have permission to delete from Storage.**
        3.  Delete the record from the `files` table.
    *   See Supabase documentation on "Scheduled Functions," `pg_cron`, and "Edge Functions."
*   **Implementation Details**:
    *   The `storage_path` column in the `files` table is specifically for this deletion process.
    *   This backend setup for auto-deletion is crucial for the privacy aspect of PaperPlane and needs to be implemented and tested thoroughly.

## Custom Domain

Both Vercel and Netlify allow you to easily connect a custom domain to your deployed application through their dashboard settings.

---

This completes the basic deployment. Remember to thoroughly test your application after deployment, especially the file upload, download, and RLS-protected functionalities with Supabase. Secure your Supabase RLS policies and Storage bucket policies appropriately for production. **The auto-deletion mechanism is key to fulfilling the app's privacy promise.**
