/**
 * Booking Calendar Engine v1.0
 * Core scheduling engine — Zero dependencies, pure JS
 * 
 * Usage:
 *   const engine = new BookingCalendarEngine(INDUSTRY_CONFIG);
 *   const schedule = engine.generateSchedule(startDate, preferences);
 *   const chips = engine.getSmartDateChips();
 */

// ============================================================
// BOOKING CALENDAR ENGINE
// ============================================================

class BookingCalendarEngine {
    /**
     * @param {Object} config — Industry configuration from reminder-config.js
     * @param {Object} config.frequency — 'one-time' | 'recurring' | 'milestone' | 'course' | 'class'
     * @param {Array}  config.milestones — Array of milestone objects (for milestone/course types)
     * @param {Object} config.workingHours — { start: '08:00', end: '17:00', days: [1,2,3,4,5,6] }
     * @param {string} config.defaultInterval — e.g., '6m', '4w', 'weekly'
     * @param {Object} config.reminderContent — Industry-specific preparation notes
     * @param {string} config.clinicName — Business name
     * @param {string} config.clinicAddress — Business address
     * @param {string} config.clinicPhone — Business phone
     * @param {string} config.googleMapsUrl — Google Maps link
     */
    constructor(config) {
        this.config = config;
        this.appointments = [];
    }

    // ── Schedule Generation ──

    /**
     * Generate appointment schedule based on industry type
     * @param {Date} startDate — Start date (e.g., LMP for OB/GYN, signup date, etc.)
     * @param {Object} preferences — User preferences
     * @param {string} preferences.dayPreference — 'weekday' | 'weekend' | 'any'
     * @param {string} preferences.timeSlot — 'morning' | 'afternoon' | 'evening'
     * @returns {Array} — List of appointment objects
     */
    generateSchedule(startDate, preferences = {}) {
        const { frequency } = this.config;

        switch (frequency) {
            case 'milestone':
                this.appointments = this._generateMilestoneSchedule(startDate, preferences);
                break;
            case 'recurring':
                this.appointments = this._generateRecurringSchedule(startDate, preferences);
                break;
            case 'course':
                this.appointments = this._generateCourseSchedule(startDate, preferences);
                break;
            case 'class':
                this.appointments = this._generateClassSchedule(startDate, preferences);
                break;
            case 'one-time':
            default:
                this.appointments = this._generateOneTimeSchedule(startDate, preferences);
                break;
        }

        return this.appointments;
    }

    /**
     * Milestone-based schedule (OB/GYN, Pediatrics, Veterinary)
     * Each milestone has a specific week/month offset from start date
     */
    _generateMilestoneSchedule(startDate, preferences) {
        const milestones = this.config.milestones || [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return milestones.map((m, index) => {
            const apptDate = new Date(startDate);

            // Support week or month offset
            if (m.week !== undefined) {
                apptDate.setDate(apptDate.getDate() + m.week * 7);
            } else if (m.month !== undefined) {
                apptDate.setMonth(apptDate.getMonth() + m.month);
            } else if (m.day !== undefined) {
                apptDate.setDate(apptDate.getDate() + m.day);
            }

            // Adjust to preferred day
            this._adjustToPreferredDay(apptDate, preferences.dayPreference);

            // Set time
            this._setPreferredTime(apptDate, preferences.timeSlot);

            const isPast = apptDate < today;
            const isNext = !isPast && (index === 0 || this._isPreviousPast(milestones, index, startDate, today));

            return {
                index,
                ...m,
                date: apptDate,
                dateISO: this._formatDateISO(apptDate),
                dateVN: this._formatDateVN(apptDate),
                timeStr: this._formatTime(apptDate),
                isPast,
                isNext,
                status: isPast ? 'past' : isNext ? 'next' : 'future',
            };
        });
    }

    /**
     * Recurring schedule (Dental, Salon, Auto, General Medicine)
     * Fixed interval from last appointment
     */
    _generateRecurringSchedule(startDate, preferences, count = 6) {
        const interval = this._parseInterval(this.config.defaultInterval);
        const appointments = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < count; i++) {
            const apptDate = new Date(startDate);
            apptDate.setDate(apptDate.getDate() + interval * (i + 1));
            this._adjustToPreferredDay(apptDate, preferences.dayPreference);
            this._setPreferredTime(apptDate, preferences.timeSlot);

            const isPast = apptDate < today;

            appointments.push({
                index: i,
                title: `${this.config.name} — Lần ${i + 1}`,
                desc: this.config.reminderContent?.preparation || '',
                date: apptDate,
                dateISO: this._formatDateISO(apptDate),
                dateVN: this._formatDateVN(apptDate),
                timeStr: this._formatTime(apptDate),
                isPast,
                isNext: !isPast && (i === 0 || appointments[i - 1]?.isPast),
                status: isPast ? 'past' : 'future',
            });
        }

        // Mark first future as 'next'
        const firstFuture = appointments.find(a => !a.isPast);
        if (firstFuture) firstFuture.isNext = true;
        if (firstFuture) firstFuture.status = 'next';

        return appointments;
    }

    /**
     * Course-based schedule (Spa — X sessions, fixed interval)
     */
    _generateCourseSchedule(startDate, preferences, totalSessions = 10) {
        const interval = this._parseInterval(this.config.defaultInterval || '14d');
        const appointments = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < totalSessions; i++) {
            const apptDate = new Date(startDate);
            apptDate.setDate(apptDate.getDate() + interval * i);
            this._adjustToPreferredDay(apptDate, preferences.dayPreference);
            this._setPreferredTime(apptDate, preferences.timeSlot);

            const isPast = apptDate < today;

            appointments.push({
                index: i,
                title: `Buổi ${i + 1}/${totalSessions}`,
                desc: `Liệu trình — ${this.config.name}`,
                date: apptDate,
                dateISO: this._formatDateISO(apptDate),
                dateVN: this._formatDateVN(apptDate),
                timeStr: this._formatTime(apptDate),
                isPast,
                isNext: false,
                status: isPast ? 'past' : 'future',
            });
        }

        const firstFuture = appointments.find(a => !a.isPast);
        if (firstFuture) {
            firstFuture.isNext = true;
            firstFuture.status = 'next';
        }

        return appointments;
    }

    /**
     * Class-based schedule (Yoga, Music, Education — recurring weekly)
     */
    _generateClassSchedule(startDate, preferences, weeksAhead = 8) {
        const appointments = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const classDays = this.config.workingHours?.days || [1, 3, 5]; // Mon, Wed, Fri

        for (let w = 0; w < weeksAhead; w++) {
            classDays.forEach((dayOfWeek, di) => {
                const apptDate = new Date(startDate);
                apptDate.setDate(apptDate.getDate() + w * 7);

                // Adjust to target day of week
                const currentDay = apptDate.getDay();
                const diff = dayOfWeek - currentDay;
                apptDate.setDate(apptDate.getDate() + diff);

                if (apptDate < startDate) return;

                this._setPreferredTime(apptDate, preferences.timeSlot);
                const isPast = apptDate < today;

                appointments.push({
                    index: appointments.length,
                    title: `Lớp — ${this.config.name}`,
                    desc: this.config.reminderContent?.preparation || '',
                    date: apptDate,
                    dateISO: this._formatDateISO(apptDate),
                    dateVN: this._formatDateVN(apptDate),
                    timeStr: this._formatTime(apptDate),
                    isPast,
                    isNext: false,
                    status: isPast ? 'past' : 'future',
                });
            });
        }

        // Sort by date and mark next
        appointments.sort((a, b) => a.date - b.date);
        const firstFuture = appointments.find(a => !a.isPast);
        if (firstFuture) {
            firstFuture.isNext = true;
            firstFuture.status = 'next';
        }

        return appointments;
    }

    /**
     * One-time schedule (Real Estate, Restaurant, Photography)
     */
    _generateOneTimeSchedule(startDate, preferences) {
        const apptDate = new Date(startDate);
        this._adjustToPreferredDay(apptDate, preferences.dayPreference);
        this._setPreferredTime(apptDate, preferences.timeSlot);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isPast = apptDate < today;

        return [{
            index: 0,
            title: this.config.name,
            desc: this.config.reminderContent?.preparation || '',
            date: apptDate,
            dateISO: this._formatDateISO(apptDate),
            dateVN: this._formatDateVN(apptDate),
            timeStr: this._formatTime(apptDate),
            isPast,
            isNext: !isPast,
            status: isPast ? 'past' : 'next',
        }];
    }

    // ── Smart Date Chips ──

    /**
     * Generate smart date chip options for booking form
     * @returns {Array} — 5 date options: Today, Tomorrow, + next 3 working days
     */
    getSmartDateChips() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const chips = [];
        const workingDays = this.config.workingHours?.days || [1, 2, 3, 4, 5, 6];
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

        let daysChecked = 0;
        let currentDate = new Date(today);

        while (chips.length < 5 && daysChecked < 14) {
            const dayOfWeek = currentDate.getDay();

            if (workingDays.includes(dayOfWeek)) {
                const isToday = daysChecked === 0;
                const isTomorrow = daysChecked === 1;

                chips.push({
                    date: new Date(currentDate),
                    dateISO: this._formatDateISO(currentDate),
                    dateVN: this._formatDateVN(currentDate),
                    label: isToday ? 'Hôm nay' : isTomorrow ? 'Ngày mai' : dayNames[dayOfWeek],
                    subLabel: isToday || isTomorrow ? dayNames[dayOfWeek] : this._formatShortDate(currentDate),
                    isRecommended: isTomorrow, // Tomorrow is usually recommended
                });
            }

            currentDate.setDate(currentDate.getDate() + 1);
            daysChecked++;
        }

        return chips;
    }

    /**
     * Get available time slots for a given date
     * @param {Date} date — Target date
     * @returns {Array} — Available time slots
     */
    getTimeSlots(date) {
        const { start, end } = this.config.workingHours || { start: '08:00', end: '17:00' };
        const [startH] = start.split(':').map(Number);
        const [endH] = end.split(':').map(Number);
        const slots = [];

        // Morning slots
        if (startH <= 11) {
            slots.push({ label: 'Sáng', subLabel: `${start} - 12:00`, value: 'morning', time: start });
        }

        // Afternoon slots
        if (startH <= 16 && endH >= 13) {
            slots.push({ label: 'Chiều', subLabel: '13:00 - 17:00', value: 'afternoon', time: '13:00' });
        }

        // Evening slots (if clinic opens late)
        if (endH >= 18) {
            slots.push({ label: 'Tối', subLabel: '18:00 - 20:00', value: 'evening', time: '18:00' });
        }

        return slots;
    }

    // ── Utility Methods ──

    getNextAppointment() {
        return this.appointments.find(a => a.isNext) || this.appointments.find(a => !a.isPast);
    }

    getFutureAppointments() {
        return this.appointments.filter(a => !a.isPast);
    }

    getPastAppointments() {
        return this.appointments.filter(a => a.isPast);
    }

    // ── Private Helpers ──

    _parseInterval(interval) {
        const value = parseInt(interval);
        if (interval.endsWith('m')) return value * 30; // months → days (approx)
        if (interval.endsWith('w')) return value * 7;   // weeks → days
        if (interval.endsWith('d')) return value;        // days
        if (interval === 'weekly') return 7;
        return 30; // default 1 month
    }

    _adjustToPreferredDay(date, preference) {
        if (!preference || preference === 'any') return;
        const day = date.getDay();

        if (preference === 'weekday' && (day === 0 || day === 6)) {
            // Move to Monday
            date.setDate(date.getDate() + (day === 0 ? 1 : 2));
        } else if (preference === 'weekend' && day !== 0 && day !== 6) {
            // Move to Saturday
            date.setDate(date.getDate() + (6 - day));
        }
    }

    _setPreferredTime(date, timeSlot) {
        switch (timeSlot) {
            case 'morning': date.setHours(8, 0, 0, 0); break;
            case 'afternoon': date.setHours(14, 0, 0, 0); break;
            case 'evening': date.setHours(18, 0, 0, 0); break;
            default: date.setHours(8, 0, 0, 0); // default morning
        }
    }

    _isPreviousPast(milestones, currentIndex, startDate, today) {
        if (currentIndex === 0) return true;
        const prev = milestones[currentIndex - 1];
        const prevDate = new Date(startDate);
        if (prev.week !== undefined) prevDate.setDate(prevDate.getDate() + prev.week * 7);
        else if (prev.month !== undefined) prevDate.setMonth(prevDate.getMonth() + prev.month);
        return prevDate < today;
    }

    _formatDateISO(date) {
        return date.toISOString().split('T')[0].replace(/-/g, '');
    }

    _formatDateVN(date) {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${d}/${m}/${date.getFullYear()}`;
    }

    _formatShortDate(date) {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${d}/${m}`;
    }

    _formatTime(date) {
        const h = date.getHours().toString().padStart(2, '0');
        const m = date.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
    }
}

// Export for both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BookingCalendarEngine };
}
