import React, { useState } from 'react';
import { Package, Plus, Search, Edit2, Trash2, X, AlertTriangle, Layers, Tag, Save } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { formatINR } from '../../utils/formatters';
import { productAPI } from '../../services/api';

const COMMON_UNITS = ['pcs', 'kg', 'g', 'l', 'ml', 'box', 'pack', 'pair', 'meter', 'bottle', 'can'];

const ProductManager = () => {
  const { products, fetchProducts, fetchCategories, showToast, searchQuery, theme } = usePOS();
  const isLight = theme === 'light';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    sku: '',
    barcode: '',
    brand: '',
    category: 'General',
    subcategory: '',
    price: '',
    costPrice: '',
    stock: '',
    unit: 'pcs',
    minStockAlert: 5,
    image: '',
    description: ''
  });

  const [attributesList, setAttributesList] = useState([]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      title: '',
      sku: '',
      barcode: '',
      brand: '',
      category: 'General',
      subcategory: '',
      price: '',
      costPrice: '',
      stock: '',
      unit: 'pcs',
      minStockAlert: 5,
      image: '',
      description: ''
    });
    setAttributesList([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setIsEditing(true);
    setEditingId(product._id || product.id);
    setFormData({
      title: product.title || '',
      sku: product.sku || '',
      barcode: product.barcode || '',
      brand: product.brand || '',
      category: product.category || 'General',
      subcategory: product.subcategory || '',
      price: product.price !== undefined ? String(product.price) : '',
      costPrice: product.costPrice !== undefined ? String(product.costPrice) : '',
      stock: product.stock !== undefined ? String(product.stock) : (product.totalStock !== undefined ? String(product.totalStock) : '0'),
      unit: product.unit || 'pcs',
      minStockAlert: product.minStockAlert !== undefined ? product.minStockAlert : 5,
      image: product.image || '',
      description: product.description || ''
    });
    setAttributesList(Array.isArray(product.attributes) ? [...product.attributes] : []);
    setIsModalOpen(true);
  };

  const handleAddAttributeRow = () => {
    setAttributesList([
      ...attributesList,
      { name: '', value: '' }
    ]);
  };

  const handleRemoveAttributeRow = (index) => {
    setAttributesList(attributesList.filter((_, i) => i !== index));
  };

  const handleAttributeChange = (index, field, value) => {
    const updated = [...attributesList];
    updated[index][field] = value;
    setAttributesList(updated);
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.price || !formData.category) {
      showToast('Title, category, and retail price are required', 'warning');
      return;
    }

    try {
      const validAttributes = attributesList.filter(a => a.name.trim() && a.value.trim());

      const payload = {
        title: formData.title.trim(),
        sku: formData.sku.trim() || undefined,
        barcode: formData.barcode.trim() || undefined,
        brand: formData.brand.trim() || undefined,
        category: formData.category.trim(),
        subcategory: formData.subcategory.trim() || undefined,
        price: Number(formData.price),
        costPrice: Number(formData.costPrice || 0),
        stock: Number(formData.stock || 0),
        unit: formData.unit.trim() || 'pcs',
        minStockAlert: Number(formData.minStockAlert || 5),
        image: formData.image?.trim() || '',
        description: formData.description?.trim() || '',
        attributes: validAttributes
      };

      if (isEditing && editingId) {
        const res = await productAPI.update(editingId, payload);
        if (res.data?.success) {
          showToast('Product updated successfully!', 'success');
          setIsModalOpen(false);
          fetchProducts();
          fetchCategories();
        }
      } else {
        const res = await productAPI.create(payload);
        if (res.data?.success) {
          showToast('Product added to inventory!', 'success');
          setIsModalOpen(false);
          fetchProducts();
          fetchCategories();
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save product', 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await productAPI.delete(id);
      showToast('Product removed from inventory', 'info');
      fetchProducts();
      fetchCategories();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete product', 'error');
    }
  };

  return (
    <div className={`flex-1 p-6 overflow-y-auto space-y-6 select-none transition-colors duration-300 ${
      isLight ? 'bg-[#fbf4dc] text-[#051f14]' : 'bg-[#05170f] text-[#fef3c7]'
    }`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-black flex items-center gap-2 ${isLight ? 'text-[#051f14]' : 'text-white'}`}>
            <Package className={`w-6 h-6 ${isLight ? 'text-[#072618]' : 'text-amber-400'}`} />
            Universal Inventory & Product Manager
          </h2>
          <p className={`text-xs mt-1 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
            Manage your retail catalog, free-form categories, stock counts, units, and custom attributes.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg active:scale-95 cursor-pointer ${
            isLight
              ? 'bg-[#072418] hover:bg-[#0c3924] text-[#fef08a] shadow-[#072418]/25'
              : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-[#051a10] shadow-amber-500/30'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Inventory Table */}
      <div className={`border rounded-3xl overflow-hidden shadow-xl transition-colors duration-300 ${
        isLight ? 'bg-[#fffaf0] border-[#d6b866]' : 'bg-[#09251a] border-[#144833]'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`font-bold border-b uppercase tracking-wider text-[10px] ${
              isLight ? 'bg-[#f8eed1] text-[#051f14] border-[#d6b866]' : 'bg-[#061a11] text-[#fde047] border-[#144833]'
            }`}>
              <tr>
                <th className="py-3.5 px-4">Item Details</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Retail Price</th>
                <th className="py-3.5 px-4">Cost Price</th>
                <th className="py-3.5 px-4">Margin</th>
                <th className="py-3.5 px-4">Stock Level</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-[#d6b866]/40' : 'divide-[#144833]'}`}>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="7" className={`text-center py-16 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/60'}`}>
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-xs">No products found in catalog</p>
                    <p className="text-[11px] mt-0.5 opacity-70">Click "Add New Product" above to create your first inventory item.</p>
                  </td>
                </tr>
              ) : (
                products.map((prod) => {
                  const pid = prod._id || prod.id;
                  const stock = prod.stock !== undefined ? prod.stock : (prod.totalStock || 0);
                  const minAlert = prod.minStockAlert !== undefined ? prod.minStockAlert : 5;
                  const unit = prod.unit || 'pcs';
                  const profit = (prod.price - (prod.costPrice || 0)).toFixed(2);
                  const profitMargin = prod.price > 0 ? ((profit / prod.price) * 100).toFixed(0) : 0;

                  return (
                    <tr key={pid} className={`transition-colors ${isLight ? 'hover:bg-[#f4e4b9]/40' : 'hover:bg-[#0c2f21]/60'}`}>
                      {/* Product Thumbnail & Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {prod.image ? (
                            <img
                              src={prod.image}
                              alt={prod.title}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              className={`w-10 h-10 object-cover rounded-xl border shrink-0 ${isLight ? 'border-[#d6b866]' : 'border-[#144833]'}`}
                            />
                          ) : (
                            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black text-xs shrink-0 uppercase ${
                              isLight ? 'bg-[#f4e4b9] border-[#c8a74e] text-[#072618]' : 'bg-[#061a11] border-[#144833] text-amber-400'
                            }`}>
                              {(prod.title || 'P').charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className={`font-bold ${isLight ? 'text-[#051f14]' : 'text-[#fef3c7]'}`}>{prod.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {prod.brand && (
                                <span className={`text-[10px] uppercase tracking-wider font-semibold ${isLight ? 'text-[#0f442e]' : 'text-amber-400'}`}>
                                  {prod.brand}
                                </span>
                              )}
                              <span className={`text-[10px] font-mono ${isLight ? 'text-[#0f442e]/70' : 'text-[#fde047]/60'}`}>
                                SKU: {prod.sku}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          isLight ? 'bg-[#f4e4b9] text-[#072618] border-[#c8a74e]' : 'bg-[#061a11] text-amber-400 border-[#144833]'
                        }`}>
                          {prod.category} {prod.subcategory ? `• ${prod.subcategory}` : ''}
                        </span>
                      </td>

                      {/* Prices */}
                      <td className={`py-3.5 px-4 font-bold ${isLight ? 'text-[#051f14]' : 'text-white'}`}>
                        {formatINR(prod.price)}
                      </td>
                      <td className={`py-3.5 px-4 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
                        {formatINR(prod.costPrice || 0)}
                      </td>

                      {/* Profit Margin */}
                      <td className="py-3.5 px-4">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          +{formatINR(profit)} ({profitMargin}%)
                        </span>
                      </td>

                      {/* Stock Level */}
                      <td className="py-3.5 px-4">
                        {stock === 0 ? (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-950 text-rose-300 border-rose-500/30'
                          }`}>
                            Out of Stock
                          </span>
                        ) : stock <= minAlert ? (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border animate-pulse ${
                            isLight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-950 text-amber-300 border-amber-500/30'
                          }`}>
                            Low Stock ({stock} {unit})
                          </span>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            isLight ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                          }`}>
                            {stock} {unit}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(prod)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isLight
                              ? 'bg-[#f4e4b9] text-[#072618] border-[#c8a74e] hover:bg-[#ebd89f]'
                              : 'bg-[#061a11] text-amber-400 border-[#144833] hover:bg-[#0c2f21]'
                          }`}
                          title="Edit product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(pid)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isLight
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              : 'bg-rose-950/60 text-rose-400 border-rose-500/30 hover:bg-rose-900'
                          }`}
                          title="Delete item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in ${
          isLight ? 'bg-[#051f14]/40' : 'bg-[#05170f]/85'
        }`}>
          <div className={`border rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] ${
            isLight ? 'bg-[#fffaf0] border-[#d6b866] text-[#051f14]' : 'bg-[#09251a] border-[#144833] text-[#fef3c7]'
          }`}>
            <div className={`p-5 border-b flex items-center justify-between ${
              isLight ? 'bg-[#f8eed1] border-[#d6b866]' : 'bg-[#061a11] border-[#144833]'
            }`}>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-[#051f14]' : 'text-white'}`}>
                {isEditing ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>{isEditing ? 'Edit Retail Product' : 'Add New Retail Product'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  isLight ? 'bg-[#f4e4b9] hover:bg-[#ebd89f] text-[#051f14]' : 'bg-[#061a11] hover:bg-[#0c2f21] text-[#fef08a]'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                {/* Title */}
                <div className="col-span-2">
                  <label className={`text-[10px] font-bold uppercase block mb-1 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Wireless Noise-Cancelling Headphones"
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none ${
                      isLight
                        ? 'bg-[#f8eed1] border-[#c8a74e] text-[#051f14] placeholder-[#0f442e]/60 focus:border-[#072618]'
                        : 'bg-[#061a11] border-[#144833] text-[#fde047] placeholder-[#fbbf24]/50 focus:border-amber-400'
                    }`}
                  />
                </div>

                {/* Category (Free-form text with suggestions) */}
                <div>
                  <label className={`text-[10px] font-bold uppercase block mb-1 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    list="category-suggestions"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Electronics, Grocery, Apparel..."
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none ${
                      isLight ? 'bg-[#f8eed1] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#144833] text-[#fde047]'
                    }`}
                  />
                  <datalist id="category-suggestions">
                    <option value="Electronics" />
                    <option value="Groceries" />
                    <option value="Clothing" />
                    <option value="Footwear" />
                    <option value="Pharmacy" />
                    <option value="Hardware" />
                    <option value="Stationery" />
                    <option value="General" />
                  </datalist>
                </div>

                {/* Subcategory */}
                <div>
                  <label className={`text-[10px] font-bold uppercase block mb-1 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
                    Subcategory / Department
                  </label>
                  <input
                    type="text"
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    placeholder="e.g. Audio, Dairy, Casual..."
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none ${
                      isLight ? 'bg-[#f8eed1] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#144833] text-[#fde047]'
                    }`}
                  />
                </div>

                {/* Brand */}
                <div>
                  <label className={`text-[10px] font-bold uppercase block mb-1 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
                    Brand / Manufacturer
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g. Sony, Nestle, Nike..."
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none ${
                      isLight ? 'bg-[#f8eed1] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#144833] text-[#fde047]'
                    }`}
                  />
                </div>

                {/* Barcode */}
                <div>
                  <label className={`text-[10px] font-bold uppercase block mb-1 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
                    Barcode / UPC
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Scan or enter barcode"
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none ${
                      isLight ? 'bg-[#f8eed1] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#144833] text-[#fde047]'
                    }`}
                  />
                </div>

                {/* Retail Price */}
                <div>
                  <label className={`text-[10px] font-bold uppercase block mb-1 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
                    Retail Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="499"
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none ${
                      isLight ? 'bg-[#f8eed1] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#144833] text-[#fde047]'
                    }`}
                  />
                </div>

                {/* Cost Price */}
                <div>
                  <label className={`text-[10px] font-bold uppercase block mb-1 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
                    Cost Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    placeholder="300"
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none ${
                      isLight ? 'bg-[#f8eed1] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#144833] text-[#fde047]'
                    }`}
                  />
                </div>

                {/* Stock Quantity */}
                <div>
                  <label className={`text-[10px] font-bold uppercase block mb-1 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
                    Initial Stock Count *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="50"
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none ${
                      isLight ? 'bg-[#f8eed1] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#144833] text-[#fde047]'
                    }`}
                  />
                </div>

                {/* Unit of Measurement */}
                <div>
                  <label className={`text-[10px] font-bold uppercase block mb-1 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
                    Measurement Unit
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none cursor-pointer ${
                      isLight ? 'bg-[#f8eed1] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#144833] text-[#fde047]'
                    }`}
                  >
                    {COMMON_UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                {/* Image URL */}
                <div className="col-span-2">
                  <label className={`text-[10px] font-bold uppercase block mb-1 ${isLight ? 'text-[#0f442e]' : 'text-[#fde047]/70'}`}>
                    Product Image URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://example.com/item.jpg or leave blank"
                    className={`w-full border rounded-xl px-3 py-2 focus:outline-none ${
                      isLight ? 'bg-[#f8eed1] border-[#c8a74e] text-[#051f14]' : 'bg-[#061a11] border-[#144833] text-[#fde047]'
                    }`}
                  />
                </div>
              </div>

              {/* Dynamic Key-Value Attributes Builder */}
              <div className={`pt-3 border-t ${isLight ? 'border-[#d6b866]' : 'border-[#144833]'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className={`text-[11px] font-bold uppercase tracking-wider block ${isLight ? 'text-[#051f14]' : 'text-[#fef08a]'}`}>
                      Custom Product Attributes
                    </span>
                    <span className={`text-[10px] ${isLight ? 'text-[#0f442e]/70' : 'text-[#fde047]/60'}`}>
                      Add any custom specifications (e.g. Size, Color, Warranty, Weight, Voltage, Flavor)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAttributeRow}
                    className={`text-[10px] font-bold hover:underline flex items-center gap-1 cursor-pointer ${
                      isLight ? 'text-[#072618]' : 'text-amber-400'
                    }`}
                  >
                    <Plus className="w-3 h-3" /> Add Attribute
                  </button>
                </div>

                {attributesList.length === 0 ? (
                  <p className={`text-[11px] italic p-2 rounded-xl border text-center ${
                    isLight ? 'border-[#d6b866]/40 text-[#0f442e]/60 bg-[#f8eed1]/40' : 'border-[#144833]/50 text-[#fde047]/50 bg-[#061a11]/40'
                  }`}>
                    No custom attributes added. Click "Add Attribute" to attach custom specs.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {attributesList.map((attr, idx) => (
                      <div key={idx} className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl border ${
                        isLight ? 'bg-[#f4e4b9] border-[#c8a74e]' : 'bg-[#061a11] border-[#144833]'
                      }`}>
                        <div className="col-span-5">
                          <input
                            type="text"
                            value={attr.name}
                            onChange={(e) => handleAttributeChange(idx, 'name', e.target.value)}
                            placeholder="Attribute Name (e.g. Color)"
                            className={`w-full border rounded-lg p-1.5 text-[11px] ${
                              isLight ? 'bg-[#fffaf0] border-[#c8a74e] text-[#051f14]' : 'bg-[#09251a] border-[#144833] text-[#fde047]'
                            }`}
                          />
                        </div>
                        <div className="col-span-5">
                          <input
                            type="text"
                            value={attr.value}
                            onChange={(e) => handleAttributeChange(idx, 'value', e.target.value)}
                            placeholder="Value (e.g. Midnight Blue)"
                            className={`w-full border rounded-lg p-1.5 text-[11px] ${
                              isLight ? 'bg-[#fffaf0] border-[#c8a74e] text-[#051f14]' : 'bg-[#09251a] border-[#144833] text-[#fde047]'
                            }`}
                          />
                        </div>
                        <div className="col-span-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveAttributeRow(idx)}
                            className="text-rose-500 p-1 hover:bg-rose-100 dark:hover:bg-rose-950 rounded cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className={`pt-4 border-t flex justify-end gap-3 ${isLight ? 'border-[#d6b866]' : 'border-[#144833]'}`}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded-xl font-semibold cursor-pointer ${
                    isLight ? 'bg-[#f4e4b9] text-[#051f14] hover:bg-[#ebd89f] border border-[#c8a74e]' : 'bg-[#061a11] text-[#fef08a] hover:bg-[#0c2f21] border border-[#144833]'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2 rounded-xl font-black shadow-lg cursor-pointer flex items-center gap-1.5 ${
                    isLight
                      ? 'bg-[#072418] hover:bg-[#0c3924] text-[#fef08a] shadow-[#072418]/25'
                      : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-[#051a10] shadow-amber-500/30'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Update Product' : 'Save Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;
