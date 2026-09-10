const SalesDocument = require('../models/SalesDocument');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { getIsConnected } = require('../config/db');
const PDFDocument = require('pdfkit');

let memorySalesDocuments = [];

// Helper to generate formatted sequential doc number
const generateDocNumber = (type) => {
  const prefixMap = {
    Estimate: 'EST',
    ProformaInvoice: 'PI',
    SalesOrder: 'SO',
    DeliveryChallan: 'DC',
    CreditNote: 'CN'
  };
  const prefix = prefixMap[type] || 'DOC';
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${random}`;
};

// GET /api/documents
const getDocuments = async (req, res) => {
  try {
    const userId = req.userId;
    const { type, status, search } = req.query;

    if (getIsConnected()) {
      let query = { userId };
      if (type && type !== 'All') query.documentType = type;
      if (status && status !== 'All') query.status = status;
      if (search) {
        query.$or = [
          { docNumber: { $regex: search, $options: 'i' } },
          { 'customer.name': { $regex: search, $options: 'i' } },
          { 'customer.phone': { $regex: search, $options: 'i' } }
        ];
      }

      const docs = await SalesDocument.find(query).sort({ createdAt: -1 });
      return res.json({ success: true, count: docs.length, data: docs });
    } else {
      let list = memorySalesDocuments.filter(d => d.userId && d.userId.toString() === userId);
      if (type && type !== 'All') list = list.filter(d => d.documentType === type);
      if (status && status !== 'All') list = list.filter(d => d.status === status);
      if (search) {
        const s = search.toLowerCase();
        list = list.filter(d =>
          d.docNumber.toLowerCase().includes(s) ||
          (d.customer?.name && d.customer.name.toLowerCase().includes(s))
        );
      }
      return res.json({ success: true, count: list.length, data: list, isMemory: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/documents/:id
const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (getIsConnected()) {
      const doc = await SalesDocument.findOne({ _id: id, userId });
      if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
      return res.json({ success: true, data: doc });
    } else {
      const doc = memorySalesDocuments.find(d => (d._id === id || d.id === id) && d.userId === userId);
      if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
      return res.json({ success: true, data: doc });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/documents
const createDocument = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      documentType = 'Estimate',
      customer = {},
      items = [],
      wholeBillDiscount = { type: 'fixed', value: 0, amount: 0 },
      taxRate = 0,
      isInterState = false,
      notes = '',
      terms = '',
      dueDate = null,
      referenceNumber = ''
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required' });
    }

    // Process items & calculations
    let subtotal = 0;
    let itemDiscountTotal = 0;

    const processedItems = items.map(item => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      const lineBase = qty * price;
      let discAmount = 0;

      if (item.discountPercent > 0) {
        discAmount = (lineBase * Number(item.discountPercent)) / 100;
      } else if (item.discountAmount > 0) {
        discAmount = Number(item.discountAmount);
      }
      discAmount = Math.min(lineBase, discAmount);
      itemDiscountTotal += discAmount;

      const taxableLine = lineBase - discAmount;
      const itemTaxRate = Number(item.taxRate || taxRate || 0);
      const taxAmt = (taxableLine * itemTaxRate) / 100;

      let cgst = 0, sgst = 0, igst = 0;
      if (isInterState) {
        igst = Number(taxAmt.toFixed(2));
      } else {
        cgst = Number((taxAmt / 2).toFixed(2));
        sgst = Number((taxAmt / 2).toFixed(2));
      }

      const itemTotal = Number((taxableLine + taxAmt).toFixed(2));
      subtotal += lineBase;

      return {
        productId: item.productId || null,
        title: item.title || 'Item',
        sku: item.sku || '',
        quantity: qty,
        unit: item.unit || 'pcs',
        unitPrice: price,
        discountPercent: Number(item.discountPercent) || 0,
        discountAmount: Number(discAmount.toFixed(2)),
        hsnCode: item.hsnCode || '',
        taxRate: itemTaxRate,
        cgst,
        sgst,
        igst,
        cess: Number(item.cess) || 0,
        batchNumber: item.batchNumber || '',
        serialNumber: item.serialNumber || '',
        itemTotal
      };
    });

    // Whole-bill discount calculation
    let billDisc = 0;
    if (wholeBillDiscount.type === 'percent') {
      billDisc = ((subtotal - itemDiscountTotal) * (Number(wholeBillDiscount.value) || 0)) / 100;
    } else {
      billDisc = Number(wholeBillDiscount.value) || 0;
    }
    const totalDiscount = Number((itemDiscountTotal + billDisc).toFixed(2));
    const taxableAmount = Math.max(0, subtotal - totalDiscount);

    // Document taxes
    let cgstTotal = 0, sgstTotal = 0, igstTotal = 0;
    processedItems.forEach(i => {
      cgstTotal += i.cgst;
      sgstTotal += i.sgst;
      igstTotal += i.igst;
    });
    const taxAmount = Number((cgstTotal + sgstTotal + igstTotal).toFixed(2));
    const rawTotal = taxableAmount + taxAmount;
    const grandTotal = Math.round(rawTotal); // Auto cash-rounding
    const roundOff = Number((grandTotal - rawTotal).toFixed(2));

    const docNumber = req.body.docNumber || generateDocNumber(documentType);

    const docData = {
      userId,
      documentType,
      docNumber,
      referenceNumber,
      customer: {
        id: customer.id || customer._id || null,
        name: customer.name || 'Walk-in Guest',
        phone: customer.phone || '',
        email: customer.email || '',
        gstin: customer.gstin || '',
        billingAddress: customer.billingAddress || {}
      },
      items: processedItems,
      subtotal: Number(subtotal.toFixed(2)),
      itemDiscountTotal: Number(itemDiscountTotal.toFixed(2)),
      wholeBillDiscount: {
        type: wholeBillDiscount.type || 'fixed',
        value: Number(wholeBillDiscount.value) || 0,
        amount: Number(billDisc.toFixed(2))
      },
      totalDiscount,
      taxableAmount: Number(taxableAmount.toFixed(2)),
      taxAmount,
      cgst: Number(cgstTotal.toFixed(2)),
      sgst: Number(sgstTotal.toFixed(2)),
      igst: Number(igstTotal.toFixed(2)),
      cess: 0,
      roundOff,
      grandTotal,
      status: 'Open',
      dueDate,
      notes,
      terms
    };

    if (getIsConnected()) {
      const newDoc = await SalesDocument.create(docData);
      return res.status(201).json({ success: true, message: `${documentType} created successfully`, data: newDoc });
    } else {
      const newDoc = {
        _id: 'doc_' + Date.now(),
        id: 'doc_' + Date.now(),
        ...docData,
        createdAt: new Date()
      };
      memorySalesDocuments.unshift(newDoc);
      return res.status(201).json({ success: true, message: `${documentType} created (session mode)`, data: newDoc });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/documents/:id/convert-to-invoice (1-Click conversion into Tax Invoice)
const convertToInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { paymentMethod = 'Cash', amountPaid = null } = req.body;

    let doc = null;
    if (getIsConnected()) {
      doc = await SalesDocument.findOne({ _id: id, userId });
    } else {
      doc = memorySalesDocuments.find(d => (d._id === id || d.id === id) && d.userId === userId);
    }

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (doc.status === 'Converted') {
      return res.status(400).json({
        success: false,
        message: 'This document has already been converted to a Tax Invoice',
        invoiceId: doc.convertedInvoiceId
      });
    }

    // Convert document items to Order items format
    const orderItems = doc.items.map(item => ({
      productId: item.productId,
      title: item.title,
      productTitle: item.title,
      sku: item.sku,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      itemTotal: item.itemTotal
    }));

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${dateStr}-${randomNum}`;

    const finalAmountPaid = amountPaid !== null ? Number(amountPaid) : doc.grandTotal;

    const orderPayload = {
      userId,
      invoiceNumber,
      storeName: req.user?.storeName || 'My Retail Store',
      storeLogo: req.user?.storeLogo || '',
      storeBranch: req.user?.storeBranch || 'Main Branch',
      customer: {
        id: doc.customer?.id || null,
        name: doc.customer?.name || 'Walk-in Guest',
        phone: doc.customer?.phone || ''
      },
      items: orderItems,
      subtotal: doc.subtotal,
      discountAmount: doc.totalDiscount,
      taxAmount: doc.taxAmount,
      grandTotal: doc.grandTotal,
      paymentMethod,
      amountPaid: finalAmountPaid,
      changeGiven: Math.max(0, finalAmountPaid - doc.grandTotal),
      cashierName: req.user?.name || 'Operator',
      status: 'Completed'
    };

    if (getIsConnected()) {
      const order = await Order.create(orderPayload);

      // Decrement inventory stock
      for (const it of doc.items) {
        if (it.productId) {
          await Product.findByIdAndUpdate(it.productId, {
            $inc: { stock: -it.quantity }
          });
        }
      }

      // Mark document converted
      doc.status = 'Converted';
      doc.convertedInvoiceId = order._id;
      doc.convertedAt = new Date();
      await doc.save();

      return res.json({
        success: true,
        message: `Successfully converted ${doc.documentType} #${doc.docNumber} to Tax Invoice #${order.invoiceNumber}`,
        data: { document: doc, order }
      });
    } else {
      const order = {
        _id: 'ord_' + Date.now(),
        id: 'ord_' + Date.now(),
        ...orderPayload,
        createdAt: new Date()
      };
      doc.status = 'Converted';
      doc.convertedInvoiceId = order._id;
      doc.convertedAt = new Date();

      return res.json({
        success: true,
        message: `Successfully converted ${doc.documentType} to Tax Invoice #${order.invoiceNumber}`,
        data: { document: doc, order }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/documents/:id/pdf (Generate and stream PDF)
const generateDocumentPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    let doc = null;
    if (getIsConnected()) {
      doc = await SalesDocument.findOne({ _id: id, userId });
    } else {
      doc = memorySalesDocuments.find(d => (d._id === id || d.id === id) && d.userId === userId);
    }

    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    // Set response headers for PDF stream
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${doc.docNumber}.pdf"`);

    const pdf = new PDFDocument({ margin: 40, size: 'A4' });
    pdf.pipe(res);

    // Header
    pdf.fontSize(20).text(req.user?.storeName || 'UNIVERSAL RETAIL STORE', { align: 'center', bold: true });
    pdf.fontSize(10).text(req.user?.storeBranch || 'Tax & Commercial Invoicing', { align: 'center' });
    pdf.moveDown(0.5);

    // Document Title Banner
    pdf.rect(40, pdf.y, 515, 25).fill('#051f14');
    pdf.fillColor('#fde047').fontSize(12).text(doc.documentType.toUpperCase(), 50, pdf.y + 6, { bold: true });
    pdf.fillColor('#ffffff').fontSize(10).text(`Doc #: ${doc.docNumber}`, 400, pdf.y - 12);
    pdf.moveDown(2);

    // Document Info & Customer
    pdf.fillColor('#000000').fontSize(10);
    const topY = pdf.y;
    pdf.text(`Date: ${new Date(doc.createdAt).toLocaleDateString()}`, 40, topY);
    if (doc.dueDate) {
      pdf.text(`Due Date: ${new Date(doc.dueDate).toLocaleDateString()}`, 40, topY + 14);
    }
    pdf.text(`Status: ${doc.status}`, 40, topY + 28);

    pdf.text(`Billed To:`, 320, topY, { bold: true });
    pdf.text(doc.customer?.name || 'Walk-in Guest', 320, topY + 14);
    pdf.text(`Phone: ${doc.customer?.phone || 'N/A'}`, 320, topY + 28);
    if (doc.customer?.gstin) {
      pdf.text(`GSTIN: ${doc.customer.gstin}`, 320, topY + 42);
    }
    pdf.moveDown(3);

    // Table Header
    const tableTop = pdf.y;
    pdf.rect(40, tableTop, 515, 20).fill('#f4e4b9');
    pdf.fillColor('#051f14').fontSize(9).text('Item', 50, tableTop + 5, { bold: true });
    pdf.text('SKU', 220, tableTop + 5, { bold: true });
    pdf.text('Qty', 300, tableTop + 5, { bold: true });
    pdf.text('Rate', 360, tableTop + 5, { bold: true });
    pdf.text('Tax', 420, tableTop + 5, { bold: true });
    pdf.text('Total (INR)', 470, tableTop + 5, { bold: true });

    let currentY = tableTop + 24;
    doc.items.forEach(it => {
      pdf.fillColor('#000000').fontSize(9);
      pdf.text(it.title, 50, currentY, { width: 160 });
      pdf.text(it.sku || '-', 220, currentY);
      pdf.text(`${it.quantity} ${it.unit}`, 300, currentY);
      pdf.text(`₹${it.unitPrice.toFixed(2)}`, 360, currentY);
      pdf.text(`${it.taxRate}%`, 420, currentY);
      pdf.text(`₹${it.itemTotal.toFixed(2)}`, 470, currentY);
      currentY += 20;
    });

    pdf.moveDown();
    pdf.y = currentY + 10;
    pdf.strokeColor('#cccccc').lineWidth(1).moveTo(40, pdf.y).lineTo(555, pdf.y).stroke();
    pdf.moveDown(0.5);

    // Totals
    const summaryX = 350;
    pdf.fontSize(9).text(`Subtotal:`, summaryX);
    pdf.text(`₹${doc.subtotal.toFixed(2)}`, 480, pdf.y - 11);
    pdf.text(`Total Discount:`, summaryX);
    pdf.text(`-₹${doc.totalDiscount.toFixed(2)}`, 480, pdf.y - 11);
    pdf.text(`Tax Amount (GST):`, summaryX);
    pdf.text(`₹${doc.taxAmount.toFixed(2)}`, 480, pdf.y - 11);
    if (doc.roundOff !== 0) {
      pdf.text(`Round Off:`, summaryX);
      pdf.text(`₹${doc.roundOff.toFixed(2)}`, 480, pdf.y - 11);
    }
    pdf.fontSize(12).text(`Grand Total:`, summaryX, pdf.y + 4, { bold: true });
    pdf.fontSize(12).text(`₹${doc.grandTotal.toFixed(2)}`, 480, pdf.y - 14, { bold: true });

    // Terms & Notes
    if (doc.notes || doc.terms) {
      pdf.moveDown(2);
      pdf.fontSize(8).fillColor('#666666');
      if (doc.notes) pdf.text(`Notes: ${doc.notes}`);
      if (doc.terms) pdf.text(`Terms: ${doc.terms}`);
    }

    pdf.end();
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// POST /api/documents/:id/dispatch (Multi-channel WhatsApp / SMS / Email helper)
const dispatchDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { channel = 'WhatsApp', recipient } = req.body;

    let doc = null;
    if (getIsConnected()) {
      doc = await SalesDocument.findOne({ _id: id, userId });
    } else {
      doc = memorySalesDocuments.find(d => (d._id === id || d.id === id) && d.userId === userId);
    }

    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    const target = recipient || doc.customer?.phone || doc.customer?.email;
    if (!target) {
      return res.status(400).json({ success: false, message: 'No recipient phone or email provided' });
    }

    const message = `Hello ${doc.customer?.name || 'Customer'}, here is your ${doc.documentType} #${doc.docNumber} for ₹${doc.grandTotal}. Thank you for shopping with us!`;

    // Generate WhatsApp direct web link if WhatsApp
    let waLink = '';
    if (channel === 'WhatsApp') {
      const cleanPhone = target.replace(/[^0-9]/g, '');
      const encodedMsg = encodeURIComponent(message);
      waLink = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
    }

    const logEntry = {
      channel,
      recipient: target,
      status: 'Sent',
      sentAt: new Date(),
      message
    };

    if (getIsConnected()) {
      doc.dispatchLogs.push(logEntry);
      await doc.save();
    } else {
      if (!doc.dispatchLogs) doc.dispatchLogs = [];
      doc.dispatchLogs.push(logEntry);
    }

    return res.json({
      success: true,
      message: `${doc.documentType} dispatched via ${channel} successfully!`,
      data: {
        channel,
        recipient: target,
        waLink,
        message,
        sentAt: logEntry.sentAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDocuments,
  getDocumentById,
  createDocument,
  convertToInvoice,
  generateDocumentPdf,
  dispatchDocument
};
