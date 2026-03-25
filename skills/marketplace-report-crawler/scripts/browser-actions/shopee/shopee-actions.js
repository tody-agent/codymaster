/**
 * Shopee Browser Actions
 * ==================================================
 * JavaScript snippets to inject into Shopee Seller pages.
 */

/**
 * Select month range on Shopee's typical calendar-range picker
 * Used for platform_income, platform_wallet, ads_wallet_historical
 */
function shopeeCalendar_selectMonthRange(yearMonth) {
  // Shopee usually has a date range input that opens a popper with two calendars.
  const dateRangeInputs = document.querySelectorAll('.shopee-date-range-picker input');
  if (dateRangeInputs.length > 0) {
    dateRangeInputs[0].click(); // Open picker
    
    setTimeout(() => {
      // Very naive approach: try to find 'THIS_MONTH' or 'LAST_MONTH' button
      // Or try to select the 1st and last day. Shopee's calendar is highly custom.
      const lastMonthBtn = Array.from(document.querySelectorAll('.shopee-popover span, .shopee-popover div')).find(el => el.textContent.trim() === 'Tháng trước' || el.textContent.trim() === 'Last Month');
      if (lastMonthBtn) {
        lastMonthBtn.click();
      }
    }, 500);
  }
}

/**
 * Select a specific month in a month-picker
 * Used for platform_report (PDF)
 */
function shopeeMonthPicker_selectMonth(yearMonth) {
  const monthInput = document.querySelector('.shopeesc-month-picker, .month-picker-input');
  if (monthInput) {
    monthInput.click();
    setTimeout(() => {
      // Find the specific month cell
      const monthStr = parseInt(yearMonth.substring(4, 6), 10).toString();
      const cells = document.querySelectorAll('.month-cell, .shopee-month-table td');
      for (const cell of cells) {
        if (cell.textContent.trim() === monthStr || cell.textContent.trim().includes(`Tháng ${monthStr}`)) {
          cell.click();
          break;
        }
      }
    }, 500);
  }
}

/**
 * Input Start and End date directly into text inputs
 * Used for paid_ads_onsite_report (date_input)
 */
function shopeeDateInput_setDate(startDateStr, endDateStr) {
  // Usually there are two inputs: start date and end date
  const inputs = document.querySelectorAll('.shopee-input__input[placeholder*="YYYY"], input[placeholder*="Ngày"]');
  if (inputs.length >= 2) {
    // Start date
    const startInput = inputs[0];
    startInput.value = startDateStr;
    startInput.dispatchEvent(new Event('input', { bubbles: true }));
    startInput.dispatchEvent(new Event('change', { bubbles: true }));

    // End date
    const endInput = inputs[1];
    endInput.value = endDateStr;
    endInput.dispatchEvent(new Event('input', { bubbles: true }));
    endInput.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

/**
 * Click export button
 */
function shopeeClickExport() {
  // Tries to find common export buttons
  const exportBtn = Array.from(document.querySelectorAll('button')).find(btn => {
    const text = btn.textContent.trim().toLowerCase();
    return text.includes('xuất') || text.includes('export') || text.includes('tải');
  });
  
  if (exportBtn) {
    exportBtn.click();
    return true;
  }
  return false;
}

module.exports = {
  shopeeCalendar_selectMonthRange,
  shopeeMonthPicker_selectMonth,
  shopeeDateInput_setDate,
  shopeeClickExport
};
