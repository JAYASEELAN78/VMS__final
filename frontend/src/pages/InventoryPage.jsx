import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, fetchCategories, updateProductStock, createCategory, deleteProduct } from '../store/slices/productsSlice';
import { Package, Plus, Search, ArrowUpCircle, ArrowDownCircle, AlertTriangle, Box, TrendingUp, X, FolderPlus, Trash2 } from 'lucide-react';
import { useToast } from '../components/common';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const InventoryPage = () => {
    const toast = useToast();
    const dispatch = useDispatch();
    const { items: products, categories, isLoading } = useSelector((state) => state.products);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [showStockModal, setShowStockModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [stockType, setStockType] = useState('in');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [stockQuantity, setStockQuantity] = useState(1);
    const [stockReason, setStockReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // New category form state
    const [newCategory, setNewCategory] = useState({
        name: '',
        description: ''
    });

    useEffect(() => {
        dispatch(fetchProducts());
        dispatch(fetchCategories());
    }, [dispatch]);

    const handleStockUpdate = async () => {
        if (!selectedProduct || !stockQuantity || !stockReason) return;
        try {
            await dispatch(updateProductStock({ id: selectedProduct._id, data: { type: stockType, quantity: stockQuantity, reason: stockReason } })).unwrap();
            toast.success(`Stock ${stockType === 'in' ? 'added' : 'removed'} successfully`);
            setShowStockModal(false);
            setSelectedProduct(null);
            setStockQuantity(1);
            setStockReason('');
            dispatch(fetchProducts());
        } catch (error) {
            toast.error('Failed to update stock: ' + (error || 'Unknown error'));
        }
    };

    const handleAddCategory = async () => {
        if (!newCategory.name.trim()) {
            toast.warning('Please enter a category name');
            return;
        }

        setIsSubmitting(true);
        try {
            await dispatch(createCategory({
                name: newCategory.name.trim(),
                description: newCategory.description.trim()
            })).unwrap();

            setShowCategoryModal(false);
            setNewCategory({ name: '', description: '' });
            dispatch(fetchCategories());
        } catch (error) {
            toast.error('Failed to add category: ' + (error || 'Unknown error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (product) => {
        setProductToDelete(product);
        setShowDeleteConfirm(true);
    };

    const handleDeleteProduct = async () => {
        if (!productToDelete) return;
        setIsDeleting(true);
        try {
            await dispatch(deleteProduct(productToDelete._id)).unwrap();
            setShowDeleteConfirm(false);
            setProductToDelete(null);
        } catch (error) {
            toast.error('Failed to delete product: ' + (error || 'Unknown error'));
        } finally {
            setIsDeleting(false);
        }
    };

    const stats = {
        totalProducts: products.length,
        totalStock: products.reduce((s, p) => s + (p.stock || 0), 0),
        lowStock: products.filter(p => p.stock <= (p.lowStockThreshold || 5)).length,
        inventoryValue: products.reduce((s, p) => s + ((p.stock || 0) * (p.sellingPrice || 0)), 0)
    };

    const categoryData = categories.map(c => ({ name: c.name, value: products.filter(p => p.category?._id === c._id || p.category === c._id).reduce((s, p) => s + (p.stock || 0), 0) }));
    const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
    const formatCurrency = (a) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(a);

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
        const catId = p.category?._id || p.category;
        const matchesCategory = filterCategory === 'all' || catId === filterCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Total Products */}
                <div
                    className="relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 cursor-default"
                    style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 10px 30px -5px rgba(102, 126, 234, 0.4)',
                    }}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: 'white', transform: 'translate(30%, -30%)' }} />
                    <div className="relative z-1 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                            <Package size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>Total Products</p>
                            <p className="text-2xl font-bold text-white mt-0.5">{stats.totalProducts}</p>
                        </div>
                    </div>
                </div>

                {/* Total Stock */}
                <div
                    className="relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 cursor-default"
                    style={{
                        background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                        boxShadow: '0 10px 30px -5px rgba(14, 165, 233, 0.4)',
                    }}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: 'white', transform: 'translate(30%, -30%)' }} />
                    <div className="relative z-1 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                            <Box size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>Total Stock</p>
                            <p className="text-2xl font-bold text-white mt-0.5">{stats.totalStock.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Low Stock */}
                <div
                    className="relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 cursor-default"
                    style={{
                        background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                        boxShadow: '0 10px 30px -5px rgba(244, 63, 94, 0.4)',
                    }}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: 'white', transform: 'translate(30%, -30%)' }} />
                    <div className="relative z-1 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                            <AlertTriangle size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>Low Stock</p>
                            <p className="text-2xl font-bold text-white mt-0.5">{stats.lowStock}</p>
                        </div>
                    </div>
                </div>

                {/* Inventory Value */}
                <div
                    className="relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 cursor-default"
                    style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        boxShadow: '0 10px 30px -5px rgba(16, 185, 129, 0.4)',
                    }}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: 'white', transform: 'translate(30%, -30%)' }} />
                    <div className="relative z-1 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                            <TrendingUp size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>Inventory Value</p>
                            <p className="text-2xl font-bold text-white mt-0.5">{formatCurrency(stats.inventoryValue)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {products.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 card">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock by Category</h3>
                        <ResponsiveContainer width="100%" height={200}><BarChart data={categoryData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
                    </div>
                    <div className="card">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution</h3>
                        <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={categoryData.filter(c => c.value > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value">{categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
                    </div>
                </div>
            )}

            <div className="flex gap-4">
                <div className="relative flex-1"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" className="form-input pl-10" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
                <select className="form-input w-40" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}><option value="all">All Categories</option>{categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select>
            </div>

            <div className="card overflow-hidden p-0">
                {isLoading ? (
                    <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#3b82f6', borderTopColor: 'transparent' }} /></div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500"><Package size={48} className="mx-auto mb-2 opacity-50" /><p>No products found</p></div>
                ) : (
                    <table className="table">
                        <thead><tr className="bg-gray-50"><th>Product</th><th>SKU</th><th>Category</th><th>Stock</th><th>Price</th><th>Status</th><th className="text-right">Stock Actions</th></tr></thead>
                        <tbody>
                            {filteredProducts.map(p => (
                                <tr key={p._id}>
                                    <td className="font-medium">{p.name}</td><td className="text-gray-500">{p.sku}</td><td>{p.category?.name || 'N/A'}</td><td className="font-semibold">{p.stock}</td><td>{formatCurrency(p.sellingPrice)}</td>
                                    <td><span className={`badge ${p.stock <= (p.lowStockThreshold || 5) ? 'badge-error' : 'badge-success'}`}>{p.stock <= (p.lowStockThreshold || 5) ? 'Low' : 'In Stock'}</span></td>
                                    <td>
                                        <div className="flex justify-end gap-2">
                                            <button
                                                className="action-btn action-btn-green"
                                                onClick={() => { setSelectedProduct(p); setStockType('in'); setShowStockModal(true); }}
                                                title="Stock In"
                                            >
                                                <ArrowUpCircle size={18} />
                                            </button>
                                            <button
                                                className="action-btn action-btn-amber"
                                                onClick={() => { setSelectedProduct(p); setStockType('out'); setShowStockModal(true); }}
                                                title="Stock Out"
                                            >
                                                <ArrowDownCircle size={18} />
                                            </button>
                                            <button
                                                className="action-btn action-btn-red"
                                                onClick={() => handleDeleteClick(p)}
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Stock Update Modal */}
            {showStockModal && selectedProduct && (
                <div className="modal-overlay" onClick={() => setShowStockModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Colored Header */}
                        <div
                            className="px-6 py-5 flex items-center justify-between"
                            style={{
                                background: stockType === 'in'
                                    ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                                    : 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)'
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    {stockType === 'in'
                                        ? <ArrowUpCircle size={22} className="text-white" />
                                        : <ArrowDownCircle size={22} className="text-white" />
                                    }
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{stockType === 'in' ? 'Stock In' : 'Stock Out'}</h3>
                                    <p className="text-xs text-white/70">Update inventory quantity</p>
                                </div>
                            </div>
                            <button
                                className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                                onClick={() => setShowStockModal(false)}
                            >
                                <X size={18} className="text-white" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5">
                            {/* Product Info */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div>
                                    <p className="font-semibold text-gray-900 text-base">{selectedProduct.name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">SKU: {selectedProduct.sku || 'N/A'}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-medium text-gray-500 block">Current Stock</span>
                                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-bold ${selectedProduct.stock <= (selectedProduct.lowStockThreshold || 5)
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-green-100 text-green-700'
                                        }`}>
                                        {selectedProduct.stock}
                                    </span>
                                </div>
                            </div>

                            {/* Quantity */}
                            <div>
                                <label className="form-label">Quantity</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    min="1"
                                    value={stockQuantity}
                                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                                    placeholder="Enter quantity"
                                />
                                {stockQuantity > 0 && (
                                    <p className="text-xs mt-1.5 text-gray-500">
                                        New stock will be: <span className="font-semibold text-gray-800">
                                            {stockType === 'in'
                                                ? selectedProduct.stock + stockQuantity
                                                : Math.max(0, selectedProduct.stock - stockQuantity)
                                            }
                                        </span>
                                    </p>
                                )}
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="form-label">Reason</label>
                                <select
                                    className="form-input"
                                    value={stockReason}
                                    onChange={(e) => setStockReason(e.target.value)}
                                >
                                    <option value="">Select reason</option>
                                    {stockType === 'in' ? (
                                        <>
                                            <option value="purchase">Purchase</option>
                                            <option value="return">Customer Return</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="sale">Sale</option>
                                            <option value="damage">Damaged / Defective</option>
                                        </>
                                    )}
                                    <option value="adjustment">Manual Adjustment</option>
                                </select>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                            <button className="btn btn-secondary" onClick={() => setShowStockModal(false)}>Cancel</button>
                            <button
                                className="btn text-white font-semibold"
                                style={{
                                    background: stockType === 'in'
                                        ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                                        : 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                                    boxShadow: stockType === 'in'
                                        ? '0 4px 14px rgba(5, 150, 105, 0.4)'
                                        : '0 4px 14px rgba(234, 88, 12, 0.4)'
                                }}
                                onClick={handleStockUpdate}
                                disabled={!stockQuantity || !stockReason}
                            >
                                {stockType === 'in' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                                Update Stock
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Category Modal */}
            {showCategoryModal && (
                <div className="modal-overlay" onClick={() => { setShowCategoryModal(false); setNewCategory({ name: '', description: '' }); }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 rounded-t-2xl" style={{ backgroundColor: '#1e3a5f' }}>
                            <h3 className="text-lg font-semibold text-white">Add New Category</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="form-label">Category Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Enter category name"
                                    value={newCategory.name}
                                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-input"
                                    rows="3"
                                    placeholder="Category description (optional)"
                                    value={newCategory.description}
                                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-2xl">
                            <button className="btn btn-secondary" onClick={() => { setShowCategoryModal(false); setNewCategory({ name: '', description: '' }); }}>Cancel</button>
                            <button
                                className="btn btn-primary flex items-center gap-2"
                                onClick={handleAddCategory}
                                disabled={isSubmitting}
                            >
                                <Plus size={18} />
                                {isSubmitting ? 'Adding...' : 'Add Category'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && productToDelete && (
                <div className="modal-overlay" onClick={() => { setShowDeleteConfirm(false); setProductToDelete(null); }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} className="text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Product</h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete <strong>{productToDelete.name}</strong>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => { setShowDeleteConfirm(false); setProductToDelete(null); }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn bg-red-600 text-white hover:bg-red-700"
                                    onClick={handleDeleteProduct}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryPage;
