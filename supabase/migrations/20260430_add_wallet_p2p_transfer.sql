create table if not exists public.user_wallets (
  phone text primary key,
  vig_token_balance bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.p2p_vig_transfers (
  id uuid primary key default gen_random_uuid(),
  sender_phone text not null,
  recipient_phone text not null,
  amount_vig bigint not null check (amount_vig > 0),
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create or replace function public.transfer_vig_tokens_p2p(
  sender_phone text,
  recipient_phone text,
  amount_vig bigint,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_balance bigint;
  existing_transfer_id uuid;
  new_transfer_id uuid;
begin
  if sender_phone is null or recipient_phone is null or amount_vig is null or p_idempotency_key is null then
    return jsonb_build_object('ok', false, 'code', 'invalid_input', 'message_vi', 'Thieu du lieu giao dich.');
  end if;
  if trim(sender_phone) = '' or trim(recipient_phone) = '' or amount_vig <= 0 or trim(p_idempotency_key) = '' then
    return jsonb_build_object('ok', false, 'code', 'invalid_input', 'message_vi', 'Du lieu khong hop le.');
  end if;
  if sender_phone = recipient_phone then
    return jsonb_build_object('ok', false, 'code', 'self_transfer_not_allowed', 'message_vi', 'Khong the tu chuyen cho chinh minh.');
  end if;

  select id into existing_transfer_id
  from public.p2p_vig_transfers
  where idempotency_key = p_idempotency_key
  limit 1;
  if existing_transfer_id is not null then
    return jsonb_build_object('ok', true, 'transfer_id', existing_transfer_id, 'idempotent', true);
  end if;

  insert into public.user_wallets (phone, vig_token_balance)
  values (sender_phone, 0)
  on conflict (phone) do nothing;

  insert into public.user_wallets (phone, vig_token_balance)
  values (recipient_phone, 0)
  on conflict (phone) do nothing;

  select vig_token_balance into sender_balance
  from public.user_wallets
  where phone = sender_phone
  for update;

  perform 1
  from public.user_wallets
  where phone = recipient_phone
  for update;

  if coalesce(sender_balance, 0) < amount_vig then
    return jsonb_build_object('ok', false, 'code', 'insufficient_balance', 'message_vi', 'So du VIG Token khong du.');
  end if;

  update public.user_wallets
  set vig_token_balance = vig_token_balance - amount_vig, updated_at = now()
  where phone = sender_phone;

  update public.user_wallets
  set vig_token_balance = vig_token_balance + amount_vig, updated_at = now()
  where phone = recipient_phone;

  insert into public.p2p_vig_transfers (sender_phone, recipient_phone, amount_vig, idempotency_key)
  values (sender_phone, recipient_phone, amount_vig, p_idempotency_key)
  returning id into new_transfer_id;

  return jsonb_build_object('ok', true, 'transfer_id', new_transfer_id, 'idempotent', false);
exception
  when unique_violation then
    select id into existing_transfer_id
    from public.p2p_vig_transfers
    where idempotency_key = p_idempotency_key
    limit 1;
    return jsonb_build_object('ok', true, 'transfer_id', existing_transfer_id, 'idempotent', true);
  when others then
    return jsonb_build_object('ok', false, 'code', 'server_error', 'message_vi', 'Loi he thong khi chuyen VIG Token.');
end;
$$;

grant execute on function public.transfer_vig_tokens_p2p(text, text, bigint, text) to anon, authenticated;

