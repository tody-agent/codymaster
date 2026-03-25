/**
 * TikTok Browser Actions — Date Selection & Export
 * ==================================================
 * JavaScript snippets to inject into TikTok Seller Center pages.
 * 
 * Extracted from Power Automate Desktop flow: "20260209 GBS Tiktok"
 * 
 * TikTok uses:
 * 1. core-picker (TikTok Design System) — for Income, Wallet pages
 * 2. pulse-select — for pagination on Invoice page
 */

// ============================================================================
// TIKTOK INCOME / WALLET — core-picker date range
// URL: https://seller-vn.tiktok.com/finance/transactions?shop_region=VN&tab=settled_tab
// URL: https://seller-vn.tiktok.com/finance/withdraw-new
// ============================================================================

/**
 * Select first and last day of target month in TikTok core-picker
 * Used for TikTok Income and Wallet pages
 * 
 * @param {string} yearMonth - Format: "YYYYMM" (e.g., "202602")
 */
function tiktokCorePicker_selectMonthRange(yearMonth) {
  const lastDay = new Date(yearMonth.slice(0, 4), yearMonth.slice(4, 6), 0)
    .getDate().toString().padStart(2, '0');
  
  const cells = [...document.querySelectorAll('.core-picker-cell-in-view .core-picker-date-value')];
  const first = cells.find(c => c.textContent.trim() === '01');
  const last = cells.find(c => c.textContent.trim() === lastDay);
  
  first?.click();
  setTimeout(() => last?.click(), 100);
}

// ============================================================================
// TIKTOK AFFILIATE INVOICE — Month picker + Table scraping
// URL: https://seller-vn.tiktok.com/finance/invoice?shop_region=VN
// ============================================================================

/**
 * Select target month in TikTok month picker (Jan-Dec display)
 * Used for TikTok Affiliate Invoice page
 * 
 * @param {string} yearMonth - Format: "YYYYMM" (e.g., "202602")
 */
function tiktokMonthPicker_selectMonth(yearMonth) {
  const month = parseInt(yearMonth.substring(4, 6), 10);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  const monthName = monthNames[month - 1];
  
  const cells = document.querySelectorAll('.core-picker-date-value');
  let targetCell = null;
  
  for (let i = 0; i < cells.length; i++) {
    if (cells[i].textContent.trim() === monthName) {
      targetCell = cells[i];
      break;
    }
  }
  
  if (targetCell) {
    targetCell.click();
    setTimeout(function() {
      targetCell.click(); // Double-click to confirm
    }, 300);
  }
}

/**
 * Set pagination to 50 items per page
 * Used on TikTok Affiliate Invoice page for large datasets
 */
function tiktokPagination_set50PerPage() {
  const options = document.querySelectorAll('.pulse-select-option');
  
  for (let option of options) {
    const label = option.querySelector('.pulse-select-option-label-single');
    if (label && label.textContent.trim() === '50/Page') {
      option.click();
      return true;
    }
  }
  return false;
}

/**
 * Get max page number from TikTok pagination
 * @returns {number|null} Max page number
 */
function tiktokPagination_getMaxPage() {
  const paginationElement = document.querySelector('.core-pagination-list');
  if (!paginationElement) return null;

  const pageItems = paginationElement.querySelectorAll('.core-pagination-item');
  let maxPage = 0;

  pageItems.forEach(item => {
    const text = item.textContent.trim();
    if (/^\d+$/.test(text)) {
      const pageNumber = parseInt(text, 10);
      if (pageNumber > maxPage) {
        maxPage = pageNumber;
      }
    }
  });

  return maxPage || null;
}

/**
 * Click next page button in TikTok pagination
 */
function tiktokPagination_clickNext() {
  const element = document.querySelector('.core-pagination-item-next');
  if (!element) return;

  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  element.dispatchEvent(new MouseEvent('mousemove', {
    view: window, bubbles: true, cancelable: true, clientX: x, clientY: y
  }));

  element.dispatchEvent(new MouseEvent('click', {
    view: window, bubbles: true, cancelable: true, button: 0
  }));
}

// ============================================================================
// HELPER — Scroll to bottom
// ============================================================================

function scrollToBottom() {
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth"
  });
}

// ============================================================================
// BROWSER AGENT INSTRUCTIONS — TIKTOK COMPLETE FLOWS
// ============================================================================

/**
 * === TIKTOK PLATFORM INCOME ===
 * 1. Navigate to: https://seller-vn.tiktok.com/finance/transactions?shop_region=VN&tab=settled_tab
 * 2. Wait for text "Lịch sử xuất dữ liệu" to appear (up to 200s)
 * 3. Wait 1s
 * 4. Click "Xuất" button
 * 5. Wait 1s → Click SVG calendar icon to open date picker
 * 6. Wait 1s → Click another SVG to clear existing date
 * 7. Execute tiktokCorePicker_selectMonthRange(yearMonth)
 * 8. Wait 1s → Click "OK" button
 * 9. Wait 2s → Click "Xuất" (the export Span inside popup)
 * 10. Wait for "Đang xuất" text to disappear (up to 600s!)
 * 11. Wait 1s → Click "Tải xuống" button
 * 12. Save file as: {yearMonth}_{brand}_platform_income.xlsx
 * 
 * === TIKTOK WALLET ===
 * 1. Navigate to: https://seller-vn.tiktok.com/finance/withdraw-new?is_new_connect=0&shop_region=VN
 * 2. Wait for "Lịch sử xuất dữ liệu" (up to 200s)
 * 3. Scroll down 500px
 * 4. Click "Xuất"
 * 5. Click SVG → clear → select date range (same as Income)
 * 6. Click OK → Click "Xuất" button
 * 7. Wait for "Đang xuất" to disappear (up to 600s)
 * 8. Click "Tải xuống"
 * 9. Save as: {yearMonth}_{brand}_platform_wallet.xlsx
 * 
 * === TIKTOK AFFILIATE INVOICE ===
 * 1. Navigate to: https://seller-vn.tiktok.com/finance/invoice?shop_region=VN
 * 2. Wait for page load
 * 3. Click "Biên nhận hoa hồng liên kết"
 * 4. Wait 2s → Click SVG to open month picker
 * 5. Execute tiktokMonthPicker_selectMonth(yearMonth)
 * 6. Wait 3s → Click "OK"
 * 7. Check if "Nothing here at the moment" exists
 *    - If yes: skip (no data)
 *    - If no: continue below
 * 8. Scroll to bottom
 * 9. Click pagination dropdown → Execute tiktokPagination_set50PerPage()
 * 10. Get max page: tiktokPagination_getMaxPage()
 * 11. If single page: extract table → save as .xlsx
 * 12. If multiple pages: loop through pages:
 *     a. Extract table data from current page
 *     b. Save as: {yearMonth}_{brand}_affiliate_invoice_report_part_{pageNum}.xlsx
 *     c. Click next: tiktokPagination_clickNext()
 *     d. Wait 2s → repeat
 * 
 * TABLE EXTRACTION CSS SELECTOR:
 *   Rows: html > body > div:eq(0) > div:eq(1) > main > div:eq(0) > 
 *          div:eq(0) > div:eq(0) > div:eq(1) > div:eq(0) > div:eq(0) > 
 *          div:eq(0) > div:eq(0) > div:eq(2) > div:eq(0) > div:eq(0) > 
 *          div:eq(0) > div:eq(0) > div:eq(0) > table > tbody > tr
 *   
 *   Columns:
 *     - td:eq(0) > div > span > div > div  (Column 1)
 *     - td:eq(1) > div > span              (Column 2)
 *     - td:eq(2) > div > span              (Column 3)
 *     - td:eq(3) > div > span              (Column 4)
 *     - td:eq(4) > div > span              (Column 5)
 */

// ============================================================================
// TIKTOK ADS AND AFFILIATE ORDERS
// ============================================================================

/**
 * Handle TikTok Business Center (Ads) date picker
 * Used for ads_cost, ads_revenue
 */
function tiktokAds_setDateRange(startDateStr, endDateStr) {
  // Usually involves clicking the date picker button
  const pickerBtn = document.querySelector('.byted-date-picker, .date-picker-trigger');
  if (pickerBtn) {
    pickerBtn.click();
    setTimeout(() => {
      // Very naive: find inputs or presets inside the popup
      // TikTok Business Center uses a complex React date picker
      const presets = document.querySelectorAll('.byted-picker-preset-item');
      for (const preset of presets) {
        if (preset.textContent.trim().includes('Last Month') || preset.textContent.trim().includes('Tháng trước')) {
          preset.click();
          break;
        }
      }
    }, 500);
  }
}

/**
 * Click typical TikTok export buttons
 */
function tiktokClickExport() {
  const exportBtns = document.querySelectorAll('button');
  for (const btn of exportBtns) {
    const text = btn.textContent.trim().toLowerCase();
    if (text.includes('export') || text.includes('xuất') || text.includes('tải')) {
      btn.click();
      return true;
    }
  }
  
  // Also check divs/spans that act as buttons (TikTok uses these heavily)
  const allElements = document.querySelectorAll('div, span');
  for (const el of allElements) {
    const text = el.textContent.trim().toLowerCase();
    if ((text === 'export' || text === 'xuất' || text === 'tải xuống') && el.children.length === 0) {
      el.click();
      return true;
    }
  }
  
  return false;
}

module.exports = {
  tiktokCorePicker_selectMonthRange,
  tiktokMonthPicker_selectMonth,
  tiktokPagination_set50PerPage,
  tiktokPagination_getMaxPage,
  tiktokPagination_clickNext,
  scrollToBottom,
  tiktokAds_setDateRange,
  tiktokClickExport
};
