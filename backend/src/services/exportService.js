const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { formatCurrency } = require('../utils/currencyConverter');
const { Readable } = require('stream');

/**
 * Export Service
 * Handles exporting expense data to Excel and PDF formats
 */

/**
 * Calculate expense summary
 * @param {array} expenses - Array of expense objects
 * @returns {object} Summary object
 */
const calculateSummary = (expenses) => {
  const summary = {
    total: 0,
    byCategory: {},
    byMerchant: {},
    byMonth: {}
  };

  expenses.forEach(expense => {
    // Total
    summary.total += expense.amount;

    // By category
    if (!summary.byCategory[expense.category]) {
      summary.byCategory[expense.category] = 0;
    }
    summary.byCategory[expense.category] += expense.amount;

    // By merchant
    if (expense.merchant) {
      if (!summary.byMerchant[expense.merchant]) {
        summary.byMerchant[expense.merchant] = 0;
      }
      summary.byMerchant[expense.merchant] += expense.amount;
    }

    // By month
    const monthKey = new Date(expense.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    if (!summary.byMonth[monthKey]) {
      summary.byMonth[monthKey] = 0;
    }
    summary.byMonth[monthKey] += expense.amount;
  });

  return summary;
};

/**
 * Generate Excel file from expenses
 * @param {array} expenses - Array of expense objects
 * @param {string} currency - User's currency
 * @returns {Promise<Buffer>} Excel file buffer
 */
const generateExcel = async (expenses, currency) => {
  const workbook = new ExcelJS.Workbook();

  // Set workbook properties
  workbook.creator = 'WealthWise';
  workbook.created = new Date();

  // Create worksheet
  const worksheet = workbook.addWorksheet('Expenses', {
    properties: { tabColor: { argb: '8B5CF6' } }
  });

  // Define columns
  worksheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Category', key: 'category', width: 15 },
    { header: 'Merchant', key: 'merchant', width: 20 },
    { header: 'Description', key: 'description', width: 30 },
    { header: 'Amount', key: 'amount', width: 15 },
    { header: 'Payment Method', key: 'paymentMethod', width: 15 }
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '8B5CF6' }
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // Add data rows
  expenses.forEach(expense => {
    worksheet.addRow({
      date: new Date(expense.date).toLocaleDateString(),
      category: expense.category || '',
      merchant: expense.merchant || '',
      description: expense.description || '',
      amount: expense.amount || 0,
      paymentMethod: expense.paymentMethod || ''
    });
  });

  // Format amount column as currency
  worksheet.getColumn('amount').numFmt = '#,##0.00';
  worksheet.getColumn('amount').alignment = { horizontal: 'right' };

  // Add summary section
  const summaryStartRow = expenses.length + 3;
  const summary = calculateSummary(expenses);

  worksheet.getCell(`A${summaryStartRow}`).value = 'SUMMARY';
  worksheet.getCell(`A${summaryStartRow}`).font = { bold: true, size: 14 };

  worksheet.getCell(`A${summaryStartRow + 1}`).value = 'Total Expenses:';
  worksheet.getCell(`B${summaryStartRow + 1}`).value = summary.total;
  worksheet.getCell(`B${summaryStartRow + 1}`).numFmt = '#,##0.00';
  worksheet.getCell(`B${summaryStartRow + 1}`).font = { bold: true };

  worksheet.getCell(`A${summaryStartRow + 2}`).value = 'Total Transactions:';
  worksheet.getCell(`B${summaryStartRow + 2}`).value = expenses.length;
  worksheet.getCell(`B${summaryStartRow + 2}`).font = { bold: true };

  // Add category summary
  let categoryRow = summaryStartRow + 4;
  worksheet.getCell(`A${categoryRow}`).value = 'BY CATEGORY';
  worksheet.getCell(`A${categoryRow}`).font = { bold: true };
  categoryRow++;

  Object.entries(summary.byCategory).forEach(([category, amount]) => {
    worksheet.getCell(`A${categoryRow}`).value = category;
    worksheet.getCell(`B${categoryRow}`).value = amount;
    worksheet.getCell(`B${categoryRow}`).numFmt = '#,##0.00';
    categoryRow++;
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

/**
 * Generate PDF file from expenses
 * @param {array} expenses - Array of expense objects
 * @param {string} currency - User's currency
 * @returns {Promise<Buffer>} PDF file buffer
 */
const generatePDF = async (expenses, currency) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      // Collect PDF data
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const summary = calculateSummary(expenses);

      // Header
      doc.fontSize(20).fillColor('#8B5CF6').text('WealthWise Expense Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).fillColor('#666666').text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      // Summary Box
      doc.fontSize(14).fillColor('#000000').text('Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      doc.text(`Total Expenses: ${formatCurrency(summary.total, currency)}`);
      doc.text(`Number of Transactions: ${expenses.length}`);
      doc.moveDown();

      // Category Summary
      doc.fontSize(12).fillColor('#8B5CF6').text('Expenses by Category', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#000000');

      Object.entries(summary.byCategory)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, amount]) => {
          const percentage = ((amount / summary.total) * 100).toFixed(1);
          doc.text(`${category}: ${formatCurrency(amount, currency)} (${percentage}%)`);
        });

      doc.moveDown();

      // Transactions Table
      doc.fontSize(12).fillColor('#8B5CF6').text('Detailed Transactions', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#000000');

      // Table header
      const tableTop = doc.y;
      const colWidths = {
        date: 70,
        category: 80,
        merchant: 100,
        amount: 80,
        payment: 80
      };

      doc.font('Helvetica-Bold');
      doc.text('Date', 50, tableTop, { width: colWidths.date, continued: true });
      doc.text('Category', { width: colWidths.category, continued: true });
      doc.text('Merchant', { width: colWidths.merchant, continued: true });
      doc.text('Amount', { width: colWidths.amount, continued: true });
      doc.text('Payment', { width: colWidths.payment });

      doc.moveDown(0.3);
      doc.strokeColor('#CCCCCC').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);

      // Table rows
      doc.font('Helvetica');
      expenses.forEach((expense, index) => {
        // Check if we need a new page
        if (doc.y > 700) {
          doc.addPage();
          doc.fontSize(9);
        }

        const y = doc.y;
        doc.text(new Date(expense.date).toLocaleDateString(), 50, y, { width: colWidths.date, continued: true });
        doc.text(expense.category || '', { width: colWidths.category, continued: true });
        doc.text(expense.merchant || '', { width: colWidths.merchant, continued: true });
        doc.text(expense.amount.toFixed(2), { width: colWidths.amount, continued: true });
        doc.text(expense.paymentMethod || '', { width: colWidths.payment });

        if (expense.description) {
          doc.fontSize(8).fillColor('#666666');
          doc.text(`   ${expense.description}`, 50);
          doc.fontSize(9).fillColor('#000000');
        }

        doc.moveDown(0.3);
      });

      // Footer
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#999999');
        doc.text(
          `Page ${i + 1} of ${pages.count}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Export expenses to specified format
 * @param {array} expenses - Array of expense objects
 * @param {string} format - Export format ('excel', 'pdf')
 * @param {string} currency - User's currency
 * @returns {Promise<object>} Export result with data and metadata
 */
const exportExpenses = async (expenses, format, currency = 'INR') => {
  if (!expenses || expenses.length === 0) {
    return {
      success: false,
      error: 'No expenses to export'
    };
  }

  try {
    switch (format.toLowerCase()) {
      case 'excel':
      case 'xlsx':
        const excelBuffer = await generateExcel(expenses, currency);
        return {
          success: true,
          data: excelBuffer,
          filename: `expenses_${Date.now()}.xlsx`,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };

      case 'pdf':
        const pdfBuffer = await generatePDF(expenses, currency);
        return {
          success: true,
          data: pdfBuffer,
          filename: `expenses_${Date.now()}.pdf`,
          contentType: 'application/pdf'
        };

      default:
        return {
          success: false,
          error: 'Invalid export format. Use excel or pdf'
        };
    }
  } catch (error) {
    console.error('Export error:', error);
    return {
      success: false,
      error: `Export failed: ${error.message}`
    };
  }
};

/**
 * Generate categorized expense report
 * @param {array} expenses - Array of expense objects
 * @param {string} currency - User's currency
 * @returns {object} Categorized report
 */
const generateCategorizedReport = (expenses, currency = 'INR') => {
  const summary = calculateSummary(expenses);
  const totalSpent = summary.total;

  const categorizedData = Object.entries(summary.byCategory).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalSpent > 0 ? ((amount / totalSpent) * 100).toFixed(2) : 0,
    formattedAmount: formatCurrency(amount, currency)
  }));

  // Sort by amount descending
  categorizedData.sort((a, b) => b.amount - a.amount);

  return {
    success: true,
    totalSpent: formatCurrency(totalSpent, currency),
    totalSpentRaw: totalSpent,
    categories: categorizedData,
    transactionCount: expenses.length
  };
};

module.exports = {
  exportExpenses,
  generateCategorizedReport,
  calculateSummary,
  generateExcel,
  generatePDF
};
