# CaloFlow

Web app theo dõi calo, nhật ký bữa ăn và mục tiêu cân nặng. MVP dùng Next.js 16, React 19, TypeScript, Tailwind CSS 4 và Supabase PostgreSQL.

## Tính năng hiện có

- Dashboard responsive chỉ hiển thị dữ liệu của tài khoản đã đăng nhập.
- Light/dark mode theo lựa chọn người dùng, lưu trong `localStorage` với key `caloflow-theme`.
- Route guard mặc định chặn toàn bộ trang ứng dụng khi chưa đăng nhập.
- Trang `/login` và `/register` riêng biệt; xác nhận email và đăng xuất bằng Supabase Auth.
- Nhập bữa ăn thủ công, lưu nutrition snapshot vào PostgreSQL và xóa bữa ăn thêm nhầm sau bước xác nhận.
- Tính BMR/TDEE bằng Mifflin–St Jeor, giới hạn mục tiêu quá gấp và lưu profile/goal nguyên tử.
- Dashboard đọc calo, macro, bữa ăn và mục tiêu thật theo ngày tại múi giờ tài khoản.
- PostgreSQL migrations, seed món ăn, generated columns, indexes và Row Level Security.
- Unit tests, lint, typecheck, formatting, production build và GitHub Actions CI.
- Endpoint kiểm tra `/api/health`.

Chưa triển khai: theo dõi nước, calo vận động, workout reminders, Web Push và nhận diện món ăn bằng camera/AI Vision.

## Chạy project

Yêu cầu Node.js 20.9 trở lên; project chuẩn hóa trên Node 22.19.

```bash
npm install
npm run dev
```

Mở <http://localhost:3000>.

Các route chính:

- `/login` — đăng nhập
- `/register` — tạo tài khoản
- `/` — dashboard, yêu cầu đăng nhập
- `/calculator` — tính và lưu BMR/TDEE/mục tiêu, yêu cầu đăng nhập
- `/meals` — nhập và xem bữa ăn, yêu cầu đăng nhập
- `/api/health` — trạng thái service và cấu hình database

`/auth` chỉ còn là route tương thích và chuyển hướng sang `/login`. Khi thiếu session, các trang ứng dụng tự chuyển về `/login?next=...`. Khi thiếu `.env.local`, ứng dụng fail closed thay vì hiển thị dữ liệu demo.

## Hướng dẫn setup Supabase từng bước

### 1. Tạo Supabase project

1. Mở <https://supabase.com/dashboard> và đăng nhập.
2. Chọn **New project**.
3. Chọn organization, đặt tên project, tạo database password mạnh và chọn region gần người dùng.
4. Chờ project chuyển sang trạng thái sẵn sàng.

Database nằm trên hạ tầng Supabase và là một PostgreSQL database thật. Dữ liệu người dùng không nằm trong source code hay trong Vercel.

### 2. Tạo schema, RPC và dữ liệu món ăn

Trong project Supabase, mở **SQL Editor → New query**. Mở từng file trong repository, sao chép toàn bộ nội dung và chạy đúng thứ tự:

1. `supabase/migrations/202608190001_initial_schema.sql`
2. `supabase/migrations/202608190002_save_goal_plan.sql`
3. `supabase/seed.sql`

Migration 001 tạo enums, tables, constraints, generated nutrition totals, indexes, triggers và RLS. Migration 002 tạo RPC `save_goal_plan` để cập nhật profile, hủy goal active cũ và tạo goal mới trong cùng transaction. Seed thêm danh mục món ăn ban đầu.

Sau khi chạy, kiểm tra **Table Editor** có các bảng:

- `profiles`
- `food_items`
- `meal_entries`
- `goals`
- `workout_reminders`

Không tắt RLS. Publishable key chỉ an toàn khi các policy RLS vẫn hoạt động.

### 3. Bật email authentication

1. Mở **Authentication → Providers → Email**.
2. Bật Email provider.
3. Nên bật **Confirm email** để tài khoản phải xác nhận địa chỉ email trước khi đăng nhập.
4. Trong **Authentication → URL Configuration** đặt:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: thêm `http://localhost:3000/auth/callback`

Khi triển khai production, thêm URL production, ví dụ:

- Site URL: `https://your-app.vercel.app`
- Redirect URL: `https://your-app.vercel.app/auth/callback`

Luồng xác nhận dùng PKCE. Sau khi đăng ký, nên mở email xác nhận trong cùng trình duyệt đã tạo tài khoản để cookie verifier còn tồn tại.

### 4. Lấy Project URL và Publishable key

Mở **Project Settings → API** và sao chép:

- **Project URL**
- **Publishable key**

Không dùng `service_role` key cho ứng dụng này và tuyệt đối không đặt service-role key trong biến bắt đầu bằng `NEXT_PUBLIC_`.

### 5. Tạo `.env.local`

Sao chép `.env.example` thành `.env.local` rồi thay giá trị thật:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxx
```

Sau khi sửa env, dừng và chạy lại dev server:

```bash
npm run dev
```

Kiểm tra <http://localhost:3000/api/health>. Trường `database` phải là `configured`, không phải `unconfigured`.

### 6. Kiểm tra luồng lưu dữ liệu

1. Mở `/register`, tạo tài khoản.
2. Mở email xác nhận trong cùng trình duyệt.
3. Đăng nhập tại `/login`.
4. Mở `/meals`, thêm một món rồi reload; món vẫn phải tồn tại.
5. Mở `/calculator`, tính và lưu mục tiêu.
6. Quay lại `/`; dashboard phải cập nhật calo, macro, cân nặng và goal.
7. Đăng xuất rồi đăng nhập lại; dữ liệu vẫn còn.

Có thể kiểm tra bản ghi trong Supabase **Table Editor**. Dùng hai tài khoản khác nhau để xác nhận RLS không cho tài khoản A đọc hoặc ghi dữ liệu của tài khoản B.

### 7. Cấu hình Vercel

Trong **Vercel → Project Settings → Environment Variables**, thêm cùng ba biến với `NEXT_PUBLIC_SITE_URL` là URL production. Sau đó redeploy. Đồng thời thêm URL callback production vào Supabase Authentication như bước 3.

## Backend và database hoạt động thế nào?

Backend nằm ngay trong Next.js:

- **Server Components** đọc dữ liệu trực tiếp từ Supabase; không gọi vòng qua API nội bộ.
- **Server Actions** validate form, xác thực lại user rồi mutation database.
- **Route Handler** `/auth/callback` đổi PKCE code lấy session; `/api/health` báo trạng thái service.
- Root `proxy.ts` refresh Supabase auth cookie và chuyển request chưa đăng nhập về `/login` theo chuẩn Next.js 16.
- `lib/supabase/server.ts` tạo client phía server từ publishable key và session cookie.
- Supabase Auth lưu identity trong `auth.users`.
- PostgreSQL lưu dữ liệu nghiệp vụ trong schema `public`.
- RLS là ranh giới cuối cùng ngăn truy cập chéo tài khoản.

Khi thêm bữa ăn, browser chỉ gửi ID món, khối lượng và loại bữa. Server đọc lại row `food_items`, lấy tên/calo/macro đáng tin cậy, lưu snapshot vào `meal_entries`, còn PostgreSQL tự tính tổng bằng generated columns. Browser không được quyết định `user_id` hoặc tổng calo.

Khi lưu mục tiêu, server chạy lại Zod validation và `calculateGoalPlan()`, sau đó gọi RPC transaction. Browser không được quyết định BMR, TDEE hoặc calorie target cuối cùng.

Xem thêm:

- [Hướng dẫn người dùng về nguyên tắc tính](docs/USER_CALCULATION_GUIDE.md)
- [Kiến trúc ứng dụng](docs/ARCHITECTURE.md)
- [Database, authentication và công thức kỹ thuật](docs/DATABASE_AUTH_CALCULATION_GUIDE.md)

## Cấu trúc chính

```text
app/                     Routes, Server Components, Server Actions, Route Handlers
components/              UI tái sử dụng và các Client Component nhỏ
lib/auth/                 Auth state, route policy và safe redirect
lib/data/                 Data loaders phía server
lib/domain/               Validation và công thức sức khỏe thuần TypeScript
lib/supabase/             Supabase config, clients và database types
supabase/migrations/      PostgreSQL schema/RPC có version
supabase/seed.sql         Dữ liệu món ăn ban đầu
docs/                     Tài liệu kiến trúc
proxy.ts                  Refresh session và chặn route riêng tư
```

## Quality checks

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

Hoặc chạy lint + typecheck + test:

```bash
npm run check
```

## Công thức và lưu ý sức khỏe

- BMR: Mifflin–St Jeor.
- TDEE: BMR nhân hệ số vận động.
- Quy đổi thay đổi cân nặng: xấp xỉ 7.700 kcal/kg.
- Giới hạn điều chỉnh khoảng -1.000 kcal/ngày khi giảm và +500 kcal/ngày khi tăng.
- Mục tiêu đề xuất không thấp hơn BMR ước tính.

Kết quả chỉ mang tính tham khảo cho người trưởng thành khỏe mạnh, không thay thế bác sĩ hoặc chuyên gia dinh dưỡng. Người mang thai, có bệnh nền, có tiền sử rối loạn ăn uống hoặc là vận động viên chuyên nghiệp cần đánh giá cá nhân hóa.
