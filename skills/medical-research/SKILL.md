---
name: medical-research
description: Evidence-based medical writing protocol for OB/GYN research articles. Ensures citation standards, Level of Evidence grading, anti-hallucination rules, and clinical accuracy markers. Use when generating or reviewing medical content.
allowed-tools: Read, Write, Edit, Bash
version: 1.0
priority: HIGH
---

# Medical Research — Evidence-Based Writing Protocol

> **Bắt buộc** khi viết bài y khoa cho hệ thống RND Sản Phụ Khoa.

---

## 1. Evidence Grading — Oxford CEBM

Mỗi khuyến cáo/phác đồ trong bài **BẮT BUỘC** ghi Level of Evidence:

| Level | Loại bằng chứng | Ký hiệu trong bài |
|-------|-----------------|-------------------|
| **I** | Systematic Review / Meta-analysis / RCT lớn | `[LoE: I]` |
| **II** | RCT nhỏ / Cohort study chất lượng cao | `[LoE: II]` |
| **III** | Case-control study / Cohort hồi cứu | `[LoE: III]` |
| **IV** | Case series / Cross-sectional | `[LoE: IV]` |
| **V** | Expert opinion / Consensus | `[LoE: V]` |

**Quy tắc:**
- Mỗi bài bệnh lý (Tier 2) phải có **ít nhất 3 khuyến cáo có LoE**
- Mỗi bài kỹ thuật (Tier 3) phải có **ít nhất 2 khuyến cáo có LoE**
- Mỗi bài nền tảng (Tier 1) phải có **ít nhất 1 LoE**
- Ghi LoE **inline** ngay sau khuyến cáo, ví dụ: `Aspirin 150mg từ tuần 12 cho nhóm nguy cơ cao [LoE: I — ASPRE trial 2017]`

---

## 2. Citation Standard — Trích Dẫn Bắt Buộc

### Nguồn được chấp nhận (ưu tiên giảm dần)

| Ưu tiên | Nguồn | Ví dụ trích dẫn |
|---------|-------|-----------------|
| **P0** | Hướng dẫn BYT Việt Nam | `[BYT 2023 — Hướng dẫn Chẩn đoán và Điều trị]` |
| **P1** | ACOG Practice Bulletin | `[ACOG PB #234, 2024]` |
| **P1** | ASRM Committee Opinion | `[ASRM CO 2023]` |
| **P1** | ESHRE Guideline | `[ESHRE Guideline 2024]` |
| **P2** | WHO Recommendation | `[WHO 2023]` |
| **P2** | Cochrane Systematic Review | `[Cochrane 2023]` |
| **P3** | NICE / RCOG | `[NICE NG000, 2024]` |
| **P3** | Uptodate / Textbook chuẩn | `[Williams Obstetrics 26th Ed]` |

### Quy tắc trích dẫn

- Mỗi bài **BẮT BUỘC** có section `## TÀI LIỆU THAM KHẢO` ở cuối
- Mỗi bài bệnh lý (T2) phải trích **≥ 3 guideline khác nhau**
- Mỗi bài kỹ thuật (T3) phải trích **≥ 2 guideline**
- Mỗi bài nền tảng (T1) phải trích **≥ 2 guideline**
- Trích dẫn **inline** trong văn bản, ví dụ: `Theo ACOG PB #234 (2024), tỷ lệ thành công IVF ở phụ nữ > 40 tuổi là 15-20%`
- **KHÔNG** chấp nhận trích dẫn chung chung: ~~"Theo nghiên cứu"~~, ~~"Các chuyên gia cho rằng"~~

---

## 3. Anti-Hallucination Rules — Cấm Bịa

> 🔴 **CRITICAL:** Quy tắc tối quan trọng cho nội dung y khoa.

| Quy tắc | Mô tả | Ví dụ vi phạm |
|---------|-------|---------------|
| **Không bịa số liệu** | Không tự tạo tỷ lệ %, con số thống kê | ❌ "Tỷ lệ thành công 87.3%" (không nguồn) |
| **Không bịa thuốc** | Chỉ ghi thuốc có thật, đúng liều | ❌ Bịa biệt dược không tồn tại |
| **Không bịa guideline** | Chỉ trích dẫn guideline có thật | ❌ "ACOG PB #999" (không tồn tại) |
| **Không bịa nghiên cứu** | Không tạo tên tác giả/năm giả | ❌ "Theo Smith et al. (2024)..." (bịa) |
| **Khi không chắc → ghi rõ** | Ghi "Dữ liệu dao động..." hoặc dùng khoảng | ✅ "Tỷ lệ ~10-20% (tùy nghiên cứu)" |

### Cụm từ an toàn khi thiếu dữ liệu chính xác

```
✅ "Tỷ lệ dao động từ X-Y% tùy nghiên cứu"
✅ "Theo y văn, ước tính khoảng..."
✅ "Dữ liệu tại Việt Nam còn hạn chế, quốc tế báo cáo..."
✅ "Cần thêm nghiên cứu để xác nhận"
❌ "Chính xác XX.X%"  (khi không có nguồn cụ thể)
```

---

## 4. Clinical Safety Markers — Markup Y Khoa

Mỗi bài bệnh lý (T2) **BẮT BUỘC** có đủ 4 marker:

| Marker | Mục đích | Format |
|--------|---------|--------|
| `> 💊 GHI CHÚ LÂM SÀNG` | Lưu ý thực hành quan trọng nhất | Blockquote |
| `> ⚠️ CỜ ĐỎ` | Khi nào cần can thiệp khẩn / chuyển tuyến | Blockquote |
| `> 📚 THAM KHẢO` | Guideline chính cho chủ đề này | Blockquote |
| `> ⚕️ DISCLAIMER` | Cần chỉ định BS chuyên khoa | Blockquote cuối bài |

### Disclaimer bắt buộc (cuối mỗi bài)

```markdown
> ⚕️ **DISCLAIMER:** Nội dung bài viết chỉ mang tính chất tham khảo y khoa.
> Mọi quyết định chẩn đoán và điều trị **cần chỉ định của bác sĩ chuyên khoa**.
> Không tự ý áp dụng phác đồ khi chưa có đánh giá lâm sàng cụ thể.
```

---

## 5. Cross-Reference Protocol

### Liên kết giữa các bài

- Khi nhắc đến bệnh lý/kỹ thuật có bài riêng → **BẮT BUỘC ghi mã bài**
- Format: `→ Xem chi tiết: [VSN-04] Lạc nội mạc tử cung`
- Section `## CROSS-LINKS` phải liệt kê tất cả bài liên quan

### ICD-10

- Bài bệnh lý (T2) có mã ICD-10 → **BẮT BUỘC ghi trong header**
- Format: `> **ICD-10:** N97.0 | **Nhóm:** VSN`

---

## 6. Medical Writing Audit — 8 Chiều Đánh Giá

Khi review bài viết y khoa, chấm điểm 8 chiều (1-10):

| Chiều | Câu hỏi | Tiêu chuẩn đạt |
|-------|---------|----------------|
| **1. Evidence Quality** | Có LoE cho khuyến cáo chính? | ≥ 3 LoE markers |
| **2. Citation Depth** | Có trích dẫn guideline cụ thể? | ≥ 3 nguồn khác nhau |
| **3. Clinical Accuracy** | Liều thuốc, chỉ số đúng? | Không có sai sót y khoa |
| **4. Structure** | Đúng template, đủ section? | 100% sections có nội dung |
| **5. ICD-10 Compliance** | Có mã ICD-10 đúng? | Header có ICD-10 |
| **6. Safety Markers** | Có Cờ Đỏ, Disclaimer? | 4/4 markers |
| **7. Cross-References** | Có liên kết bài liên quan? | ≥ 2 cross-links |
| **8. Word Count** | Đủ độ dài tối thiểu? | T1≥1500, T2≥2000, T3≥1500 |

**Scoring:**
- **72-80:** Xuất sắc — publish ready
- **56-71:** Tốt — cần chỉnh nhẹ
- **40-55:** Trung bình — cần bổ sung bằng chứng
- **< 40:** Fail — viết lại

---

## 7. Template Enhancement Rules

Khi tạo bài mới, inject thêm các yêu cầu sau vào prompt:

### Cho bài bệnh lý (T2)

```
EVIDENCE-BASED REQUIREMENTS:
1. Mỗi khuyến cáo điều trị ghi [LoE: I-V] + nguồn
2. Section "CHẨN ĐOÁN" phải có bảng xét nghiệm với cột "Guideline nguồn"
3. Section "ĐIỀU TRỊ" phải trích dẫn phác đồ cụ thể (ACOG/BYT/ASRM)
4. Cuối bài có "## TÀI LIỆU THAM KHẢO" liệt kê ≥ 3 guideline
5. Cuối bài có DISCLAIMER y khoa
6. KHÔNG bịa số liệu — dùng khoảng ước tính khi thiếu dữ liệu chính xác
```

### Cho bài kỹ thuật (T3)

```
EVIDENCE-BASED REQUIREMENTS:
1. Mỗi bước quy trình ghi nguồn phác đồ (ASRM/ESHRE/BYT)
2. Bảng thuốc phải có cột "Guideline" 
3. Tỷ lệ thành công phải ghi nguồn + khoảng tin cậy
4. Cuối bài có "## TÀI LIỆU THAM KHẢO" ≥ 2 guideline
5. Cuối bài có DISCLAIMER y khoa
```

---

## Verification Script

Chạy sau khi sinh bài để kiểm tra chất lượng:

```bash
python3 ~/.gemini/antigravity/skills/medical-research/scripts/evidence_checker.py <output_dir>
```

Script kiểm tra: References, LoE markers, ICD-10, Disclaimer, word count, cross-links.

---

## Quick Diagnostic

| Câu hỏi | Nếu KHÔNG | Hành động |
|---------|-----------|-----------|
| Có section TÀI LIỆU THAM KHẢO? | Bài thiếu nguồn | Thêm ≥ 3 guideline |
| Có LoE cho khuyến cáo? | Không rõ độ tin cậy | Gán LoE I-V |
| Có ICD-10 trong header? | Thiếu mã hóa | Thêm ICD-10 |
| Có CỜ ĐỎ? | Thiếu cảnh báo lâm sàng | Thêm marker ⚠️ |
| Có DISCLAIMER? | Rủi ro pháp lý | Thêm disclaimer cuối bài |
| Số liệu có nguồn? | Nghi ngờ hallucination | Đổi sang khoảng ước tính |
