import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBills, createBill, deleteBill } from '../store/slices/billsSlice';
import { fetchProducts } from '../store/slices/productsSlice';
import { fetchSettings } from '../store/slices/settingsSlice';
import { Plus, Search, Printer, Eye, Trash2, X, FileText, Download, Users, Receipt, Mail } from 'lucide-react';
import BillTemplate from '../components/BillTemplate';
import { downloadInvoicePDF } from '../utils/invoiceGenerator';
import { customersAPI, emailAPI } from '../services/api';
import { useToast } from '../components/common';

const BillingPage = () => {
    const toast = useToast();
    const dispatch = useDispatch();
    const { items: bills, isLoading } = useSelector((state) => state.bills);
    const { items: products } = useSelector((state) => state.products);
    const settings = useSelector((state) => state.settings.data);
    const billTemplateRef = useRef(null);
    const emptyInvoiceRef = useRef(null);

    const [showBillModal, setShowBillModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showEmptyInvoiceModal, setShowEmptyInvoiceModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailBill, setEmailBill] = useState(null);
    const [emailTo, setEmailTo] = useState('');
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [billTypeFilter, setBillTypeFilter] = useState('all');
    const [customer, setCustomer] = useState({
        name: '',
        phone: '',
        address: '',
        gstin: '',
        state: 'Tamilnadu',
        stateCode: '33'
    });
    const [transport, setTransport] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [billItems, setBillItems] = useState([]);
    const [discount, setDiscount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerSuggestions, setCustomerSuggestions] = useState([]);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);

    useEffect(() => {
        dispatch(fetchBills());
        dispatch(fetchProducts());
        dispatch(fetchSettings());
    }, [dispatch]);

    // Search customers when customerSearch changes
    useEffect(() => {
        const searchCustomers = async () => {
            if (customerSearch.length < 2) {
                setCustomerSuggestions([]);
                return;
            }
            setIsSearchingCustomers(true);
            try {
                const response = await customersAPI.getAll({ search: customerSearch, limit: 5 });
                setCustomerSuggestions(response.data.data || []);
            } catch (error) {
                console.error('Error searching customers:', error);
            } finally {
                setIsSearchingCustomers(false);
            }
        };
        const debounce = setTimeout(searchCustomers, 300);
        return () => clearTimeout(debounce);
    }, [customerSearch]);

    const selectCustomer = (selectedCustomer) => {
        setCustomer({
            name: selectedCustomer.companyName || '',
            phone: selectedCustomer.mobile || '',
            address: selectedCustomer.address || '',
            gstin: selectedCustomer.gstin || '',
            state: selectedCustomer.state || 'Tamilnadu',
            stateCode: selectedCustomer.stateCode || '33'
        });
        setCustomerSearch(selectedCustomer.companyName);
        setShowCustomerDropdown(false);
    };

    const addItemToBill = (product) => {
        // Always add as a new line item to allow same product with different sizes/rates
        const uniqueId = `${product._id}_${Date.now()}`;
        setBillItems([...billItems, {
            productId: product._id,
            uniqueId: uniqueId,
            name: product.name,
            productName: product.name,
            price: product.sellingPrice,
            quantity: 1,
            noOfPacks: 1,
            pcsInPack: 1,
            ratePerPiece: product.sellingPrice,
            ratePerPack: product.sellingPrice,
            hsnCode: product.hsn || '',
            gstRate: product.gstRate || 5,
            sizesOrPieces: ''
        }]);
    };

    const updateItemQuantity = (uniqueId, quantity) => {
        if (quantity <= 0) setBillItems(billItems.filter(item => item.uniqueId !== uniqueId));
        else setBillItems(billItems.map(item => item.uniqueId === uniqueId ? { ...item, quantity, noOfPacks: quantity } : item));
    };

    const updateItemField = (uniqueId, field, value) => {
        setBillItems(billItems.map(item => {
            if (item.uniqueId !== uniqueId) return item;
            const updated = { ...item, [field]: value };
            // Recalculate if rate fields change
            if (field === 'ratePerPiece' || field === 'pcsInPack') {
                updated.ratePerPack = (updated.ratePerPiece || 0) * (updated.pcsInPack || 1);
            }
            if (field === 'ratePerPack' || field === 'noOfPacks') {
                updated.price = (updated.ratePerPack || updated.price);
                updated.quantity = updated.noOfPacks || updated.quantity;
            }
            return updated;
        }));
    };

    const subtotal = billItems.reduce((sum, item) => sum + ((item.ratePerPack || item.price) * (item.noOfPacks || item.quantity)), 0);
    const discountAmount = (subtotal * discount) / 100;
    const taxableAmount = subtotal - discountAmount;
    const cgstRate = settings?.tax?.cgstRate || 2.5;
    const sgstRate = settings?.tax?.sgstRate || 2.5;
    const cgstAmount = (taxableAmount * cgstRate) / 100;
    const sgstAmount = (taxableAmount * sgstRate) / 100;
    const gstAmount = cgstAmount + sgstAmount;
    const grandTotal = Math.round(taxableAmount + gstAmount);
    const roundOff = grandTotal - (taxableAmount + gstAmount);
    const totalPacks = billItems.reduce((sum, item) => sum + (item.noOfPacks || item.quantity), 0);

    const handleCreateBill = async () => {
        if (!customer.name || !customer.phone || billItems.length === 0) {
            toast.warning('Please fill customer details and add items');
            return;
        }

        const billData = {
            customer,
            transport,
            fromDate,
            toDate,
            totalPacks,
            numOfBundles: 1,
            items: billItems.map(item => ({
                productId: item.productId,
                productName: item.name || item.productName,
                price: item.ratePerPack || item.price,
                quantity: item.noOfPacks || item.quantity,
                noOfPacks: item.noOfPacks || item.quantity,
                pcsInPack: item.pcsInPack || 1,
                ratePerPiece: item.ratePerPiece || item.price,
                ratePerPack: item.ratePerPack || item.price,
                hsnCode: item.hsnCode || '',
                sizesOrPieces: item.sizesOrPieces || '',
                gstRate: item.gstRate || 5,
                discount: 0
            })),
            subtotal,
            discount,
            discountAmount,
            taxableAmount,
            cgst: cgstAmount,
            sgst: sgstAmount,
            totalTax: gstAmount,
            roundOff,
            grandTotal,
            paymentMethod
        };

        try {
            const result = await dispatch(createBill(billData));
            if (createBill.fulfilled.match(result)) {
                setShowBillModal(false);
                resetForm();
                dispatch(fetchBills());
            } else {
                toast.error('Failed to create bill: ' + (result.payload || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error creating bill:', error);
            toast.error('Failed to create bill: ' + (error.message || 'Unknown error'));
        }
    };

    const resetForm = () => {
        setCustomer({ name: '', phone: '', address: '', gstin: '', state: 'Tamilnadu', stateCode: '33' });
        setTransport('');
        setFromDate('');
        setToDate('');
        setBillItems([]);
        setDiscount(0);
    };

    const handleViewBill = (bill) => {
        setSelectedBill(bill);
        setShowPreviewModal(true);
    };

    const handleDeleteClick = (bill) => {
        setSelectedBill(bill);
        setShowDeleteConfirm(true);
    };

    const handleDeleteBill = async () => {
        if (!selectedBill) return;
        setIsDeleting(true);
        try {
            await dispatch(deleteBill(selectedBill._id)).unwrap();
            setShowDeleteConfirm(false);
            setSelectedBill(null);
        } catch (error) {
            toast.error('Failed to delete bill: ' + (error || 'Unknown error'));
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDownloadPDF = (bill) => {
        downloadInvoicePDF(bill, settings);
    };

    const handleEmailBill = async () => {
        const trimmedEmail = emailTo?.trim();
        if (!trimmedEmail || !emailBill) {
            toast.warning('Please enter a valid email address');
            return;
        }
        setIsSendingEmail(true);
        try {
            const response = await emailAPI.sendBill(emailBill._id, trimmedEmail);
            if (response.data.success) {
                toast.success(response.data.message || 'Bill emailed successfully!');
                setShowEmailModal(false);
                setEmailTo('');
                setEmailBill(null);
            } else {
                toast.error(response.data.message || 'Failed to send email');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send email');
        } finally {
            setIsSendingEmail(false);
        }
    };

    const handlePrintBill = () => {
        if (selectedBill) {
            downloadInvoicePDF(selectedBill, settings);
        }
    };

    const formatCurrency = (amount) => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount)}`;

    const filteredBills = bills.filter(bill => {
        const searchLower = searchQuery.toLowerCase();
        const billDateObj = new Date(bill.date || bill.createdAt);
        const billDate = `${billDateObj.getDate().toString().padStart(2, '0')}/${(billDateObj.getMonth() + 1).toString().padStart(2, '0')}/${billDateObj.getFullYear()}`;
        const matchesSearch =
            bill.billNumber?.toLowerCase().includes(searchLower) ||
            bill.customer?.name?.toLowerCase().includes(searchLower) ||
            bill.partyName?.toLowerCase().includes(searchLower) ||
            billDate.includes(searchQuery);
        const matchesType = billTypeFilter === 'all' || bill.billType === billTypeFilter;
        return matchesSearch && matchesType && (filterStatus === 'all' || bill.paymentStatus === filterStatus);
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
                <div className="flex gap-2">
                    <button className="btn btn-primary" onClick={() => setShowBillModal(true)}><Plus size={18} />New Bill</button>
                    <button
                        className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                        onClick={() => setShowEmptyInvoiceModal(true)}
                        title="Empty Invoice Template"
                    >
                        <FileText size={20} className="text-gray-600" />
                    </button>
                </div>
            </div>

            <div className="card py-4">
                <div className="flex flex-col gap-4">
                    <input
                        type="text"
                        className="form-input py-2 text-sm w-full"
                        placeholder="Search by Bill No, Customer, or Date..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="flex gap-4 flex-wrap items-center">
                        <div className="flex gap-2 flex-wrap items-center">
                            <span className="text-xs font-semibold text-gray-600 uppercase">Type:</span>
                            {[{ key: 'all', label: 'All' }, { key: 'SALES', label: 'Sales' }, { key: 'PURCHASE', label: 'Purchase' }, { key: 'DIRECT', label: 'Direct' }].map(f => (
                                <button
                                    key={f.key}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${billTypeFilter === f.key ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    style={billTypeFilter === f.key ? { backgroundColor: f.key === 'SALES' ? '#16a34a' : f.key === 'PURCHASE' ? '#2563eb' : f.key === 'DIRECT' ? '#6b7280' : '#7c3aed' } : {}}
                                    onClick={() => setBillTypeFilter(f.key)}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2 flex-wrap items-center">
                            <span className="text-xs font-semibold text-gray-600 uppercase">Status:</span>
                            {[{ key: 'all', label: 'All' }, { key: 'paid', label: 'Paid' }, { key: 'pending', label: 'Pending' }, { key: 'partial', label: 'Partial' }, { key: 'cancel', label: 'Cancel' }].map(f => (
                                <button
                                    key={f.key}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === f.key ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    style={filterStatus === f.key ? { backgroundColor: f.key === 'paid' ? '#16a34a' : f.key === 'pending' ? '#f59e0b' : f.key === 'partial' ? '#3b82f6' : f.key === 'cancel' ? '#ef4444' : '#7c3aed' } : {}}
                                    onClick={() => setFilterStatus(f.key)}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="card overflow-hidden p-0">
                {isLoading ? (
                    <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#3b82f6', borderTopColor: 'transparent' }} /></div>
                ) : filteredBills.length === 0 ? (
                    <div className="text-center py-12 text-gray-500"><FileText size={48} className="mx-auto mb-2 opacity-50" /><p>No bills found</p></div>
                ) : (
                    <table className="table">
                        <thead><tr className="bg-gray-50"><th>Bill No</th><th>Type</th><th>Date</th><th>Party</th><th>Amount</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
                        <tbody>
                            {filteredBills.map((bill) => (
                                <tr key={bill._id}>
                                    <td className="font-medium" style={{ color: '#1e40af' }}>{bill.billNumber}</td>
                                    <td>
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{
                                            backgroundColor: bill.billType === 'SALES' ? '#dcfce7' : bill.billType === 'PURCHASE' ? '#dbeafe' : '#f3f4f6',
                                            color: bill.billType === 'SALES' ? '#15803d' : bill.billType === 'PURCHASE' ? '#1d4ed8' : '#4b5563'
                                        }}>
                                            {bill.billType || 'DIRECT'}
                                        </span>
                                    </td>
                                    <td>{(() => { const d = new Date(bill.date || bill.createdAt); return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`; })()}</td>
                                    <td><div><p className="font-medium">{bill.partyName || bill.customer?.name}</p><p className="text-xs text-gray-500">{bill.customer?.phone}</p></div></td>
                                    <td className="font-semibold">{formatCurrency(bill.grandTotal)}</td>
                                    <td>
                                        <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{
                                            backgroundColor: bill.paymentStatus === 'paid' ? '#dcfce7' : bill.paymentStatus === 'pending' ? '#fef3c7' : bill.paymentStatus === 'partial' ? '#dbeafe' : '#fee2e2',
                                            color: bill.paymentStatus === 'paid' ? '#15803d' : bill.paymentStatus === 'pending' ? '#92400e' : bill.paymentStatus === 'partial' ? '#1d4ed8' : '#991b1b'
                                        }}>
                                            {bill.paymentStatus ? bill.paymentStatus.charAt(0).toUpperCase() + bill.paymentStatus.slice(1) : 'Pending'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex justify-end gap-2">
                                            <button
                                                className="action-btn action-btn-blue"
                                                onClick={() => handleViewBill(bill)}
                                                title="View Bill"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                className="action-btn action-btn-green"
                                                onClick={() => handleDownloadPDF(bill)}
                                                title="Download PDF"
                                            >
                                                <Download size={18} />
                                            </button>
                                            <button
                                                className="action-btn"
                                                style={{ color: '#7c3aed', backgroundColor: '#f5f3ff' }}
                                                onClick={() => { setEmailBill(bill); setEmailTo(bill.customer?.email || ''); setShowEmailModal(true); }}
                                                title="Email Bill"
                                            >
                                                <Mail size={18} />
                                            </button>
                                            <button
                                                className="action-btn action-btn-red"
                                                onClick={() => handleDeleteClick(bill)}
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



            {/* Bill Preview Modal */}
            {showPreviewModal && selectedBill && (
                <div className="modal-overlay" onClick={() => setShowPreviewModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-[230mm] max-h-[95vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="text-lg font-semibold text-gray-900">Bill Preview - {selectedBill.billNumber}</h3>
                            <div className="flex gap-2">
                                <button
                                    className="btn btn-sm"
                                    style={{ backgroundColor: '#1e40af', color: 'white' }}
                                    onClick={() => {
                                        setEmailBill(selectedBill);
                                        setEmailTo(selectedBill.customer?.email || '');
                                        setShowPreviewModal(false);
                                        setShowEmailModal(true);
                                    }}
                                >
                                    <Mail size={16} />Email
                                </button>
                                <button className="btn btn-primary btn-sm" onClick={handlePrintBill}><Download size={16} />Download PDF</button>
                                <button className="btn btn-ghost btn-icon" onClick={() => setShowPreviewModal(false)}><X size={20} /></button>
                            </div>
                        </div>
                        <div className="p-4 overflow-auto max-h-[80vh]" style={{ backgroundColor: '#f0f0f0' }}>
                            <div ref={billTemplateRef}>
                                <BillTemplate bill={selectedBill} settings={settings} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Bill Modal */}
            {showBillModal && (
                <div className="modal-overlay" onClick={() => setShowBillModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h3 className="text-lg font-semibold text-gray-900">Create New Bill</h3><button className="btn btn-ghost btn-icon" onClick={() => setShowBillModal(false)}><X size={20} /></button></div>
                        <div className="p-4 overflow-y-auto max-h-[70vh]">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <Users size={18} style={{ color: '#1e40af' }} />
                                        Buyer Details
                                    </h4>

                                    {/* Customer Search */}
                                    <div className="relative">
                                        <label className="text-xs text-gray-500 mb-1 block">Search Customer</label>
                                        <input
                                            className="form-input"
                                            placeholder="Search by company name, phone, or GSTIN..."
                                            value={customerSearch}
                                            onChange={(e) => {
                                                setCustomerSearch(e.target.value);
                                                setShowCustomerDropdown(true);
                                            }}
                                            onFocus={() => setShowCustomerDropdown(true)}
                                        />
                                        {isSearchingCustomers && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#3b82f6', borderTopColor: 'transparent' }} />
                                            </div>
                                        )}
                                        {showCustomerDropdown && customerSuggestions.length > 0 && (
                                            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                {customerSuggestions.map((cust) => (
                                                    <div
                                                        key={cust._id}
                                                        className="px-4 py-3 cursor-pointer hover:bg-green-50 border-b border-gray-100 last:border-b-0"
                                                        onClick={() => selectCustomer(cust)}
                                                    >
                                                        <p className="font-medium text-gray-900">{cust.companyName}</p>
                                                        <p className="text-xs text-gray-500">{cust.mobile} • {cust.gstin || 'No GSTIN'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {showCustomerDropdown && customerSearch.length >= 2 && customerSuggestions.length === 0 && !isSearchingCustomers && (
                                            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-center text-gray-500 text-sm">
                                                No customers found. Fill details below.
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">Buyer Name *</label>
                                            <input className="form-input" placeholder="Enter buyer name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">Phone Number *</label>
                                            <input className="form-input" placeholder="Enter phone number" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">GSTIN</label>
                                            <input className="form-input" placeholder="Enter GSTIN" value={customer.gstin} onChange={(e) => setCustomer({ ...customer, gstin: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">Transport</label>
                                            <input className="form-input" placeholder="Enter transport" value={transport} onChange={(e) => setTransport(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">From</label>
                                            <input className="form-input" placeholder="From (e.g., place or date)" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">To</label>
                                            <input className="form-input" placeholder="To (e.g., place or date)" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">State</label>
                                            <input className="form-input" placeholder="State" value={customer.state} onChange={(e) => setCustomer({ ...customer, state: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">State Code</label>
                                            <input className="form-input" placeholder="State Code" value={customer.stateCode} onChange={(e) => setCustomer({ ...customer, stateCode: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">Address (optional)</label>
                                        <input className="form-input" placeholder="Enter address" value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} />
                                    </div>

                                    <h4 className="font-semibold text-gray-900 pt-4">Select Products</h4>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {products.length === 0 ? <p className="text-gray-500 text-center py-4">No products available</p> : products.map((product) => (
                                            <div key={product._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100" onClick={() => addItemToBill(product)}>
                                                <div><p className="font-medium text-gray-900">{product.name}</p><p className="text-sm text-gray-500">{product.sku} • HSN: {product.hsn || 'N/A'}</p></div>
                                                <div className="text-right"><p className="font-semibold" style={{ color: '#1e40af' }}>{formatCurrency(product.sellingPrice)}</p><button className="text-xs" style={{ color: '#1e40af' }}>+ Add</button></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-900">Bill Items</h4>
                                    {billItems.length === 0 ? <div className="text-center py-8 text-gray-500"><FileText size={48} className="mx-auto mb-2 opacity-50" /><p>No items added</p></div> : (
                                        <div className="space-y-2 max-h-52 overflow-y-auto">
                                            {billItems.map((item) => (
                                                <div key={item.uniqueId} className="p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div>
                                                            <p className="font-medium text-gray-900">{item.name}</p>
                                                            <p className="text-xs text-gray-500">HSN: {item.hsnCode || 'N/A'}</p>
                                                        </div>
                                                        <p className="font-semibold">{formatCurrency((item.ratePerPack || item.price) * (item.noOfPacks || item.quantity))}</p>
                                                    </div>
                                                    <div className="grid grid-cols-5 gap-2 text-xs">
                                                        <div>
                                                            <label className="text-gray-500">Size</label>
                                                            <select className="form-input text-xs p-1" value={item.sizesOrPieces || ''} onChange={(e) => updateItemField(item.uniqueId, 'sizesOrPieces', e.target.value)}>
                                                                <option value="">Select</option>
                                                                <option value="S">S</option>
                                                                <option value="M">M</option>
                                                                <option value="L">L</option>
                                                                <option value="XL">XL</option>
                                                                <option value="XXL">XXL</option>
                                                                <option value="XXXL">XXXL</option>
                                                                <option value="28">28</option>
                                                                <option value="30">30</option>
                                                                <option value="32">32</option>
                                                                <option value="34">34</option>
                                                                <option value="36">36</option>
                                                                <option value="38">38</option>
                                                                <option value="40">40</option>
                                                                <option value="Free Size">Free Size</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-gray-500">Rate/Pc</label>
                                                            <input type="number" className="form-input text-xs p-1" value={item.ratePerPiece || ''} onChange={(e) => updateItemField(item.uniqueId, 'ratePerPiece', Number(e.target.value))} />
                                                        </div>
                                                        <div>
                                                            <label className="text-gray-500">Pcs/Pack</label>
                                                            <input type="number" className="form-input text-xs p-1" value={item.pcsInPack || ''} onChange={(e) => updateItemField(item.uniqueId, 'pcsInPack', Number(e.target.value))} />
                                                        </div>
                                                        <div>
                                                            <label className="text-gray-500">Rate/Pack</label>
                                                            <input type="number" className="form-input text-xs p-1" value={item.ratePerPack || ''} onChange={(e) => updateItemField(item.uniqueId, 'ratePerPack', Number(e.target.value))} />
                                                        </div>
                                                        <div>
                                                            <label className="text-gray-500">No. Packs</label>
                                                            <div className="flex items-center gap-1">
                                                                <button className="w-6 h-6 rounded bg-gray-200 text-sm" onClick={() => updateItemQuantity(item.uniqueId, (item.noOfPacks || item.quantity) - 1)}>-</button>
                                                                <span className="w-6 text-center text-sm">{item.noOfPacks || item.quantity}</span>
                                                                <button className="w-6 h-6 rounded bg-gray-200 text-sm" onClick={() => updateItemQuantity(item.uniqueId, (item.noOfPacks || item.quantity) + 1)}>+</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="border-t border-gray-200 pt-4 space-y-2">
                                        <div className="flex justify-between text-gray-600"><span>Product Amount</span><span>{formatCurrency(subtotal)}</span></div>
                                        <div className="flex items-center justify-between"><span className="text-gray-600">Discount (%)</span><input type="number" className="form-input w-20 text-right" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></div>
                                        <div className="flex justify-between text-gray-600"><span>Taxable Amount</span><span>{formatCurrency(taxableAmount)}</span></div>
                                        <div className="flex justify-between text-gray-600"><span>CGST @ {cgstRate}%</span><span>{formatCurrency(cgstAmount)}</span></div>
                                        <div className="flex justify-between text-gray-600"><span>SGST @ {sgstRate}%</span><span>{formatCurrency(sgstAmount)}</span></div>
                                        <div className="flex justify-between text-gray-600"><span>Total Packs</span><span>{totalPacks}</span></div>
                                        <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200"><span>Grand Total</span><span style={{ color: '#1e40af' }}>{formatCurrency(grandTotal)}</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowBillModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreateBill} disabled={isLoading}>{isLoading ? 'Creating...' : 'Create Bill'}</button></div>
                    </div>
                </div>
            )
            }

            {/* Email Bill Modal */}
            {showEmailModal && emailBill && (
                <div className="modal-overlay" onClick={() => { setShowEmailModal(false); setEmailBill(null); }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#f5f3ff' }}>
                                <Mail size={32} style={{ color: '#7c3aed' }} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Bill</h3>
                            <p className="text-gray-600 mb-4">
                                Send bill <strong>{emailBill.billNumber}</strong> ({formatCurrency(emailBill.grandTotal)}) via email.
                            </p>
                            <input
                                type="email"
                                className="form-input w-full mb-4"
                                placeholder="Recipient email address"
                                value={emailTo}
                                onChange={(e) => setEmailTo(e.target.value)}
                                autoFocus
                            />
                            <div className="flex gap-3 justify-center">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => { setShowEmailModal(false); setEmailBill(null); }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn"
                                    style={{ backgroundColor: '#7c3aed', color: 'white' }}
                                    onClick={handleEmailBill}
                                    disabled={isSendingEmail || !emailTo}
                                >
                                    {isSendingEmail ? 'Sending...' : 'Send Email'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Bill Confirmation Modal */}
            {
                showDeleteConfirm && selectedBill && (
                    <div className="modal-overlay" onClick={() => { setShowDeleteConfirm(false); setSelectedBill(null); }}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 size={32} className="text-red-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Bill</h3>
                                <p className="text-gray-600 mb-6">
                                    Are you sure you want to delete bill <strong>{selectedBill.billNumber}</strong>? This action cannot be undone.
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => { setShowDeleteConfirm(false); setSelectedBill(null); }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn bg-red-600 text-white hover:bg-red-700"
                                        onClick={handleDeleteBill}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            {showEmptyInvoiceModal && (
                <div className="modal-overlay" onClick={() => setShowEmptyInvoiceModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-[230mm] max-h-[95vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="text-lg font-semibold text-gray-900">Empty Invoice Template</h3>
                            <div className="flex gap-2">
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={async () => {
                                        const element = emptyInvoiceRef.current;
                                        if (element) {
                                            await downloadBillPDF(element, 'Empty_Invoice');
                                        }
                                    }}
                                >
                                    <Download size={16} />Download PDF
                                </button>
                                <button className="btn btn-ghost btn-icon" onClick={() => setShowEmptyInvoiceModal(false)}><X size={20} /></button>
                            </div>
                        </div>
                        <div className="p-4 overflow-auto max-h-[80vh]" style={{ backgroundColor: '#f0f0f0' }}>
                            <div ref={emptyInvoiceRef}>
                                <BillTemplate
                                    bill={{
                                        billNumber: '',
                                        date: new Date(),
                                        customer: {
                                            name: '',
                                            phone: '',
                                            address: '',
                                            gstin: '',
                                            state: 'Tamilnadu',
                                            stateCode: '33'
                                        },
                                        transport: '',
                                        fromText: 'TIRUPPUR',
                                        toText: '',
                                        fromDate: '',
                                        toDate: '',
                                        items: [],
                                        subtotal: 0,
                                        discount: 0,
                                        discountAmount: 0,
                                        taxableAmount: 0,
                                        cgst: 0,
                                        sgst: 0,
                                        totalTax: 0,
                                        roundOff: 0,
                                        grandTotal: 0,
                                        totalPacks: 0,
                                        numOfBundles: 0
                                    }}
                                    settings={settings}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default BillingPage;
