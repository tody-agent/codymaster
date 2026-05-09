# Industry Patterns — 20 Ngành Nghề

> Mỗi ngành có pattern sẵn. Agent đọc file này → match ngành → load config → customize.

---

## Pattern Format

```javascript
{
  key: string,              // unique identifier
  name: string,             // display name (Vietnamese)
  icon: string,             // emoji icon
  frequency: 'one-time' | 'recurring' | 'milestone' | 'course' | 'class',
  defaultInterval: string,  // e.g., '6m', '4w', 'per-milestone'
  
  // Milestones (for milestone-based industries)
  milestones: [{ week/month/day, title, desc, urgency }],
  
  // Reminder Config
  reminderAlarms: [{ trigger, description }],
  reminderContent: {
    preparation: string,    // what to prepare
    arriveEarly: string,    // arrive X minutes early
    fasting: boolean,       // need fasting?
    bringDocuments: string[],
    specialNotes: string
  },
  
  // Calendar Event Templates
  calendarTitleTemplate: string,  // '{service} — {clinicName}'
  calendarDescTemplate: string,   // multi-line with placeholders
  
  // Business Config  
  workingHours: { start, end, days[] },
  bookingFields: string[],       // form fields needed
  conversionValue: number,       // VND, estimated per appointment
  
  // Follow-up
  followUp: { interval, promptText, reBookingCTA }
}
```

---

## 1. 🏥 Sản Phụ Khoa (OB/GYN)

| Config | Value |
|--------|-------|
| `key` | `obgyn` |
| `frequency` | `milestone` |
| `defaultInterval` | Per gestational week |
| `conversionValue` | 500,000 VND |

**Milestones:**

| Week | Title | Description | Urgency |
|------|-------|-------------|---------|
| 8 | Khám thai lần đầu | Siêu âm xác nhận tim thai, xét nghiệm máu cơ bản | recommended |
| 12 | Sàng lọc quý 1 (Gold Milestone) | Double Test, đo độ mờ da gáy NT | critical |
| 16 | Khám định kỳ quý 2 | Triple Test (nếu cần), theo dõi phát triển thai | recommended |
| 20 | Siêu âm hình thái | Siêu âm 4D kiểm tra cấu trúc thai nhi | critical |
| 24 | Nghiệm pháp đường huyết | Xét nghiệm tiểu đường thai kỳ OGTT 75g | critical |
| 28 | Khám đầu quý 3 | Tiêm phòng uốn ván, xét nghiệm máu lần 2 | recommended |
| 32 | Siêu âm tăng trưởng | Đánh giá cân nặng thai, vị trí nhau thai | recommended |
| 34 | Tiêm Tdap | Vaccine ho gà cho mẹ, bảo vệ bé sơ sinh | recommended |
| 36 | Khám tiền sản | Xét nghiệm GBS, đánh giá ngôi thai, kế hoạch sinh | critical |
| 37 | Theo dõi hàng tuần | Monitor tim thai NST, kiểm tra cổ tử cung | monitoring |
| 38 | Theo dõi hàng tuần | NST, đánh giá nước ối, chuẩn bị sinh | monitoring |
| 39 | Theo dõi hàng tuần | Quyết định chờ sinh hay can thiệp | monitoring |
| 40 | Ngày dự sinh | Đánh giá tình trạng, quyết định phương pháp sinh | critical |

**Reminder Content:**
- Preparation: "Mang theo sổ khám thai, kết quả xét nghiệm gần nhất"
- Arrive early: 15 phút
- Fasting: Có (cho xét nghiệm máu ở tuần 8, 24, 28)
- Documents: Sổ khám thai, CCCD/CMND, Thẻ BHYT
- Special: "Uống nhiều nước trước siêu âm"

**Reminder Timing:** 1 ngày + 2 giờ trước

---

## 2. 🦷 Nha Khoa (Dental)

| Config | Value |
|--------|-------|
| `key` | `dental` |
| `frequency` | `recurring` |
| `defaultInterval` | `6m` (6 tháng) |
| `conversionValue` | 300,000 VND |

**Reminder Content:**
- Preparation: "Đánh răng kỹ trước khi đến"
- Arrive early: 10 phút
- Fasting: Không (trừ nhổ răng có gây mê → nhịn ăn 6h)
- Documents: CCCD, Thẻ BHYT (nếu có)
- Special: "Không uống cà phê/trà đậm ngày đó"

**Follow-up:** Sau 6 tháng → "Đã đến lịch lấy cao răng định kỳ"

**Reminder Timing:** 1 ngày + 2 giờ trước

---

## 3. 👶 Nhi Khoa (Pediatrics)

| Config | Value |
|--------|-------|
| `key` | `pediatrics` |
| `frequency` | `milestone` |
| `defaultInterval` | Theo lịch tiêm chủng |
| `conversionValue` | 400,000 VND |

**Milestones (Lịch tiêm chủng mở rộng):**

| Tháng tuổi | Title | Vaccine |
|-------------|-------|---------|
| 0 | Sơ sinh | BCG + Viêm gan B mũi 1 |
| 2 | 2 tháng | 5in1/6in1 mũi 1 + Rota mũi 1 |
| 3 | 3 tháng | 5in1/6in1 mũi 2 + Rota mũi 2 |
| 4 | 4 tháng | 5in1/6in1 mũi 3 + Rota mũi 3 |
| 6 | 6 tháng | Cúm mũi 1 |
| 9 | 9 tháng | Sởi mũi 1 |
| 12 | 12 tháng | MMR mũi 1 + Thủy đậu mũi 1 |
| 15 | 15 tháng | Viêm não Nhật Bản mũi 1 |
| 18 | 18 tháng | 5in1/6in1 nhắc lại |
| 24 | 24 tháng | Viêm não NB mũi 2 |
| 48 | 4 tuổi | MMR mũi 2 + DPT nhắc |

**Reminder Content:**
- Preparation: "Bé khỏe mạnh, không sốt. Mang sổ tiêm chủng"
- Arrive early: 15 phút
- Fasting: Không
- Documents: Sổ tiêm chủng, giấy khai sinh, BHYT bé
- Special: "Cho bé ăn nhẹ trước 30 phút. Mang thêm 1 bộ quần áo dự phòng"

**Reminder Timing:** 2 ngày + 2 giờ trước (cần chuẩn bị sức khỏe bé)

---

## 4. 👁️ Nhãn Khoa (Ophthalmology)

| Config | Value |
|--------|-------|
| `key` | `ophthalmology` |
| `frequency` | `recurring` |
| `defaultInterval` | `12m` (1 năm) |
| `conversionValue` | 350,000 VND |

**Reminder Content:**
- Preparation: "Mang theo kính đang dùng (nếu có)"
- Arrive early: 10 phút
- Fasting: Không
- Documents: Kết quả đo mắt lần trước
- Special: "Không đeo kính áp tròng 24h trước khám. Có người đưa về nếu tra thuốc giãn đồng tử"

**Reminder Timing:** 1 ngày + 2 giờ trước

---

## 5. 💆 Spa / Thẩm Mỹ (Beauty/Spa)

| Config | Value |
|--------|-------|
| `key` | `spa` |
| `frequency` | `course` |
| `defaultInterval` | Liệu trình X buổi (7-14 ngày/buổi) |
| `conversionValue` | 800,000 VND |

**Reminder Content:**
- Preparation: "Rửa mặt sạch, không make-up trước khi đến"
- Arrive early: 10 phút (thay đồ)
- Fasting: Không
- Documents: Thẻ liệu trình (nếu có)
- Special: "Tránh nắng 24h sau trị liệu. Uống đủ nước"

**Follow-up:**
- Sau mỗi buổi → "Buổi tiếp theo: [date]"
- Hết liệu trình → "Tái khám đánh giá kết quả sau 1 tháng"

**Reminder Timing:** 1 ngày + 3 giờ trước

---

## 6. 🏋️ Gym / Fitness

| Config | Value |
|--------|-------|
| `key` | `gym` |
| `frequency` | `recurring` |
| `defaultInterval` | `weekly` (2-4 buổi/tuần) |
| `conversionValue` | 200,000 VND |

**Reminder Content:**
- Preparation: "Mang đồ tập, khăn, bình nước"
- Arrive early: 10 phút (thay đồ + warm-up)
- Fasting: Không (ăn nhẹ trước 1h)
- Documents: Thẻ thành viên
- Special: "Bài tập hôm nay: {workout_type}. Ăn nhẹ trước 1 tiếng"

**Reminder Timing:** 2 giờ trước

---

## 7. 🎓 Giáo Dục / Trung Tâm (Education)

| Config | Value |
|--------|-------|
| `key` | `education` |
| `frequency` | `class` |
| `defaultInterval` | Per term/semester |
| `conversionValue` | 1,000,000 VND |

**Reminder Content:**
- Preparation: "Mang sách + vở + bút theo môn {subject}"
- Arrive early: 5 phút
- Fasting: N/A
- Documents: Thẻ học viên
- Special: "Bài tập về nhà: {homework_note}"

**Follow-up:** Nhắc đóng học phí kỳ tiếp theo trước 1 tuần

**Reminder Timing:** 1 ngày + 1 giờ trước

---

## 8. 🏡 Bất Động Sản (Real Estate)

| Config | Value |
|--------|-------|
| `key` | `realestate` |
| `frequency` | `one-time` |
| `defaultInterval` | N/A |
| `conversionValue` | 5,000,000 VND (lead value) |

**Reminder Content:**
- Preparation: "Chuẩn bị câu hỏi về pháp lý, quy hoạch"
- Arrive early: 10 phút
- Fasting: N/A
- Documents: CCCD/CMND, Sổ hộ khẩu, Giấy xác nhận tài chính
- Special: "Địa chỉ dự án: {project_address}. Mang áo thoáng mát nếu đi thực tế"

**Follow-up:** Sau 3 ngày → "Anh/chị đã cân nhắc? Có cần tư vấn thêm?"

**Reminder Timing:** 1 ngày + 3 giờ trước

---

## 9. 🚗 Gara / Auto Service

| Config | Value |
|--------|-------|
| `key` | `auto` |
| `frequency` | `recurring` |
| `defaultInterval` | `6m` hoặc per 5,000km |
| `conversionValue` | 1,500,000 VND |

**Reminder Content:**
- Preparation: "Kiểm tra ODO hiện tại, ghi chú tiếng ồn lạ (nếu có)"
- Arrive early: 10 phút
- Fasting: N/A
- Documents: Giấy đăng kiểm, sổ bảo dưỡng
- Special: "ODO hiện tại: ___km. Hạng mục: Thay dầu + lọc gió + kiểm tra phanh"

**Follow-up:** Sau 5,000km hoặc 6 tháng → "Đã đến lịch bảo dưỡng tiếp theo"

**Reminder Timing:** 2 ngày + 3 giờ trước

---

## 10. 🐾 Thú Y (Veterinary)

| Config | Value |
|--------|-------|
| `key` | `veterinary` |
| `frequency` | `milestone` |
| `defaultInterval` | Theo lịch vaccine + tẩy giun |
| `conversionValue` | 300,000 VND |

**Milestones:**

| Tháng tuổi | Title | Description |
|-------------|-------|-------------|
| 2 | Vaccine 5/7 bệnh mũi 1 | + Tẩy giun lần 1 |
| 3 | Vaccine 5/7 bệnh mũi 2 | + Kiểm tra sức khỏe |
| 4 | Vaccine dại | Mũi đầu tiên |
| 6 | Triệt sản | Tư vấn triệt sản (nếu cần) |
| 12 | Vaccine nhắc hàng năm | Nhắc vaccine + tẩy giun |

**Reminder Content:**
- Preparation: "Không cho thú cưng ăn 2h trước. Đeo rọ mõm cho chó lớn"
- Arrive early: 10 phút
- Documents: Sổ vaccine thú cưng
- Special: "Mang mẫu phân nếu nghi tẩy giun"

**Reminder Timing:** 1 ngày + 2 giờ trước

---

## 11. ⚖️ Luật Sư / Tư Vấn Pháp Lý (Legal)

| Config | Value |
|--------|-------|
| `key` | `legal` |
| `frequency` | `one-time` |
| `defaultInterval` | N/A (follow-up as needed) |
| `conversionValue` | 2,000,000 VND |

**Reminder Content:**
- Preparation: "Chuẩn bị đầy đủ hồ sơ liên quan đến vụ việc"
- Arrive early: 15 phút
- Documents: CCCD, Hợp đồng gốc, Tài liệu chứng cứ, Biên lai phí
- Special: "Viết sẵn timeline sự việc để tư vấn nhanh hơn"

**Reminder Timing:** 1 ngày + 3 giờ trước

---

## 12. 🍽️ Nhà Hàng / F&B (Restaurant)

| Config | Value |
|--------|-------|
| `key` | `restaurant` |
| `frequency` | `one-time` |
| `defaultInterval` | N/A |
| `conversionValue` | 500,000 VND |

**Reminder Content:**
- Preparation: "Bàn đã được giữ cho {guest_count} người"
- Arrive early: Đúng giờ
- Documents: N/A
- Special: "Menu đặc biệt hôm nay: {special_menu}. Có yêu cầu dị ứng thực phẩm?"

**Follow-up:** Sau bữa ăn → "Cảm ơn quý khách! Đánh giá trên Google Maps?"

**Reminder Timing:** 3 giờ + 30 phút trước

---

## 13. 💇 Salon / Tóc (Hair Salon)

| Config | Value |
|--------|-------|
| `key` | `salon` |
| `frequency` | `recurring` |
| `defaultInterval` | `4w` - `6w` (4-6 tuần) |
| `conversionValue` | 250,000 VND |

**Reminder Content:**
- Preparation: "Gội đầu sạch trước khi đến (nếu nhuộm/uốn)"
- Arrive early: 5 phút
- Documents: N/A
- Special: "Dịch vụ: {service}. Mang ảnh mẫu nếu muốn kiểu tóc mới"

**Follow-up:** Sau 4-6 tuần → "Đã đến lúc refresh tóc rồi!"

**Reminder Timing:** 1 ngày + 2 giờ trước

---

## 14. 🧘 Yoga / Wellness

| Config | Value |
|--------|-------|
| `key` | `yoga` |
| `frequency` | `class` |
| `defaultInterval` | `weekly` (2-3 buổi/tuần) |
| `conversionValue` | 150,000 VND |

**Reminder Content:**
- Preparation: "Mang thảm yoga, khăn, bình nước"
- Arrive early: 10 phút (thay đồ + hít thở)
- Fasting: Không ăn nặng 2h trước
- Documents: Thẻ thành viên
- Special: "Lớp hôm nay: {class_type}. Level: {level}"

**Reminder Timing:** 3 giờ + 30 phút trước

---

## 15. 📸 Studio / Photography

| Config | Value |
|--------|-------|
| `key` | `photography` |
| `frequency` | `one-time` |
| `defaultInterval` | N/A (session-based) |
| `conversionValue` | 2,000,000 VND |

**Reminder Content:**
- Preparation: "Chuẩn bị 2-3 bộ trang phục. Trang điểm nhẹ hoặc để studio make-up"
- Arrive early: 15 phút (thay đồ + trao đổi concept)
- Documents: N/A
- Special: "Concept: {shoot_concept}. Mang thêm phụ kiện cá nhân (nón, khăn, hoa...)"

**Follow-up:** Sau 5-7 ngày → "Ảnh đã xong! Link xem ảnh: {gallery_url}"

**Reminder Timing:** 1 ngày + 3 giờ trước

---

## 16. 🏨 Hotel / Travel

| Config | Value |
|--------|-------|
| `key` | `hotel` |
| `frequency` | `one-time` |
| `defaultInterval` | N/A |
| `conversionValue` | 1,500,000 VND |

**Reminder Content:**
- Preparation: "Check-in từ 14:00. Mang CCCD/Passport"
- Arrive early: N/A
- Documents: CCCD/Passport, Booking confirmation
- Special: "Phòng: {room_type}. Yêu cầu đặc biệt: {special_request}"

**Follow-up:** Sau check-out → "Cảm ơn quý khách! Đánh giá trải nghiệm?"

**Reminder Timing:** 1 ngày + 3 giờ trước

---

## 17. 👨‍⚕️ Đa Khoa / Nội Khoa (General Medicine)

| Config | Value |
|--------|-------|
| `key` | `general_medicine` |
| `frequency` | `recurring` |
| `defaultInterval` | `3m` - `6m` (checkup) |
| `conversionValue` | 500,000 VND |

**Reminder Content:**
- Preparation: "NHỊN ĂN trước 8-12 giờ (nếu lấy máu xét nghiệm)"
- Arrive early: 15 phút (đăng ký + đo huyết áp)
- Documents: CCCD, BHYT, kết quả xét nghiệm cũ, đơn thuốc đang dùng
- Special: "Ghi lại triệu chứng gần đây, thuốc đang uống"

**Reminder Timing:** 1 ngày + 2 giờ trước (nhắc nhịn ăn tối hôm trước)

---

## 18. 🧠 Tâm Lý / Therapy

| Config | Value |
|--------|-------|
| `key` | `therapy` |
| `frequency` | `recurring` |
| `defaultInterval` | `1w` - `2w` (hàng tuần/2 tuần) |
| `conversionValue` | 800,000 VND |

**Reminder Content:**
- Preparation: "Dành 10 phút suy nghĩ về tuần vừa qua"
- Arrive early: 5 phút
- Documents: N/A
- Special: "Phiên tư vấn của bạn hoàn toàn bảo mật. Ghi chú cảm xúc nổi bật trong tuần"

> ⚠️ **Privacy note:** Calendar event description KHÔNG chứa chi tiết nhạy cảm. Chỉ ghi "Phiên tư vấn tại {clinicName}"

**Reminder Timing:** 1 ngày + 1 giờ trước

---

## 19. 💼 Coworking / Meeting Room

| Config | Value |
|--------|-------|
| `key` | `coworking` |
| `frequency` | `one-time` |
| `defaultInterval` | N/A (event-based) |
| `conversionValue` | 500,000 VND |

**Reminder Content:**
- Preparation: "Phòng họp: {room_name}, sức chứa {capacity} người"
- Arrive early: 10 phút (setup)
- Documents: N/A
- Special: "Thiết bị sẵn: projector, whiteboard, wifi. Link online: {meeting_url}"

**Reminder Timing:** 1 ngày + 1 giờ + 15 phút trước

---

## 20. 🎶 Music / Dance Class

| Config | Value |
|--------|-------|
| `key` | `music_dance` |
| `frequency` | `class` |
| `defaultInterval` | `weekly` (1-2 buổi/tuần) |
| `conversionValue` | 200,000 VND |

**Reminder Content:**
- Preparation: "Mang theo nhạc cụ: {instrument}. Tập bài: {song_name}"
- Arrive early: 5 phút (tune nhạc cụ)
- Documents: Sách/sheet nhạc
- Special: "Lớp hôm nay: {class_topic}. Giáo viên: {teacher_name}"

**Follow-up:** Sau mỗi kỳ thi/biểu diễn → "Chúc mừng! Đăng ký level tiếp theo?"

**Reminder Timing:** 2 giờ + 30 phút trước

---

## Quick Reference: Industry → Key Config

| # | Industry | Key | Frequency | Interval | Conversion VND |
|---|----------|-----|-----------|----------|----------------|
| 1 | Sản phụ khoa | `obgyn` | milestone | per-week | 500K |
| 2 | Nha khoa | `dental` | recurring | 6 months | 300K |
| 3 | Nhi khoa | `pediatrics` | milestone | vaccine schedule | 400K |
| 4 | Nhãn khoa | `ophthalmology` | recurring | 12 months | 350K |
| 5 | Spa/Thẩm mỹ | `spa` | course | 7-14 days | 800K |
| 6 | Gym/Fitness | `gym` | recurring | weekly | 200K |
| 7 | Giáo dục | `education` | class | per term | 1,000K |
| 8 | Bất động sản | `realestate` | one-time | N/A | 5,000K |
| 9 | Gara/Auto | `auto` | recurring | 6m/5000km | 1,500K |
| 10 | Thú y | `veterinary` | milestone | vaccine | 300K |
| 11 | Luật sư | `legal` | one-time | N/A | 2,000K |
| 12 | Nhà hàng | `restaurant` | one-time | N/A | 500K |
| 13 | Salon/Tóc | `salon` | recurring | 4-6 weeks | 250K |
| 14 | Yoga | `yoga` | class | weekly | 150K |
| 15 | Studio | `photography` | one-time | session | 2,000K |
| 16 | Hotel | `hotel` | one-time | N/A | 1,500K |
| 17 | Đa khoa | `general_medicine` | recurring | 3-6 months | 500K |
| 18 | Tâm lý | `therapy` | recurring | 1-2 weeks | 800K |
| 19 | Coworking | `coworking` | one-time | event | 500K |
| 20 | Music/Dance | `music_dance` | class | weekly | 200K |
