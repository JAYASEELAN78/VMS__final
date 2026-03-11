import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Plus, Edit, Trash2, X, Building, Phone, Mail, FileText, Search, Loader } from 'lucide-react';
import { companiesAPI } from '../services/api';

const CompaniesPage = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        company_name: '', contact_person: '', phone: '', email: '', address: '', gst_number: ''
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const response = await companiesAPI.getAll();
            setCompanies(response.data);
        } catch (error) {
            console.error('Failed to fetch companies:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await companiesAPI.update(editingId, formData);
            } else {
                await companiesAPI.create(formData);
            }
            setIsModalOpen(false);
            setFormData({ company_name: '', contact_person: '', phone: '', email: '', address: '', gst_number: '' });
            setEditingId(null);
            fetchCompanies();
        } catch (error) {
            console.error('Save failed:', error);
        }
    };

    const handleEdit = (company) => {
        setFormData(company);
        setEditingId(company._id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this company?')) {
            try {
                await companiesAPI.delete(id);
                fetchCompanies();
            } catch (error) {
                console.error('Delete failed:', error);
            }
        }
    };

    const filteredCompanies = companies.filter(c =>
        c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contact_person.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Store className="text-blue-600" /> Company Management
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Manage partner companies for your job work orders.</p>
                </div>
                <button
                    onClick={() => { setEditingId(null); setFormData({ company_name: '', contact_person: '', phone: '', email: '', address: '', gst_number: '' }); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                    <Plus size={18} /> Add Company
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 relative">
                    <Search className="absolute left-7 top-7 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search companies or contact persons..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                                <th className="p-4">Company Name</th>
                                <th className="p-4">Contact Info</th>
                                <th className="p-4">GST Number</th>
                                <th className="p-4">Address</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">
                                        <Loader className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                                        Loading companies...
                                    </td>
                                </tr>
                            ) : filteredCompanies.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">No companies found.</td>
                                </tr>
                            ) : (
                                filteredCompanies.map(company => (
                                    <tr key={company._id} className="hover:bg-gray-50 transition">
                                        <td className="p-4 font-semibold text-gray-900">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold uppercase">
                                                    {company.company_name.charAt(0)}
                                                </div>
                                                {company.company_name}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-gray-800">{company.contact_person}</div>
                                            <div className="text-gray-500 text-xs flex gap-2">
                                                <Phone className="inline w-3 h-3" /> {company.phone}
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-gray-600">{company.gst_number || '-'}</td>
                                        <td className="p-4 text-gray-500 max-w-xs truncate">{company.address || '-'}</td>
                                        <td className="p-4 flex gap-2 justify-end">
                                            <button onClick={() => handleEdit(company)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit size={16} /></button>
                                            <button onClick={() => handleDelete(company._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Building className="text-blue-600" size={20} />
                                    {editingId ? 'Edit Company' : 'Add New Company'}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-200 p-1.5 rounded-lg transition"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Company Name *</label>
                                    <input required type="text" name="company_name" value={formData.company_name} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Contact Person *</label>
                                        <input required type="text" name="contact_person" value={formData.contact_person} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Phone *</label>
                                        <input required type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">GST Number</label>
                                        <input type="text" name="gst_number" value={formData.gst_number} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                                    <textarea name="address" value={formData.address} onChange={handleInputChange} rows="3" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"></textarea>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                                    <button type="submit" className="px-5 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-sm">{editingId ? 'Save Changes' : 'Add Company'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default CompaniesPage;
