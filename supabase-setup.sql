-- Syum's portfolio CMS: database tables, public read access, admin-only writes and file storage.
-- Run this whole script in Supabase Dashboard > SQL Editor > New query.

create table if not exists public.portfolio_profile (
  id boolean primary key default true check (id),
  full_name text not null default 'Syum Teame Gebreyesus',
  role text not null default 'Computer Engineer · Software Developer',
  location text not null default 'Addis Ababa, Ethiopia',
  summary text not null default '',
  about text not null default '',
  email text not null default 'syum.gebre1@gmail.com',
  linkedin text not null default 'https://www.linkedin.com/in/syumgebre1',
  github text not null default 'https://github.com/syum.gebre1',
  phone text not null default '',
  cgpa text not null default '3.71/4.00',
  exit_score text not null default '90/100',
  graduation_year text not null default '2026',
  photo_path text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  technologies text[] not null default '{}',
  image_path text not null default '',
  project_url text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_certificates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  issuer text not null default '',
  issued_on text not null default '',
  credential_url text not null default '',
  file_path text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_experience (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  company text not null default '',
  location text not null default '',
  start_date text not null default '',
  end_date text not null default '',
  description text not null default '',
  highlights text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_education (
  id uuid primary key default gen_random_uuid(),
  degree text not null,
  institution text not null default '',
  graduation_date text not null default '',
  details text not null default '',
  coursework text[] not null default '{}',
  cgpa text not null default '',
  exit_score text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_skills (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  items text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_highlights (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'Achievement',
  title text not null,
  details text not null default '',
  url text not null default '',
  file_path text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Single-row table for editable site-wide contact details (WhatsApp + Telegram).
-- Public can read it (the portfolio site uses it to build the contact links);
-- only signed-in admins can change it.
create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  whatsapp_number text not null default '' check (whatsapp_number ~ '^[0-9]{0,15}$'),
  telegram_username text not null default '' check (telegram_username ~ '^[A-Za-z0-9_]{0,32}$'),
  updated_at timestamptz not null default now()
);

-- Public contact form submissions. Visitors may submit only; admins can read and update inbox status.
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  email text not null check (
    char_length(email) <= 254
    and email ~* '^[^[:space:]@]+@[^[:space:]@]+([.][^[:space:]@]+)+$'
  ),
  subject text not null default '' check (char_length(subject) <= 200),
  message text not null check (char_length(trim(message)) between 1 and 10000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

-- Also upgrade an existing compatible inbox table without creating another table.
alter table public.contact_messages
  add column if not exists subject text not null default '',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists read_at timestamptz;
create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

create unique index if not exists portfolio_projects_title_unique on public.portfolio_projects (title);
create unique index if not exists portfolio_certificates_title_unique on public.portfolio_certificates (title);
create unique index if not exists portfolio_experience_role_company_unique on public.portfolio_experience (role, company);
create unique index if not exists portfolio_education_degree_institution_unique on public.portfolio_education (degree, institution);
create unique index if not exists portfolio_skills_category_unique on public.portfolio_skills (category);
create unique index if not exists portfolio_highlights_category_title_unique on public.portfolio_highlights (category, title);

-- Public visitors can read portfolio content. Only authenticated users can edit it.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'portfolio_profile', 'portfolio_projects', 'portfolio_certificates',
    'portfolio_experience', 'portfolio_education', 'portfolio_skills',
    'portfolio_highlights', 'site_settings'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists "Public can read %1$s" on public.%1$I', table_name);
    execute format('create policy "Public can read %1$s" on public.%1$I for select using (true)', table_name);
    execute format('drop policy if exists "Authenticated can insert %1$s" on public.%1$I', table_name);
    execute format('create policy "Authenticated can insert %1$s" on public.%1$I for insert to authenticated with check (auth.uid() is not null)', table_name);
    execute format('drop policy if exists "Authenticated can update %1$s" on public.%1$I', table_name);
    execute format('create policy "Authenticated can update %1$s" on public.%1$I for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null)', table_name);
    execute format('drop policy if exists "Authenticated can delete %1$s" on public.%1$I', table_name);
    execute format('create policy "Authenticated can delete %1$s" on public.%1$I for delete to authenticated using (auth.uid() is not null)', table_name);
  end loop;
end $$;

alter table public.contact_messages enable row level security;

-- Remove any old permissive policies/grants so visitors cannot read or change inbox rows.
do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'contact_messages'
  loop
    execute format('drop policy %I on public.contact_messages', existing_policy.policyname);
  end loop;
end $$;

revoke all privileges on table public.contact_messages from anon, authenticated, public;
create policy "Public can submit contact messages"
  on public.contact_messages for insert to anon, authenticated
  with check (
    char_length(trim(name)) between 1 and 120
    and char_length(email) <= 254
    and email ~* '^[^[:space:]@]+@[^[:space:]@]+([.][^[:space:]@]+)+$'
    and char_length(subject) <= 200
    and char_length(trim(message)) between 1 and 10000
  );
drop policy if exists "Authenticated admins can read contact messages" on public.contact_messages;
create policy "Authenticated admins can read contact messages"
  on public.contact_messages for select to authenticated
  using (auth.uid() is not null);
drop policy if exists "Authenticated admins can update contact messages" on public.contact_messages;
create policy "Authenticated admins can update contact messages"
  on public.contact_messages for update to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

grant insert (name, email, subject, message) on public.contact_messages to anon, authenticated;
grant select on public.contact_messages to authenticated;
grant update (read_at) on public.contact_messages to authenticated;

-- Make the newly-created or upgraded table immediately visible through the Supabase REST API.
notify pgrst, 'reload schema';

grant select on public.portfolio_profile, public.portfolio_projects, public.portfolio_certificates,
  public.portfolio_experience, public.portfolio_education, public.portfolio_skills,
  public.portfolio_highlights, public.site_settings to anon, authenticated;
grant insert, update, delete on public.portfolio_profile, public.portfolio_projects,
  public.portfolio_certificates, public.portfolio_experience, public.portfolio_education,
  public.portfolio_skills, public.portfolio_highlights, public.site_settings to authenticated;

-- Create a public-read bucket. Upload, update, and delete are restricted to signed-in admins.
insert into storage.buckets (id, name, public)
values ('portfolio-files', 'portfolio-files', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can read portfolio files" on storage.objects;
create policy "Public can read portfolio files"
  on storage.objects for select
  using (bucket_id = 'portfolio-files');

drop policy if exists "Authenticated can upload portfolio files" on storage.objects;
create policy "Authenticated can upload portfolio files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'portfolio-files' and auth.uid() is not null);

drop policy if exists "Authenticated can update portfolio files" on storage.objects;
create policy "Authenticated can update portfolio files"
  on storage.objects for update to authenticated
  using (bucket_id = 'portfolio-files' and auth.uid() is not null)
  with check (bucket_id = 'portfolio-files' and auth.uid() is not null);

drop policy if exists "Authenticated can delete portfolio files" on storage.objects;
create policy "Authenticated can delete portfolio files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'portfolio-files' and auth.uid() is not null);

-- Starter profile and the content already supplied for the portfolio.
insert into public.portfolio_profile (id, summary, about)
values (
  true,
  'Computer engineering graduate and software developer focused on thoughtful web and mobile experiences.',
  'I graduated from Aksum University with a BSc in Electrical and Computer Engineering, specializing in Computer Engineering. My experience spans the MERN stack, React Native, Python, databases, networking, and application security.'
)
on conflict (id) do nothing;

-- Default (empty) row for contact settings. Fill it in from the admin.
insert into public.site_settings (id, whatsapp_number, telegram_username)
values (1, '', '')
on conflict (id) do nothing;

insert into public.portfolio_projects (title, description, technologies, sort_order) values
  ('Crime Management System', 'A centralized web platform for managing crime records, with role-based access for administrators, officers, and users.', array['React.js','Node.js','MongoDB','REST APIs'], 1),
  ('School Task Manager', 'A cross-platform study companion for assignments, academic tasks, and exam reminders, with offline access.', array['React Native','SQLite','Offline-first'], 2),
  ('Game Coin Platform', 'A full-stack virtual currency purchasing experience integrating third-party payment gateway APIs.', array['React.js','Node.js','Payments'], 3),
  ('Campus Network Design', 'A secure campus network simulation with segmented VLANs, routing, and traffic access controls.', array['Cisco Packet Tracer','VLANs','ACLs','DHCP / DNS'], 4)
on conflict do nothing;

insert into public.portfolio_certificates (title, issuer, issued_on, sort_order) values
  ('MERN Stack: All You Need to Know with Practical Project', 'Udemy', '2025', 1),
  ('Basics of Python', 'UniAthena', '2026', 2),
  ('Employment Skills and Job-Readiness Training', 'CEED', '2026', 3),
  ('Basics of AI', 'UniAthena', '2026', 4)
on conflict do nothing;

insert into public.portfolio_experience (role, company, location, start_date, end_date, description, highlights, sort_order) values
  ('Frontend Developer Intern', 'Root Solution', 'Addis Ababa, Ethiopia', 'June 2025', 'August 2025', 'Built responsive web and mobile applications with React.js and React Native, including a game coin purchasing platform with payment gateway integration.', array['Worked in a six-person Agile team across planning, reviews, testing, and deployment.','Improved application performance with code optimization, lazy loading, and efficient state management.','Debugged and tested features to support clean, production-ready software.'], 1)
on conflict do nothing;

insert into public.portfolio_education (degree, institution, graduation_date, details, coursework, cgpa, exit_score, sort_order) values
  ('BSc in Electrical & Computer Engineering — Computer Engineering', 'Aksum University', 'June 2026', 'Computer Engineering specialization.', array['Data Structures & Algorithms','Software Engineering','Database Systems','Operating Systems','Computer Architecture','Embedded Systems','Computer Networks & Security','Web Development','Data Communication'], '3.71/4.00', '90/100', 1)
on conflict do nothing;

insert into public.portfolio_skills (category, items, sort_order) values
  ('Development', array['JavaScript (ES6+)','Python','HTML5','CSS3','React.js','React Native','Node.js','Express.js'], 1),
  ('Data & APIs', array['MongoDB','SQLite','MySQL','RESTful APIs','Payment gateway integration'], 2),
  ('Networks & security', array['Cisco Packet Tracer','VLANs','ACLs','OSPF','EIGRP','DHCP','DNS'], 3),
  ('Tools & practice', array['Git','GitHub','VS Code','Postman','Agile/Scrum','Responsive design','Debugging','Testing'], 4),
  ('Beyond code', array['Problem-solving','Teamwork','Communication','Adaptability','Time management','Customer focus'], 5)
on conflict do nothing;

insert into public.portfolio_highlights (category, title, details, sort_order) values
  ('Language', 'Tigrinya', 'Native', 1),
  ('Language', 'Amharic', 'Fluent', 2),
  ('Language', 'English', 'Professional working proficiency', 3)
on conflict do nothing;