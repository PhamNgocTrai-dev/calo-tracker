
# Dự án: Web tính Calo & Nhắc nhở tập luyện

## 1. Mục tiêu dự án

Xây dựng web app giúp:

- Tính số lượng kcal của mỗi bữa ăn (nhập thủ công thông tin món ăn, giai đoạn sau sẽ bổ sung nhận diện qua camera)
- Đặt mục tiêu cân nặng mong muốn + thời gian đáp ứng
- Tự động tính deficit/surplus calo cần thiết mỗi ngày
- Nhắc nhở tập luyện dựa trên mục tiêu và tiến độ thực tế

**Lưu ý phạm vi bản đầu (MVP):** Bỏ qua tính năng nhận diện món ăn qua camera (AI Vision) ở giai đoạn đầu, chỉ làm nhập liệu thủ công. Camera/AI Vision sẽ phát triển ở giai đoạn sau.

---

## 2. Luồng hoạt động tổng thể

```
User nhập thông tin món ăn (thủ công) ──→ Match với DB dinh dưỡng ──→ Lưu log bữa ăn
                                                                              │
User đặt mục tiêu (cân nặng, thời gian) ──→ Tính TDEE/deficit cần thiết ──→ So sánh với log ──→ Sinh nhắc nhở tập luyện
```

*(Giai đoạn sau sẽ bổ sung: User chụp ảnh món ăn → Nhận diện qua AI Vision → Match DB dinh dưỡng → Lưu log)*

---

## 3. Kiến trúc hệ thống (MVP)

```
Next.js (Frontend + API routes) ←→ Supabase (Database + Auth)
```

Dùng Next.js full-stack (không cần backend riêng như FastAPI) vì giai đoạn này chưa xử lý AI/Vision nặng. Khi phát triển tính năng nhận diện ảnh sau này, có thể tách riêng một service Python (FastAPI) để xử lý phần Computer Vision nếu cần.

---

## 4. Tech stack đề xuất

| Thành phần                       | Công nghệ                                           | Lý do                                                                  |
| ---------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------- |
| Frontend                           | Next.js 14+ (App Router, TypeScript, Tailwind CSS)    | Chuẩn hiện đại, Server Components, dev nhanh                        |
| Backend                            | Next.js API routes (giai đoạn đầu)                | Gộp chung 1 stack, đơn giản hóa deploy                             |
| Database + Auth + Storage          | Supabase (PostgreSQL)                                 | Free tier tốt, có sẵn Auth/Storage, giảm việc tự quản lý server |
| Nhận diện ảnh (giai đoạn sau) | Claude Vision API / GPT-4V / Gemini                   | Không cần tự train model, độ chính xác cao, triển khai nhanh    |
| Lưu ảnh (giai đoạn sau)        | Supabase Storage hoặc Cloudflare R2                  |                                                                         |
| Push notification                  | Web Push API (Service Worker) hoặc Telegram/Zalo Bot | Nhắc lịch tập luyện                                                 |
| Deploy                             | Vercel                                                | Tối ưu cho Next.js, free tier đủ dùng cho project cá nhân        |

---

## 5. Nguồn dữ liệu dinh dưỡng

**Nguyên tắc: dùng API/nguồn dữ liệu công khai chính thống, không cào dữ liệu trái phép.**

- **USDA FoodData Central** — API miễn phí, dữ liệu uy tín, chủ yếu món Mỹ/quốc tế
- **Edamam Nutrition API / Nutritionix API** — có free tier, database lớn, ít món Việt
- **Bảng thành phần dinh dưỡng thực phẩm Việt Nam** (Viện Dinh dưỡng Quốc gia) — nguồn chuẩn cho món Việt, cần tự số hóa (nhập liệu thủ công từ nguồn công khai) thành DB nội bộ

**Chiến lược thực tế:**

1. Tự xây DB nội bộ (bảng `food_items`) cho khoảng 200–300 món Việt phổ biến (phở, cơm tấm, bún chả...) làm ưu tiên
2. Fallback qua API quốc tế (USDA/Edamam) cho món không có sẵn trong DB nội bộ

---

## 6. Thiết kế Database (PostgreSQL qua Supabase)

Các bảng chính cần có:

- **`users`** — thông tin người dùng (tuổi, giới tính, chiều cao, cân nặng hiện tại, activity level)
- **`food_items`** — DB dinh dưỡng nội bộ (tên món, calo/100g, protein, carb, fat, nguồn dữ liệu)
- **`meals_log`** — log bữa ăn của user (user_id, food_item_id, khối lượng, thời gian ăn, tổng calo)
- **`goals`** — mục tiêu cân nặng (user_id, cân nặng hiện tại, cân nặng mục tiêu, thời gian mong muốn, ngày bắt đầu)
- **`workout_reminders`** — lịch nhắc tập luyện (user_id, thời gian nhắc, trạng thái đã tập/chưa)

---

## 7. Công thức tính toán mục tiêu

1. Tính **BMR** (Basal Metabolic Rate) theo công thức **Mifflin-St Jeor** từ tuổi, giới tính, chiều cao, cân nặng hiện tại
2. Nhân với **activity factor** (mức độ vận động hàng ngày) → ra **TDEE** (Total Daily Energy Expenditure)
3. Từ chênh lệch (cân nặng hiện tại − cân nặng mục tiêu) chia cho thời gian mong muốn → tính **deficit/surplus calo cần thiết mỗi ngày**
   - Nên giới hạn mức an toàn: giảm/tăng khoảng 0.5–1kg/tuần, tránh khuyến nghị thay đổi quá nhanh
4. So sánh calo nạp vào thực tế (từ `meals_log`) với TDEE − deficit mục tiêu → sinh nhắc nhở (VD: "cần đốt thêm X calo hôm nay" hoặc gợi ý bài tập)

---

## 8. Tiến độ setup đã thực hiện

- [X] Xác nhận môi trường: Node.js v22.19.0 (đủ điều kiện cho Next.js 14+)
- [X] Tạo project Next.js:

  ```bash
  npx create-next-app@latest calo-tracker
  ```

  Cấu hình đã chọn: TypeScript = Yes, ESLint = Yes, Tailwind CSS = Yes, `src/` directory = Yes, App Router = Yes, custom import alias = No
- [X] Chạy thử project:

  ```bash
  cd calo-tracker
  npm run dev
  ```

  → kiểm tra `http://localhost:3000`

### Các bước tiếp theo (chưa thực hiện)

- [ ] Tạo tài khoản + project trên Supabase, lấy API key (cần thực hiện trong tài khoản của chủ project)
- [X] Cài Supabase client cho browser/server và thêm `.env.example`
- [X] Tạo migration PostgreSQL, seed data, indexes và RLS (chưa apply lên Supabase cloud)
- [X] Build giao diện nhập món ăn thủ công ở chế độ demo
- [X] Xây form đặt mục tiêu cân nặng + tính BMR/TDEE/deficit có kiểm thử
- [ ] Kết nối Auth và Server Actions để lưu dữ liệu thật
- [ ] Xây hệ thống nhắc nhở tập luyện (Web Push hoặc Bot)
- [ ] (Giai đoạn sau) Tích hợp nhận diện món ăn qua camera bằng AI Vision API

---

## 9. Ghi chú bổ sung

- Người thực hiện: đang làm dev ASP.NET Web Forms / Oracle PL/SQL, có kinh nghiệm code Python cơ bản, đang học thêm Next.js/React cho project này.
- Ưu tiên công nghệ phù hợp cho project cá nhân, chi phí thấp/miễn phí (free tier), dễ deploy và bảo trì một mình.
