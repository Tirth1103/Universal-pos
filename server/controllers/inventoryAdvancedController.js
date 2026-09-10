const Product = require('../models/Product');
const StockAdjustment = require('../models/StockAdjustment');
const { getIsConnected } = require('../config/db');
const { memoryProducts } = require('./productController');
const xlsx = require('xlsx');

let memoryAdjustments = [];

// GET /api/inventory-advanced/low-stock-and-expiry
const getLowStockAndExpiry = async (req, res) => {
  try {
    const userId = req.userId;
    const daysAhead = Number(req.query.days) || 60;
    const now = new Date();
    const thresholdDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    if (getIsConnected()) {
      // 1. Query low stock items
      const lowStockProducts = await Product.find({
        userId,
        $expr: {
          $lte: ['$stock', { $ifNull: ['$reorderPoint', '$minStockAlert', 5] }]
        }
      }).select('title sku category brand stock reorderPoint minStockAlert price unit');

      // 2. Query products with batches expiring within daysAhead or expired
      const expiryProducts = await Product.aggregate([
        { $match: { userId: new (require('mongoose').Types.ObjectId)(userId), 'batches.0': { $exists: true } } },
        { $unwind: '$batches' },
        {
          $match: {
            'batches.expiryDate': { $ne: null, $lte: thresholdDate }
          }
        },
        {
          $project: {
            productId: '$_id',
            title: '$title',
            sku: '$sku',
            category: '$category',
            batchNumber: '$batches.batchNumber',
            quantity: '$batches.quantity',
            expiryDate: '$batches.expiryDate',
            manufacturingDate: '$batches.manufacturingDate',
            mrp: '$batches.mrp',
            isExpired: { $lt: ['$batches.expiryDate', now] }
          }
        },
        { $sort: { 'batches.expiryDate': 1 } }
      ]);

      return res.json({
        success: true,
        data: {
          lowStock: lowStockProducts,
          nearExpiryOrExpired: expiryProducts
        }
      });
    } else {
      const userProducts = (memoryProducts || []).filter(p => p.userId && p.userId.toString() === userId);
      const lowStock = userProducts.filter(p => (p.stock || 0) <= (p.reorderPoint || p.minStockAlert || 5));
      const nearExpiryOrExpired = [];

      userProducts.forEach(p => {
        if (Array.isArray(p.batches)) {
          p.batches.forEach(b => {
            if (b.expiryDate) {
              const exp = new Date(b.expiryDate);
              if (exp <= thresholdDate) {
                nearExpiryOrExpired.push({
                  productId: p._id || p.id,
                  title: p.title,
                  sku: p.sku,
                  category: p.category,
                  batchNumber: b.batchNumber,
                  quantity: b.quantity,
                  expiryDate: b.expiryDate,
                  manufacturingDate: b.manufacturingDate,
                  mrp: b.mrp,
                  isExpired: exp < now
                });
              }
            }
          });
        }
      });

      return res.json({
        success: true,
        data: { lowStock, nearExpiryOrExpired },
        isMemory: true
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/inventory-advanced/adjustments
const createStockAdjustment = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      productId,
      adjustmentType,
      quantityChanged,
      reasonCode = '',
      notes = '',
      batchNumber = ''
    } = req.body;

    if (!productId || quantityChanged === undefined) {
      return res.status(400).json({ success: false, message: 'Product ID and quantity change required' });
    }

    const qtyChange = Number(quantityChanged);

    if (getIsConnected()) {
      const product = await Product.findOne({ _id: productId, userId });
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

      const previousStock = product.stock || 0;
      const newStock = Math.max(0, previousStock + qtyChange);

      product.stock = newStock;

      // Adjust batch quantity if batchNumber provided
      if (batchNumber && Array.isArray(product.batches)) {
        const batch = product.batches.find(b => b.batchNumber === batchNumber);
        if (batch) {
          batch.quantity = Math.max(0, (batch.quantity || 0) + qtyChange);
        }
      }

      await product.save();

      const adjustment = await StockAdjustment.create({
        userId,
        productId,
        productTitle: product.title,
        sku: product.sku,
        batchNumber,
        adjustmentType,
        quantityChanged: qtyChange,
        previousStock,
        newStock,
        reasonCode,
        notes,
        adjustedBy: req.user?.name || 'Store Operator'
      });

      return res.status(201).json({
        success: true,
        message: 'Stock adjustment applied and logged successfully',
        data: { adjustment, updatedStock: newStock }
      });
    } else {
      const product = (memoryProducts || []).find(p => (p._id === productId || p.id === productId) && p.userId === userId);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

      const previousStock = product.stock || 0;
      const newStock = Math.max(0, previousStock + qtyChange);
      product.stock = newStock;

      const adjustment = {
        _id: 'adj_' + Date.now(),
        id: 'adj_' + Date.now(),
        userId,
        productId,
        productTitle: product.title,
        sku: product.sku,
        batchNumber,
        adjustmentType,
        quantityChanged: qtyChange,
        previousStock,
        newStock,
        reasonCode,
        notes,
        adjustedBy: req.user?.name || 'Store Operator',
        createdAt: new Date()
      };
      memoryAdjustments.unshift(adjustment);

      return res.status(201).json({
        success: true,
        message: 'Stock adjustment applied (session mode)',
        data: { adjustment, updatedStock: newStock }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/inventory-advanced/adjustments
const getStockAdjustments = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId, type } = req.query;

    if (getIsConnected()) {
      let query = { userId };
      if (productId) query.productId = productId;
      if (type && type !== 'All') query.adjustmentType = type;

      const adjustments = await StockAdjustment.find(query).sort({ createdAt: -1 }).limit(100);
      return res.json({ success: true, count: adjustments.length, data: adjustments });
    } else {
      let list = memoryAdjustments.filter(a => a.userId && a.userId.toString() === userId);
      if (productId) list = list.filter(a => a.productId === productId);
      if (type && type !== 'All') list = list.filter(a => a.adjustmentType === type);
      return res.json({ success: true, count: list.length, data: list, isMemory: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/inventory-advanced/export-catalog
const exportCatalogExcel = async (req, res) => {
  try {
    const userId = req.userId;

    let products = [];
    if (getIsConnected()) {
      products = await Product.find({ userId });
    } else {
      products = (memoryProducts || []).filter(p => p.userId && p.userId.toString() === userId);
    }

    const rows = products.map(p => ({
      'Item Code (SKU)': p.sku || '',
      'Item Name': p.title || '',
      'Category': p.category || '',
      'Subcategory': p.subcategory || '',
      'Brand': p.brand || '',
      'Unit': p.unit || 'pcs',
      'Sale Price': p.price || 0,
      'Wholesale Price': p.wholesalePrice || 0,
      'Cost Price': p.costPrice || 0,
      'Stock Quantity': p.stock || 0,
      'Min Stock Alert': p.minStockAlert || 5,
      'Reorder Point': p.reorderPoint || 5,
      'HSN / SAC Code': p.hsnCode || '',
      'GST Tax Rate (%)': p.taxRate || 0,
      'Description': p.description || ''
    }));

    const worksheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Catalog');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory_catalog.xlsx"');
    return res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/inventory-advanced/import-catalog (Supports array of items parsed from client or direct JSON)
const importCatalog = async (req, res) => {
  try {
    const userId = req.userId;
    const { items = [] } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide items array to import' });
    }

    let createdCount = 0;
    let updatedCount = 0;

    for (const item of items) {
      const sku = (item.sku || item['Item Code (SKU)'] || `SKU-${Date.now()}-${Math.floor(Math.random()*1000)}`).toString().trim();
      const title = (item.title || item['Item Name'] || 'Imported Item').toString().trim();
      const price = Number(item.price || item['Sale Price']) || 0;
      const costPrice = Number(item.costPrice || item['Cost Price']) || 0;
      const stock = Number(item.stock || item['Stock Quantity']) || 0;
      const category = (item.category || item['Category'] || 'General').toString().trim();
      const hsnCode = (item.hsnCode || item['HSN / SAC Code'] || '').toString().trim();
      const taxRate = Number(item.taxRate || item['GST Tax Rate (%)']) || 0;

      if (getIsConnected()) {
        const existing = await Product.findOne({ userId, sku });
        if (existing) {
          existing.title = title;
          existing.price = price;
          existing.costPrice = costPrice;
          existing.stock = stock;
          existing.category = category;
          existing.hsnCode = hsnCode;
          existing.taxRate = taxRate;
          await existing.save();
          updatedCount++;
        } else {
          await Product.create({
            userId,
            sku,
            title,
            price,
            costPrice,
            stock,
            category,
            hsnCode,
            taxRate
          });
          createdCount++;
        }
      } else {
        const existing = (memoryProducts || []).find(p => p.userId === userId && p.sku === sku);
        if (existing) {
          existing.title = title;
          existing.price = price;
          existing.costPrice = costPrice;
          existing.stock = stock;
          existing.category = category;
          existing.hsnCode = hsnCode;
          existing.taxRate = taxRate;
          updatedCount++;
        } else {
          const newProd = {
            _id: 'prod_' + Date.now() + '_' + Math.random(),
            id: 'prod_' + Date.now(),
            userId,
            sku,
            title,
            price,
            costPrice,
            stock,
            category,
            hsnCode,
            taxRate,
            unit: 'pcs',
            minStockAlert: 5,
            reorderPoint: 5,
            attributes: [],
            batches: []
          };
          memoryProducts.unshift(newProd);
          createdCount++;
        }
      }
    }

    return res.json({
      success: true,
      message: `Bulk import completed: ${createdCount} items created, ${updatedCount} items updated.`,
      data: { createdCount, updatedCount, totalProcessed: items.length }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLowStockAndExpiry,
  createStockAdjustment,
  getStockAdjustments,
  exportCatalogExcel,
  importCatalog
};
