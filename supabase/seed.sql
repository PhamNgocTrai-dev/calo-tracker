insert into public.food_items (
  name,
  normalized_name,
  serving_size_g,
  calories_per_100g,
  protein_g_per_100g,
  carbs_g_per_100g,
  fat_g_per_100g,
  source,
  source_reference,
  is_verified
)
values
  ('Phở bò', 'pho bo', 100, 158, 9.1, 19.2, 5.0, 'Dữ liệu khởi tạo MVP', null, true),
  ('Cơm gà nướng', 'com ga nuong', 100, 186, 12.4, 20.8, 6.1, 'Dữ liệu khởi tạo MVP', null, true),
  ('Bánh mì trứng', 'banh mi trung', 100, 265, 10.2, 32.0, 10.5, 'Dữ liệu khởi tạo MVP', null, true),
  ('Bún chả', 'bun cha', 100, 177, 8.7, 22.4, 5.8, 'Dữ liệu khởi tạo MVP', null, true),
  ('Ức gà áp chảo', 'uc ga ap chao', 100, 165, 31.0, 0, 3.6, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', true),
  ('Cơm trắng', 'com trang', 100, 130, 2.7, 28.2, 0.3, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', true),
  ('Trứng gà luộc', 'trung ga luoc', 100, 155, 12.6, 1.1, 10.6, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', true),
  ('Chuối', 'chuoi', 100, 89, 1.1, 22.8, 0.3, 'USDA FoodData Central', 'https://fdc.nal.usda.gov/', true)
on conflict do nothing;
