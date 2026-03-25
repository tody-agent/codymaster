/**
 * Reminder Configuration v1.0
 * 20 Industry presets for booking-calendar skill
 * 
 * Usage:
 *   const config = INDUSTRY_PATTERNS['obgyn'];
 *   const engine = new BookingCalendarEngine({ ...config, clinicName, clinicAddress });
 */

// ============================================================
// INDUSTRY PATTERNS — 20 Presets
// ============================================================

const INDUSTRY_PATTERNS = {

    // ── 1. Sản Phụ Khoa ──
    obgyn: {
        key: 'obgyn',
        name: 'Sản phụ khoa',
        icon: '🏥',
        frequency: 'milestone',
        defaultInterval: 'per-milestone',
        milestones: [
            { week: 8, title: 'Khám thai lần đầu', desc: 'Siêu âm xác nhận tim thai, xét nghiệm máu cơ bản', urgency: 'recommended' },
            { week: 12, title: 'Sàng lọc quý 1', desc: 'Double Test, đo độ mờ da gáy NT', urgency: 'critical' },
            { week: 16, title: 'Khám định kỳ quý 2', desc: 'Triple Test (nếu cần), theo dõi phát triển thai', urgency: 'recommended' },
            { week: 20, title: 'Siêu âm hình thái', desc: 'Siêu âm 4D kiểm tra cấu trúc thai nhi', urgency: 'critical' },
            { week: 24, title: 'Nghiệm pháp đường huyết', desc: 'Xét nghiệm tiểu đường thai kỳ OGTT 75g', urgency: 'critical' },
            { week: 28, title: 'Khám đầu quý 3', desc: 'Tiêm phòng uốn ván, xét nghiệm máu lần 2', urgency: 'recommended' },
            { week: 32, title: 'Siêu âm tăng trưởng', desc: 'Đánh giá cân nặng thai, vị trí nhau thai', urgency: 'recommended' },
            { week: 34, title: 'Tiêm Tdap', desc: 'Vaccine ho gà cho mẹ, bảo vệ bé sơ sinh', urgency: 'recommended' },
            { week: 36, title: 'Khám tiền sản', desc: 'Xét nghiệm GBS, đánh giá ngôi thai, kế hoạch sinh', urgency: 'critical' },
            { week: 37, title: 'Theo dõi hàng tuần', desc: 'Monitor tim thai NST, kiểm tra cổ tử cung', urgency: 'monitoring' },
            { week: 38, title: 'Theo dõi hàng tuần', desc: 'NST, đánh giá nước ối, chuẩn bị sinh', urgency: 'monitoring' },
            { week: 39, title: 'Theo dõi hàng tuần', desc: 'Quyết định chờ sinh hay can thiệp', urgency: 'monitoring' },
            { week: 40, title: 'Ngày dự sinh', desc: 'Đánh giá tình trạng, quyết định phương pháp sinh', urgency: 'critical' },
        ],
        reminderAlarms: [
            { trigger: '-P1D', description: 'Nhắc: Ngày mai khám thai — {title} tại {clinicName}' },
            { trigger: '-PT2H', description: 'Lịch khám hôm nay: {title} lúc {time}' },
        ],
        reminderContent: {
            preparation: 'Mang theo sổ khám thai, kết quả xét nghiệm gần nhất',
            arriveEarly: '15 phút',
            fasting: true, // cho xét nghiệm máu
            bringDocuments: ['Sổ khám thai', 'CCCD/CMND', 'Thẻ BHYT'],
            specialNotes: 'Uống nhiều nước trước siêu âm',
        },
        calendarTitleTemplate: '{service} — {clinicName}',
        calendarDescTemplate: '{desc}\n\n📍 {clinicName}\n📌 {address}\n📞 {phone}\n🗺️ {mapsUrl}',
        workingHours: { start: '08:00', end: '17:00', days: [1, 2, 3, 4, 5, 6] },
        bookingFields: ['phone', 'name', 'lmpDate', 'service', 'timeSlot', 'note'],
        conversionValue: 500000,
        followUp: { interval: 'per-milestone', promptText: 'Đã đến lịch khám thai tiếp theo' },
    },

    // ── 2. Nha Khoa ──
    dental: {
        key: 'dental',
        name: 'Nha khoa',
        icon: '🦷',
        frequency: 'recurring',
        defaultInterval: '6m',
        milestones: [],
        reminderAlarms: [
            { trigger: '-P1D', description: 'Nhắc: Ngày mai lịch khám nha khoa tại {clinicName}' },
            { trigger: '-PT2H', description: 'Lịch khám nha khoa hôm nay lúc {time}' },
        ],
        reminderContent: {
            preparation: 'Đánh răng kỹ trước khi đến',
            arriveEarly: '10 phút',
            fasting: false,
            bringDocuments: ['CCCD', 'Thẻ BHYT (nếu có)'],
            specialNotes: 'Không uống cà phê/trà đậm ngày khám',
        },
        calendarTitleTemplate: '{service} — {clinicName}',
        calendarDescTemplate: '{desc}\n\n📍 {clinicName}\n📌 {address}\n📞 {phone}\n🗺️ {mapsUrl}',
        workingHours: { start: '08:00', end: '18:00', days: [1, 2, 3, 4, 5, 6] },
        bookingFields: ['phone', 'name', 'date', 'timeSlot', 'service', 'note'],
        conversionValue: 300000,
        followUp: { interval: '6m', promptText: 'Đã đến lịch lấy cao răng định kỳ (6 tháng)' },
    },

    // ── 3. Nhi Khoa ──
    pediatrics: {
        key: 'pediatrics',
        name: 'Nhi khoa',
        icon: '👶',
        frequency: 'milestone',
        defaultInterval: 'per-milestone',
        milestones: [
            { month: 0, title: 'Tiêm sơ sinh', desc: 'BCG + Viêm gan B mũi 1', urgency: 'critical' },
            { month: 2, title: 'Tiêm 2 tháng', desc: '5in1/6in1 mũi 1 + Rota mũi 1', urgency: 'critical' },
            { month: 3, title: 'Tiêm 3 tháng', desc: '5in1/6in1 mũi 2 + Rota mũi 2', urgency: 'critical' },
            { month: 4, title: 'Tiêm 4 tháng', desc: '5in1/6in1 mũi 3 + Rota mũi 3', urgency: 'critical' },
            { month: 6, title: 'Tiêm 6 tháng', desc: 'Cúm mũi 1', urgency: 'recommended' },
            { month: 9, title: 'Tiêm 9 tháng', desc: 'Sởi mũi 1', urgency: 'critical' },
            { month: 12, title: 'Tiêm 12 tháng', desc: 'MMR mũi 1 + Thủy đậu mũi 1', urgency: 'critical' },
            { month: 15, title: 'Tiêm 15 tháng', desc: 'Viêm não Nhật Bản mũi 1', urgency: 'recommended' },
            { month: 18, title: 'Nhắc 18 tháng', desc: '5in1/6in1 nhắc lại', urgency: 'recommended' },
            { month: 24, title: 'Tiêm 24 tháng', desc: 'Viêm não NB mũi 2', urgency: 'recommended' },
            { month: 48, title: 'Tiêm 4 tuổi', desc: 'MMR mũi 2 + DPT nhắc lại', urgency: 'recommended' },
        ],
        reminderAlarms: [
            { trigger: '-P2D', description: 'Nhắc: 2 ngày nữa bé tiêm vaccine — {title}' },
            { trigger: '-PT2H', description: 'Hôm nay bé tiêm vaccine: {title} lúc {time}' },
        ],
        reminderContent: {
            preparation: 'Bé khỏe mạnh, không sốt. Mang sổ tiêm chủng',
            arriveEarly: '15 phút',
            fasting: false,
            bringDocuments: ['Sổ tiêm chủng', 'Giấy khai sinh', 'BHYT bé'],
            specialNotes: 'Cho bé ăn nhẹ trước 30 phút. Mang thêm 1 bộ quần áo dự phòng',
        },
        calendarTitleTemplate: '{service} — {clinicName}',
        calendarDescTemplate: '{desc}\n\nChuẩn bị: Bé khỏe, mang sổ tiêm\n📍 {clinicName}\n📌 {address}\n📞 {phone}',
        workingHours: { start: '08:00', end: '17:00', days: [1, 2, 3, 4, 5, 6] },
        bookingFields: ['phone', 'parentName', 'babyName', 'babyDOB', 'service', 'note'],
        conversionValue: 400000,
        followUp: { interval: 'per-milestone', promptText: 'Đã đến lịch tiêm vaccine cho bé' },
    },

    // ── 4. Nhãn Khoa ──
    ophthalmology: {
        key: 'ophthalmology',
        name: 'Nhãn khoa',
        icon: '👁️',
        frequency: 'recurring',
        defaultInterval: '12m',
        milestones: [],
        reminderAlarms: [
            { trigger: '-P1D', description: 'Nhắc: Ngày mai khám mắt tại {clinicName}' },
            { trigger: '-PT2H', description: 'Lịch khám mắt hôm nay lúc {time}' },
        ],
        reminderContent: {
            preparation: 'Mang theo kính đang dùng (nếu có)',
            arriveEarly: '10 phút',
            fasting: false,
            bringDocuments: ['Kết quả đo mắt lần trước'],
            specialNotes: 'Không đeo kính áp tròng 24h trước khám. Có người đưa về nếu tra thuốc giãn đồng tử',
        },
        calendarTitleTemplate: '{service} — {clinicName}',
        calendarDescTemplate: '{desc}\n\n⚠️ Không đeo kính áp tròng 24h trước\n📍 {clinicName}\n📌 {address}',
        workingHours: { start: '08:00', end: '17:00', days: [1, 2, 3, 4, 5, 6] },
        bookingFields: ['phone', 'name', 'date', 'timeSlot', 'service', 'note'],
        conversionValue: 350000,
        followUp: { interval: '12m', promptText: 'Đã đến lịch kiểm tra mắt định kỳ (1 năm)' },
    },

    // ── 5. Spa / Thẩm Mỹ ──
    spa: {
        key: 'spa',
        name: 'Spa / Thẩm mỹ',
        icon: '💆',
        frequency: 'course',
        defaultInterval: '14d',
        milestones: [],
        reminderAlarms: [
            { trigger: '-P1D', description: 'Nhắc: Ngày mai buổi trị liệu tại {clinicName}' },
            { trigger: '-PT3H', description: 'Buổi trị liệu hôm nay lúc {time} — rửa mặt sạch trước nhé!' },
        ],
        reminderContent: {
            preparation: 'Rửa mặt sạch, không make-up trước khi đến',
            arriveEarly: '10 phút (thay đồ)',
            fasting: false,
            bringDocuments: ['Thẻ liệu trình (nếu có)'],
            specialNotes: 'Tránh nắng 24h sau trị liệu. Uống đủ nước',
        },
        calendarTitleTemplate: '{service} — {clinicName}',
        calendarDescTemplate: '{desc}\n\n✨ Nhớ rửa mặt sạch!\n📍 {clinicName}\n📌 {address}',
        workingHours: { start: '09:00', end: '20:00', days: [1, 2, 3, 4, 5, 6, 0] },
        bookingFields: ['phone', 'name', 'date', 'timeSlot', 'service', 'courseSession', 'note'],
        conversionValue: 800000,
        followUp: { interval: 'per-course', promptText: 'Buổi trị liệu tiếp theo' },
    },

    // ── 6. Gym / Fitness ──
    gym: {
        key: 'gym',
        name: 'Gym / Fitness',
        icon: '🏋️',
        frequency: 'recurring',
        defaultInterval: 'weekly',
        milestones: [],
        reminderAlarms: [
            { trigger: '-PT2H', description: 'Buổi tập hôm nay lúc {time} — mang đồ tập!' },
        ],
        reminderContent: {
            preparation: 'Mang đồ tập, khăn, bình nước',
            arriveEarly: '10 phút (thay đồ + warm-up)',
            fasting: false,
            bringDocuments: ['Thẻ thành viên'],
            specialNotes: 'Ăn nhẹ trước 1 tiếng',
        },
        calendarTitleTemplate: '{service} — {clinicName}',
        calendarDescTemplate: 'Buổi tập: {desc}\n🏋️ Mang đồ tập, khăn, nước\n📍 {clinicName}',
        workingHours: { start: '06:00', end: '22:00', days: [1, 2, 3, 4, 5, 6, 0] },
        bookingFields: ['phone', 'name', 'date', 'timeSlot', 'trainerName', 'note'],
        conversionValue: 200000,
        followUp: { interval: 'weekly', promptText: 'Buổi tập tuần này' },
    },

    // ── 7. Giáo Dục ──
    education: {
        key: 'education',
        name: 'Giáo dục / Trung tâm',
        icon: '🎓',
        frequency: 'class',
        defaultInterval: 'per-term',
        milestones: [],
        reminderAlarms: [
            { trigger: '-P1D', description: 'Nhắc: Ngày mai có lớp {title}' },
            { trigger: '-PT1H', description: 'Lớp {title} bắt đầu sau 1 giờ' },
        ],
        reminderContent: {
            preparation: 'Mang sách + vở + bút theo môn',
            arriveEarly: '5 phút',
            fasting: false,
            bringDocuments: ['Thẻ học viên'],
            specialNotes: '',
        },
        calendarTitleTemplate: '{service} — {clinicName}',
        calendarDescTemplate: 'Lớp: {desc}\n📍 {clinicName}\n📌 {address}',
        workingHours: { start: '08:00', end: '21:00', days: [1, 2, 3, 4, 5, 6, 0] },
        bookingFields: ['phone', 'name', 'studentName', 'course', 'note'],
        conversionValue: 1000000,
        followUp: { interval: 'per-term', promptText: 'Nhắc đóng học phí kỳ tiếp theo' },
    },

    // ── 8. Bất Động Sản ──
    realestate: {
        key: 'realestate',
        name: 'Bất động sản',
        icon: '🏡',
        frequency: 'one-time',
        defaultInterval: null,
        milestones: [],
        reminderAlarms: [
            { trigger: '-P1D', description: 'Nhắc: Ngày mai xem dự án — mang CMND!' },
            { trigger: '-PT3H', description: 'Buổi xem dự án lúc {time} — chuẩn bị câu hỏi' },
        ],
        reminderContent: {
            preparation: 'Chuẩn bị câu hỏi về pháp lý, quy hoạch',
            arriveEarly: '10 phút',
            fasting: false,
            bringDocuments: ['CCCD/CMND', 'Sổ hộ khẩu', 'Giấy xác nhận tài chính'],
            specialNotes: 'Mang áo thoáng mát nếu đi xem thực tế',
        },
        calendarTitleTemplate: 'Xem dự án — {clinicName}',
        calendarDescTemplate: '{desc}\n\n📄 Mang CMND, xác nhận tài chính\n📍 {address}\n🗺️ {mapsUrl}',
        workingHours: { start: '08:00', end: '18:00', days: [1, 2, 3, 4, 5, 6, 0] },
        bookingFields: ['phone', 'name', 'budget', 'projectInterest', 'date', 'timeSlot', 'note'],
        conversionValue: 5000000,
        followUp: { interval: '3d', promptText: 'Anh/chị đã cân nhắc? Cần tư vấn thêm không?' },
    },

    // ── 9. Gara / Auto Service ──
    auto: {
        key: 'auto',
        name: 'Gara / Auto',
        icon: '🚗',
        frequency: 'recurring',
        defaultInterval: '6m',
        milestones: [],
        reminderAlarms: [
            { trigger: '-P2D', description: 'Nhắc: 2 ngày nữa bảo dưỡng xe tại {clinicName}' },
            { trigger: '-PT3H', description: 'Hôm nay bảo dưỡng xe lúc {time}' },
        ],
        reminderContent: {
            preparation: 'Kiểm tra ODO hiện tại, ghi chú tiếng ồn lạ (nếu có)',
            arriveEarly: '10 phút',
            fasting: false,
            bringDocuments: ['Giấy đăng kiểm', 'Sổ bảo dưỡng'],
            specialNotes: 'Hạng mục: Thay dầu + lọc gió + kiểm tra phanh',
        },
        calendarTitleTemplate: 'Bảo dưỡng xe — {clinicName}',
        calendarDescTemplate: '{desc}\n\n🚗 Mang giấy đăng kiểm + sổ bảo dưỡng\n📍 {clinicName}\n📌 {address}',
        workingHours: { start: '07:30', end: '17:30', days: [1, 2, 3, 4, 5, 6] },
        bookingFields: ['phone', 'name', 'carModel', 'licensePlate', 'service', 'date', 'note'],
        conversionValue: 1500000,
        followUp: { interval: '6m', promptText: 'Đã đến lịch bảo dưỡng tiếp theo (6 tháng / 5000km)' },
    },

    // ── 10. Thú Y ──
    veterinary: {
        key: 'veterinary',
        name: 'Thú y',
        icon: '🐾',
        frequency: 'milestone',
        defaultInterval: 'per-milestone',
        milestones: [
            { month: 2, title: 'Vaccine 5/7 bệnh mũi 1', desc: '+ Tẩy giun lần 1', urgency: 'critical' },
            { month: 3, title: 'Vaccine 5/7 bệnh mũi 2', desc: '+ Kiểm tra sức khỏe', urgency: 'critical' },
            { month: 4, title: 'Vaccine dại', desc: 'Mũi đầu tiên', urgency: 'critical' },
            { month: 6, title: 'Tư vấn triệt sản', desc: 'Triệt sản (nếu cần)', urgency: 'recommended' },
            { month: 12, title: 'Vaccine nhắc hàng năm', desc: 'Nhắc vaccine + tẩy giun', urgency: 'recommended' },
        ],
        reminderAlarms: [
            { trigger: '-P1D', description: 'Nhắc: Ngày mai đưa bé đi tiêm vaccine' },
            { trigger: '-PT2H', description: 'Hôm nay tiêm vaccine cho bé lúc {time}' },
        ],
        reminderContent: {
            preparation: 'Không cho thú cưng ăn 2h trước. Đeo rọ mõm cho chó lớn',
            arriveEarly: '10 phút',
            fasting: false,
            bringDocuments: ['Sổ vaccine thú cưng'],
            specialNotes: 'Mang mẫu phân nếu nghi tẩy giun',
        },
        calendarTitleTemplate: '{service} — {clinicName}',
        calendarDescTemplate: '{desc}\n\n🐾 Nhớ mang sổ vaccine\n📍 {clinicName}\n📌 {address}',
        workingHours: { start: '08:00', end: '18:00', days: [1, 2, 3, 4, 5, 6, 0] },
        bookingFields: ['phone', 'ownerName', 'petName', 'petType', 'petAge', 'service', 'date', 'note'],
        conversionValue: 300000,
        followUp: { interval: 'per-milestone', promptText: 'Đã đến lịch tiêm vaccine cho bé' },
    },

    // ── 11. Luật Sư ──
    legal: {
        key: 'legal',
        name: 'Luật sư / Tư vấn pháp lý',
        icon: '⚖️',
        frequency: 'one-time',
        defaultInterval: null,
        milestones: [],
        reminderAlarms: [
            { trigger: '-P1D', description: 'Nhắc: Ngày mai buổi tư vấn pháp lý — chuẩn bị hồ sơ!' },
            { trigger: '-PT3H', description: 'Buổi tư vấn pháp lý lúc {time}' },
        ],
        reminderContent: {
            preparation: 'Chuẩn bị đầy đủ hồ sơ liên quan đến vụ việc',
            arriveEarly: '15 phút',
            fasting: false,
            bringDocuments: ['CCCD', 'Hợp đồng gốc', 'Tài liệu chứng cứ', 'Biên lai phí'],
            specialNotes: 'Viết sẵn timeline sự việc để tư vấn nhanh hơn',
        },
        calendarTitleTemplate: 'Tư vấn pháp lý — {clinicName}',
        calendarDescTemplate: '{desc}\n\n📄 Mang HĐ gốc + chứng cứ\n📍 {clinicName}\n📌 {address}',
        workingHours: { start: '08:00', end: '17:00', days: [1, 2, 3, 4, 5] },
        bookingFields: ['phone', 'name', 'caseType', 'date', 'timeSlot', 'note'],
        conversionValue: 2000000,
        followUp: { interval: null, promptText: null },
    },

    // ── 12. Nhà Hàng ──
    restaurant: {
        key: 'restaurant',
        name: 'Nhà hàng / F&B',
        icon: '🍽️',
        frequency: 'one-time',
        defaultInterval: null,
        milestones: [],
        reminderAlarms: [
            { trigger: '-PT3H', description: 'Nhắc: Bàn đã được giữ tại {clinicName} lúc {time}' },
            { trigger: '-PT30M', description: 'Bàn tại {clinicName} trong 30 phút nữa!' },
        ],
        reminderContent: {
            preparation: 'Bàn đã được giữ',
            arriveEarly: 'Đúng giờ',
            fasting: false,
            bringDocuments: [],
            specialNotes: 'Có yêu cầu dị ứng thực phẩm?',
        },
        calendarTitleTemplate: 'Đặt bàn — {clinicName}',
        calendarDescTemplate: 'Bàn cho {guestCount} người\n\n🍽️ {clinicName}\n📌 {address}\n🗺️ {mapsUrl}',
        workingHours: { start: '10:00', end: '22:00', days: [1, 2, 3, 4, 5, 6, 0] },
        bookingFields: ['phone', 'name', 'guestCount', 'date', 'timeSlot', 'specialRequest'],
        conversionValue: 500000,
        followUp: { interval: 'post-visit', promptText: 'Cảm ơn! Đánh giá trên Google Maps?' },
    },

    // ── 13. Salon / Tóc ──
    salon: {
        key: 'salon',
        name: 'Salon / Tóc',
        icon: '💇',
        frequency: 'recurring',
        defaultInterval: '5w',
        milestones: [],
        reminderAlarms: [
            { trigger: '-P1D', description: 'Nhắc: Ngày mai lịch cắt tóc tại {clinicName}' },
            { trigger: '-PT2H', description: 'Lịch cắt tóc hôm nay lúc {time}' },
        ],
        reminderContent: {
            preparation: 'Gội đầu sạch trước khi đến (nếu nhuộm/uốn)',
            arriveEarly: '5 phút',
            fasting: false,
            bringDocuments: [],
            specialNotes: 'Mang ảnh mẫu nếu muốn kiểu tóc mới',
        },
        calendarTitleTemplate: '{service} — {clinicName}',
        calendarDescTemplate: '{desc}\n\n💇 {clinicName}\n📌 {address}\n🗺️ {mapsUrl}',
        workingHours: { start: '09:00', end: '20:00', days: [1, 2, 3, 4, 5, 6, 0] },
        bookingFields: ['phone', 'name', 'service', 'stylist', 'date', 'timeSlot'],
        conversionValue: 250000,
        followUp: { interval: '5w', promptText: 'Đã đến lúc refresh tóc rồi!' },
    },

    // ── 14. Yoga / Wellness ──
    yoga: {
        key: 'yoga',
        name: 'Yoga / Wellness',
        icon: '🧘',
        frequency: 'class',
        defaultInterval: 'weekly',
        milestones: [],
        reminderAlarms: [
            { trigger: '-PT3H', description: 'Lớp yoga hôm nay lúc {time} — mang thảm!' },
            { trigger: '-PT30M', description: 'Lớp yoga bắt đầu trong 30 phút' },
        ],
        reminderContent: {
            preparation: 'Mang thảm yoga, khăn, bình nước',
            arriveEarly: '10 phút (thay đồ + hít thở)',
            fasting: false,
            bringDocuments: ['Thẻ thành viên'],
            specialNotes: 'Không ăn nặng 2h trước',
        },
        calendarTitleTemplate: 'Lớp Yoga — {clinicName}',
        calendarDescTemplate: '{desc}\n\n🧘 Mang thảm, khăn, nước\n📍 {clinicName}\n📌 {address}',
        workingHours: { start: '06:00', end: '21:00', days: [1, 2, 3, 4, 5, 6, 0] },
        bookingFields: ['phone', 'name', 'classType', 'level', 'date', 'timeSlot'],
        conversionValue: 150000,
        followUp: { interval: 'weekly', promptText: 'Lớp yoga tuần này' },
    },

    // ── 15. Studio / Photography ──
    photography: {
        key: 'photography',
        name: 'Studio / Photography',
        icon: '📸',
        frequency: 'one-time',
        defaultInterval: null,
        milestones: [],
        reminderAlarms: [
            { trigger: '-P1D', description: 'Nhắc: Ngày mai chụp ảnh — chuẩn bị trang phục!' },
            { trigger: '-PT3H', description: 'Buổi chụp ảnh lúc {time} tại {clinicName}' },
        ],
        reminderContent: {
            preparation: 'Chuẩn bị 2-3 bộ trang phục. Trang điểm nhẹ hoặc để studio make-up',
            arriveEarly: '15 phút (thay đồ + trao đổi concept)',
            fasting: false,
            bringDocuments: [],
            specialNotes: 'Mang thêm phụ kiện cá nhân (nón, khăn, hoa...)',
        },
        calendarTitleTemplate: 'Chụp ảnh — {clinicName}',
        calendarDescTemplate: '{desc}\n\n📸 Chuẩn bị 2-3 bộ trang phục\n📍 {clinicName}\n📌 {address}',
        workingHours: { start: '08:00', end: '18:00', days: [1, 2, 3, 4, 5, 6, 0] },
        bookingFields: ['phone', 'name', 'shootConcept', 'guestCount', 'date', 'timeSlot', 'note'],
        conversionValue: 2000000,
        followUp: { interval: '7d', promptText: 'Ảnh đã xong! Xem gallery?' },
    },

    // ── 16. Hotel / Travel ──
    hotel: {
        key: 'hotel',
        name: 'Hotel / Travel',
        icon: '🏨',
        frequency: 'one-time',
        defaultInterval: null,
        milestones: [],
        reminderAlarms: [
            { trigger: '-P1D', description: 'Nhắc: Ngày mai check-in tại {clinicName} — mang CCCD!' },
            { trigger: '-PT3H', description: 'Check-in tại {clinicName} từ 14:00' },
        ],
        reminderContent: {
            preparation: 'Check-in từ 14:00. Mang CCCD/Passport',
            arriveEarly: null,
            fasting: false,
            bringDocuments: ['CCCD/Passport', 'Booking confirmation'],
            specialNotes: '',
        },
        calendarTitleTemplate: 'Check-in — {clinicName}',
        calendarDescTemplate: '{desc}\n\n🏨 Check-in từ 14:00\n📍 {clinicName}\n📌 {address}\n🗺️ {mapsUrl}',
        workingHours: { start: '00:00', end: '23:59', days: [1, 2, 3, 4, 5, 6, 0] },
        bookingFields: ['phone', 'name', 'roomType', 'checkIn', 'checkOut', 'guestCount', 'specialRequest'],
        conversionValue: 1500000,
        followUp: { interval: 'post-checkout', promptText: 'Cảm ơn! Đánh giá trải nghiệm?' },
    },

    // ── 17. Đa Khoa / Nội Khoa ──
    general_medicine: {
        key: 'general_medicine',
        name: 'Đa khoa / Nội khoa',
        icon: '👨‍⚕️',
        frequency: 'recurring',
        defaultInterval: '3m',
        milestones: [],
        reminderAlarms: [
            { trigger: '-P1D', description: 'Nhắc: Ngày mai khám tại {clinicName} — NHỊN ĂN nếu xét nghiệm máu!' },
            { trigger: '-PT2H', description: 'Lịch khám hôm nay lúc {time}' },
        ],
        reminderContent: {
            preparation: 'NHỊN ĂN trước 8-12 giờ (nếu lấy máu xét nghiệm)',
            arriveEarly: '15 phút (đăng ký + đo huyết áp)',
            fasting: true,
            bringDocuments: ['CCCD', 'BHYT', 'Kết quả xét nghiệm cũ', 'Đơn thuốc đang dùng'],
            specialNotes: 'Ghi lại triệu chứng gần đây, thuốc đang uống',
        },
        calendarTitleTemplate: '{service} — {clinicName}',
        calendarDescTemplate: '⚠️ NHỊN ĂN nếu xét nghiệm máu!\n\n{desc}\n📍 {clinicName}\n📌 {address}\n📞 {phone}',
        workingHours: { start: '07:30', end: '17:00', days: [1, 2, 3, 4, 5, 6] },
        bookingFields: ['phone', 'name', 'date', 'timeSlot', 'service', 'symptoms', 'note'],
        conversionValue: 500000,
        followUp: { interval: '3m', promptText: 'Đã đến lịch khám sức khỏe định kỳ (3 tháng)' },
    },

    // ── 18. Tâm Lý / Therapy ──
    therapy: {
        key: 'therapy',
        name: 'Tâm lý / Therapy',
        icon: '🧠',
        frequency: 'recurring',
        defaultInterval: '1w',
        milestones: [],
        reminderAlarms: [
            { trigger: '-P1D', description: 'Nhắc: Phiên tư vấn ngày mai' },
            { trigger: '-PT1H', description: 'Phiên tư vấn bắt đầu sau 1 giờ' },
        ],
        reminderContent: {
            preparation: 'Dành 10 phút suy nghĩ về tuần vừa qua',
            arriveEarly: '5 phút',
            fasting: false,
            bringDocuments: [],
            // ⚠️ PRIVACY: Calendar event KHÔNG chứa chi tiết nhạy cảm
            specialNotes: 'Phiên tư vấn hoàn toàn bảo mật',
        },
        calendarTitleTemplate: 'Phiên tư vấn — {clinicName}',
        // ⚠️ PRIVACY: Minimal description to protect patient privacy
        calendarDescTemplate: 'Phiên tư vấn tại {clinicName}\n📍 {address}',
        workingHours: { start: '09:00', end: '20:00', days: [1, 2, 3, 4, 5, 6] },
        bookingFields: ['phone', 'name', 'date', 'timeSlot', 'sessionType'],
        conversionValue: 800000,
        followUp: { interval: '1w', promptText: 'Phiên tư vấn tuần này' },
    },

    // ── 19. Coworking / Meeting Room ──
    coworking: {
        key: 'coworking',
        name: 'Coworking / Meeting',
        icon: '💼',
        frequency: 'one-time',
        defaultInterval: null,
        milestones: [],
        reminderAlarms: [
            { trigger: '-P1D', description: 'Nhắc: Ngày mai đặt phòng họp tại {clinicName}' },
            { trigger: '-PT1H', description: 'Phòng họp trong 1 giờ nữa' },
            { trigger: '-PT15M', description: 'Phòng họp bắt đầu trong 15 phút!' },
        ],
        reminderContent: {
            preparation: 'Phòng sẵn: projector, whiteboard, wifi',
            arriveEarly: '10 phút (setup)',
            fasting: false,
            bringDocuments: [],
            specialNotes: '',
        },
        calendarTitleTemplate: 'Phòng họp — {clinicName}',
        calendarDescTemplate: 'Phòng: {roomName}\nSức chứa: {capacity} người\n\n📍 {clinicName}\n📌 {address}',
        workingHours: { start: '07:00', end: '22:00', days: [1, 2, 3, 4, 5, 6, 0] },
        bookingFields: ['phone', 'name', 'roomType', 'capacity', 'date', 'startTime', 'endTime', 'meetingUrl'],
        conversionValue: 500000,
        followUp: { interval: null, promptText: null },
    },

    // ── 20. Music / Dance Class ──
    music_dance: {
        key: 'music_dance',
        name: 'Music / Dance',
        icon: '🎶',
        frequency: 'class',
        defaultInterval: 'weekly',
        milestones: [],
        reminderAlarms: [
            { trigger: '-PT2H', description: 'Lớp nhạc/dance hôm nay lúc {time}' },
            { trigger: '-PT30M', description: 'Lớp bắt đầu trong 30 phút — mang nhạc cụ!' },
        ],
        reminderContent: {
            preparation: 'Mang theo nhạc cụ. Tập bài được giao',
            arriveEarly: '5 phút (tune nhạc cụ)',
            fasting: false,
            bringDocuments: ['Sách/sheet nhạc'],
            specialNotes: '',
        },
        calendarTitleTemplate: 'Lớp nhạc — {clinicName}',
        calendarDescTemplate: '{desc}\n\n🎶 Mang nhạc cụ + sheet nhạc\n📍 {clinicName}\n📌 {address}',
        workingHours: { start: '08:00', end: '21:00', days: [1, 2, 3, 4, 5, 6, 0] },
        bookingFields: ['phone', 'name', 'instrument', 'level', 'date', 'timeSlot', 'teacherName'],
        conversionValue: 200000,
        followUp: { interval: 'weekly', promptText: 'Lớp nhạc tuần này' },
    },
};

// ── Helper Functions ──

/**
 * Get industry config by key
 * @param {string} key — Industry key (e.g., 'obgyn', 'dental')
 * @returns {Object|null} — Industry config or null
 */
function getIndustryPattern(key) {
    return INDUSTRY_PATTERNS[key] || null;
}

/**
 * List all available industries
 * @returns {Array} — Array of { key, name, icon }
 */
function listIndustries() {
    return Object.values(INDUSTRY_PATTERNS).map(p => ({
        key: p.key,
        name: p.name,
        icon: p.icon,
        frequency: p.frequency,
    }));
}

/**
 * Build Google Maps search URL from address
 * @param {string} name — Business name
 * @param {string} address — Business address
 * @returns {string} — Google Maps search URL
 */
function buildMapsSearchUrl(name, address) {
    const q = encodeURIComponent(`${name}, ${address}`);
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { INDUSTRY_PATTERNS, getIndustryPattern, listIndustries, buildMapsSearchUrl };
}
