import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Plus, X, Search, Loader } from 'lucide-react';
import { dispatchAPI, ordersAPI } from '../services/api';

const DELIVERY_COLORS = {
    'Pending': 'bg-amber-100 text-amber-700',
    'Dispatched': 'bg-blue-100 text-blue-700',
    'Delivered': 'bg-emerald-100 text-emerald-700',
};

const DispatchPage = () => {
    const [dispatches, setDispatches] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ order_id: '', dispatch_date: '', transport: '', invoice_number: '', delivery_status: 'Pending' });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [dispRes, ordersRes] = await Promise.all([
                dispatchAPI.getAll(),
                ordersAPI.getAll()
            ]);
            setDispatches(dispRes.data || []);
            setOrders(ordersRes.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await dispatchAPI.create(formData);
            setIsModalOpen(false);
            setFormData({ order_id: '', dispatch_date: '', transport: '', invoice_number: '', delivery_status: 'Pending' });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const filtered = dispatches.filter(d =>
        (d.invoice_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.transport || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.order_id?.order_id || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Truck className="text-orange-600" /> Dispatch Management
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Track shipments and delivery status for finished goods.</p>
                </div>
                <button onClick={() => { setFormData({ order_id: orders[0]?._id || '', dispatch_date: new Date().toISOString().split('T')[0], transport: '', invoice_number: '', delivery_status: 'Pending' }); setIsModalOpen(true); }} className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-orange-700 transition">
                    <Plus size={18} /> New Dispatch
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 relative">
                    <Search className="absolute left-7 top-7 text-gray-400" size={18} />
                    <input type="text" placeholder="Search by invoice, transport or order..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                                <th className="p-4">Invoice No.</th>
                                <th className="p-4">Order</th>
                                <th className="p-4">Transport</th>
                                <th className="p-4">Dispatch Date</th>
                                <th className="p-4">Delivery Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center"><Loader className="w-7 h-7 animate-spin mx-auto text-orange-600 mb-2" /></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No dispatches recorded yet.</td></tr>
                            ) : filtered.map(d => (
                                <tr key={d._id} className="hover:bg-gray-50">
                                    <td className="p-4 font-mono font-bold text-gray-900">{d.invoice_number}</td>
                                    <td className="p-4 text-gray-700">{d.order_id?.order_id || d.order_id}</td>
                                    <td className="p-4 text-gray-700 flex items-center gap-2"><Truck size={14} className="text-orange-400" />{d.transport}</td>
                                    <td className="p-4 text-gray-500">{d.dispatch_date ? new Date(d.dispatch_date).toLocaleDateString() : '-'}</td>
                                    <td className="p-4"><span className={`px-3 py-1 text-[11px] uppercase font-bold rounded-full ${DELIVERY_COLORS[d.delivery_status] || 'bg-gray-100 text-gray-700'}`}>{d.delivery_status}</span></td>
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
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Truck size={20} className="text-orange-600" /> Create Dispatch</h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-200 p-1.5 rounded-lg"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Linked Order *</label>
                                    <select required value={formData.order_id} onChange={e => setFormData(p => ({ ...p, order_id: e.target.value }))} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50">
                                        <option value="" disabled>Select Order</option>
                                        {orders.map(o => <option key={o._id} value={o._id}>{o.order_id} — {o.product_name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Invoice Number</label>
                                        <input type="text" value={formData.invoice_number} onChange={e => setFormData(p => ({ ...p, invoice_number: e.target.value }))} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50" placeholder="e.g. INV-1001" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Transport / Vehicle</label>
                                        <input type="text" value={formData.transport} onChange={e => setFormData(p => ({ ...p, transport: e.target.value }))} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50" placeholder="e.g. TN09 AB 1234" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Dispatch Date</label>
                                        <input type="date" value={formData.dispatch_date} onChange={e => setFormData(p => ({ ...p, dispatch_date: e.target.value }))} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Delivery Status</label>
                                        <select value={formData.delivery_status} onChange={e => setFormData(p => ({ ...p, delivery_status: e.target.value }))} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 font-semibold">
                                            {Object.keys(DELIVERY_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="pt-4 border-t flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                                    <button type="submit" className="px-5 py-2.5 text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-sm">Create Dispatch</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default DispatchPage;
