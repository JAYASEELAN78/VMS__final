import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, X, Search, Loader, BoxSelect } from 'lucide-react';
import { rawMaterialsAPI, ordersAPI } from '../services/api';

const RawMaterialsPage = () => {
    const [materials, setMaterials] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ order_id: '', material_name: '', quantity: '', received_date: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [matsRes, ordersRes] = await Promise.all([
                rawMaterialsAPI.getAll ? rawMaterialsAPI.getAll() : Promise.resolve({ data: [] }),
                ordersAPI.getAll()
            ]);
            setMaterials(matsRes.data || []);
            setOrders(ordersRes.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await rawMaterialsAPI.add(formData);
            setIsModalOpen(false);
            setFormData({ order_id: '', material_name: '', quantity: '', received_date: '' });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const filtered = materials.filter(m =>
        (m.material_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.order_id?.order_id || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Package className="text-emerald-600" /> Raw Materials
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Track materials received for each order.</p>
                </div>
                <button onClick={() => { setFormData({ order_id: orders[0]?._id || '', material_name: '', quantity: '', received_date: new Date().toISOString().split('T')[0] }); setIsModalOpen(true); }} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition">
                    <Plus size={18} /> Add Material
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 relative">
                    <Search className="absolute left-7 top-7 text-gray-400" size={18} />
                    <input type="text" placeholder="Search by material or order..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                                <th className="p-4">Material Name</th>
                                <th className="p-4">Linked Order</th>
                                <th className="p-4">Quantity</th>
                                <th className="p-4">Received Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {loading ? (
                                <tr><td colSpan="4" className="p-8 text-center"><Loader className="w-7 h-7 animate-spin mx-auto text-emerald-600 mb-2" />Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="4" className="p-8 text-center text-gray-500">No materials recorded yet.</td></tr>
                            ) : filtered.map(m => (
                                <tr key={m._id} className="hover:bg-gray-50">
                                    <td className="p-4 font-semibold text-gray-900 flex items-center gap-2"><BoxSelect size={16} className="text-emerald-500" />{m.material_name}</td>
                                    <td className="p-4 text-gray-600">{m.order_id?.order_id || m.order_id}</td>
                                    <td className="p-4 font-medium">{m.quantity}</td>
                                    <td className="p-4 text-gray-500">{m.received_date ? new Date(m.received_date).toLocaleDateString() : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                            <div className="flex justify-between items-center p-5 border-b bg-gray-50/50">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Package size={20} className="text-emerald-600" /> Add Raw Material</h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-200 p-1.5 rounded-lg transition"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Linked Order *</label>
                                    <select required name="order_id" value={formData.order_id} onChange={e => setFormData(p => ({ ...p, order_id: e.target.value }))} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                                        <option value="" disabled>Select Order</option>
                                        {orders.map(o => <option key={o._id} value={o._id}>{o.order_id} — {o.product_name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Material Name *</label>
                                    <input required type="text" value={formData.material_name} onChange={e => setFormData(p => ({ ...p, material_name: e.target.value }))} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity *</label>
                                        <input required type="number" min="1" value={formData.quantity} onChange={e => setFormData(p => ({ ...p, quantity: e.target.value }))} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Received Date</label>
                                        <input type="date" value={formData.received_date} onChange={e => setFormData(p => ({ ...p, received_date: e.target.value }))} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                                    </div>
                                </div>
                                <div className="pt-4 border-t flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                                    <button type="submit" className="px-5 py-2.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-sm">Add Material</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default RawMaterialsPage;
