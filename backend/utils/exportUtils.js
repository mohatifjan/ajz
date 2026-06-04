import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { stringify } from 'csv-stringify/sync';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const generatePDFReport = async (title, headers, data, filename) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        bufferPages: true
      });

      const filePath = join(__dirname, '../temp', filename);
      const stream = createWriteStream(filePath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('AJZ - Point of Sale System', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(title, { align: 'center' });
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown();

      // Table
      const startX = 50;
      const startY = doc.y;
      const colWidth = (doc.page.width - 100) / headers.length;
      const rowHeight = 20;

      // Header row
      doc.fontSize(10).font('Helvetica-Bold');
      headers.forEach((header, i) => {
        doc.text(header, startX + i * colWidth, startY, { width: colWidth, align: 'left' });
      });

      doc.moveTo(startX, startY + rowHeight).lineTo(doc.page.width - 50, startY + rowHeight).stroke();

      // Data rows
      doc.font('Helvetica').fontSize(9);
      let currentY = startY + rowHeight + 5;

      data.forEach((row, idx) => {
        if (currentY > doc.page.height - 100) {
          doc.addPage();
          currentY = 50;
        }

        headers.forEach((header, colIdx) => {
          const value = row[header] || '';
          doc.text(String(value).substring(0, 30), startX + colIdx * colWidth, currentY, {
            width: colWidth,
            align: 'left'
          });
        });

        currentY += rowHeight;
      });

      doc.end();

      stream.on('finish', () => {
        resolve(filePath);
      });
    } catch (error) {
      reject(error);
    }
  });
};

export const generateExcelReport = async (title, sheets, filename) => {
  try {
    const workbook = new ExcelJS.Workbook();

    sheets.forEach((sheet) => {
      const worksheet = workbook.addWorksheet(sheet.name);

      // Add title
      worksheet.mergeCells('A1', `H1`);
      const titleCell = worksheet.getCell('A1');
      titleCell.value = title;
      titleCell.font = { bold: true, size: 14 };
      titleCell.alignment = { horizontal: 'center', vertical: 'center' };

      // Add headers
      const headers = sheet.headers;
      headers.forEach((header, idx) => {
        const cell = worksheet.getCell(3, idx + 1);
        cell.value = header;
        cell.font = { bold: true, color: { rgb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'FF366092' } };
        cell.alignment = { horizontal: 'center', vertical: 'center' };
      });

      // Add data
      sheet.data.forEach((row, rowIdx) => {
        headers.forEach((header, colIdx) => {
          const cell = worksheet.getCell(4 + rowIdx, colIdx + 1);
          cell.value = row[header] || '';
          cell.alignment = { horizontal: 'left', vertical: 'center' };

          // Add borders
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      // Auto adjust column widths
      headers.forEach((header, idx) => {
        const maxLength = Math.max(
          header.length,
          ...sheet.data.map(row => String(row[header] || '').length)
        );
        worksheet.getColumn(idx + 1).width = Math.min(maxLength + 2, 50);
      });
    });

    const filePath = join(__dirname, '../temp', filename);
    await workbook.xlsx.writeFile(filePath);
    return filePath;
  } catch (error) {
    throw error;
  }
};

export const generateCSVReport = (headers, data, filename) => {
  try {
    const csv = stringify([headers, ...data.map(row => headers.map(h => row[h] || ''))]);
    const filePath = join(__dirname, '../temp', filename);
    const stream = createWriteStream(filePath);
    stream.write(csv);
    stream.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  } catch (error) {
    throw error;
  }
};

export const formatCurrency = (amount) => {
  return `Rs. ${Number(amount).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const formatNumber = (num) => {
  return Number(num).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
