-- Compras de Google Play verificadas por la función verify-play-purchase.
-- Vincula cada compra (purchase_token) a un solo usuario, para que no se pueda reutilizar.
-- Sin políticas de RLS: solo la función (con la service role) lee y escribe.
create table if not exists public.play_purchases (
  purchase_token text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id text not null,
  state text,
  expiry_time timestamptz,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

alter table public.play_purchases enable row level security;

create index if not exists play_purchases_user_id_idx on public.play_purchases (user_id);
