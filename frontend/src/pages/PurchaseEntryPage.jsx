import { useState, useEffect } from 'react';
import { Search, Plus, ArrowLeft, FileText, Save, Eye, Edit, Trash2, X } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import { purchaseEntriesAPI, suppliersAPI } from '../services/api';
import { useToast } from '../components/common';

const PurchaseEntryPage = () => {
    const toast = useToast();
    const [showNewEntry, setShowNewEntry] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [purchases, setPurchases] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
    const [filters, setFilters] = useState({
        invNo: '',
        company: '',
        fromDate: '',
        toDate: ''
    });

    // New/Edit Purchase Entry State
    const [isEditing, setIsEditing] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [newPurchase, setNewPurchase] = useState({
        supplier: '',
        date: new Date().toISOString().split('T')[0],
        invNo: ''
    });

    const [items, setItems] = useState([
        { id: 1, particular: '', hsnCode: '', size: '', ratePerPiece: '', pcsInPack: '', ratePerPack: '', noOfPacks: '' }
    ]);

    useEffect(() => {
        fetchPurchases();
        fetchSuppliers();
    }, [pagination.page, pagination.limit]);

    const fetchPurchases = async () => {
        setIsLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit
            };
            if (filters.invNo) params.search = filters.invNo;
            if (filters.company) params.search = filters.company;
            if (filters.fromDate) params.fromDate = filters.fromDate;
            if (filters.toDate) params.toDate = filters.toDate;

            const response = await purchaseEntriesAPI.getAll(params);
            setPurchases(response.data.data || []);
            setPagination(prev => ({
                ...prev,
                total: response.data.pagination?.total || 0,
                pages: response.data.pagination?.pages || 0
            }));
        } catch (error) {
            console.error('Error fetching purchases:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await suppliersAPI.getAll({ limit: 100 });
            setSuppliers(response.data.data || []);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchPurchases();
    };

    const handleClearFilters = () => {
        setFilters({ invNo: '', company: '', fromDate: '', toDate: '' });
        setTimeout(() => fetchPurchases(), 100);
    };

    const handleNewPurchase = () => {
        resetForm();
        setShowNewEntry(true);
    };

    const handleBack = () => {
        setShowNewEntry(false);
        resetForm();
    };

    const resetForm = () => {
        setNewPurchase({
            supplier: '',
            date: new Date().toISOString().split('T')[0],
            invNo: ''
        });
        setItems([{ id: 1, particular: '', hsnCode: '', size: '', ratePerPiece: '', pcsInPack: '', ratePerPack: '', noOfPacks: '' }]);
        setIsEditing(false);
        setSelectedEntry(null);
    };

    const handleAddItem = () => {
        setItems([...items, {
            id: items.length + 1,
            particular: '',
            hsnCode: '',
            size: '',
            ratePerPiece: '',
            pcsInPack: '',
            ratePerPack: '',
            noOfPacks: ''
        }]);
    };

    const handleRemoveItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const handleItemChange = (id, field, value) => {
        setItems(items.map(item => {
            if (item.id !== id) return item;
            const updated = { ...item, [field]: value };
            // Auto-calculate ratePerPack when ratePerPiece or pcsInPack changes
            if (field === 'ratePerPiece' || field === 'pcsInPack') {
                const rpp = parseFloat(field === 'ratePerPiece' ? value : updated.ratePerPiece) || 0;
                const pcs = parseFloat(field === 'pcsInPack' ? value : updated.pcsInPack) || 1;
                updated.ratePerPack = (rpp * pcs).toString();
            }
            return updated;
        }));
    };

    const calculateItemTotal = (item) => {
        return (parseFloat(item.ratePerPack) || 0) * (parseFloat(item.noOfPacks) || 0);
    };

    const handleSave = async () => {
        if (!newPurchase.supplier) {
            toast.warning('Please enter supplier name');
            return;
        }

        if (!newPurchase.invNo) {
            toast.warning('Please enter invoice number');
            return;
        }

        const validItems = items.filter(item => item.particular && item.ratePerPack && item.noOfPacks);
        if (validItems.length === 0) {
            toast.warning('Please add at least one item with particulars, rate per pack and no. of packs');
            return;
        }

        setIsSubmitting(true);
        try {
            const entryData = {
                supplier: { name: newPurchase.supplier },
                date: newPurchase.date,
                invoiceNumber: newPurchase.invNo,
                items: validItems.map(item => ({
                    particular: item.particular,
                    hsnCode: item.hsnCode || '',
                    size: item.size,
                    ratePerPiece: parseFloat(item.ratePerPiece) || 0,
                    pcsInPack: parseFloat(item.pcsInPack) || 1,
                    ratePerPack: parseFloat(item.ratePerPack) || 0,
                    noOfPacks: parseFloat(item.noOfPacks) || 0
                }))
            };

            if (isEditing && selectedEntry) {
                await purchaseEntriesAPI.update(selectedEntry._id, entryData);
            } else {
                await purchaseEntriesAPI.create(entryData);
            }

            setShowNewEntry(false);
            resetForm();
            fetchPurchases();
        } catch (error) {
            toast.error('Error saving purchase entry: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleView = (entry) => {
        setSelectedEntry(entry);
        setShowViewModal(true);
    };

    const handleEdit = (entry) => {
        setNewPurchase({
            supplier: entry.supplier?.name || '',
            date: entry.date ? new Date(entry.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            invNo: entry.invoiceNumber || ''
        });
        setItems(entry.items?.map((item, index) => ({
            id: index + 1,
            particular: item.particular || '',
            hsnCode: item.hsnCode || '',
            size: item.size || '',
            ratePerPiece: item.ratePerPiece?.toString() || '',
            pcsInPack: item.pcsInPack?.toString() || '',
            ratePerPack: item.ratePerPack?.toString() || '',
            noOfPacks: item.noOfPacks?.toString() || ''
        })) || [{ id: 1, particular: '', hsnCode: '', size: '', ratePerPiece: '', pcsInPack: '', ratePerPack: '', noOfPacks: '' }]);
        setSelectedEntry(entry);
        setIsEditing(true);
        setShowNewEntry(true);
    };

    const handleDeleteClick = (entry) => {
        setSelectedEntry(entry);
        setShowDeleteConfirm(true);
    };

    const handleDelete = async () => {
        try {
            await purchaseEntriesAPI.delete(selectedEntry._id);
            setShowDeleteConfirm(false);
            setSelectedEntry(null);
            fetchPurchases();
        } catch (error) {
            toast.error('Error deleting purchase entry: ' + (error.response?.data?.message || error.message));
        }
    };

    // Show New Purchase Entry Form
    if (showNewEntry) {
        return (
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleBack}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={20} className="text-gray-700" />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {isEditing ? 'Edit Purchase Entry' : 'New Purchase Entry'}
                        </h1>
                    </div>
                    <button className="btn btn-secondary">
                        <FileText size={18} />
                        INVOICE
                    </button>
                </div>

                {/* Top Fields */}
                <div className="card">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="form-label">Supplier *</label>
                            <input
                                type="text"
                                className="form-input border-2 border-cyan-500 focus:border-cyan-600 focus:ring-cyan-500"
                                placeholder="Enter Supplier Name"
                                value={newPurchase.supplier}
                                onChange={(e) => setNewPurchase({ ...newPurchase, supplier: e.target.value })}
                                list="supplier-list"
                            />
                            <datalist id="supplier-list">
                                {suppliers.map(s => (
                                    <option key={s._id} value={s.companyName} />
                                ))}
                            </datalist>
                        </div>
                        <div>
                            <label className="form-label">Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={newPurchase.date}
                                onChange={(e) => setNewPurchase({ ...newPurchase, date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="form-label">Inv No *</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Enter Invoice Number"
                                value={newPurchase.invNo}
                                onChange={(e) => setNewPurchase({ ...newPurchase, invNo: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* New Purchase Entry Table */}
                <div className="card">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Purchase Items</h2>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-100 border-b-2 border-gray-300">
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700">S No</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Particulars *</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700">HSN Code</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Sizes / Pieces</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Rate Per Piece</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Pcs in Pack</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Rate Per Pack *</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700">No Of Packs *</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Amount Rs.</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={item.id} className="border-b border-gray-200">
                                        <td className="p-3 text-sm font-medium text-gray-900">{index + 1}</td>
                                        <td className="p-3">
                                            <input
                                                type="text"
                                                className="form-input w-full"
                                                placeholder="Item name"
                                                value={item.particular}
                                                onChange={(e) => handleItemChange(item.id, 'particular', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="text"
                                                className="form-input w-24"
                                                placeholder="HSN"
                                                value={item.hsnCode}
                                                onChange={(e) => handleItemChange(item.id, 'hsnCode', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-3">
                                            <select
                                                className="form-input w-24"
                                                value={item.size}
                                                onChange={(e) => handleItemChange(item.id, 'size', e.target.value)}
                                            >
                                                <option value="">Size</option>
                                                <option value="S">S</option>
                                                <option value="M">M</option>
                                                <option value="L">L</option>
                                                <option value="XL">XL</option>
                                                <option value="XXL">XXL</option>
                                            </select>
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                className="form-input w-24"
                                                placeholder="Rate"
                                                value={item.ratePerPiece}
                                                onChange={(e) => handleItemChange(item.id, 'ratePerPiece', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                className="form-input w-20"
                                                placeholder="Pcs"
                                                value={item.pcsInPack}
                                                onChange={(e) => handleItemChange(item.id, 'pcsInPack', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                className="form-input w-24"
                                                placeholder="Rate"
                                                value={item.ratePerPack}
                                                onChange={(e) => handleItemChange(item.id, 'ratePerPack', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                className="form-input w-20"
                                                placeholder="Packs"
                                                value={item.noOfPacks}
                                                onChange={(e) => handleItemChange(item.id, 'noOfPacks', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-3 text-sm font-bold text-gray-900">
                                            ₹{calculateItemTotal(item).toFixed(2)}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex gap-1">
                                                {index === items.length - 1 && (
                                                    <button
                                                        onClick={handleAddItem}
                                                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                )}
                                                {items.length > 1 && (
                                                    <button
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-md transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Grand Total */}
                    <div className="mt-4 flex justify-end">
                        <div className="bg-gray-100 px-6 py-3 rounded-lg">
                            <span className="text-lg font-bold text-gray-900">
                                Grand Total: ₹{items.reduce((sum, item) => sum + calculateItemTotal(item), 0).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={handleBack}
                            className="btn btn-secondary px-6"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSubmitting}
                            className="btn btn-primary px-8"
                        >
                            <Save size={18} />
                            {isSubmitting ? 'Saving...' : 'SAVE'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Show Purchase List (default view)
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Purchase</h1>
                <button
                    className="flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium text-sm transition-colors"
                    style={{ backgroundColor: '#3b82f6' }}
                    onClick={handleNewPurchase}
                >
                    <Plus size={18} />
                    NEW PURCHASE ENTRY
                </button>
            </div>

            {/* Search Filters Card */}
            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="shrink-0 w-32">
                        <label className="form-label">Inv No</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter invoice number"
                            value={filters.invNo}
                            onChange={(e) => setFilters({ ...filters, invNo: e.target.value })}
                        />
                    </div>
                    <div className="shrink-0 w-48">
                        <label className="form-label">Company</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter company name"
                            value={filters.company}
                            onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                        />
                    </div>
                    <div className="shrink-0 w-36">
                        <label className="form-label">From Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={filters.fromDate}
                            onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                        />
                    </div>
                    <div className="shrink-0 w-36">
                        <label className="form-label">To Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={filters.toDate}
                            onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                        />
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={handleSearch}
                        disabled={isLoading}
                    >
                        <Search size={16} />
                        Search
                    </button>
                    <button
                        className="btn btn-ghost"
                        onClick={handleClearFilters}
                        title="Clear filters"
                    >
                        <X size={16} />
                        Clear
                    </button>
                </div>
            </div>

            {/* Data Table Card */}
            <div className="card p-0">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b-2 border-gray-300">
                                <th className="text-left p-4 text-sm font-bold text-gray-900">S No</th>
                                <th className="text-left p-4 text-sm font-bold text-gray-900">Date</th>
                                <th className="text-left p-4 text-sm font-bold text-gray-900">InvNo</th>
                                <th className="text-left p-4 text-sm font-bold text-gray-900">Company Name</th>
                                <th className="text-left p-4 text-sm font-bold text-gray-900">Qty</th>
                                <th className="text-left p-4 text-sm font-bold text-gray-900">Amount</th>
                                <th className="text-left p-4 text-sm font-bold text-gray-900">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="7" className="py-8 text-center">
                                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    </td>
                                </tr>
                            ) : purchases.length > 0 ? (
                                purchases.map((purchase, index) => (
                                    <tr
                                        key={purchase._id}
                                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="p-4 text-sm font-medium text-gray-900">{(pagination.page - 1) * pagination.limit + index + 1}</td>
                                        <td className="p-4 text-sm font-medium text-gray-900">{formatDate(purchase.date)}</td>
                                        <td className="p-4 text-sm font-semibold" style={{ color: '#1e40af' }}>{purchase.invoiceNumber}</td>
                                        <td className="p-4 text-sm font-medium text-gray-900">{purchase.supplier?.name || '-'}</td>
                                        <td className="p-4 text-sm font-medium text-gray-900">{purchase.items?.reduce((sum, item) => sum + (item.noOfPacks || 0), 0) || 0}</td>
                                        <td className="p-4 text-sm font-bold text-green-600">₹{(purchase.grandTotal || 0).toLocaleString()}</td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <button
                                                    className="action-btn action-btn-blue"
                                                    title="View"
                                                    onClick={() => handleView(purchase)}
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    className="action-btn action-btn-green"
                                                    title="Edit"
                                                    onClick={() => handleEdit(purchase)}
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    className="action-btn action-btn-red"
                                                    title="Delete"
                                                    onClick={() => handleDeleteClick(purchase)}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-600 font-medium">
                                        No purchase entries found. Click "NEW PURCHASE ENTRY" to add one.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                        <div className="text-sm text-gray-600">
                            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                disabled={pagination.page <= 1}
                                className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                disabled={pagination.page >= pagination.pages}
                                className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* View Modal */}
            {showViewModal && selectedEntry && (
                <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 flex justify-between items-center" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
                            <h3 className="text-lg font-semibold text-white">Purchase Entry Details</h3>
                            <button onClick={() => setShowViewModal(false)} className="text-white hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div><span className="text-gray-500">Invoice No:</span> <span className="font-semibold">{selectedEntry.invoiceNumber}</span></div>
                                <div><span className="text-gray-500">Date:</span> <span className="font-semibold">{formatDate(selectedEntry.date)}</span></div>
                                <div><span className="text-gray-500">Supplier:</span> <span className="font-semibold">{selectedEntry.supplier?.name}</span></div>
                                <div><span className="text-gray-500">Total:</span> <span className="font-semibold text-green-600">₹{selectedEntry.grandTotal?.toLocaleString()}</span></div>
                            </div>
                            <h4 className="font-semibold mb-2">Items</h4>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="p-2 text-left">Particular</th>
                                        <th className="p-2 text-left">HSN Code</th>
                                        <th className="p-2 text-left">Size</th>
                                        <th className="p-2 text-right">Rate/Piece</th>
                                        <th className="p-2 text-right">Pcs/Pack</th>
                                        <th className="p-2 text-right">Rate/Pack</th>
                                        <th className="p-2 text-right">No. Packs</th>
                                        <th className="p-2 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedEntry.items?.map((item, i) => (
                                        <tr key={i} className="border-b">
                                            <td className="p-2">{item.particular}</td>
                                            <td className="p-2">{item.hsnCode || '-'}</td>
                                            <td className="p-2">{item.size || '-'}</td>
                                            <td className="p-2 text-right">₹{item.ratePerPiece || 0}</td>
                                            <td className="p-2 text-right">{item.pcsInPack || 1}</td>
                                            <td className="p-2 text-right">₹{item.ratePerPack || 0}</td>
                                            <td className="p-2 text-right">{item.noOfPacks || 0}</td>
                                            <td className="p-2 text-right">₹{item.total?.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && selectedEntry && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} className="text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Purchase Entry</h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete invoice <strong>{selectedEntry.invoiceNumber}</strong>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseEntryPage;
