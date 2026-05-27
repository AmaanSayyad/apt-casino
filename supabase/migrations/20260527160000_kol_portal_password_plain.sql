-- Store last portal password in plaintext for admin dashboard visibility (KOL self-service updates sync here).

alter table public.kol_allocations
  add column if not exists portal_password_plain text;

comment on column public.kol_allocations.portal_password_plain is
  'Last known portal password for admin support; updated on create, admin reset, or KOL change.';
