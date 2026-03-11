import { useState, useEffect } from 'react';
import { Search, Plus, ArrowLeft, FileText, Save, Eye, Edit, Trash2, X, Receipt, Mail } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import { salesEntriesAPI, customersAPI, productsAPI, emailAPI } from '../services/api';
import { useToast } from '../components/common';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSettings } from '../store/slices/settingsSlice';
import BillTemplate from '../components/BillTemplate';
import { downloadBillPDF } from '../utils/pdfGenerator';

const SalesEntryPage = () => {
    const toast = useToast();
    const dispatch = useDispatch();
    const settings = useSelector((state) => state.settings.data);
    const [showNewEntry, setShowNewEntry] = useState(false);
    const [showInvoicePreview, setShowInvoicePreview] = useState(false);
    const [previewBill, setPreviewBill] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sales, setSales] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
    const [filters, setFilters] = useState({
        invNo: '',
        customer: '',
        fromDate: '',
        toDate: ''
    });

    // New/Edit Sales Entry State
    const [isEditing, setIsEditing] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [isGeneratingBill, setIsGeneratingBill] = useState(false);
    const [newSale, setNewSale] = useState({
        customer: '',
        date: new Date().toISOString().split('T')[0],
        invNo: ''
    });

    const [items, setItems] = useState([
        { id: 1, product: '', particular: '', size: '', quantity: '', rate: '', cgst: '', sgst: '', igst: '' }
    ]);

    useEffect(() => {
        fetchSales();
        fetchCustomers();
        fetchProductsList();
        dispatch(fetchSettings());
    }, [pagination.page, pagination.limit, dispatch]);

    const fetchSales = async () => {
        setIsLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit
            };
            if (filters.invNo) params.search = filters.invNo;
            if (filters.customer) params.search = filters.customer;
            if (filters.fromDate) params.fromDate = filters.fromDate;
            if (filters.toDate) params.toDate = filters.toDate;

            const response = await salesEntriesAPI.getAll(params);
            setSales(response.data.data || []);
            setPagination(prev => ({
                ...prev,
                total: response.data.pagination?.total || 0,
                pages: response.data.pagination?.pages || 0
            }));
        } catch (error) {
            console.error('Error fetching sales:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await customersAPI.getAll({ limit: 100 });
            setCustomers(response.data.data || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const fetchProductsList = async () => {
        try {
            const response = await productsAPI.getAll({ limit: 200 });
            setProducts(response.data.data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchSales();
    };

    const handleClearFilters = () => {
        setFilters({ invNo: '', customer: '', fromDate: '', toDate: '' });
        setTimeout(() => fetchSales(), 100);
    };

    const handleNewSale = () => {
        resetForm();
        setShowNewEntry(true);
    };

    const handleBack = () => {
        setShowNewEntry(false);
        resetForm();
    };

    const resetForm = () => {
        setNewSale({
            customer: '',
            date: new Date().toISOString().split('T')[0],
            invNo: ''
        });
        setItems([{ id: 1, product: '', particular: '', hsnCode: '', size: '', ratePerPiece: '', pcsInPack: '', ratePerPack: '', noOfPacks: '' }]);
        setIsEditing(false);
        setSelectedEntry(null);
    };

    const handleAddItem = () => {
        setItems([...items, {
            id: items.length + 1,
            product: '',
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

    const handleProductSelect = (id, productId) => {
        const product = products.find(p => p._id === productId);
        if (product) {
            setItems(items.map(item =>
                item.id === id ? {
                    ...item,
                    product: product._id,
                    particular: product.name,
                    hsnCode: product.hsn || '',
                    ratePerPiece: product.sellingPrice?.toString() || '',
                    size: product.size || ''
                } : item
            ));
        } else {
            // Clear product link if "None" selected
            setItems(items.map(item =>
                item.id === id ? { ...item, product: '' } : item
            ));
        }
    };

    const calculateItemTotal = (item) => {
        return (parseFloat(item.ratePerPack) || 0) * (parseFloat(item.noOfPacks) || 0);
    };

    const handleSave = async () => {
        if (!newSale.customer) {
            toast.warning('Please enter customer name');
            return;
        }

        const validItems = items.filter(item => item.particular && item.noOfPacks && item.ratePerPack);
        if (validItems.length === 0) {
            toast.warning('Please add at least one item with product, rate per pack, and no of packs');
            return;
        }

        setIsSubmitting(true);
        try {
            const entryData = {
                customer: { name: newSale.customer },
                date: newSale.date,
                invoiceNumber: newSale.invNo || undefined,
                items: validItems.map(item => ({
                    product: item.product || undefined,
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
                await salesEntriesAPI.update(selectedEntry._id, entryData);
            } else {
                await salesEntriesAPI.create(entryData);
            }

            setShowNewEntry(false);
            resetForm();
            fetchSales();
        } catch (error) {
            toast.error('Error saving sales entry: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleView = (entry) => {
        setSelectedEntry(entry);
        setShowViewModal(true);
    };

    const handleEdit = (entry) => {
        setNewSale({
            customer: entry.customer?.name || '',
            date: entry.date ? new Date(entry.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            invNo: entry.invoiceNumber || ''
        });
        setItems(entry.items?.map((item, index) => ({
            id: index + 1,
            product: item.product || '',
            particular: item.particular || '',
            hsnCode: item.hsnCode || '',
            size: item.size || '',
            ratePerPiece: item.ratePerPiece?.toString() || '',
            pcsInPack: item.pcsInPack?.toString() || '',
            ratePerPack: item.ratePerPack?.toString() || '',
            noOfPacks: item.noOfPacks?.toString() || ''
        })) || [{ id: 1, product: '', particular: '', hsnCode: '', size: '', ratePerPiece: '', pcsInPack: '', ratePerPack: '', noOfPacks: '' }]);
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
            await salesEntriesAPI.delete(selectedEntry._id);
            setShowDeleteConfirm(false);
            setSelectedEntry(null);
            fetchSales();
        } catch (error) {
            toast.error('Error deleting sales entry: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleGenerateBill = async (entry) => {
        setIsGeneratingBill(true);
        try {
            const response = await salesEntriesAPI.generateBill(entry._id);
            if (response.data.success) {
                const bill = response.data.data;
                toast.success(`Bill #${bill.billNumber} generated successfully!`);
                // Show bill preview
                setPreviewBill(bill);
                setShowInvoicePreview(true);
                setShowViewModal(false);
            }
        } catch (error) {
            toast.error('Error generating bill: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsGeneratingBill(false);
        }
    };

    const handleInvoicePreview = () => {
        if (!newSale.customer) {
            toast.warning('Please select a customer first');
            return;
        }

        // Find customer details
        const customerDetails = customers.find(c => c.companyName === newSale.customer) || { name: newSale.customer };

        // Calculate totals
        const validItems = items.filter(item => item.particular && item.noOfPacks && item.ratePerPack);

        // Calculate subtotal
        const subtotal = validItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);

        // Count total packs/quantity for the invoice
        const totalPacks = validItems.reduce((sum, item) => sum + (parseFloat(item.noOfPacks) || 0), 0)

        const billData = {
            billNumber: newSale.invNo || 'DRAFT',
            date: newSale.date,
            customer: {
                name: customerDetails.companyName || newSale.customer,
                phone: customerDetails.mobile || '',
                address: customerDetails.address || '',
                gstin: customerDetails.gstin || '',
                state: customerDetails.state || '',
            },
            items: validItems.map(item => ({
                productName: item.particular,
                quantity: parseFloat(item.noOfPacks) || 0,
                price: parseFloat(item.ratePerPack) || 0,
                total: calculateItemTotal(item),
                hsn: item.hsnCode || '',
                noOfPacks: parseFloat(item.noOfPacks) || 0,
                ratePerPack: parseFloat(item.ratePerPack) || 0
            })),
            subtotal: subtotal,
            discountAmount: 0,
            grandTotal: subtotal,
            totalPacks: totalPacks
        };

        setPreviewBill(billData);
        setShowInvoicePreview(true);
    };

    const handleDownloadPDF = async () => {
        if (!previewBill) return;
        const element = document.getElementById('bill-template-preview');
        if (element) {
            await downloadBillPDF(element, previewBill.billNumber || 'Invoice');
        }
    };

    const handleEmailBill = async () => {
        if (!previewBill || !previewBill._id) {
            toast.warning('Please save and generate a proper bill before emailing.');
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await emailAPI.sendBill(previewBill._id);
            if (response.data.success) {
                toast.success(`Bill emailed successfully to ${previewBill.customer?.email || 'customer'}!`);
            } else {
                toast.error(response.data.message || 'Failed to email bill');
            }
        } catch (error) {
            console.error('Error emailing bill:', error);
            toast.error(error.response?.data?.message || 'Error emailing bill');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Show New Sales Entry Form
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
                            {isEditing ? 'Edit Sales Entry' : 'New Sales Entry'}
                        </h1>
                    </div>
                    <button
                        className="btn btn-secondary"
                        onClick={handleInvoicePreview}
                    >
                        <FileText size={18} />
                        INVOICE
                    </button>
                </div>

                {/* Top Fields */}
                <div className="card">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="form-label">Customer *</label>
                            <input
                                type="text"
                                className="form-input border-2 border-cyan-500 focus:border-cyan-600 focus:ring-cyan-500"
                                placeholder="Enter Customer Name"
                                value={newSale.customer}
                                onChange={(e) => setNewSale({ ...newSale, customer: e.target.value })}
                                list="customer-list"
                            />
                            <datalist id="customer-list">
                                {customers.map(c => (
                                    <option key={c._id} value={c.companyName} />
                                ))}
                            </datalist>
                        </div>
                        <div>
                            <label className="form-label">Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={newSale.date}
                                onChange={(e) => setNewSale({ ...newSale, date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="form-label">Inv No (Auto-generated if empty)</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Leave empty for auto"
                                value={newSale.invNo}
                                onChange={(e) => setNewSale({ ...newSale, invNo: e.target.value })}
                                disabled={isEditing}
                            />
                        </div>
                    </div>
                </div>

                {/* New Sales Entry Table */}
                <div className="card">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Sales Items</h2>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-100 border-b-2 border-gray-300">
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700">S.No</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Product</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700">HSN Code</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Sizes/Pieces</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Rate Per Piece</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Pcs in Pack</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Rate Per Pack</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700">No Of Packs</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Amount Rs.</th>
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={item.id} className="border-b border-gray-200">
                                        <td className="p-3 text-sm font-medium text-gray-900">{index + 1}</td>
                                        <td className="p-3">
                                            <select
                                                className="form-input w-36 text-sm"
                                                value={item.product || ''}
                                                onChange={(e) => handleProductSelect(item.id, e.target.value)}
                                            >
                                                <option value="">-- Select --</option>
                                                {products.map(p => (
                                                    <option key={p._id} value={p._id}>
                                                        {p.name} (₹{p.sellingPrice})
                                                    </option>
                                                ))}
                                            </select>
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
                                                placeholder="₹"
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
                                                placeholder="₹"
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

    // Show Sales List (default view)
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
                <button
                    className="flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium text-sm transition-colors"
                    style={{ backgroundColor: '#3b82f6' }}
                    onClick={handleNewSale}
                >
                    <Plus size={18} />
                    NEW SALES ENTRY
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
                        <label className="form-label">Customer</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter customer name"
                            value={filters.customer}
                            onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
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
                                <th className="text-left p-4 text-sm font-bold text-gray-900">Customer Name</th>
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
                            ) : sales.length > 0 ? (
                                sales.map((sale, index) => (
                                    <tr
                                        key={sale._id}
                                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="p-4 text-sm font-medium text-gray-900">{(pagination.page - 1) * pagination.limit + index + 1}</td>
                                        <td className="p-4 text-sm font-medium text-gray-900">{formatDate(sale.date)}</td>
                                        <td className="p-4 text-sm font-semibold" style={{ color: '#1e40af' }}>{sale.invoiceNumber}</td>
                                        <td className="p-4 text-sm font-medium text-gray-900">{sale.customer?.name || '-'}</td>
                                        <td className="p-4 text-sm font-medium text-gray-900">{sale.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}</td>
                                        <td className="p-4 text-sm font-bold text-green-600">₹{(sale.grandTotal || 0).toLocaleString()}</td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <button
                                                    className="action-btn action-btn-blue"
                                                    title="View"
                                                    onClick={() => handleView(sale)}
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    className="action-btn action-btn-green"
                                                    title="Edit"
                                                    onClick={() => handleEdit(sale)}
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    className="p-2 rounded-lg transition-colors bg-amber-100 hover:bg-amber-200 text-amber-700"
                                                    title="Generate Bill"
                                                    onClick={() => handleGenerateBill(sale)}
                                                    disabled={isGeneratingBill}
                                                >
                                                    <Receipt size={18} />
                                                </button>
                                                <button
                                                    className="action-btn action-btn-red"
                                                    title="Delete"
                                                    onClick={() => handleDeleteClick(sale)}
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
                                        No sales entries found. Click "NEW SALES ENTRY" to add one.
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
                            <h3 className="text-lg font-semibold text-white">Sales Entry Details</h3>
                            <button onClick={() => setShowViewModal(false)} className="text-white hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div><span className="text-gray-500">Invoice No:</span> <span className="font-semibold">{selectedEntry.invoiceNumber}</span></div>
                                <div><span className="text-gray-500">Date:</span> <span className="font-semibold">{formatDate(selectedEntry.date)}</span></div>
                                <div><span className="text-gray-500">Customer:</span> <span className="font-semibold">{selectedEntry.customer?.name}</span></div>
                                <div><span className="text-gray-500">Total:</span> <span className="font-semibold text-green-600">₹{selectedEntry.grandTotal?.toLocaleString()}</span></div>
                            </div>
                            <h4 className="font-semibold mb-2">Items</h4>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="p-2 text-left">Product</th>
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
                                            <td className="p-2">
                                                {item.particular}
                                                {item.product && <span className="ml-1 text-xs text-blue-600">(Linked)</span>}
                                            </td>
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

                            {/* Generate Bill Button in View Modal */}
                            <div className="mt-6 flex justify-end">
                                <button
                                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium text-sm transition-colors"
                                    onClick={() => handleGenerateBill(selectedEntry)}
                                    disabled={isGeneratingBill}
                                >
                                    <Receipt size={18} />
                                    {isGeneratingBill ? 'Generating...' : 'Generate Bill'}
                                </button>
                            </div>
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
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Sales Entry</h3>
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

            {/* Invoice/Bill Preview Modal */}
            {showInvoicePreview && previewBill && (
                <div className="modal-overlay" onClick={() => setShowInvoicePreview(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-[230mm] max-h-[95vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {previewBill.billNumber && previewBill.billNumber !== 'DRAFT'
                                    ? `Bill Preview - ${previewBill.billNumber}`
                                    : 'Invoice Preview'}
                            </h3>
                            <div className="flex gap-2">
                                {previewBill._id && (
                                    <button
                                        className="btn btn-sm text-white bg-blue-600 hover:bg-blue-700"
                                        onClick={handleEmailBill}
                                        disabled={isSubmitting}
                                    >
                                        <Mail size={16} /> {isSubmitting ? 'Sending...' : 'Email'}
                                    </button>
                                )}
                                <button className="btn btn-primary btn-sm" onClick={handleDownloadPDF}>
                                    <FileText size={16} /> Download PDF
                                </button>
                                <button className="btn btn-ghost btn-icon" onClick={() => setShowInvoicePreview(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="p-4 overflow-auto max-h-[80vh] bg-gray-100">
                            <div id="bill-template-preview">
                                <BillTemplate bill={previewBill} settings={settings} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesEntryPage;
