import { useState, useEffect } from 'react';
import { Truck, Plus, Search, Edit, Trash2, X, Save } from 'lucide-react';
import { suppliersAPI } from '../services/api';
import { useToast } from '../components/common';

const SupplierEntryPage = () => {
    const toast = useToast();
    const [suppliers, setSuppliers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
    const [formData, setFormData] = useState({
        companyName: '',
        gstin: '',
        state: 'Tamilnadu',
        mobile: '',
        alternateNo: '',
        email: '',
        address: ''
    });

    useEffect(() => {
        fetchSuppliers();
    }, [pagination.page, pagination.limit]);

    const fetchSuppliers = async () => {
        setIsLoading(true);
        try {
            const response = await suppliersAPI.getAll({
                search: searchQuery,
                page: pagination.page,
                limit: pagination.limit
            });
            setSuppliers(response.data.data || []);
            setPagination(prev => ({
                ...prev,
                total: response.data.pagination?.total || 0,
                pages: response.data.pagination?.pages || 0
            }));
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchSuppliers();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({
            companyName: '',
            gstin: '',
            state: 'Tamilnadu',
            mobile: '',
            alternateNo: '',
            email: '',
            address: ''
        });
        setIsEditing(false);
        setSelectedSupplier(null);
    };

    const handleOpenModal = (supplier = null) => {
        if (supplier) {
            setFormData({
                companyName: supplier.companyName || '',
                gstin: supplier.gstin || '',
                state: supplier.state || 'Tamilnadu',
                mobile: supplier.mobile || '',
                alternateNo: supplier.alternateNo || '',
                email: supplier.email || '',
                address: supplier.address || ''
            });
            setSelectedSupplier(supplier);
            setIsEditing(true);
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.companyName || !formData.mobile) {
            toast.warning('Please fill Company Name and Phone No');
            return;
        }
        try {
            if (isEditing && selectedSupplier) {
                await suppliersAPI.update(selectedSupplier._id, formData);
                toast.success('Supplier updated successfully');
            } else {
                await suppliersAPI.create(formData);
                toast.success('Supplier added successfully');
            }
            setShowModal(false);
            resetForm();
            fetchSuppliers();
        } catch (error) {
            toast.error('Error saving supplier: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDeleteClick = (supplier) => {
        setSelectedSupplier(supplier);
        setShowDeleteConfirm(true);
    };

    const handleDelete = async () => {
        try {
            await suppliersAPI.delete(selectedSupplier._id);
            toast.success('Supplier deleted successfully');
            setShowDeleteConfirm(false);
            setSelectedSupplier(null);
            fetchSuppliers();
        } catch (error) {
            toast.error('Error deleting supplier: ' + (error.response?.data?.message || error.message));
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

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Truck className="text-green-600" size={20} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Supplier Entry</h1>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => handleOpenModal()}
                >
                    <Plus size={16} />
                    New Supplier
                </button>
            </div>

            {/* Search Section */}
            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="shrink-0 w-64">
                        <label className="form-label">Name / Mobile</label>
                        <input
                            type="text"
                            placeholder="Enter name or mobile"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="form-input"
                        />
                    </div>

                    <button
                        onClick={handleSearch}
                        disabled={isLoading}
                        className="btn btn-primary"
                    >
                        <Search size={16} />
                        Search
                    </button>
                    <button
                        onClick={() => { setSearchQuery(''); fetchSuppliers(); }}
                        className="btn btn-ghost"
                    >
                        <X size={16} />
                        Clear
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Company Name</th>
                                <th>Mobile</th>
                                <th>Email</th>
                                <th>GSTIN</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center">
                                        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#3b82f6', borderTopColor: 'transparent' }}></div>
                                    </td>
                                </tr>
                            ) : suppliers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-gray-500">
                                        No suppliers found. Click "NEW SUPPLIER" to add one.
                                    </td>
                                </tr>
                            ) : (
                                suppliers.map((supplier, index) => (
                                    <tr key={supplier._id}>
                                        <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                                        <td className="text-blue-600 font-medium">{supplier.companyName}</td>
                                        <td>{supplier.mobile}</td>
                                        <td>{supplier.email || '-'}</td>
                                        <td className="font-mono">{supplier.gstin || '-'}</td>
                                        <td>
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    className="action-btn action-btn-blue"
                                                    onClick={() => handleOpenModal(supplier)}
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    className="action-btn action-btn-red"
                                                    onClick={() => handleDeleteClick(supplier)}
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
                                        className={`px-3 py-1 text-sm rounded font-medium ${pagination.page === pageNum ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
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
                                    className={`px-3 py-1 text-sm rounded font-medium ${pagination.limit === limit ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {limit}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* New/Edit Supplier Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
                            <h3 className="text-lg font-semibold text-white">
                                {isEditing ? 'Edit Supplier' : 'New Supplier'}
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                <input
                                    type="text"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleInputChange}
                                    className="form-input w-full"
                                    placeholder="Enter company name"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                                    <input
                                        type="text"
                                        name="gstin"
                                        value={formData.gstin}
                                        onChange={handleInputChange}
                                        className="form-input w-full"
                                        placeholder="Enter GSTIN"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                                    <select
                                        name="state"
                                        value={formData.state}
                                        onChange={handleInputChange}
                                        className="form-input w-full"
                                    >
                                        <option value="Tamilnadu">Tamilnadu</option>
                                        <option value="Kerala">Kerala</option>
                                        <option value="Karnataka">Karnataka</option>
                                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                                        <option value="Telangana">Telangana</option>
                                        <option value="Maharashtra">Maharashtra</option>
                                        <option value="Gujarat">Gujarat</option>
                                        <option value="Delhi">Delhi</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone No</label>
                                    <input
                                        type="text"
                                        name="mobile"
                                        value={formData.mobile}
                                        onChange={handleInputChange}
                                        className="form-input w-full"
                                        placeholder="Phone"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Alternate No</label>
                                    <input
                                        type="text"
                                        name="alternateNo"
                                        value={formData.alternateNo}
                                        onChange={handleInputChange}
                                        className="form-input w-full"
                                        placeholder="Alternate"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="form-input w-full"
                                        placeholder="Email"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    className="form-input w-full resize-none"
                                    rows="2"
                                    placeholder="Enter address"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50">
                            <button
                                onClick={() => setShowModal(false)}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="btn btn-primary"
                            >
                                <Save size={16} />
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && selectedSupplier && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} className="text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Supplier</h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete <strong>{selectedSupplier.companyName}</strong>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="btn btn-danger"
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

export default SupplierEntryPage;
