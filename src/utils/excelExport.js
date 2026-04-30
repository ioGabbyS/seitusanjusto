import * as XLSX from 'xlsx';

/**
 * Exports data to an Excel file.
 * @param {Array} data - Array of objects to export.
 * @param {string} fileName - Name of the file to be downloaded (without extension).
 * @param {string} sheetName - Name of the worksheet.
 */
export const exportToExcel = (data, fileName, sheetName = 'Sheet1') => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
