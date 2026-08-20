# Kiến trúc CaloFlow

## 1. Database nằm ở đâu?

Database production nằm trên **Supabase**, tức PostgreSQL được quản lý trên cloud. Source code chỉ chứa migration và seed có version; dữ liệu tài khoản không nằm trong Git hoặc Vercel filesystem.

- Schema: `supabase/migrations/`.
- Dữ liệu món ăn khởi tạo: `supabase/seed.sql`.
- Identity: bảng hệ thống `auth.users` do Supabase Auth quản lý.
- Dữ liệu nghiệp vụ: schema `public`.
- Authorization tầng database: Row Level Security (RLS).

| Bảng                | Vai trò                                                   |
| ------------------- | --------------------------------------------------------- |
| `profiles`          | Hồ sơ sức khỏe mở rộng của tài khoản Auth                 |
| `food_items`        | Danh mục dinh dưỡng chuẩn và món riêng của người dùng     |
| `meal_entries`      | Nhật ký món ăn, kèm snapshot dinh dưỡng tại thời điểm lưu |
| `goals`             | Mục tiêu cân nặng, BMR/TDEE và calorie target             |
| `workout_reminders` | Nền tảng cho lịch nhắc tập ở giai đoạn sau                |

`meal_entries` dùng generated columns để PostgreSQL tính `total_calories`, `total_protein_g`, `total_carbs_g` và `total_fat_g` từ khối lượng cùng snapshot trên 100g.

## 2. Trạng thái truy cập ứng dụng

- `/login`, `/register`, `/auth/callback` và `/api/health` là các route public.
- Dashboard `/`, `/meals`, `/calculator` và các trang ứng dụng tương lai được bảo vệ mặc định.
- Khi chưa có session hợp lệ, `proxy.ts` chuyển hướng về `/login` và giữ tham số `next` an toàn.
- Server Components vẫn gọi `requireAuthenticatedUser()`; Server Actions vẫn xác thực lại user; RLS vẫn là ranh giới cuối cùng.
- Nếu thiếu Supabase env, ứng dụng fail closed: chỉ trang auth/setup và health có thể truy cập, không chạy demo data.

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
6. `proxy.ts` refresh session ở request tiếp theo.
7. Server luôn dùng `auth.getUser()` để lấy user đã được Supabase xác minh.

`lib/auth/routing.ts` tập trung route public và chuẩn hóa `next`: chỉ chấp nhận URL nội bộ, từ chối backslash, URL dạng `//` và các route auth gây vòng lặp.

## 5. Luồng lưu bữa ăn

1. Browser gửi `foodItemId`, `amountG` và `mealType`.
2. Server Action chạy Zod validation.
3. Action gọi `auth.getUser()`; không nhận `user_id` từ browser.
4. Action đọc lại món từ `food_items` theo RLS.
5. Action insert tên và nutrition snapshot vào `meal_entries`.
6. PostgreSQL tự tính tổng calo/macro bằng generated columns.
7. Policy `meal_entries_insert_own` xác nhận `user_id = auth.uid()`.
8. Next.js revalidate `/meals` và `/`.

Do đó người dùng không thể sửa hidden input để tự khai calo thấp hơn hoặc ghi dữ liệu cho tài khoản khác.

## 6. Luồng lưu mục tiêu

1. Browser gửi dữ liệu đầu vào công thức, không gửi kết quả authoritative.
2. Server Action chạy lại `goalPlanSchema` và `calculateGoalPlan()`.
3. Action tính `target_date` ở server.
4. RPC `save_goal_plan` chạy trong một transaction:
   - cập nhật profile;
   - đổi goal active cũ thành `cancelled`;
   - tạo goal active mới.
5. Partial failure rollback toàn bộ transaction; unique partial index bảo đảm mỗi user chỉ có một active goal.
6. RLS và `auth.uid()` bảo vệ ownership.

## 7. Luồng đọc dashboard

`lib/data/dashboard.ts`:

- đọc timezone và cân nặng từ profile;
- đọc active goal;
- đọc meal entries gần hiện tại rồi lọc theo ngày tại timezone tài khoản;
- cộng calories/protein/carbs/fat từ generated columns;
- map dữ liệu sang view model cho dashboard.

Các chỉ số chưa có schema như nước uống và calo vận động được ghi rõ là **chưa hỗ trợ**, không dùng số demo trong authenticated mode. Macro target cũng không bị bịa khi chưa có mô hình target macro.

## 8. Theme

Tailwind CSS 4 dùng custom dark variant dựa trên class `.dark` tại root. Script trong `app/layout.tsx` chạy trước paint:

1. đọc `caloflow-theme` từ localStorage;
2. nếu chưa có, fallback sang `prefers-color-scheme` của OS;
3. gắn `.dark` và `color-scheme` trước khi body được vẽ.

`components/theme-toggle.tsx` là Client Component nhỏ, chỉ thay class root và lưu `light` hoặc `dark`.

## 9. Ranh giới bảo mật

- Publishable key được phép ở browser chỉ vì RLS luôn bật.
- Không đưa `service_role` vào `NEXT_PUBLIC_*` hoặc frontend bundle.
- Mọi Server Action xác thực lại user ngay trong action.
- Không tin `user_id`, nutrition totals, BMR, TDEE hay target do browser tự khai.
- RLS là lớp defense-in-depth cuối cùng.
- Không log toàn bộ health profile hoặc meal details.
- Health output là thông tin tham khảo, không phải chẩn đoán hay chỉ định y tế.

## 10. Deploy

Local cần ba biến:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

Production dùng cùng biến với Site URL production. Cả localhost callback và production callback phải nằm trong Supabase Authentication Redirect URLs. Chi tiết thao tác có tại root `README.md`.
