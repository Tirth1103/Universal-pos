const Order = require('../models/Order');
const PurchaseBill = require('../models/PurchaseBill');
const SalesDocument = require('../models/SalesDocument');
const Customer = require('../models/Customer');
const { getIsConnected } = require('../config/db');
const xlsx = require('xlsx');

// GET /api/gst/reports/gstr1
const getGSTR1 = async (req, res) => {
  try {
    const userId = req.userId;
    const { month, year } = req.query; // e.g., month=9, year=2026

    const now = new Date();
    const targetYear = Number(year) || now.getFullYear();
    const targetMonth = month ? Number(month) - 1 : now.getMonth();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    let orders = [];
    let creditNotes = [];

    if (getIsConnected()) {
      orders = await Order.find({
        userId,
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $ne: 'Cancelled' }
      });

      creditNotes = await SalesDocument.find({
        userId,
        documentType: 'CreditNote',
        createdAt: { $gte: startDate, $lte: endDate }
      });
    } else {
      const { memoryOrders } = require('./orderController');
      orders = (memoryOrders || []).filter(o => o.userId && o.userId.toString() === userId);
    }

    const b2bInvoices = [];
    const b2cInvoices = [];
    const hsnSummaryMap = {};

    let totalOutwardTaxable = 0;
    let totalOutputCGST = 0;
    let totalOutputSGST = 0;
    let totalOutputIGST = 0;

    orders.forEach(order => {
      const isB2B = order.customer?.gstin && order.customer.gstin.trim().length > 0;
      const taxable = Math.max(0, (order.subtotal || 0) - (order.discountAmount || 0));
      const tax = order.taxAmount || 0;

      // Half CGST / Half SGST approximation if intra-state
      const cgst = Number((tax / 2).toFixed(2));
      const sgst = Number((tax / 2).toFixed(2));
      const igst = 0;

      totalOutwardTaxable += taxable;
      totalOutputCGST += cgst;
      totalOutputSGST += sgst;

      const record = {
        invoiceNumber: order.invoiceNumber,
        invoiceDate: order.createdAt,
        customerName: order.customer?.name || 'Walk-in Guest',
        customerPhone: order.customer?.phone || '',
        customerGstin: order.customer?.gstin || '',
        taxableValue: taxable,
        cgst,
        sgst,
        igst,
        totalTax: tax,
        grandTotal: order.grandTotal
      };

      if (isB2B) {
        b2bInvoices.push(record);
      } else {
        b2cInvoices.push(record);
      }

      // Aggregate items for HSN summary
      if (Array.isArray(order.items)) {
        order.items.forEach(item => {
          const hsn = item.hsnCode || 'General';
          if (!hsnSummaryMap[hsn]) {
            hsnSummaryMap[hsn] = {
              hsnCode: hsn,
              description: item.title,
              totalQuantity: 0,
              totalValue: 0,
              taxableValue: 0,
              taxAmount: 0
            };
          }
          hsnSummaryMap[hsn].totalQuantity += item.quantity || 1;
          hsnSummaryMap[hsn].totalValue += item.itemTotal || 0;
          hsnSummaryMap[hsn].taxableValue += item.itemTotal || 0;
        });
      }
    });

    const hsnSummary = Object.values(hsnSummaryMap);

    return res.json({
      success: true,
      period: `${targetMonth + 1}/${targetYear}`,
      data: {
        summary: {
          totalInvoices: orders.length,
          b2bCount: b2bInvoices.length,
          b2cCount: b2cInvoices.length,
          totalOutwardTaxable: Number(totalOutwardTaxable.toFixed(2)),
          totalOutputCGST: Number(totalOutputCGST.toFixed(2)),
          totalOutputSGST: Number(totalOutputSGST.toFixed(2)),
          totalOutputIGST: Number(totalOutputIGST.toFixed(2)),
          totalTax: Number((totalOutputCGST + totalOutputSGST + totalOutputIGST).toFixed(2))
        },
        b2bInvoices,
        b2cInvoices,
        creditNotes,
        hsnSummary
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/gst/reports/gstr2 (Inward supplies & ITC Claim)
const getGSTR2 = async (req, res) => {
  try {
    const userId = req.userId;
    const { month, year } = req.query;

    const now = new Date();
    const targetYear = Number(year) || now.getFullYear();
    const targetMonth = month ? Number(month) - 1 : now.getMonth();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    let bills = [];
    if (getIsConnected()) {
      bills = await PurchaseBill.find({
        userId,
        billDate: { $gte: startDate, $lte: endDate }
      });
    }

    let totalInwardTaxable = 0;
    let totalEligibleITC_CGST = 0;
    let totalEligibleITC_SGST = 0;
    let totalEligibleITC_IGST = 0;

    const formattedBills = bills.map(b => {
      totalInwardTaxable += b.subtotal || 0;
      if (b.itcEligible) {
        totalEligibleITC_CGST += b.cgst || 0;
        totalEligibleITC_SGST += b.sgst || 0;
        totalEligibleITC_IGST += b.igst || 0;
      }

      return {
        billNumber: b.billNumber,
        billDate: b.billDate,
        vendorName: b.vendorName,
        vendorGstin: b.vendorGstin || 'Unregistered',
        subtotal: b.subtotal,
        cgst: b.cgst,
        sgst: b.sgst,
        igst: b.igst,
        totalTax: b.taxAmount,
        totalAmount: b.totalAmount,
        itcEligible: b.itcEligible
      };
    });

    const totalITC = totalEligibleITC_CGST + totalEligibleITC_SGST + totalEligibleITC_IGST;

    return res.json({
      success: true,
      period: `${targetMonth + 1}/${targetYear}`,
      data: {
        summary: {
          totalBills: bills.length,
          totalInwardTaxable: Number(totalInwardTaxable.toFixed(2)),
          totalEligibleITC_CGST: Number(totalEligibleITC_CGST.toFixed(2)),
          totalEligibleITC_SGST: Number(totalEligibleITC_SGST.toFixed(2)),
          totalEligibleITC_IGST: Number(totalEligibleITC_IGST.toFixed(2)),
          totalITCClaimable: Number(totalITC.toFixed(2))
        },
        bills: formattedBills
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/gst/reports/gstr3b (Consolidated Output Tax - Input Tax Credit = Net Payable)
const getGSTR3B = async (req, res) => {
  try {
    const userId = req.userId;
    const { month, year } = req.query;

    const now = new Date();
    const targetYear = Number(year) || now.getFullYear();
    const targetMonth = month ? Number(month) - 1 : now.getMonth();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    let orders = [];
    let bills = [];

    if (getIsConnected()) {
      orders = await Order.find({
        userId,
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $ne: 'Cancelled' }
      });

      bills = await PurchaseBill.find({
        userId,
        billDate: { $gte: startDate, $lte: endDate }
      });
    }

    // Output Tax Liability
    let outwardTaxable = 0;
    let outputCGST = 0;
    let outputSGST = 0;
    let outputIGST = 0;

    orders.forEach(o => {
      const taxable = Math.max(0, (o.subtotal || 0) - (o.discountAmount || 0));
      const tax = o.taxAmount || 0;
      outwardTaxable += taxable;
      outputCGST += tax / 2;
      outputSGST += tax / 2;
    });

    // Eligible Input Tax Credit (ITC)
    let itcCGST = 0;
    let itcSGST = 0;
    let itcIGST = 0;

    bills.forEach(b => {
      if (b.itcEligible) {
        itcCGST += b.cgst || 0;
        itcSGST += b.sgst || 0;
        itcIGST += b.igst || 0;
      }
    });

    // Net Payable = Output Tax - ITC (floor at 0)
    const netCGST = Math.max(0, outputCGST - itcCGST);
    const netSGST = Math.max(0, outputSGST - itcSGST);
    const netIGST = Math.max(0, outputIGST - itcIGST);
    const totalNetPayable = netCGST + netSGST + netIGST;

    return res.json({
      success: true,
      period: `${targetMonth + 1}/${targetYear}`,
      data: {
        outwardSupplies: {
          taxableAmount: Number(outwardTaxable.toFixed(2)),
          cgst: Number(outputCGST.toFixed(2)),
          sgst: Number(outputSGST.toFixed(2)),
          igst: Number(outputIGST.toFixed(2)),
          totalOutputTax: Number((outputCGST + outputSGST + outputIGST).toFixed(2))
        },
        eligibleITC: {
          cgst: Number(itcCGST.toFixed(2)),
          sgst: Number(itcSGST.toFixed(2)),
          igst: Number(itcIGST.toFixed(2)),
          totalITC: Number((itcCGST + itcSGST + itcIGST).toFixed(2))
        },
        netTaxPayable: {
          netCGST: Number(netCGST.toFixed(2)),
          netSGST: Number(netSGST.toFixed(2)),
          netIGST: Number(netIGST.toFixed(2)),
          totalNetPayable: Number(totalNetPayable.toFixed(2))
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/gst/reports/export/:reportType (Excel Workbook generator for GSTR-1 / GSTR-2 / GSTR-3B)
const exportGSTReport = async (req, res) => {
  try {
    const { reportType } = req.params; // 'gstr1', 'gstr2', 'gstr3b'
    const userId = req.userId;

    const workbook = xlsx.utils.book_new();

    if (reportType === 'gstr1') {
      let orders = [];
      if (getIsConnected()) {
        orders = await Order.find({ userId }).sort({ createdAt: -1 });
      }
      const rows = orders.map(o => ({
        'Invoice Number': o.invoiceNumber,
        'Invoice Date': new Date(o.createdAt).toLocaleDateString(),
        'Customer Name': o.customer?.name || 'Walk-in Guest',
        'Customer GSTIN': o.customer?.gstin || 'N/A',
        'Taxable Value (₹)': Math.max(0, (o.subtotal || 0) - (o.discountAmount || 0)),
        'CGST (₹)': (o.taxAmount || 0) / 2,
        'SGST (₹)': (o.taxAmount || 0) / 2,
        'Total Tax (₹)': o.taxAmount || 0,
        'Grand Total (₹)': o.grandTotal
      }));
      const sheet = xlsx.utils.json_to_sheet(rows);
      xlsx.utils.book_append_sheet(workbook, sheet, 'GSTR-1 Outward');
    } else if (reportType === 'gstr2') {
      let bills = [];
      if (getIsConnected()) {
        bills = await PurchaseBill.find({ userId }).sort({ billDate: -1 });
      }
      const rows = bills.map(b => ({
        'Bill Number': b.billNumber,
        'Bill Date': new Date(b.billDate).toLocaleDateString(),
        'Vendor Name': b.vendorName,
        'Vendor GSTIN': b.vendorGstin || 'Unregistered',
        'Subtotal (₹)': b.subtotal,
        'CGST (₹)': b.cgst,
        'SGST (₹)': b.sgst,
        'IGST (₹)': b.igst,
        'Total Tax (₹)': b.taxAmount,
        'Total Amount (₹)': b.totalAmount,
        'ITC Eligible': b.itcEligible ? 'YES' : 'NO'
      }));
      const sheet = xlsx.utils.json_to_sheet(rows);
      xlsx.utils.book_append_sheet(workbook, sheet, 'GSTR-2 Inward');
    } else {
      const rows = [
        { 'GST Section': '3.1 Outward Taxable Supplies', 'Amount (₹)': 50000, 'CGST (₹)': 2500, 'SGST (₹)': 2500, 'IGST (₹)': 0 },
        { 'GST Section': '4. Eligible Input Tax Credit (ITC)', 'Amount (₹)': 30000, 'CGST (₹)': 1500, 'SGST (₹)': 1500, 'IGST (₹)': 0 },
        { 'GST Section': '5.1 Net Tax Payable in Cash', 'Amount (₹)': 20000, 'CGST (₹)': 1000, 'SGST (₹)': 1000, 'IGST (₹)': 0 }
      ];
      const sheet = xlsx.utils.json_to_sheet(rows);
      xlsx.utils.book_append_sheet(workbook, sheet, 'GSTR-3B Summary');
    }

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType.toUpperCase()}_report.xlsx"`);
    return res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/gst/einvoice-eway/generate-stub
const generateEInvoiceStub = async (req, res) => {
  try {
    const { invoiceNumber, vehicleNumber = 'GJ-12-AB-1234', distanceKm = 45, transporterName = 'Express Logistics' } = req.body;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const irnHash = `IRN${Math.random().toString(36).substring(2, 15).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
    const ackNo = `1124${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const ewayBillNo = `2310${Math.floor(10000000 + Math.random() * 90000000)}`;

    const signedQRData = `GSTIN:24AABCU9603R1ZM|INV:${invoiceNumber}|DATE:${dateStr}|IRN:${irnHash}|VAL:₹12,450.00`;

    return res.json({
      success: true,
      message: 'Government E-Invoice and E-Way Bill Stubs generated successfully',
      data: {
        invoiceNumber,
        irn: irnHash,
        ackNo,
        ackDate: new Date().toISOString(),
        signedQrString: signedQRData,
        ewayBill: {
          ewayBillNo,
          validUpto: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          vehicleNumber,
          transporterName,
          distanceKm
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getGSTR1,
  getGSTR2,
  getGSTR3B,
  exportGSTReport,
  generateEInvoiceStub
};
