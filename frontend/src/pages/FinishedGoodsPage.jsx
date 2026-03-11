import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Plus, X, Search, Loader } from 'lucide-react';
import { finishedGoodsAPI, ordersAPI } from '../services/api';

const QUALITY_COLORS = {
    'Pass': 'bg-emerald-100 text-emerald-700',
    'Fail': 'bg-red-100 text-red-700',
    'Pending': 'bg-amber-100 text-amber-700',
};

const FinishedGoodsPage = () => {
    const [goods, setGoods] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ order_id: '', product_name: '', quantity: '', quality_status: 'Pending', ready_date: '' });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [goodsRes, ordersRes] = await Promise.all([
                finishedGoodsAPI.getAll(),
                ordersAPI.getAll()
            ]);
            setGoods(goodsRes.data || []);
            setOrders(ordersRes.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await finishedGoodsAPI.add(formData);
            setIsModalOpen(false);
            setFormData({ order_id: '', product_name: '', quantity: '', quality_status: 'Pending', ready_date: '' });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const filtered = goods.filter(g =>
        (g.product_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.order_id?.order_id || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <CheckSquare className="text-teal-600" /> Finished Goods
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Record completed products and quality checks.</p>
                </div>
                <button onClick={() => { setFormData({ order_id: orders[0]?._id || '', product_name: '', quantity: '', quality_status: 'Pending', ready_date: new Date().toISOString().split('T')[0] }); setIsModalOpen(true); }} className="flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-teal-700 transition">
                    <Plus size={18} /> Add Finished Goods
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 relative">
                    <Search className="absolute left-7 top-7 text-gray-400" size={18} />
                    <input type="text" placeholder="Search by product or order..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                                <th className="p-4">Product Name</th>
                                <th className="p-4">Linked Order</th>
                                <th className="p-4">Quantity</th>
                                <th className="p-4">Quality Check</th>
                                <th className="p-4">Ready Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center"><Loader className="w-7 h-7 animate-spin mx-auto text-teal-600 mb-2" /></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No finished goods recorded yet.</td></tr>
                            ) : filtered.map(g => (
                                <tr key={g._id} className="hover:bg-gray-50">
                                    <td className="p-4 font-semibold text-gray-900">{g.product_name}</td>
                                    <td className="p-4 text-gray-600">{g.order_id?.order_id || g.order_id}</td>
                                    <td className="p-4 font-medium">{g.quantity}</td>
                                    <td className="p-4"><span className={`px-3 py-1 text-[11px] uppercase font-bold rounded-full ${QUALITY_COLORS[g.quality_status] || 'bg-gray-100 text-gray-700'}`}>{g.quality_status}</span></td>
                                    <td className="p-4 text-gray-500">{g.ready_date ? new Date(g.ready_date).toLocaleDateString() : '-'}</td>
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
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><CheckSquare size={20} className="text-teal-600" /> Add Finished Goods</h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-200 p-1.5 rounded-lg"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Linked Order *</label>
                                    <select required value={formData.order_id} onChange={e => setFormData(p => ({ ...p, order_id: e.target.value }))} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50">
                                        <option value="" disabled>Select Order</option>
                                        {orders.map(o => <option key={o._id} value={o._id}>{o.order_id} — {o.product_name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Product Name *</label>
                                        <input required type="text" value={formData.product_name} onChange={e => setFormData(p => ({ ...p, product_name: e.target.value }))} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity *</label>
                                        <input required type="number" min="1" value={formData.quantity} onChange={e => setFormData(p => ({ ...p, quantity: e.target.value }))} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Quality Status</label>
                                        <select value={formData.quality_status} onChange={e => setFormData(p => ({ ...p, quality_status: e.target.value }))} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 font-semibold">
                                            {Object.keys(QUALITY_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Ready Date</label>
                                        <input type="date" value={formData.ready_date} onChange={e => setFormData(p => ({ ...p, ready_date: e.target.value }))} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
                                    </div>
                                </div>
                                <div className="pt-4 border-t flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                                    <button type="submit" className="px-5 py-2.5 text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm">Save Record</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default FinishedGoodsPage;
