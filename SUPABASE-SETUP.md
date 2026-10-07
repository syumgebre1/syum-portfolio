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
3. In **Authentication → URL Configuration**, set the Site URL to your production website base URL. Add the deployed site's `/**` wildcard to the allowed redirect URLs so the admin page is included.

## 3. Publish the website

This is a plain static site. Deploy from the repository root; no build command or framework is needed. The included `netlify.toml` sets the publish directory to `.`.

For Netlify, import the existing GitHub repository `syumgebre1/syum-portfolio`. Confirm the build command is empty and the publish directory is `.` (the repository root). Deploy the site, then use its HTTPS Netlify URL. The homepage should open at the site root; `/admin.html` opens the private admin sign-in.

After Netlify assigns the production domain, update Supabase **Authentication → URL Configuration**: set **Site URL** to the Netlify production base URL (for example, `https://your-site.netlify.app`) and add `https://your-site.netlify.app/**` under allowed **Redirect URLs**. Keep the GitHub Pages address there too if you continue to use that copy of the site. If you later connect a custom domain, add its wildcard redirect and use its HTTPS base URL as the Site URL.

Deploy over HTTPS. Opening HTML directly with a `file://` URL is not suitable for Supabase login or browser modules.

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
