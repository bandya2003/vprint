# PaperPlane Deployment Guide

This guide provides basic instructions for deploying your PaperPlane Next.js application to Vercel or Netlify.

## Prerequisites

1.  **Git Repository**: Your project code should be hosted on a Git provider like GitHub, GitLab, or Bitbucket.
2.  **Supabase Project**: You need a Supabase project for database and file storage.
    *   Get your Project URL and Anon Key.
    *   Create a Storage bucket (e.g., `vprint-files`) and set its access policies (e.g., public read if using direct public URLs, or configure policies for access via API).
    *   Create a `files` table in your Supabase database with the following schema (or similar):
        *   `id` (uuid, primary key, auto-generated)
        *   `created_at` (timestamptz, default now())
        *   `guest_code` (text)
        *   `file_name` (text)
        *   `file_type` (text)
        *   `upload_date` (timestamptz)
        *   `download_url` (text) - Public URL from Supabase Storage.
        *   `storage_path` (text) - Path in the Supabase bucket, for deletion.
        *   `download_timestamps` (jsonb, array of ISO 8601 strings, nullable)
    *   Configure Row Level Security (RLS) for your `files` table appropriately for your application's needs (e.g., allow public inserts and reads for development, or more restrictive rules for production).
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

## Auto-Deletion Cron Job / Scheduled Function

The automatic file deletion feature (2-7 days) requires a scheduled task:

*   **Supabase**: You can use Supabase Edge Functions triggered by a cron job (using `pg_cron` or a third-party scheduler like GitHub Actions or a service like EasyCron).
    *   The Edge Function would:
        1.  Query the `files` table for records where `upload_date` is older than your retention period (e.g., 7 days ago).
        2.  For each old record, delete the corresponding file from Supabase Storage using its `storage_path`.
        3.  Delete the record from the `files` table.
    *   See Supabase documentation on "Scheduled Functions" and `pg_cron`.

This backend setup for auto-deletion is crucial for the privacy aspect of PaperPlane and needs to be implemented separately from the frontend deployment.

## Custom Domain

Both Vercel and Netlify allow you to easily connect a custom domain to your deployed application through their dashboard settings.

---

This completes the basic deployment. Remember to thoroughly test your application after deployment, especially the file upload and download functionality with Supabase. Secure your Supabase RLS policies and Storage bucket policies appropriately for production.
