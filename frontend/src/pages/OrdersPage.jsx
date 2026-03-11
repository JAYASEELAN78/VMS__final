import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Edit, Trash2, X, Search, Loader, Calendar, Package } from 'lucide-react';
import { ordersAPI, companiesAPI } from '../services/api';

const STATUS_COLORS = {
    'Pending': 'bg-amber-100 text-amber-800',
    'Material Received': 'bg-purple-100 text-purple-800',
    'Processing': 'bg-blue-100 text-blue-800',
    'Completed': 'bg-emerald-100 text-emerald-800',
    'Delivered': 'bg-gray-100 text-gray-800'
};

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        order_id: '', company_id: '', product_name: '', quantity: '', order_date: '', delivery_date: '', status: 'Pending'
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ordersRes, companiesRes] = await Promise.all([
                ordersAPI.getAll(),
                companiesAPI.getAll()
            ]);
            setOrders(ordersRes.data);
            setCompanies(companiesRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const generateOrderId = () => {
        const prefix = "ORD-";
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        return `${prefix}${randomNum}`;
    };

    const handleOpenModal = (order = null) => {
        if (order) {
            setFormData({
                ...order,
                company_id: order.company_id?._id || order.company_id,
                order_date: order.order_date ? new Date(order.order_date).toISOString().split('T')[0] : '',
                delivery_date: order.delivery_date ? new Date(order.delivery_date).toISOString().split('T')[0] : ''
            });
            setEditingId(order._id);
        } else {
            setFormData({
                order_id: generateOrderId(), company_id: companies.length > 0 ? companies[0]._id : '',
                product_name: '', quantity: '',
                order_date: new Date().toISOString().split('T')[0], delivery_date: '', status: 'Pending'
            });
            setEditingId(null);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await ordersAPI.update(editingId, formData);
            } else {
                await ordersAPI.create(formData);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Save failed:', error);
        }
    };

    const filteredOrders = orders.filter(o =>
        (o.order_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.product_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.company_id?.company_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <ShoppingCart className="text-blue-600" /> Order Management
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Create and track job work orders.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                    <Plus size={18} /> New Order
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 relative">
                    <Search className="absolute left-7 top-7 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Order ID, Company, or Product..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                                <th className="p-4">Order ID</th>
                                <th className="p-4">Company</th>
                                <th className="p-4">Product Details</th>
                                <th className="p-4">Dates</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">
                                        <Loader className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                                        Loading orders...
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">No orders found.</td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => (
                                    <tr key={order._id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => handleOpenModal(order)}>
                                        <td className="p-4 font-bold text-gray-900">{order.order_id}</td>
                                        <td className="p-4 font-medium text-gray-800">{order.company_id?.company_name || 'Unknown'}</td>
                                        <td className="p-4">
                                            <div className="font-semibold text-gray-800">{order.product_name}</div>
                                            <div className="text-gray-500 text-xs flex gap-1 items-center mt-1">
                                                <Package size={12} /> Qty: {order.quantity}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-gray-600 text-xs flex gap-1 items-center">
                                                <Calendar size={12} /> In: {new Date(order.order_date).toLocaleDateString()}
                                            </div>
                                            {order.delivery_date && (
                                                <div className="text-blue-600 font-medium text-xs flex gap-1 items-center mt-1">
                                                    <Calendar size={12} /> Out: {new Date(order.delivery_date).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 text-[11px] uppercase font-bold rounded-full ${STATUS_COLORS[order.status]}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="p-4 flex justify-end">
                                            <button onClick={(e) => { e.stopPropagation(); handleOpenModal(order); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit size={16} /></button>
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
                            className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <ShoppingCart className="text-blue-600" size={20} />
                                    {editingId ? 'Edit Order' : 'Create New Order'}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-200 p-1.5 rounded-lg transition"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Order ID *</label>
                                        <input required type="text" name="order_id" value={formData.order_id} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Company *</label>
                                        <select required name="company_id" value={formData.company_id} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                                            <option value="" disabled>Select Company</option>
                                            {companies.map(c => (
                                                <option key={c._id} value={c._id}>{c.company_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Product Name *</label>
                                        <input required type="text" name="product_name" value={formData.product_name} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity *</label>
                                        <input required type="number" min="1" name="quantity" value={formData.quantity} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Order Date *</label>
                                        <input required type="date" name="order_date" value={formData.order_date} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Delivery Target</label>
                                        <input type="date" name="delivery_date" value={formData.delivery_date} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Order Status</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-semibold">
                                        {Object.keys(STATUS_COLORS).map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-auto">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                                    <button type="submit" className="px-5 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-sm">{editingId ? 'Update Order' : 'Create Order'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div >
    );
};

export default OrdersPage;
