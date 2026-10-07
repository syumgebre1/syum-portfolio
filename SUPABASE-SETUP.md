# Set up your portfolio admin

Your portfolio now has a private admin page at `admin.html`. After the one-time setup, you can sign in, add/edit/delete projects, certificates, experience, education, skills, achievements, and languages, upload images or certificate files, and read contact form submissions in the private inbox. Changes are saved to Supabase and appear on the public page.

## 1. Create your Supabase project

1. Sign in to [supabase.com](https://supabase.com/) and create a project. Save the database password somewhere private; the website does not need it.
2. Open **SQL Editor** in the project dashboard, choose **New query**, open `supabase-setup.sql` from this folder, copy the entire file into the query, and run it. If you already ran an earlier version of the setup, run the updated full script again. It creates the `contact_messages` table if missing, its access policies, the file bucket, and starter content; it does not create a duplicate message table.
3. In **Project Settings → API**, copy the **Project URL** and the **anon / publishable key**. In `supabase-config.js`, paste them into `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

   The anon/publishable key is intended for use in browser code. **Never paste a `service_role` key or any secret key into this website.** The database rules permit public reading and require a signed-in user for changes.

## 2. Create your private admin login

1. In Supabase, open **Authentication → Users** and add your email address with a strong password. Confirm the user if prompted.
2. In **Authentication → Providers / Sign-in**, disable public email sign-ups. Add only your own admin user from the dashboard. This is important: anyone with an account in this project can edit the portfolio, so do not create accounts for visitors.
3. In **Authentication → URL Configuration**, set the Site URL to your published website address. Add the website address and its `/admin.html` address to the allowed redirect URLs when deploying.

## 3. Publish the website

The current site is a set of static files and is not online yet. A simple option for publishing is Netlify:

1. Create a Netlify account and choose its manual deploy / drag-and-drop option.
2. Upload the website folder, including the HTML, CSS, JavaScript, and `supabase-config.js` files. Do not upload private passwords or service-role keys.
3. Open the generated public website URL. The home page should show the starter content; append `/admin.html` to that URL to sign in and manage it.
4. If you later connect a custom domain, update the Supabase **Site URL** and allowed redirect URLs to use that domain.

Use the deployed HTTPS address to sign in and upload files. Opening the HTML directly as a `file://` page is not suitable for Supabase login or browser modules.

## Using the admin

- Open `https://your-site-address/admin.html` and sign in with the user you created in Supabase.
- Choose a content section on the left. Use **Add new**, **Edit**, or **Delete**. Separate multiple technologies, skills, coursework items, and experience highlights with commas.
- Select an image or PDF in a file field to upload it. Uploads are limited to 10 MB per file by the admin form.
- Save changes; the public portfolio reads the latest content from Supabase.
- Select **Messages** in the admin navigation to view visitor messages and mark them as read.

## Contact form security

- The public website can insert a contact message but cannot read, update, or delete submitted messages.
- The private, authenticated admin can view messages and mark them as read.
- Name, email, and message are required; subject is optional. Supabase also validates these values under Row Level Security.
- The form uses the same Supabase client and publishable/anon key as the existing site. No `service_role` key is used in the browser.

## Security reminders

- Keep public sign-ups disabled and do not share your admin password.
- The browser key in `supabase-config.js` is public; the database and storage policies are what protect editing.
- Never place database passwords, `service_role` keys, or other secret keys in frontend files.
- The storage bucket is publicly readable so portfolio pictures and certificate links can be viewed; only authenticated users can upload, change, or delete files.
