/**
 * Google Apps Script — Form to Sheet Handler
 * 
 * SETUP:
 * 1. Create Google Sheet with headers matching appendRow columns
 * 2. Extensions > Apps Script > paste this code
 * 3. Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the deployment URL → use in frontend URLS config
 * 
 * CUSTOMIZATION:
 * - Change SHEET_NAME if tab is not "Data"
 * - Modify appendRow columns to match your form fields
 * - Add more e.parameter.xxx for additional fields
 */

const SHEET_NAME = 'Data';

function doPost(e) {
    try {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
        if (!e || !e.parameter) {
            return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'No data received' }))
                .setMimeType(ContentService.MimeType.JSON);
        }

        const p = e.parameter;

        // ═══════════════════════════════════════
        // CUSTOMIZE: Change columns below to match your form
        // Column order MUST match Sheet header row
        // ═══════════════════════════════════════
        sheet.appendRow([
            new Date(),           // A: Thời gian (auto)
            p.name || '',         // B: Họ tên
            p.phone || '',        // C: SĐT
            // --- Add your custom fields below ---
            // p.email || '',      // D: Email
            // p.branch || '',     // E: Chi nhánh
            // p.problem || '',    // F: Vấn đề
            // p.time || '',       // G: Khung giờ
            // p.package || '',    // H: Gói dịch vụ
            // p.goal || '',       // I: Mục tiêu
            // --- End custom fields ---
            p.url || ''           // Last: Nguồn trang (auto)
        ]);

        return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
            .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}
