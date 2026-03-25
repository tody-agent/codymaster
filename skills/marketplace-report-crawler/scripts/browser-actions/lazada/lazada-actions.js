/**
 * Lazada Browser Actions
 * ==================================================
 * JavaScript snippets to inject into Lazada Seller Center pages.
 */

/**
 * Open calendar and go to the target month using next/prev buttons
 * Used for platform_income, platform_wallet
 */
function lazadaCalendar_selectMonthRange(yearMonth) {
  // Try to find the date picker input
  const dateInputs = document.querySelectorAll('.next-date-picker-input input, input[placeholder*="YYYY"]');
  if (dateInputs.length > 0) {
    dateInputs[0].click(); // Open picker
    
    setTimeout(() => {
      // Find the 'Last Month' preset if it exists
      const presets = document.querySelectorAll('.next-date-picker-quick span');
      for (const preset of presets) {
        if (preset.textContent.trim() === 'Tháng trước' || preset.textContent.trim() === 'Last month') {
          preset.click();
          return;
        }
      }
      
      // Otherwise find the 'OK' button and click it to accept default (usually last 30 days)
      const okBtn = document.querySelector('.next-btn-primary');
      if (okBtn) okBtn.click();
    }, 500);
  }
}

/**
 * Lazada Paid Ads uses a specific date input format
 * Used for paid_ads_onsite_report, paid_ads_product
 */
function lazadaAds_setDateRange(startDateStr, endDateStr) {
  // Check the 'Product' checkbox if needed for paid_ads_product
  const productCheckbox = document.querySelector('input[type="checkbox"][value="product"]');
  if (productCheckbox && !productCheckbox.checked) {
    productCheckbox.click();
  }

  // Find date inputs (DD/MM/YYYY format usually)
  const inputs = document.querySelectorAll('.next-input input');
  if (inputs.length >= 2) {
    // Start Date
    inputs[0].value = startDateStr;
    inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    inputs[0].dispatchEvent(new Event('change', { bubbles: true }));

    // End Date
    inputs[1].value = endDateStr;
    inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
    inputs[1].dispatchEvent(new Event('change', { bubbles: true }));
  }
}

/**
 * Select from Lazada dropdown list
 * Used for shipping_fee_details 
 */
function lazadaMultiSelect_selectDates(targetYYYYMM) {
  // Find the dropdown button
  const dropdownTrigger = document.querySelector('.next-select-trigger');
  if (dropdownTrigger) {
    dropdownTrigger.click();

    setTimeout(() => {
        // Select logic
        const items = document.querySelectorAll('.next-menu-item');
        for(const item of items) {
            if(item.textContent.trim().includes(targetYYYYMM)) {
                item.click();
            }
        }
    }, 500);
  }
}

/**
 * Click export button on Lazada
 */
function lazadaClickExport() {
  const buttons = document.querySelectorAll('button');
  for (const btn of buttons) {
    const text = btn.textContent.trim().toLowerCase();
    if (text.includes('tải xuống') || text.includes('xuất dữ liệu') || text.includes('export') || text.includes('download')) {
      btn.click();
      
      // Some export buttons open a dropdown. If so, look for Excel/PDF option.
      setTimeout(() => {
        const menuItems = document.querySelectorAll('.next-menu-item');
        for (const item of menuItems) {
            if (item.textContent.toLowerCase().includes('excel') || item.textContent.toLowerCase().includes('pdf')) {
                item.click();
                return true;
            }
        }
      }, 500);
      
      return true;
    }
  }
  return false;
}

module.exports = {
  lazadaCalendar_selectMonthRange,
  lazadaAds_setDateRange,
  lazadaMultiSelect_selectDates,
  lazadaClickExport
};
