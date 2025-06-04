# PaperPlane Deployment Guide

This guide provides basic instructions for deploying your PaperPlane Next.js application to Vercel or Netlify.

## Prerequisites

1.  **Git Repository**: Your project code should be hosted on a Git provider like GitHub, GitLab, or Bitbucket.
2.  **Vercel/Netlify Account**: You'll need an account on Vercel or Netlify.

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
4.  **Environment Variables (Important for Firebase/Supabase Integration)**:
    *   This current version of PaperPlane uses mock data. For a production deployment with actual Firebase/Supabase integration, you would need to configure environment variables for your backend services.
    *   For **Firebase**:
        *   You would add your Firebase project configuration (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId) as environment variables. These are typically prefixed with `NEXT_PUBLIC_FIREBASE_` to be available on the client-side if needed for Firebase SDK initialization, and server-side only variables for admin SDK.
    *   For **Supabase**:
        *   You would add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (and `SUPABASE_SERVICE_ROLE_KEY` for server-side operations).
    *   These variables are added in the project settings on Vercel/Netlify.

5.  **Deploy**:
    *   Click the "Deploy" button. Vercel/Netlify will build and deploy your application.
    *   You'll receive a unique URL for your deployed site.

## Auto-Deletion Cron Job / Scheduled Function

The automatic file deletion feature (2-7 days) requires a scheduled task:

*   **Firebase**: You would write a Firebase Cloud Function that queries Firestore for old files (based on `uploadDate`) and deletes them from Firestore and Firebase Storage. This function would then be triggered by Cloud Scheduler (e.g., once daily).
    *   See Firebase documentation on "Schedule functions" and "Delete data".
*   **Supabase**: You can use Supabase Edge Functions triggered by a cron job (using `pg_cron` or a third-party scheduler like GitHub Actions).
    *   See Supabase documentation on "Scheduled Functions".

This backend setup for auto-deletion is crucial for the privacy aspect of PaperPlane and needs to be implemented separately from the frontend deployment.

## Custom Domain

Both Vercel and Netlify allow you to easily connect a custom domain to your deployed application through their dashboard settings.

---

This completes the basic deployment. Remember to thoroughly test your application after deployment, especially if you integrate real backend services.
