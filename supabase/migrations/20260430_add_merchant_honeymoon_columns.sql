-- B2B merchant honeymoon trap fields (UTC timestamps).
-- Safe defaults: free top tier active for first 90 days.

alter table if exists public.merchants
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists is_free_top_tier_active boolean not null default true,
  add column if not exists free_top_tier_expires_at timestamptz not null default (timezone('utc', now()) + interval '90 days');

update public.merchants
set
  created_at = coalesce(created_at, timezone('utc', now())),
  free_top_tier_expires_at = coalesce(free_top_tier_expires_at, created_at + interval '90 days'),
  is_free_top_tier_active = case
    when coalesce(free_top_tier_expires_at, created_at + interval '90 days') > timezone('utc', now()) then true
    else false
  end;
