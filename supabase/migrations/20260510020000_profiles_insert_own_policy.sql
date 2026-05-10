-- Allow authenticated users to create their own profile row when the auth trigger
-- has not populated public.profiles yet.

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);
