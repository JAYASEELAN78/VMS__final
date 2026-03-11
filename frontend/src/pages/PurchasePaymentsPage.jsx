import { useState, useEffect } from 'react';
import { ArrowLeft, Wallet, Plus, Search, Edit, Trash2, X, Save, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { paymentsAPI, suppliersAPI } from '../services/api';
import { useToast } from '../components/common';

const PurchasePaymentsPage = () => {
    const toast = useToast();
    const navigate = useNavigate();
    const [payments, setPayments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

    // Supplier search state
    const [supplierSearch, setSupplierSearch] = useState('');
    const [supplierSuggestions, setSupplierSuggestions] = useState([]);
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
    const [isSearchingSuppliers, setIsSearchingSuppliers] = useState(false);

    const [formData, setFormData] = useState({
        companyName: '',
        supplier: null,
        date: new Date().toISOString().split('T')[0],
        paymentType: 'cash',
        bank: '',
        amount: '',
        detail: ''
    });

    useEffect(() => {
        fetchPayments();
    }, [pagination.page, pagination.limit]);

    // Search suppliers
    useEffect(() => {
        const searchSuppliers = async () => {
            if (supplierSearch.length < 2) {
                setSupplierSuggestions([]);
                return;
            }
            setIsSearchingSuppliers(true);
            try {
                const response = await suppliersAPI.getAll({ search: supplierSearch, limit: 5 });
                setSupplierSuggestions(response.data.data || []);
            } catch (error) {
                console.error('Error searching suppliers:', error);
            } finally {
                setIsSearchingSuppliers(false);
            }
        };
        const debounce = setTimeout(searchSuppliers, 300);
        return () => clearTimeout(debounce);
    }, [supplierSearch]);

    const fetchPayments = async () => {
        setIsLoading(true);
        try {
            const response = await paymentsAPI.getAll({
                type: 'purchase',
                search: searchQuery,
                fromDate: fromDate || undefined,
                toDate: toDate || undefined,
                page: pagination.page,
                limit: pagination.limit
            });
            setPayments(response.data.data || []);
            setPagination(prev => ({
                ...prev,
                total: response.data.pagination?.total || 0,
                pages: response.data.pagination?.pages || 0
            }));
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchPayments();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({
            companyName: '',
            supplier: null,
            date: new Date().toISOString().split('T')[0],
            paymentType: 'cash',
            bank: '',
            amount: '',
            detail: ''
        });
        setSupplierSearch('');
        setIsEditing(false);
        setSelectedPayment(null);
    };

    const selectSupplier = (supplier) => {
        setFormData(prev => ({
            ...prev,
            companyName: supplier.companyName,
            supplier: supplier._id
        }));
        setSupplierSearch(supplier.companyName);
        setShowSupplierDropdown(false);
    };

    const handleOpenModal = (payment = null) => {
        if (payment) {
            setFormData({
                companyName: payment.companyName || '',
                supplier: payment.supplier?._id || null,
                date: payment.date ? new Date(payment.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                paymentType: payment.paymentType || 'cash',
                bank: payment.bank || '',
                amount: payment.amount || '',
                detail: payment.detail || ''
            });
            setSupplierSearch(payment.companyName || '');
            setSelectedPayment(payment);
            setIsEditing(true);
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.companyName || !formData.amount) {
            toast.warning('Please fill Supplier and Amount');
            return;
        }
        try {
            const payload = {
                ...formData,
                type: 'purchase',
                amount: parseFloat(formData.amount)
            };
            if (isEditing && selectedPayment) {
                await paymentsAPI.update(selectedPayment._id, payload);
                toast.success('Payment updated successfully');
            } else {
                await paymentsAPI.create(payload);
                toast.success('Payment added successfully');
            }
            setShowModal(false);
            resetForm();
            fetchPayments();
        } catch (error) {
            toast.error('Error saving payment: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDeleteClick = (payment) => {
        setSelectedPayment(payment);
        setShowDeleteConfirm(true);
    };

    const handleDelete = async () => {
        try {
            await paymentsAPI.delete(selectedPayment._id);
            toast.success('Payment deleted successfully');
            setShowDeleteConfirm(false);
            setSelectedPayment(null);
            fetchPayments();
        } catch (error) {
            toast.error('Error deleting payment: ' + (error.response?.data?.message || error.message));
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    const handleLimitChange = (newLimit) => {
        setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Wallet className="text-orange-600" size={20} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Supplier Payments</h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        className="flex items-center gap-2 px-4 py-2 border border-gray-400 text-gray-600 rounded-lg font-medium text-sm hover:bg-gray-50"
                        onClick={() => toast.info('Invoice feature coming soon')}
                    >
                        <FileText size={16} />
                        INVOICE
                    </button>
                    <button
                        className="flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium text-sm transition-colors"
                        style={{ backgroundColor: '#3b82f6' }}
                        onClick={() => handleOpenModal()}
                    >
                        <Plus size={16} />
                        PAYMENT ENTRY
                    </button>
                </div>
            </div>

            {/* Search Section */}
            <div className="card py-4">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="shrink-0">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Company</label>
                        <input
                            type="text"
                            placeholder="Company name"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="form-input w-40 text-sm py-1.5"
                        />
                    </div>
                    <div className="shrink-0">
                        <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="form-input w-36 text-sm py-1.5"
                        />
                    </div>
                    <div className="shrink-0">
                        <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="form-input w-36 text-sm py-1.5"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                        style={{ backgroundColor: '#3b82f6' }}
                    >
                        <Search size={14} />
                        SEARCH
                    </button>
                    <button
                        onClick={() => { setSearchQuery(''); setFromDate(''); setToDate(''); fetchPayments(); }}
                        className="px-3 py-1.5 text-gray-500 hover:text-gray-700 font-medium text-sm"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-100 border-b-2 border-gray-300">
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">S No</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Company Name</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Bank</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Detail</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="7" className="py-8 text-center">
                                        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#3b82f6', borderTopColor: 'transparent' }}></div>
                                    </td>
                                </tr>
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-8 text-center text-gray-500">
                                        No payments found. Click "PAYMENT ENTRY" to add one.
                                    </td>
                                </tr>
                            ) : (
                                payments.map((payment, index) => (
                                    <tr key={payment._id} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="py-3 px-4 text-gray-900">{(pagination.page - 1) * pagination.limit + index + 1}</td>
                                        <td className="py-3 px-4 text-gray-900">{formatDate(payment.date)}</td>
                                        <td className="py-3 px-4 text-blue-600 font-medium">{payment.companyName}</td>
                                        <td className="py-3 px-4 text-gray-900">{payment.bank || '-'}</td>
                                        <td className="py-3 px-4 text-gray-900">{payment.detail || '-'}</td>
                                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">{formatCurrency(payment.amount)}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    className="action-btn action-btn-blue"
                                                    onClick={() => handleOpenModal(payment)}
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    className="action-btn action-btn-red"
                                                    onClick={() => handleDeleteClick(payment)}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                                className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50"
                            >
                                &lt;
                            </button>
                            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                                const pageNum = Math.max(1, pagination.page - 2) + i;
                                if (pageNum > pagination.pages) return null;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`px-3 py-1 text-sm rounded ${pagination.page === pageNum ? 'text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                                        style={pagination.page === pageNum ? { backgroundColor: '#3b82f6' } : {}}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page >= pagination.pages}
                                className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50"
                            >
                                &gt;
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            {[10, 25, 50, 100].map(limit => (
                                <button
                                    key={limit}
                                    onClick={() => handleLimitChange(limit)}
                                    className={`px-3 py-1 text-sm rounded ${pagination.limit === limit ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {limit}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* New/Edit Payment Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 rounded-t-lg" style={{ backgroundColor: '#1e3a2f' }}>
                            <h3 className="text-lg font-semibold text-white">
                                {isEditing ? 'Edit Payment' : 'New Payment'}
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Supplier Search */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier :</label>
                                <input
                                    type="text"
                                    value={supplierSearch}
                                    onChange={(e) => {
                                        setSupplierSearch(e.target.value);
                                        setFormData(prev => ({ ...prev, companyName: e.target.value, supplier: null }));
                                        setShowSupplierDropdown(true);
                                    }}
                                    onFocus={() => setShowSupplierDropdown(true)}
                                    className="form-input w-full"
                                    placeholder="Search Supplier Here"
                                />
                                {showSupplierDropdown && supplierSuggestions.length > 0 && (
                                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                        {supplierSuggestions.map((supp) => (
                                            <div
                                                key={supp._id}
                                                className="px-4 py-2 cursor-pointer hover:bg-green-50"
                                                onClick={() => selectSupplier(supp)}
                                            >
                                                <p className="font-medium text-gray-900">{supp.companyName}</p>
                                                <p className="text-xs text-gray-500">{supp.mobile}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date :</label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    className="form-input w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type : <span className="text-red-500">*</span></label>
                                <select
                                    name="paymentType"
                                    value={formData.paymentType}
                                    onChange={handleInputChange}
                                    className="form-input w-full"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="bank">Bank</option>
                                    <option value="upi">UPI</option>
                                    <option value="cheque">Cheque</option>
                                    <option value="rtgs">RTGS</option>
                                    <option value="neft">NEFT</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bank :</label>
                                <input
                                    type="text"
                                    name="bank"
                                    value={formData.bank}
                                    onChange={handleInputChange}
                                    className="form-input w-full"
                                    placeholder="Bank"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount :</label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleInputChange}
                                    className="form-input w-full"
                                    placeholder="Amount"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Detail :</label>
                                <input
                                    type="text"
                                    name="detail"
                                    value={formData.detail}
                                    onChange={handleInputChange}
                                    className="form-input w-full"
                                    placeholder="Detail"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium"
                                style={{ backgroundColor: '#3b82f6' }}
                            >
                                <Save size={16} />
                                SAVE
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && selectedPayment && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} className="text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Payment</h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete payment for <strong>{selectedPayment.companyName}</strong>? This action cannot be undone.
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

export default PurchasePaymentsPage;
