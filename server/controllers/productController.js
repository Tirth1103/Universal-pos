const Product = require('../models/Product');
const { getIsConnected } = require('../config/db');

// In-memory store fallback when MongoDB is offline
let memoryProducts = [];

// GET /api/products/categories (Dynamic categories derived from store products)
const getCategories = async (req, res) => {
  try {
    const userId = req.userId;
    if (getIsConnected()) {
      const categories = await Product.distinct('category', { userId });
      const filtered = categories.filter(c => c && typeof c === 'string' && c.trim().length > 0);
      return res.json({ success: true, data: filtered });
    } else {
      const userProds = memoryProducts.filter(p => p.userId && p.userId.toString() === userId);
      const categories = [...new Set(userProds.map(p => p.category).filter(c => c && typeof c === 'string' && c.trim().length > 0))];
      return res.json({ success: true, data: categories, isMemory: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products (Scoped strictly to authenticated user's store)
const getProducts = async (req, res) => {
  try {
    const { category, subcategory, search } = req.query;
    const userId = req.userId;

    if (getIsConnected()) {
      let query = { userId };

      if (category && category !== 'All') query.category = category;
      if (subcategory && subcategory !== 'All') query.subcategory = subcategory;
      if (search) {
        query.$and = [
          { userId },
          {
            $or: [
              { title: { $regex: search, $options: 'i' } },
              { sku: { $regex: search, $options: 'i' } },
              { barcode: { $regex: search, $options: 'i' } },
              { brand: { $regex: search, $options: 'i' } },
              { category: { $regex: search, $options: 'i' } },
              { subcategory: { $regex: search, $options: 'i' } }
            ]
          }
        ];
        delete query.userId; // Covered in $and
      }

      let products = await Product.find(query).sort({ createdAt: -1 });

      return res.json({ success: true, count: products.length, data: products });
    } else {
      // Memory fallback scoped to userId
      let list = memoryProducts.filter(p => p.userId && p.userId.toString() === userId);

      if (category && category !== 'All') {
        list = list.filter(p => p.category && p.category.toLowerCase() === category.toLowerCase());
      }
      if (subcategory && subcategory !== 'All') {
        list = list.filter(p => p.subcategory && p.subcategory.toLowerCase() === subcategory.toLowerCase());
      }
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(p =>
          (p.title && p.title.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(q))
        );
      }

      list = list.map(p => ({
        ...p,
        totalStock: p.stock !== undefined ? p.stock : 0
      }));

      return res.json({ success: true, count: list.length, data: list, isMemory: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (getIsConnected()) {
      const product = await Product.findOne({ _id: id, userId });
      if (!product) return res.status(404).json({ success: false, message: 'Product not found in your store' });
      return res.json({ success: true, data: product });
    } else {
      const product = memoryProducts.find(p => (p.id === id || p._id === id) && p.userId && p.userId.toString() === userId);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found in your store' });
      return res.json({
        success: true,
        data: { ...product, totalStock: product.stock !== undefined ? product.stock : 0 }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/products
const createProduct = async (req, res) => {
  try {
    const {
      title,
      sku,
      barcode,
      brand,
      category,
      subcategory,
      price,
      costPrice,
      stock,
      unit,
      minStockAlert,
      attributes,
      image,
      description,
      tags
    } = req.body;
    const userId = req.userId;

    if (!title || price === undefined || !category) {
      return res.status(400).json({ success: false, message: 'Title, category, and price are required.' });
    }

    const cleanSku = sku ? sku.trim() : `SKU-${Date.now().toString().slice(-6)}`;
    const cleanBarcode = barcode ? barcode.trim() : `BC-${Date.now()}`;
    const numStock = Number(stock !== undefined ? stock : 0);
    const numPrice = Number(price);
    const numCostPrice = Number(costPrice !== undefined ? costPrice : 0);
    const productAttributes = Array.isArray(attributes) ? attributes : [];

    if (getIsConnected()) {
      const newProd = await Product.create({
        userId,
        title: title.trim(),
        sku: cleanSku,
        barcode: cleanBarcode,
        brand: brand ? brand.trim() : '',
        category: category.trim(),
        subcategory: subcategory ? subcategory.trim() : '',
        price: numPrice,
        costPrice: numCostPrice,
        stock: numStock,
        unit: unit ? unit.trim() : 'pcs',
        minStockAlert: minStockAlert !== undefined ? Number(minStockAlert) : 5,
        attributes: productAttributes,
        image: image || '',
        description: description || '',
        tags: Array.isArray(tags) ? tags : []
      });
      return res.status(201).json({ success: true, data: newProd });
    } else {
      const newProd = {
        id: `prod-${Date.now()}`,
        _id: `prod-${Date.now()}`,
        userId,
        title: title.trim(),
        sku: cleanSku,
        barcode: cleanBarcode,
        brand: brand ? brand.trim() : '',
        category: category.trim(),
        subcategory: subcategory ? subcategory.trim() : '',
        price: numPrice,
        costPrice: numCostPrice,
        stock: numStock,
        unit: unit ? unit.trim() : 'pcs',
        minStockAlert: minStockAlert !== undefined ? Number(minStockAlert) : 5,
        attributes: productAttributes,
        image: image || '',
        description: description || '',
        tags: Array.isArray(tags) ? tags : [],
        totalStock: numStock,
        createdAt: new Date()
      };
      memoryProducts.unshift(newProd);
      return res.status(201).json({ success: true, data: newProd });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const updates = { ...req.body };
    if (updates.stock !== undefined) updates.stock = Number(updates.stock);
    if (updates.price !== undefined) updates.price = Number(updates.price);
    if (updates.costPrice !== undefined) updates.costPrice = Number(updates.costPrice);

    if (getIsConnected()) {
      const updated = await Product.findOneAndUpdate(
        { _id: id, userId },
        updates,
        { new: true, runValidators: true }
      );
      if (!updated) return res.status(404).json({ success: false, message: 'Product not found in your store' });
      return res.json({ success: true, data: updated });
    } else {
      const idx = memoryProducts.findIndex(p => (p.id === id || p._id === id) && p.userId && p.userId.toString() === userId);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Product not found in your store' });

      memoryProducts[idx] = {
        ...memoryProducts[idx],
        ...updates,
        totalStock: updates.stock !== undefined ? updates.stock : memoryProducts[idx].stock
      };
      return res.json({ success: true, data: memoryProducts[idx] });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (getIsConnected()) {
      const deleted = await Product.findOneAndDelete({ _id: id, userId });
      if (!deleted) return res.status(404).json({ success: false, message: 'Product not found in your store' });
      return res.json({ success: true, message: 'Product deleted successfully' });
    } else {
      const exists = memoryProducts.some(p => (p.id === id || p._id === id) && p.userId && p.userId.toString() === userId);
      if (!exists) return res.status(404).json({ success: false, message: 'Product not found in your store' });

      memoryProducts = memoryProducts.filter(p => !((p.id === id || p._id === id) && p.userId && p.userId.toString() === userId));
      return res.json({ success: true, message: 'Product deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getCategories,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  memoryProducts
};
