import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Plus, X, Search, Loader, User, Settings2, Trash2 } from 'lucide-react';
import { productionAPI, ordersAPI } from '../services/api';

const PROGRESS_COLORS = {
    'Not Started': 'bg-gray-100 text-gray-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    'On Hold': 'bg-amber-100 text-amber-700',
    'Completed': 'bg-emerald-100 text-emerald-700',
};

const ProductionPage = () => {
    const [productions, setProductions] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        order_id: '',
        machine: '',
        staff: '',
        start_date: '',
        progress: 'Not Started',
        completion_date: ''
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [prodRes, ordersRes] = await Promise.all([
                productionAPI.getAll(),
                ordersAPI.getAll()
            ]);
            setProductions(prodRes.data || []);
            setOrders(ordersRes.data || []);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (prod = null) => {
        if (prod) {
            setFormData({
                order_id: prod.order_id?._id || prod.order_id,
                machine: prod.machine || '',
                staff: prod.staff || '',
                start_date: prod.start_date ? new Date(prod.start_date).toISOString().split('T')[0] : '',
                progress: prod.progress || 'Not Started',
                completion_date: prod.completion_date ? new Date(prod.completion_date).toISOString().split('T')[0] : ''
            });
            setEditingId(prod._id);
        } else {
            setFormData({
                order_id: orders.length > 0 ? orders[0]._id : '',
                machine: '',
                staff: '',
                start_date: new Date().toISOString().split('T')[0],
                progress: 'Not Started',
                completion_date: ''
            });
            setEditingId(null);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await productionAPI.updateProgress(editingId, formData);
            } else {
                await productionAPI.start(formData);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err) { console.error('Save failed:', err); }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this production record?')) {
            try {
                await productionAPI.delete(id);
                fetchData();
            } catch (err) { console.error('Delete failed:', err); }
        }
    };

    const filtered = productions.filter(p => {
        const orderId = p.order_id?.order_id || '';
        const productName = p.order_id?.product_name || '';
        const machine = p.machine || '';
        const staff = p.staff || '';
        const query = searchQuery.toLowerCase();

        return orderId.toLowerCase().includes(query) ||
            productName.toLowerCase().includes(query) ||
            machine.toLowerCase().includes(query) ||
            staff.toLowerCase().includes(query);
    });

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <TrendingUp className="text-violet-600" /> Production Tracking
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Monitor work progress across all active orders.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-violet-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-violet-700 transition"
                >
                    <Plus size={18} /> Start Production
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 relative">
                    <Search className="absolute left-7 top-7 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Order ID, Product, Machine or Staff..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                                <th className="p-4">Order & Product</th>
                                <th className="p-4">Machine</th>
                                <th className="p-4">Staff</th>
                                <th className="p-4">Start Date</th>
                                <th className="p-4">Progress</th>
                                <th className="p-4">Completion</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {loading ? (
                                <tr><td colSpan="7" className="p-8 text-center"><Loader className="w-7 h-7 animate-spin mx-auto text-violet-600 mb-2" />Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="7" className="p-8 text-center text-gray-500">No production records found.</td></tr>
                            ) : filtered.map(p => (
                                <tr key={p._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleOpenModal(p)}>
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900">{p.order_id?.order_id || 'N/A'}</div>
                                        <div className="text-xs text-gray-500">{p.order_id?.product_name || 'Generic Product'}</div>
                                    </td>
                                    <td className="p-4 text-gray-700 flex items-center gap-2">
                                        <Settings2 size={14} className="text-violet-400" />
                                        {p.machine || '—'}
                                    </td>
                                    <td className="p-4 text-gray-700">
                                        <span className="flex items-center gap-1">
                                            <User size={14} className="text-gray-400" />
                                            {p.staff || 'Unassigned'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-500">{p.start_date ? new Date(p.start_date).toLocaleDateString() : '-'}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 text-[11px] uppercase font-bold rounded-full ${PROGRESS_COLORS[p.progress] || 'bg-gray-100 text-gray-700'}`}>
                                            {p.progress}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-500">{p.completion_date ? new Date(p.completion_date).toLocaleDateString() : '—'}</td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={(e) => handleDelete(p._id, e)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm shadow-2xl">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100">
                            <div className="flex justify-between items-center p-5 border-b bg-gray-50/50">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <TrendingUp size={20} className="text-violet-600" />
                                    {editingId ? 'Update Production' : 'Start Production'}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-200 p-1.5 rounded-lg transition"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Order *</label>
                                    <select
                                        required
                                        value={formData.order_id}
                                        onChange={e => setFormData(p => ({ ...p, order_id: e.target.value }))}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                        disabled={!!editingId}
                                    >
                                        <option value="" disabled>Select Order</option>
                                        {orders.map(o => <option key={o._id} value={o._id}>{o.order_id} — {o.product_name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Machine</label>
                                        <input type="text" value={formData.machine} onChange={e => setFormData(p => ({ ...p, machine: e.target.value }))} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50" placeholder="e.g. Machine 1" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Staff Name</label>
                                        <input type="text" value={formData.staff} onChange={e => setFormData(p => ({ ...p, staff: e.target.value }))} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50" placeholder="Assigned worker" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
                                        <input type="date" value={formData.start_date} onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Completion Date</label>
                                        <input type="date" value={formData.completion_date} onChange={e => setFormData(p => ({ ...p, completion_date: e.target.value }))} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Progress Status</label>
                                    <select value={formData.progress} onChange={e => setFormData(p => ({ ...p, progress: e.target.value }))} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50 font-semibold">
                                        {Object.keys(PROGRESS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="pt-4 border-t flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                                    <button type="submit" className="px-5 py-2.5 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg shadow-sm transition">
                                        {editingId ? 'Update Production' : 'Start Production'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ProductionPage;
