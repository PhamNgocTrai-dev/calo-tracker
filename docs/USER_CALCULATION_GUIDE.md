# Hướng dẫn người dùng: CaloFlow tính như thế nào?

Tài liệu này giải thích các con số CaloFlow hiển thị khi bạn ghi bữa ăn và lập mục tiêu cân nặng. Các kết quả là **ước tính hỗ trợ theo dõi**, không phải chẩn đoán hay chỉ định y tế.

## 1. Calo và chất dinh dưỡng của một khẩu phần

Mỗi món trong danh mục có thông tin trên 100 gram:

- năng lượng (kcal);
- protein (g);
- carbohydrate/carb (g);
- chất béo/fat (g).

Khi bạn nhập khối lượng thực tế, CaloFlow tính theo tỷ lệ:

```text
Tổng calo    = khối lượng (g) × calo trên 100g / 100
Tổng protein = khối lượng (g) × protein trên 100g / 100
Tổng carb    = khối lượng (g) × carb trên 100g / 100
Tổng fat     = khối lượng (g) × fat trên 100g / 100
```

Ví dụ, một món có 200 kcal và 10g protein trên 100g. Nếu bạn ăn 150g:

```text
Calo    = 150 × 200 / 100 = 300 kcal
Protein = 150 × 10 / 100  = 15g
```

Vì vậy, hãy nhập khối lượng gần với lượng thực tế nhất. Sai số từ cân đo, cách chế biến, nhãn dinh dưỡng hoặc dữ liệu món ăn sẽ ảnh hưởng kết quả.

## 2. Tổng calo và macro trong ngày

Dashboard cộng các bữa ăn đã ghi trong ngày để hiển thị:

```text
Calo đã nạp trong ngày = tổng calo của tất cả bữa ăn trong ngày
Protein trong ngày     = tổng protein của tất cả bữa ăn trong ngày
Carb trong ngày        = tổng carb của tất cả bữa ăn trong ngày
Fat trong ngày         = tổng fat của tất cả bữa ăn trong ngày
```

Nếu thêm nhầm, bạn có thể dùng nút thùng rác tại **Bữa ăn gần đây**. Ứng dụng yêu cầu xác nhận trước khi xóa và chỉ cho phép bạn xóa dữ liệu thuộc tài khoản của mình.

## 3. BMR là gì?

BMR (Basal Metabolic Rate) là năng lượng cơ thể ước tính sử dụng trong một ngày khi nghỉ ngơi. CaloFlow dùng công thức **Mifflin–St Jeor** cho người trưởng thành.

### Công thức nam

```text
BMR = 10 × cân nặng (kg) + 6.25 × chiều cao (cm) - 5 × tuổi + 5
```

### Công thức nữ

```text
BMR = 10 × cân nặng (kg) + 6.25 × chiều cao (cm) - 5 × tuổi - 161
```

Ví dụ: nam, 30 tuổi, 72kg, cao 170cm:

```text
BMR = 10 × 72 + 6.25 × 170 - 5 × 30 + 5
BMR = 1,637.5 kcal/ngày
```

BMR không phải lượng calo bạn bắt buộc phải ăn và không bao gồm đầy đủ hoạt động hằng ngày.

## 4. TDEE là gì?

TDEE (Total Daily Energy Expenditure) là tổng năng lượng cơ thể ước tính sử dụng trong một ngày, bao gồm hoạt động:

```text
TDEE = BMR × hệ số vận động
```

| Mức vận động       | Mô tả                               | Hệ số |
| ------------------ | ----------------------------------- | ----: |
| Ít vận động        | Công việc bàn giấy, ít tập luyện    |   1.2 |
| Vận động nhẹ       | Tập 1–3 buổi mỗi tuần               | 1.375 |
| Vận động vừa       | Tập 3–5 buổi mỗi tuần               |  1.55 |
| Vận động nhiều     | Tập 6–7 buổi mỗi tuần               | 1.725 |
| Vận động rất nhiều | Lao động nặng hoặc tập cường độ cao |   1.9 |

Ví dụ với BMR 1,637.5 và mức vận động vừa:

```text
TDEE = 1,637.5 × 1.55 ≈ 2,538 kcal/ngày
```

Nếu mức vận động bạn chọn cao hơn thực tế, TDEE có thể bị ước tính quá cao và ngược lại.

## 5. Mục tiêu calo được tính như thế nào?

CaloFlow dùng quy ước gần đúng:

```text
1kg thay đổi cân nặng ≈ 7,700 kcal
```

Đầu tiên, ứng dụng xác định chênh lệch cân nặng:

```text
Chênh lệch cân nặng = cân nặng mục tiêu - cân nặng hiện tại
```

- Số âm: mục tiêu giảm cân.
- Số dương: mục tiêu tăng cân.
- Bằng 0: mục tiêu duy trì.

Sau đó tính mức điều chỉnh calo mà thời gian bạn chọn yêu cầu:

```text
Điều chỉnh mỗi ngày = chênh lệch cân nặng × 7,700 / (số tuần × 7)
```

Mục tiêu sơ bộ:

```text
Calo mục tiêu = TDEE + điều chỉnh mỗi ngày
```

## 6. Các giới hạn thận trọng của ứng dụng

Để không trực tiếp đề xuất một kế hoạch quá gấp, CaloFlow giới hạn mức điều chỉnh:

```text
Giảm tối đa: -1,000 kcal/ngày
Tăng tối đa:   +500 kcal/ngày
```

Ứng dụng cũng không đặt mục tiêu calo thấp hơn BMR ước tính:

```text
Calo mục tiêu cuối = giá trị lớn hơn giữa BMR và mục tiêu sau điều chỉnh
```

Nếu thời gian bạn yêu cầu quá ngắn, CaloFlow sẽ:

1. giảm mức thâm hụt hoặc thặng dư về giới hạn trên;
2. giữ mục tiêu không thấp hơn BMR;
3. hiển thị cảnh báo kế hoạch đã được điều chỉnh;
4. tính lại thời gian ước tính phù hợp với mức điều chỉnh thực tế.

Các giới hạn này chỉ là quy tắc sản phẩm thận trọng, không bảo đảm phù hợp cho mọi cơ thể.

## 7. Tốc độ và thời gian ước tính

Sau khi có mức điều chỉnh cuối cùng:

```text
Thay đổi cân nặng mỗi tuần = điều chỉnh calo mỗi ngày × 7 / 7,700
```

Thời gian ước tính:

```text
Số tuần ước tính = |chênh lệch cân nặng / thay đổi cân nặng mỗi tuần|
```

Đây là mô hình tuyến tính đơn giản. Trong thực tế, cân nặng có thể dao động do nước, glycogen, tiêu hóa, hormone, thay đổi vận động và khả năng thích nghi của cơ thể.

## 8. Dữ liệu nào được tin cậy?

Để hạn chế sửa dữ liệu từ trình duyệt:

- browser chỉ gửi món ăn, khối lượng và loại bữa;
- server đọc lại dữ liệu dinh dưỡng của món từ database;
- PostgreSQL tính tổng calo và macro;
- server tự tính lại BMR, TDEE và mục tiêu calo trước khi lưu;
- mỗi tài khoản chỉ được đọc, thêm hoặc xóa dữ liệu của chính mình nhờ xác thực và Row Level Security.

## 9. Cách dùng kết quả hợp lý

- Cân hoặc ước lượng khẩu phần nhất quán.
- Ghi cả đồ uống, sốt, dầu và món ăn vặt nếu muốn theo dõi sát hơn.
- Chọn mức vận động dựa trên thói quen dài hạn, không chỉ một ngày tập nặng.
- Theo dõi xu hướng trong nhiều tuần thay vì kết luận từ một ngày hoặc một lần cân.
- Cập nhật cân nặng và mức vận động khi thói quen thay đổi đáng kể.

## 10. Lưu ý sức khỏe

CaloFlow hướng tới người trưởng thành khỏe mạnh và chỉ cung cấp số liệu tham khảo. Công thức không đánh giá thành phần cơ thể, thai kỳ, bệnh nền, thuốc đang dùng, rối loạn chuyển hóa, tiền sử rối loạn ăn uống hoặc nhu cầu của vận động viên chuyên nghiệp.

Hãy trao đổi với bác sĩ hoặc chuyên gia dinh dưỡng trước khi thay đổi chế độ ăn đáng kể, đặc biệt nếu bạn:

- đang mang thai hoặc cho con bú;
- dưới 18 tuổi;
- có bệnh nền hoặc đang dùng thuốc;
- có tiền sử rối loạn ăn uống;
- thấy mệt mỏi, chóng mặt hoặc các triệu chứng bất thường;
- cần kế hoạch phục vụ thi đấu hoặc điều trị.
