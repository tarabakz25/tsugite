-- Create storage bucket for interview videos
insert into storage.buckets (id, name, public)
values ('interview-videos', 'interview-videos', false);

-- RLS policies for interview-videos bucket
-- Shop owners can upload videos to their own shop folder
create policy "Shop owners can upload videos"
on storage.objects for insert
with check (
  bucket_id = 'interview-videos' AND
  auth.uid() IN (
    SELECT owner_profile_id FROM public.shops
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Shop owners can read their own videos
create policy "Shop owners can read their videos"
on storage.objects for select
using (
  bucket_id = 'interview-videos' AND
  auth.uid() IN (
    SELECT owner_profile_id FROM public.shops
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Shop owners can delete their own videos
create policy "Shop owners can delete their videos"
on storage.objects for delete
using (
  bucket_id = 'interview-videos' AND
  auth.uid() IN (
    SELECT owner_profile_id FROM public.shops
    WHERE id::text = (storage.foldername(name))[1]
  )
);
