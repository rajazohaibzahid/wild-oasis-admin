-- Consolidate SELECT evaluation while preserving staff access to inactive cabins.
drop policy cabins_public_read on public.cabins;
drop policy cabins_staff_manage on public.cabins;
create policy cabins_anon_read on public.cabins for select to anon using (is_active);
create policy cabins_authenticated_read on public.cabins for select to authenticated
  using (is_active or (select private.is_staff()));
create policy cabins_staff_insert on public.cabins for insert to authenticated
  with check ((select private.is_staff()));
create policy cabins_staff_update on public.cabins for update to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));
create policy cabins_staff_delete on public.cabins for delete to authenticated
  using ((select private.is_staff()));
