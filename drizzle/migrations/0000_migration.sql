
create type public.app_role as enum ('admin','user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role=_role)
$$;
create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.assign_first_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users for each row execute function public.assign_first_admin();

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create table public.store_settings (
  id int primary key default 1 check (id = 1),
  phone text, whatsapp text, email text, address text,
  facebook_url text, instagram_url text, tiktok_url text,
  hero_title text, hero_subtitle text, hero_image_url text,
  cod_enabled boolean not null default true,
  free_shipping_threshold numeric,
  show_wholesale_prices boolean not null default false,
  shipping_policy text, returns_policy text, privacy_policy text,
  updated_at timestamptz not null default now()
);
grant select on public.store_settings to anon, authenticated;
grant update on public.store_settings to authenticated;
grant all on public.store_settings to service_role;
alter table public.store_settings enable row level security;
create policy "settings public read" on public.store_settings for select using (true);
create policy "settings admin update" on public.store_settings for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger t_settings before update on public.store_settings for each row execute function public.touch_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ar text not null, name_en text,
  short_ar text, description_ar text,
  scent text, ingredients text, usage_instructions text,
  benefits text[] not null default '{}',
  images text[] not null default '{}',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "products public read" on public.products for select using (active or public.has_role(auth.uid(),'admin'));
create policy "products admin write" on public.products for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger t_products before update on public.products for each row execute function public.touch_updated_at();

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size_label text not null,
  price numeric check (price is null or price >= 0),
  stock int not null default 0 check (stock >= 0),
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.product_variants to anon, authenticated;
grant insert, update, delete on public.product_variants to authenticated;
grant all on public.product_variants to service_role;
alter table public.product_variants enable row level security;
create policy "variants public read" on public.product_variants for select using (active or public.has_role(auth.uid(),'admin'));
create policy "variants admin write" on public.product_variants for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- wholesale prices in a separate admin-only table
create table public.wholesale_prices (
  variant_id uuid primary key references public.product_variants(id) on delete cascade,
  price numeric not null check (price >= 0),
  min_quantity int not null default 1 check (min_quantity >= 1)
);
grant select, insert, update, delete on public.wholesale_prices to authenticated;
grant all on public.wholesale_prices to service_role;
alter table public.wholesale_prices enable row level security;
create policy "wholesale admin" on public.wholesale_prices for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create or replace function public.get_public_wholesale_prices()
returns table(variant_id uuid, price numeric, min_quantity int) language sql stable security definer set search_path = public as $$
  select w.variant_id, w.price, w.min_quantity from public.wholesale_prices w
  join public.product_variants v on v.id = w.variant_id and v.active
  where coalesce((select show_wholesale_prices from public.store_settings where id=1), false)
$$;
grant execute on function public.get_public_wholesale_prices() to anon, authenticated;

create table public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  city text not null unique,
  fee numeric check (fee is null or fee >= 0),
  active boolean not null default true,
  sort_order int not null default 0
);
grant select on public.shipping_zones to anon, authenticated;
grant insert, update, delete on public.shipping_zones to authenticated;
grant all on public.shipping_zones to service_role;
alter table public.shipping_zones enable row level security;
create policy "zones public read" on public.shipping_zones for select using (active or public.has_role(auth.uid(),'admin'));
create policy "zones admin write" on public.shipping_zones for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null, phone text not null, city text not null, address text not null, notes text,
  subtotal numeric not null, shipping_fee numeric, total numeric not null,
  payment_method text not null default 'cod',
  status text not null default 'new' check (status in ('new','confirmed','shipped','delivered','cancelled')),
  created_at timestamptz not null default now()
);
grant select, update, delete on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "orders admin" on public.orders for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null, size_label text not null,
  unit_price numeric not null, quantity int not null check (quantity > 0)
);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "items admin" on public.order_items for select to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('contact','wholesale')),
  name text not null check (char_length(name) between 2 and 100),
  business_name text check (business_name is null or char_length(business_name) <= 150),
  phone text not null check (phone ~ '^01[0125][0-9]{8}$'),
  city text check (city is null or char_length(city) <= 100),
  business_type text check (business_type is null or char_length(business_type) <= 100),
  quantities text check (quantities is null or char_length(quantities) <= 500),
  message text check (message is null or char_length(message) <= 2000),
  status text not null default 'new' check (status in ('new','in_progress','closed')),
  created_at timestamptz not null default now()
);
grant insert on public.inquiries to anon, authenticated;
grant select, update, delete on public.inquiries to authenticated;
grant all on public.inquiries to service_role;
alter table public.inquiries enable row level security;
create policy "anyone can submit inquiry" on public.inquiries for insert to anon, authenticated with check (status = 'new');
create policy "admin read inquiries" on public.inquiries for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin update inquiries" on public.inquiries for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin delete inquiries" on public.inquiries for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.place_order(
  _name text, _phone text, _city text, _address text, _notes text, _items jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s public.store_settings; z public.shipping_zones; it jsonb; v record;
  _sub numeric := 0; _fee numeric; _num text; _oid uuid; _qty int;
begin
  select * into s from public.store_settings where id=1;
  if not coalesce(s.cod_enabled,false) then raise exception 'COD_DISABLED'; end if;
  if _name is null or char_length(trim(_name)) < 2 or char_length(_name) > 100 then raise exception 'INVALID_NAME'; end if;
  if _phone is null or _phone !~ '^01[0125][0-9]{8}$' then raise exception 'INVALID_PHONE'; end if;
  if _address is null or char_length(trim(_address)) < 10 or char_length(_address) > 500 then raise exception 'INVALID_ADDRESS'; end if;
  if _notes is not null and char_length(_notes) > 500 then raise exception 'INVALID_NOTES'; end if;
  select * into z from public.shipping_zones where city=_city and active;
  if not found then raise exception 'INVALID_CITY'; end if;
  if _items is null or jsonb_typeof(_items) <> 'array' or jsonb_array_length(_items) = 0 or jsonb_array_length(_items) > 30 then raise exception 'EMPTY_CART'; end if;

  _num := 'PV-' || to_char(now(),'YYMMDD') || '-' || upper(substr(md5(gen_random_uuid()::text),1,5));
  insert into public.orders(order_number, customer_name, phone, city, address, notes, subtotal, shipping_fee, total)
  values (_num, trim(_name), _phone, _city, trim(_address), nullif(trim(_notes),''), 0, null, 0) returning id into _oid;

  for it in select * from jsonb_array_elements(_items) loop
    _qty := (it->>'quantity')::int;
    if _qty is null or _qty < 1 or _qty > 100 then raise exception 'INVALID_QTY'; end if;
    select pv.id, pv.price, pv.stock, pv.size_label, p.name_ar into v
      from public.product_variants pv join public.products p on p.id=pv.product_id
      where pv.id = (it->>'variant_id')::uuid and pv.active and p.active for update of pv;
    if not found or v.price is null then raise exception 'UNAVAILABLE'; end if;
    if v.stock < _qty then raise exception 'OUT_OF_STOCK'; end if;
    update public.product_variants set stock = stock - _qty where id = v.id;
    insert into public.order_items(order_id, variant_id, product_name, size_label, unit_price, quantity)
      values (_oid, v.id, v.name_ar, v.size_label, v.price, _qty);
    _sub := _sub + v.price * _qty;
  end loop;

  _fee := z.fee;
  if s.free_shipping_threshold is not null and _sub >= s.free_shipping_threshold then _fee := 0; end if;
  update public.orders set subtotal=_sub, shipping_fee=_fee, total=_sub + coalesce(_fee,0) where id=_oid;
  return jsonb_build_object('order_number', _num, 'subtotal', _sub, 'shipping_fee', _fee, 'total', _sub + coalesce(_fee,0));
end $$;
revoke all on function public.place_order(text,text,text,text,text,jsonb) from public;
grant execute on function public.place_order(text,text,text,text,text,jsonb) to anon, authenticated;

insert into public.store_settings(id, hero_title, hero_subtitle, cod_enabled) values (1, 'سائل غسيل أطباق بيوريفا', 'نضافة تفرق، ولمعة تدوم', true);
insert into public.products(slug, name_ar, name_en, short_ar, description_ar, scent, ingredients, usage_instructions)
values ('pureva-dishwashing-liquid', 'بيوريفا سائل غسيل الأطباق', 'PUREVA Dishwashing Liquid',
 'سائل غسيل أطباق من بيوريفا.',
 '[مؤقت] أضف وصف المنتج الحقيقي من لوحة التحكم.',
 '[مؤقت] أضف الرائحة الحقيقية', '[مؤقت] أضف المكونات كما هي مكتوبة على العبوة', '[مؤقت] أضف طريقة الاستخدام كما هي مكتوبة على العبوة');
insert into public.product_variants(product_id, size_label, price, stock, sort_order)
select id, '[مؤقت] الحجم الأول', null, 0, 1 from public.products where slug='pureva-dishwashing-liquid';
insert into public.shipping_zones(city, fee, sort_order) values
 ('القاهرة', null, 1), ('الجيزة', null, 2), ('الإسكندرية', null, 3);
