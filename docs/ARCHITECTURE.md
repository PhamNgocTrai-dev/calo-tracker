# Kiến trúc CaloFlow

## 1. Database nằm ở đâu?

Database production nằm trên **Supabase**, tức PostgreSQL được quản lý trên cloud. Source code chỉ chứa migration và seed có version; dữ liệu tài khoản không nằm trong Git hoặc Vercel filesystem.

- Schema: `supabase/migrations/`.
- Dữ liệu món ăn khởi tạo: `supabase/seed.sql`.
- Identity: bảng hệ thống `auth.users` do Supabase Auth quản lý.
- Dữ liệu nghiệp vụ: schema `public`.
- Authorization tầng database: Row Level Security (RLS).

| Bảng                | Vai trò                                                          |
| ------------------- | ---------------------------------------------------------------- |
| `profiles`          | Hồ sơ sức khỏe mở rộng của tài khoản Auth                        |
| `food_items`        | Catalog món/nguyên liệu/gia vị, taxonomy, nutrition và image key |
| `meal_entries`      | Nhật ký món ăn, kèm snapshot dinh dưỡng và image key khi lưu     |
| `water_entries`     | Từng lần uống nước của user, lưu lượng ml và thời điểm           |
| `goals`             | Mục tiêu cân nặng, BMR/TDEE và calorie target                    |
| `workout_reminders` | Nền tảng cho lịch nhắc tập ở giai đoạn sau                       |

`meal_entries` dùng generated columns để PostgreSQL tính `total_calories`, `total_protein_g`, `total_carbs_g` và `total_fat_g` từ khối lượng cùng snapshot trên 100g.

## 2. Trạng thái truy cập ứng dụng

- `/login`, `/register`, `/auth/callback`, `POST /auth/logout` và `/api/health` là các route public chính xác.
- Dashboard `/`, `/meals`, `/calculator` và các trang ứng dụng tương lai được bảo vệ mặc định.
- Mỗi protected request cần đồng thời Supabase identity hợp lệ và signed deadline cookie chưa hết 5 phút; `proxy.ts` chuyển hướng về `/login` với `next` và reason an toàn khi thiếu/hết phiên.
- Server Components gọi `requireAuthenticatedSession()`; Server Actions dùng mutation-auth helper không cache; RLS vẫn là ranh giới cuối cùng.
- Nếu thiếu Supabase env hoặc `AUTH_SESSION_SIGNING_SECRET`, ứng dụng fail closed: chỉ trang auth/setup và health có thể truy cập, không chạy demo data.

`lib/supabase/config.ts` kiểm tra cấu hình. Placeholder trong `.env.example` vẫn được coi là chưa cấu hình.

## 3. Backend nằm ở đâu?

MVP dùng **Next.js full-stack**, không cần repository backend riêng:

```text
Browser
  ├─ tải HTML/RSC ───────────────→ Server Components trong app/
  ├─ gửi form ───────────────────→ Server Actions
  └─ mở email confirmation ──────→ Route Handler /auth/callback
                                      │
                                  proxy.ts refresh cookie
                                      │
                           lib/supabase/server.ts
                                      │
                                      ▼
                           Supabase Auth + PostgreSQL
```

- Server Components đọc database trực tiếp qua server module, không gọi API nội bộ.
- Client Components chỉ giữ state tương tác như theme, preview nutrition và form pending state.
- Server Actions nằm cùng route feature (`app/auth/actions.ts`, `app/meals/actions.ts`, `app/calculator/actions.ts`).
- Route Handlers dành cho callback/API boundary: `/auth/callback` và `/api/health`.
- `proxy.ts` dùng `@supabase/ssr`, refresh auth cookie, chuyển tiếp no-cache headers và thực hiện route guard sớm.
- `lib/auth/session.ts` trả về `unauthenticated` hoặc `authenticated`, cache trong một server render và cung cấp `requireAuthenticatedUser()`.

## 4. Authentication flow

1. Signup action validate email, password và display name.
2. Supabase tạo row trong `auth.users`.
3. Trigger `handle_new_user` tạo row tương ứng trong `public.profiles`.
4. Supabase gửi email confirmation về `/auth/callback`.
5. Callback gọi `exchangeCodeForSession()` và ghi auth cookies.
6. Login/callback tạo thêm cookie deadline HMAC gắn với user ID, hết hạn tuyệt đối sau 300 giây.
7. `proxy.ts` kiểm tra deadline trước và sau Supabase claims refresh; refresh token không tạo hoặc gia hạn deadline.
8. Server dùng `auth.getUser()` rồi kiểm tra lại deadline và user binding trước khi đọc/ghi.

Supabase SSR auth cookies xác minh identity; signed deadline cookie thực thi chính sách thời gian của ứng dụng. Countdown chỉ nhận `expiresAtMs`/`serverNowMs`, không nhận token, và dùng monotonic elapsed time cho UI. Ứng dụng không sao chép access token, refresh token hoặc custom bearer key vào Local Storage/Session Storage; logout dọn cả hai trạng thái phiên.

`lib/auth/routing.ts` tập trung route public và chuẩn hóa `next`: chỉ chấp nhận URL nội bộ, từ chối backslash, URL dạng `//` và các route auth gây vòng lặp.

## 5. Luồng lưu bữa ăn

1. Browser gửi `foodItemId`, `amountG` và `mealType`.
2. Server Action chạy Zod validation.
3. Action gọi `auth.getUser()`; không nhận `user_id` từ browser.
4. Action đọc lại món từ `food_items` theo RLS.
5. Action insert tên, image key và nutrition snapshot vào `meal_entries`.
6. PostgreSQL tự tính tổng calo/macro bằng generated columns.
7. Policy `meal_entries_insert_own` xác nhận `user_id = auth.uid()`.
8. Next.js revalidate `/meals` và `/`.

Do đó người dùng không thể sửa hidden input để tự khai calo thấp hơn hoặc ghi dữ liệu cho tài khoản khác.

Ảnh catalog là WebP cục bộ trong `assets/foods/`. Database chỉ lưu `image_key` có version; `lib/food-images.ts` ánh xạ key sang static import cho `next/image` và trả ảnh fallback nếu key null/không tồn tại. Meal snapshot giữ hình minh họa lịch sử ổn định khi catalog thay đổi. Đây là ảnh minh họa được tạo cục bộ, không phải ảnh khẩu phần thực tế của người dùng.

## 6. Luồng lưu mục tiêu

1. Browser gửi dữ liệu đầu vào công thức, không gửi kết quả authoritative.
2. Server Action chạy lại `goalPlanSchema` và `calculateGoalPlan()`; BMI được dẫn xuất từ chiều cao/cân nặng đã validate.
3. Action tính `target_date` ở server.
4. RPC `save_goal_plan` chạy trong một transaction:
   - cập nhật profile;
   - đổi goal active cũ thành `cancelled`;
   - tạo goal active mới.
5. Partial failure rollback toàn bộ transaction; unique partial index bảo đảm mỗi user chỉ có một active goal.
6. RLS và `auth.uid()` bảo vệ ownership.

BMI không được lưu thành cột riêng vì luôn có thể tính lại từ `profiles.height_cm` và `profiles.weight_kg`; tránh dữ liệu dẫn xuất bị lệch khi chiều cao hoặc cân nặng thay đổi.

## 7. Luồng lưu nước uống

1. Browser gửi một preset 250/350/500 ml hoặc số ml tùy chỉnh.
2. Server Action chỉ chấp nhận số nguyên 50–2.000 ml và xác thực lại bằng `auth.getUser()`.
3. Server gán `user_id`; browser không được gửi user ID, ngày, timestamp hay tổng nước.
4. PostgreSQL tự gán `drank_at`; check constraint áp dụng cùng giới hạn 50–2.000 ml.
5. Policy `water_entries_insert_own` và `water_entries_delete_own` bảo vệ ownership.
6. Dashboard lọc entry theo ngày tại timezone profile rồi cộng tổng trên server.
7. Xóa nước luôn ràng buộc đồng thời entry ID và authenticated user ID.

Mục tiêu hiện tại cố định ở 2.000 ml/ngày. Giới hạn 2.000 ml áp dụng cho một lần nhập, không giới hạn tổng ngày. Mỗi lần uống là một row riêng để người dùng có thể xóa đúng lần nhập nhầm; chưa có update policy hoặc mục tiêu ngày tùy chỉnh.

## 8. Luồng đọc dashboard

`lib/data/dashboard.ts`:

- đọc timezone, chiều cao và cân nặng từ profile;
- chuẩn hóa timezone, fallback `Asia/Ho_Chi_Minh` nếu giá trị thiếu/không hợp lệ;
- đọc active goal;
- đọc meal và water entries trong lookback 48 giờ rồi lọc theo ngày tại timezone tài khoản;
- cộng calories/protein/carbs/fat và tổng ml trên server;
- dẫn xuất BMI từ chiều cao/cân nặng khi có đủ dữ liệu;
- map dữ liệu sang view model cho dashboard.

Calo vận động vẫn được ghi rõ là **chưa hỗ trợ**, không dùng số demo trong authenticated mode. Macro target cũng không bị bịa khi chưa có mô hình target macro.

## 9. Theme

Tailwind CSS 4 dùng custom dark variant dựa trên class `.dark` tại root. Script trong `app/layout.tsx` chạy trước paint:

1. đọc `caloflow-theme` từ localStorage;
2. nếu chưa có, fallback sang `prefers-color-scheme` của OS;
3. gắn `.dark` và `color-scheme` trước khi body được vẽ.

`components/theme-toggle.tsx` là Client Component nhỏ, chỉ thay class root và lưu `light` hoặc `dark`.

## 10. Ranh giới bảo mật

- Publishable key được phép ở browser chỉ vì RLS luôn bật.
- Không đưa `service_role` vào `NEXT_PUBLIC_*` hoặc frontend bundle.
- Mọi Server Action xác thực lại user ngay trong action.
- Không tin `user_id`, nutrition totals, BMR, TDEE hay target do browser tự khai.
- RLS là lớp defense-in-depth cuối cùng.
- Không log toàn bộ health profile hoặc meal details.
- Health output là thông tin tham khảo, không phải chẩn đoán hay chỉ định y tế.

## 11. Deploy

Local cần bốn biến:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
AUTH_SESSION_SIGNING_SECRET=secret-ngẫu-nhiên-mạnh-phía-server
```

`AUTH_SESSION_SIGNING_SECRET` phải có tối thiểu 32 byte, không có tiền tố `NEXT_PUBLIC_`; rotate secret làm mọi phiên hiện tại mất hiệu lực. Production dùng secret riêng và Site URL production. Cả localhost callback và production callback phải nằm trong Supabase Authentication Redirect URLs. Chi tiết thao tác có tại root `README.md`.
