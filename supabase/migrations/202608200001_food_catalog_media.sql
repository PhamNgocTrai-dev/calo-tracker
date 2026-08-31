alter table public.food_items
  add column food_kind text not null default 'ingredient',
  add column category_slug text not null default 'other',
  add column image_key text;

alter table public.meal_entries
  add column food_image_key_snapshot text;

update public.food_items
set
  food_kind = case normalized_name
    when 'pho bo' then 'dish'
    when 'com ga nuong' then 'dish'
    when 'banh mi trung' then 'dish'
    when 'bun cha' then 'dish'
    when 'uc ga ap chao' then 'ingredient'
    when 'com trang' then 'ingredient'
    when 'trung ga luoc' then 'ingredient'
    when 'chuoi' then 'ingredient'
    else food_kind
  end,
  category_slug = case normalized_name
    when 'pho bo' then 'noodles'
    when 'com ga nuong' then 'rice-dishes'
    when 'banh mi trung' then 'bread'
    when 'bun cha' then 'noodles'
    when 'uc ga ap chao' then 'protein'
    when 'com trang' then 'staples'
    when 'trung ga luoc' then 'protein'
    when 'chuoi' then 'fruit'
    else category_slug
  end,
  image_key = case normalized_name
    when 'pho bo' then 'pho-bo-v1'
    when 'com ga nuong' then 'com-ga-nuong-v1'
    when 'banh mi trung' then 'banh-mi-trung-v1'
    when 'bun cha' then 'bun-cha-v1'
    when 'uc ga ap chao' then 'uc-ga-ap-chao-v1'
    when 'com trang' then 'com-trang-v1'
    when 'trung ga luoc' then 'trung-ga-luoc-v1'
    when 'chuoi' then 'chuoi-v1'
    else image_key
  end
where is_verified;

alter table public.food_items
  add constraint food_items_kind_check
    check (food_kind in ('dish', 'ingredient', 'seasoning', 'drink')),
  add constraint food_items_category_check
    check (category_slug in (
      'rice-dishes', 'noodles', 'soups', 'bread', 'protein', 'staples',
      'vegetables', 'fruit', 'dairy', 'drinks', 'seasonings', 'other'
    )),
  add constraint food_items_image_key_check
    check (image_key is null or image_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*-v[0-9]+$');

alter table public.meal_entries
  add constraint meal_entries_image_key_check
    check (
      food_image_key_snapshot is null
      or food_image_key_snapshot ~ '^[a-z0-9]+(?:-[a-z0-9]+)*-v[0-9]+$'
    );

create unique index food_items_image_key_idx
  on public.food_items (image_key)
  where image_key is not null;

create index food_items_catalog_idx
  on public.food_items (food_kind, category_slug, normalized_name);
