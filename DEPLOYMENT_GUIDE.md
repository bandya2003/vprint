
# PaperPlane Deployment Guide

This guide provides basic instructions for deploying your PaperPlane Next.js application to Vercel or Netlify, using Supabase for backend services.

## Prerequisites

1.  **Git Repository**: Your project code should be hosted on a Git provider like GitHub, GitLab, or Bitbucket.
2.  **Supabase Project**: You need a Supabase project for database and file storage.
    *   Get your Project URL and Anon Key from your Supabase project settings (API section).
3.  **Vercel/Netlify Account**: You'll need an account on Vercel or Netlify.

## Supabase Configuration Details

### 1. Storage Bucket (`vprint-files`)

*   Create a Storage bucket in your Supabase project dashboard (e.g., `vprint-files`).
*   **Storage RLS Policies (for `storage.objects` table):**
    *   The `anon` role (used by your app for uploads) needs permission to insert (upload) and select (read) objects in this bucket.
    *   Navigate to **SQL Editor** in your Supabase dashboard.
    *   Run the following SQL commands. **Replace `'vprint-files'` with your actual bucket name if it's different.**

        ```sql
        -- Allow anon users to insert (upload) into the 'vprint-files' bucket
        CREATE POLICY "Allow anon uploads to vprint-files bucket"
        ON storage.objects
        FOR INSERT
        TO anon
        WITH CHECK (bucket_id = 'vprint-files');

        -- Allow anon users to read objects from the 'vprint-files' bucket
        -- This is important for the public URLs used by the app.
        CREATE POLICY "Allow anon reads from vprint-files bucket"
        ON storage.objects
        FOR SELECT
        TO anon
        USING (bucket_id = 'vprint-files');
        ```
    *   Note: You can also manage basic bucket access (e.g., making a bucket "public" for reads) through the Supabase Dashboard under Storage -> Select your bucket -> Policies / Bucket settings. The RLS policies above provide more granular control, especially for uploads.

### 2. Database Table (`files`)

*   Create a `files` table in your Supabase database (e.g., via Table Editor or SQL).
    *   **Schema for `files` table:**
        *   `id` (uuid, primary key, default: `gen_random_uuid()`)
        *   `created_at` (timestamptz, default: `now()`)
        *   `guest_code` (text)
        *   `file_name` (text)
        *   `file_type` (text)
        *   `upload_date` (timestamptz)
        *   `download_url` (text) - Public URL from Supabase Storage.
        *   `storage_path` (text) - Path in the Supabase bucket, for deletion.
        *   `download_timestamps` (jsonb, array, nullable)

*   **Row Level Security (RLS) for `public.files` table (CRITICAL FOR PRODUCTION)**:
    *   Ensure RLS is **ENABLED** on your `public.files` table (via Table Editor).
    *   Create the following policies for the `anon` role (typically via SQL Editor or Authentication -> Policies):
        1.  **Policy: Allow public inserts for files**
            ```sql
            CREATE POLICY "Allow public inserts for files"
            ON public.files FOR INSERT TO anon WITH CHECK (true);
            ```
        2.  **Policy: Allow public reads for files**
            ```sql
            CREATE POLICY "Allow public reads for files"
            ON public.files FOR SELECT TO anon USING (true);
            ```
        3.  **Policy: Allow public updates to download_timestamps for files**
            ```sql
            CREATE POLICY "Allow public updates to download_timestamps for files"
            ON public.files FOR UPDATE TO anon USING (true) WITH CHECK (true);
            ```

## General Deployment Steps (Vercel/Netlify)

1.  **Push to Git**: Ensure your latest code is pushed to your Git repository.
2.  **Import Project**:
    *   **Vercel**: Go to your Vercel dashboard, click "Add New..." -> "Project". Connect your Git provider and select your PaperPlane repository.
    *   **Netlify**: Go to your Netlify dashboard, click "Add new site" -> "Import an existing project". Connect your Git provider and select your PaperPlane repository.
3.  **Configure Build Settings**:
    *   Both platforms usually auto-detect Next.js projects.
    *   **Framework Preset**: `Next.js`.
    *   **Build Command**: `next build` or `npm run build`.
    *   **Output Directory / Publish Directory**: `.next`.
4.  **Environment Variables (Important for Supabase Integration)**:
    *   Configure these in your Vercel/Netlify project settings:
        *   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
        *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon (public) key.
5.  **Deploy**: Click "Deploy".

## Auto-Deletion Cron Job / Scheduled Function (ESSENTIAL FOR PRODUCTION PRIVACY)

The automatic file deletion feature (e.g., after 2-7 days) is a core privacy aspect of PaperPlane and **requires a scheduled task**. This is not handled by the frontend deployment.

*   **Supabase**: Use Supabase Edge Functions triggered by a cron job (`pg_cron`).
    *   The Edge Function would:
        1.  Query the `files` table for records older than your retention period.
        2.  For each old record, delete the file from Supabase Storage using `storage_path`. **This function must use the Supabase `service_role` key.**
        3.  Delete the record from the `files` table.
    *   See Supabase documentation on "Scheduled Functions," `pg_cron`, and "Edge Functions."
*   **Implementation Details**:
    *   The `storage_path` column in the `files` table is for this deletion.
    *   This backend setup is crucial for privacy.

## Custom Domain

Both Vercel and Netlify allow easy connection of a custom domain.

---

This completes the basic deployment. Test thoroughly. **Secure RLS policies and implement auto-deletion for production.**
