# Hướng dẫn Database, Authentication, Email và Quy tắc tính CaloFlow

Tài liệu này mô tả cách dùng Supabase PostgreSQL thật, cách đăng nhập để xác định người dùng, cách gửi email xác nhận an toàn và các quy tắc tính BMR/TDEE/mục tiêu calo.

## 1. Trạng thái ứng dụng

CaloFlow yêu cầu đăng nhập trước khi truy cập dữ liệu ứng dụng:

1. Không có Supabase env: ứng dụng fail closed và chỉ cho truy cập trang login/register hướng dẫn setup cùng `/api/health`.
2. Có Supabase env nhưng chưa đăng nhập: mọi trang ứng dụng chuyển hướng về `/login`.
3. Có Supabase env và session hợp lệ: đọc/ghi PostgreSQL theo tài khoản hiện tại.

Có thể kiểm tra trạng thái tại:

```text
http://localhost:3000/api/health
```

Kết quả DB thật phải chứa:

```json
{
  "status": "ok",
  "service": "calo-tracker",
  "database": "configured"
}
```

Nếu `database` là `unconfigured`, ứng dụng chưa đọc được `.env.local` hợp lệ và sẽ không mở các trang dữ liệu.

## 2. Tạo Supabase PostgreSQL thật

### 2.1 Tạo project

1. Truy cập https://supabase.com/dashboard.
2. Chọn New project.
3. Chọn organization.
4. Nhập project name, database password và region.
5. Chờ project khởi tạo hoàn tất.

Database người dùng nằm trong PostgreSQL của project Supabase này. Source code chỉ lưu migration; không lưu dữ liệu thật trong Git.

### 2.2 Chạy SQL

Trong Supabase Dashboard, mở SQL Editor và chạy toàn bộ nội dung các file theo đúng thứ tự:

1. `supabase/migrations/202608190001_initial_schema.sql`
2. `supabase/migrations/202608190002_save_goal_plan.sql`
3. `supabase/seed.sql`

Sau khi chạy, Table Editor phải có:

- `profiles`
- `food_items`
- `meal_entries`
- `goals`
- `workout_reminders`

Không tắt Row Level Security.

### 2.3 Lấy thông tin project

Trong Project Settings → API, lấy:

- Project URL
- Publishable key

Không sử dụng `service_role` key ở frontend. Không đặt service-role key trong biến có tiền tố `NEXT_PUBLIC_`.

### 2.4 Tạo `.env.local`

Tạo file `.env.local` ở thư mục gốc project:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxx
```

Thay URL và publishable key bằng giá trị thật, sau đó khởi động lại server:

```powershell
npm run dev
```

Biến môi trường chỉ được đọc lại sau khi restart Next.js.

## 3. Authentication và thông tin người dùng

### 3.1 Cấu hình Email provider

Trong Supabase Dashboard:

1. Mở Authentication → Providers → Email.
2. Bật Email provider.
3. Bật Confirm email.
4. Mở Authentication → URL Configuration.
5. Đặt Site URL thành `http://localhost:3000`.
6. Thêm Redirect URL `http://localhost:3000/auth/callback`.

Production cần thêm URL tương ứng, ví dụ:

```text
https://your-domain.com/auth/callback
```

### 3.2 Luồng đăng ký

1. Người dùng nhập display name, email và password tại trang `/register` riêng biệt.
2. Server Action validate dữ liệu.
3. Supabase tạo identity trong `auth.users`.
4. Trigger PostgreSQL tạo row trong `public.profiles` với cùng user ID.
5. Supabase gửi email confirmation.
6. Người dùng mở link confirmation.
7. `/auth/callback` đổi PKCE code thành session cookie.
8. Các request sau được `proxy.ts` refresh session.

### 3.3 Luồng đăng nhập

1. Người dùng nhập email/password.
2. Server gọi `signInWithPassword()`.
3. Supabase xác minh thông tin đăng nhập.
4. Session được lưu bằng secure auth cookies.
5. Server gọi `auth.getUser()` để lấy identity đã được xác minh.
6. `lib/auth/session.ts` trả về:
   - user ID;
   - email;
   - display name trong user metadata.
7. Profile sức khỏe được đọc từ `public.profiles` theo user ID hiện tại và RLS.

Không lấy user ID từ hidden input hoặc dữ liệu browser tự khai.

### 3.4 Thông tin nào nằm ở đâu?

| Nơi lưu               | Thông tin                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------- |
| `auth.users`          | ID, email, password hash, trạng thái xác nhận email, metadata Auth                        |
| `public.profiles`     | Display name, giới tính công thức, ngày sinh, chiều cao, cân nặng, mức vận động, timezone |
| `public.meal_entries` | Các món ăn của user                                                                       |
| `public.goals`        | BMR, TDEE, calorie target và mục tiêu cân nặng                                            |

Ứng dụng server xác định user bằng `auth.getUser()`. RLS bảo đảm mỗi user chỉ thấy row của họ.

## 4. Gửi email bằng Supabase

### 4.1 Giai đoạn phát triển

Supabase có email sender mặc định để thử luồng confirmation. Không cần cung cấp mật khẩu Gmail cho source code.

Sender mặc định có giới hạn tốc độ rất thấp và có thể chỉ cho gửi tới email của thành viên project. Nếu form đăng ký báo `email_address_not_authorized`, `over_email_send_rate_limit` hoặc lỗi gửi confirmation email, hãy cấu hình Custom SMTP. Lỗi **HTTP 504** thường nghĩa là Supabase Auth chờ SMTP hoặc Auth Hook quá lâu; với Gmail, kiểm tra `smtp.gmail.com`, port `587`, username là email đầy đủ và Google App Password mới. Khi chỉ phát triển local, có thể tạm tắt **Confirm email** trong Authentication → Providers → Email để kiểm tra luồng tạo tài khoản ngay lập tức; production nên bật lại.

### 4.2 Production với Gmail SMTP

Không sử dụng mật khẩu Gmail thông thường. Không gửi mật khẩu Gmail qua chat, commit, `.env.local` hoặc biến `NEXT_PUBLIC_*`.

Nếu muốn dùng Gmail làm SMTP:

1. Bật 2-Step Verification cho Google Account.
2. Tạo Google App Password dành riêng cho SMTP.
3. Trong Supabase mở Authentication → Email/SMTP Settings.
4. Bật Custom SMTP.
5. Nhập cấu hình:

```text
Host: smtp.gmail.com
Port: 587
Username: your-address@gmail.com
Password: Google App Password, không phải mật khẩu Gmail
Sender email: your-address@gmail.com
Sender name: CaloFlow
```

6. Lưu trực tiếp trong Supabase Dashboard.
7. Không đưa App Password vào repository.

Đối với production nghiêm túc, nên dùng Resend, Postmark, Amazon SES hoặc SendGrid thay vì Gmail cá nhân để có domain verification, log giao nhận và giới hạn gửi phù hợp hơn.

### 4.3 Email nào được gửi?

Luồng hiện tại gửi email khi đăng ký để xác nhận tài khoản. Đăng nhập email/password thành công không tự gửi email mỗi lần đăng nhập.

Nếu sau này cần cảnh báo đăng nhập mới, cần triển khai thêm Auth Hook hoặc webhook phía server và một email provider. Không nên gửi email đồng bộ trong action đăng nhập vì lỗi email không được làm hỏng phiên đăng nhập hợp lệ.

## 5. Quy tắc tính BMR

CaloFlow dùng công thức Mifflin–St Jeor cho người trưởng thành.

### 5.1 Nam

```text
BMR = 10 × cân nặng kg + 6.25 × chiều cao cm - 5 × tuổi + 5
```

### 5.2 Nữ

```text
BMR = 10 × cân nặng kg + 6.25 × chiều cao cm - 5 × tuổi - 161
```

Ví dụ người dùng nam, 30 tuổi, 72 kg, 170 cm:

```text
BMR = 10 × 72 + 6.25 × 170 - 5 × 30 + 5
BMR = 1637.5 kcal/ngày
```

BMR là năng lượng cơ thể ước tính cần khi nghỉ ngơi, không phải mức ăn tối ưu cho mọi trường hợp.

## 6. Quy tắc tính TDEE

```text
TDEE = BMR × hệ số vận động
```

| Mức vận động                   | Enum DB       | Hệ số |
| ------------------------------ | ------------- | ----: |
| Ít vận động                    | `sedentary`   |   1.2 |
| Vận động nhẹ, 1–3 buổi/tuần    | `light`       | 1.375 |
| Vận động vừa, 3–5 buổi/tuần    | `moderate`    |  1.55 |
| Vận động nhiều, 6–7 buổi/tuần  | `active`      | 1.725 |
| Lao động nặng/cường độ rất cao | `very_active` |   1.9 |

Ví dụ BMR 1637.5 và mức moderate:

```text
TDEE = 1637.5 × 1.55
TDEE ≈ 2538 kcal/ngày
```

## 7. Quy tắc tính calorie target

CaloFlow dùng xấp xỉ:

```text
1 kg cân nặng ≈ 7700 kcal
```

### 7.1 Chênh lệch cân nặng

```text
weightDeltaKg = targetWeightKg - currentWeightKg
```

- Nhỏ hơn 0: giảm cân.
- Lớn hơn 0: tăng cân.
- Bằng 0: duy trì.

### 7.2 Điều chỉnh theo thời gian yêu cầu

```text
requestedDailyAdjustment =
  weightDeltaKg × 7700 / (durationWeeks × 7)
```

### 7.3 Giới hạn an toàn của ứng dụng

```text
minimum adjustment = -1000 kcal/ngày
maximum adjustment = +500 kcal/ngày
```

Ứng dụng clamp mức điều chỉnh vào khoảng trên:

```text
safeAdjustment = min(500, max(-1000, requestedDailyAdjustment))
```

### 7.4 Không đề xuất thấp hơn BMR

```text
calorieTargetBeforeFloor = TDEE + safeAdjustment
dailyCalorieTarget = max(BMR, calorieTargetBeforeFloor)
```

Nếu yêu cầu giảm quá nhanh khiến calorie target thấp hơn BMR, ứng dụng giữ target ở BMR và hiển thị cảnh báo.

### 7.5 Tốc độ thay đổi được đề xuất

```text
recommendedWeeklyChangeKg =
  dailyCalorieAdjustment × 7 / 7700
```

### 7.6 Thời gian ước tính sau khi áp giới hạn

```text
estimatedDurationWeeks =
  abs(weightDeltaKg / recommendedWeeklyChangeKg)
```

Thời gian ước tính có thể dài hơn thời gian người dùng yêu cầu nếu kế hoạch ban đầu quá gấp.

## 8. Validation đầu vào

| Trường              | Quy tắc                        |
| ------------------- | ------------------------------ |
| Tuổi                | Số nguyên từ 18 đến 100        |
| Chiều cao           | 120–230 cm                     |
| Cân nặng hiện tại   | 35–300 kg                      |
| Cân nặng mục tiêu   | 35–300 kg                      |
| Thời gian           | 1–104 tuần                     |
| Giới tính công thức | `male` hoặc `female`           |
| Mức vận động        | Một trong năm enum được hỗ trợ |

Server luôn validate lại. Kết quả do browser gửi không được coi là authoritative.

## 9. Quy tắc tính dinh dưỡng bữa ăn

Browser chỉ gửi:

- `foodItemId`;
- `amountG`;
- `mealType`.

Server đọc lại món từ `food_items` rồi lưu snapshot. PostgreSQL tính:

```text
total_calories = amount_g × calories_per_100g / 100
total_protein_g = amount_g × protein_g_per_100g / 100
total_carbs_g = amount_g × carbs_g_per_100g / 100
total_fat_g = amount_g × fat_g_per_100g / 100
```

Khối lượng phải lớn hơn 0 và không vượt quá 5000g.

Snapshot được lưu để lịch sử không thay đổi nếu dữ liệu món ăn gốc được cập nhật sau này.

## 10. Quy tắc lưu mục tiêu

Server tính lại BMR, TDEE và calorie target, sau đó gọi RPC `save_goal_plan`.

RPC thực hiện trong cùng transaction:

1. Cập nhật profile hiện tại.
2. Đổi goal active cũ thành `cancelled`.
3. Tạo goal active mới.
4. Trả về goal ID.

Unique partial index bảo đảm mỗi user chỉ có tối đa một goal active.

## 11. Kiểm tra DB thật end-to-end

1. `/api/health` trả `database: configured`.
2. Tạo tài khoản tại `/register`, xác nhận email rồi đăng nhập tại `/login`.
3. Nhận và mở email confirmation.
4. Đăng nhập.
5. Thêm món tại `/meals`.
6. Reload trang, món vẫn tồn tại.
7. Kiểm tra row trong Supabase Table Editor → `meal_entries`.
8. Tính và lưu goal tại `/calculator`.
9. Kiểm tra `profiles` và `goals`.
10. Quay lại `/`, dashboard hiển thị dữ liệu PostgreSQL.
11. Logout/login lại, dữ liệu vẫn còn.
12. Thử bằng hai tài khoản để xác nhận RLS không cho đọc chéo.

## 12. Lưu ý sức khỏe

Kết quả chỉ mang tính tham khảo cho người trưởng thành khỏe mạnh. Công thức không thay thế bác sĩ hoặc chuyên gia dinh dưỡng. Người mang thai, có bệnh nền, có tiền sử rối loạn ăn uống hoặc là vận động viên chuyên nghiệp cần đánh giá cá nhân hóa.
