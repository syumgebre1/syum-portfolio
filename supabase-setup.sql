-- ===========================================================================
-- supabase-setup.sql
-- ---------------------------------------------------------------------------
-- Syum's portfolio CMS — full database schema, Row Level Security, storage
-- bucket, and starter content. Idempotent: safe to re-run.
--
-- SECURITY MODEL (this file enforces all of it):
--   - Public visitors   : SELECT only on portfolio content tables.
--   - Contact form      : INSERT only into contact_messages (no read/update).
--   - Signed-in admin   : full INSERT/UPDATE/DELETE on portfolio tables.
--   - Storage bucket    : public read, authenticated write.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- PROFILE
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_profile (
  id boolean primary key default true check (id),
  full_name text not null default 'Syum Teame Gebreyesus',
  role text not null default 'Computer Engineer · Software Developer',
  location text not null default 'Addis Ababa, Ethiopia',
  email text not null default 'syum.gebre1@gmail.com',
  linkedin text not null default 'https://www.linkedin.com/in/syumgebre1',
  github text not null default 'https://github.com/syum.gebre1',
  phone text not null default '',
  summary text not null default '',
  about text not null default '',
  now_learning text not null default '',
  availability_status text not null default 'open'
    check (availability_status in ('open', 'freelance', 'closed')),
  available_from text not null default '',
  photo_path text not null default '',
  cv_path text not null default '',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- PROJECTS
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  technologies text[] not null default '{}',
  image_path text not null default '',
  project_url text not null default '',
  repo_url text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.portfolio_projects
  add column if not exists repo_url text not null default '';

-- ---------------------------------------------------------------------------
-- CERTIFICATES
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- EXPERIENCE
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- EDUCATION
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_education (
  id uuid primary key default gen_random_uuid(),
  degree text not null,
  institution text not null default '',
  graduation_date text not null default '',
  details text not null default '',
  coursework text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- SKILLS
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_skills (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  items text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- HIGHLIGHTS
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- SITE SETTINGS
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  whatsapp_number text not null default '' check (whatsapp_number ~ '^[0-9]{0,15}$'),
  telegram_username text not null default '' check (telegram_username ~ '^[A-Za-z0-9_]{0,32}$'),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- CONTACT INBOX
-- ---------------------------------------------------------------------------
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

alter table public.contact_messages
  add column if not exists subject text not null default '',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists read_at timestamptz;

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

-- ---------------------------------------------------------------------------
-- UNIQUE INDEXES
-- ---------------------------------------------------------------------------
create unique index if not exists portfolio_projects_title_unique
  on public.portfolio_projects (title);
create unique index if not exists portfolio_certificates_title_unique
  on public.portfolio_certificates (title);
create unique index if not exists portfolio_experience_role_company_unique
  on public.portfolio_experience (role, company);
create unique index if not exists portfolio_education_degree_institution_unique
  on public.portfolio_education (degree, institution);
create unique index if not exists portfolio_skills_category_unique
  on public.portfolio_skills (category);
create unique index if not exists portfolio_highlights_category_title_unique
  on public.portfolio_highlights (category, title);

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
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

notify pgrst, 'reload schema';

grant select on public.portfolio_profile, public.portfolio_projects, public.portfolio_certificates,
  public.portfolio_experience, public.portfolio_education, public.portfolio_skills,
  public.portfolio_highlights, public.site_settings to anon, authenticated;

grant insert, update, delete on public.portfolio_profile, public.portfolio_projects,
  public.portfolio_certificates, public.portfolio_experience, public.portfolio_education,
  public.portfolio_skills, public.portfolio_highlights, public.site_settings to authenticated;

-- ---------------------------------------------------------------------------
-- STORAGE
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- SEED DATA
-- ---------------------------------------------------------------------------
insert into public.portfolio_profile (id, summary, about, now_learning, availability_status, available_from)
values (
  true,
  'Computer engineering graduate and software developer focused on thoughtful web and mobile experiences.',
  'I graduated from Aksum University with a BSc in Electrical and Computer Engineering, specializing in Computer Engineering. My experience spans the MERN stack, React Native, Python, databases, networking, and application security.',
  'Deepening my React Native + Supabase stack and exploring TypeScript.',
  'open',
  ''
)
on conflict (id) do nothing;

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

insert into public.portfolio_education (degree, institution, graduation_date, details, coursework, sort_order) values
  ('BSc in Electrical & Computer Engineering — Computer Engineering', 'Aksum University', 'June 2026', 'Computer Engineering specialization.', array['Data Structures & Algorithms','Software Engineering','Database Systems','Operating Systems','Computer Architecture','Embedded Systems','Computer Networks & Security','Web Development','Data Communication'], 1)
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