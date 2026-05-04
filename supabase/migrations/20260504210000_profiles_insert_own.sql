-- Allow authenticated users to create their own profile row if the auth trigger
-- was not present when the user was created.

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);
