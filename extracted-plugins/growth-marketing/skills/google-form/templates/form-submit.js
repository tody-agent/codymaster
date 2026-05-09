/**
 * Form Submission Handler — Auto Retry + Toast UI + Fallback
 * 
 * Features:
 * - Auto retry 3x with exponential backoff (1s → 2s → 4s)
 * - Toast notifications (success/error/retrying) — no alert()
 * - Phone validation (Vietnamese format)
 * - Zalo/contact fallback on total failure
 * - CORS-safe: handles opaque responses from Google Apps Script
 * 
 * USAGE:
 * 1. Include this script in your page (or append to shared.js)
 * 2. Add toast.css to your stylesheet
 * 3. Configure URLS object with your Apps Script deployment URLs
 * 4. Configure FALLBACK_CONTACT with your Zalo/contact URL
 * 5. Add forms with: data-form-type="xxx" onsubmit="window.submitToGoogleSheet(event)"
 */

// ═══════════════════════════════════════
// CONFIGURATION — Change these values
// ═══════════════════════════════════════
const FORM_CONFIG = {
    // Apps Script URLs per form type
    URLS: {
        // Add your deployed Apps Script URLs here
        // massage: 'https://script.google.com/macros/s/YOUR_ID/exec',
        // course:  'https://script.google.com/macros/s/YOUR_ID/exec',
    },
    // Fallback contact when form fails completely
    FALLBACK_CONTACT: {
        url: 'https://zalo.me/0559669663',   // Change to your Zalo/Messenger/etc
        label: '💬 Nhắn tin Zalo ngay',       // Button text
    },
    // Retry settings
    MAX_RETRIES: 3,
    // Phone validation regex (Vietnamese)
    PHONE_REGEX: /^0\d{8,10}$/,
    // Messages (Vietnamese — customize for your language)
    MESSAGES: {
        sending: 'Đang gửi...',
        retrying: (attempt, max) => `Đang thử lại (${attempt}/${max})...`,
        phoneInvalid: {
            title: 'Số điện thoại không hợp lệ',
            msg: 'Vui lòng nhập số điện thoại bắt đầu bằng 0, từ 9-11 chữ số.',
        },
        success: {
            title: 'Đăng ký thành công! 🎉',
            msg: 'Chúng tôi sẽ liên hệ bạn trong 30 phút. Nhắn Zalo để được tư vấn nhanh hơn!',
        },
        retryNotice: {
            title: 'Đang thử lại...',
            msg: (attempt, max) => `Lần ${attempt}/${max} — Vui lòng chờ trong giây lát.`,
        },
        error: {
            title: 'Gửi không thành công',
            msg: 'Hệ thống đang bận. Vui lòng nhắn tin Zalo để được hỗ trợ ngay — chúng tôi sẽ phản hồi trong 5 phút!',
        },
    },
};

// ═══════════════════════════════════════
// TOAST NOTIFICATION SYSTEM
// ═══════════════════════════════════════

function getToastContainer() {
    let c = document.querySelector('.form-toast-container');
    if (!c) {
        c = document.createElement('div');
        c.className = 'form-toast-container';
        document.body.appendChild(c);
    }
    return c;
}

function showFormToast(type, title, msg, options = {}) {
    const container = getToastContainer();
    container.querySelectorAll('.form-toast').forEach(t => hideFormToast(t));

    const icons = { success: '✅', error: '❌', retrying: '⏳' };
    const toast = document.createElement('div');
    toast.className = `form-toast form-toast--${type}`;

    const fallback = FORM_CONFIG.FALLBACK_CONTACT;
    toast.innerHTML = `
        <span class="form-toast-icon">${icons[type] || '📋'}</span>
        <div class="form-toast-body">
            <div class="form-toast-title">${title}</div>
            <div class="form-toast-msg">${msg}</div>
            ${options.showFallback ? `<a href="${fallback.url}" target="_blank" class="form-toast-zalo">${fallback.label}</a>` : ''}
        </div>
        <button class="form-toast-close" aria-label="Close">✕</button>
    `;

    toast.querySelector('.form-toast-close').addEventListener('click', () => hideFormToast(toast));
    container.appendChild(toast);

    const dismissMs = { success: 6000, error: 15000, retrying: 10000 };
    setTimeout(() => hideFormToast(toast), dismissMs[type] || 8000);

    return toast;
}

function hideFormToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
}

// ═══════════════════════════════════════
// FETCH WITH RETRY (Exponential Backoff)
// ═══════════════════════════════════════

async function fetchWithRetry(url, options, maxRetries, onRetry) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const res = await fetch(url, options);
            if (res.type === 'opaque' || res.ok) return res;
            try {
                const data = await res.json();
                if (data.status === 'success') return res;
                throw new Error(data.message || 'Server error');
            } catch {
                if (res.type === 'opaque') return res;
                throw new Error(`HTTP ${res.status}`);
            }
        } catch (err) {
            lastError = err;
            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt - 1) * 1000;
                if (onRetry) onRetry(attempt, maxRetries);
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }
    throw lastError;
}

// ═══════════════════════════════════════
// FORM SUBMISSION HANDLER
// ═══════════════════════════════════════

window.submitToGoogleSheet = function (event) {
    event.preventDefault();
    const form = event.target;
    const btn = form.querySelector('button[type="submit"]');
    if (!btn || btn.disabled) return;
    const originalText = btn.innerText;
    const cfg = FORM_CONFIG;
    const msgs = cfg.MESSAGES;

    // Phone validation
    const phoneInput = form.querySelector('input[name="phone"]');
    if (phoneInput) {
        const phone = phoneInput.value.replace(/\s+/g, '');
        if (!cfg.PHONE_REGEX.test(phone)) {
            showFormToast('error', msgs.phoneInvalid.title, msgs.phoneInvalid.msg);
            phoneInput.focus();
            return;
        }
    }

    // Auto-fill source URL
    const urlInput = form.querySelector('input[name="url"]');
    if (urlInput) urlInput.value = window.location.href;

    const formType = form.getAttribute('data-form-type') || Object.keys(cfg.URLS)[0];
    const scriptURL = cfg.URLS[formType] || Object.values(cfg.URLS)[0];

    if (!scriptURL) {
        showFormToast('error', 'Lỗi cấu hình', 'Chưa cấu hình URL cho form type: ' + formType);
        return;
    }

    btn.innerText = msgs.sending;
    btn.disabled = true;

    fetchWithRetry(
        scriptURL,
        { method: 'POST', body: new FormData(form) },
        cfg.MAX_RETRIES,
        (attempt, max) => {
            btn.innerText = msgs.retrying(attempt, max);
            showFormToast('retrying', msgs.retryNotice.title, msgs.retryNotice.msg(attempt, max));
        }
    )
        .then(() => {
            showFormToast('success', msgs.success.title, msgs.success.msg, { showFallback: true });
            form.reset();
            setTimeout(() => {
                window.open(cfg.FALLBACK_CONTACT.url, '_blank');
            }, 1500);
        })
        .catch(() => {
            showFormToast('error', msgs.error.title, msgs.error.msg, { showFallback: true });
        })
        .finally(() => {
            btn.innerText = originalText;
            btn.disabled = false;
        });
};
