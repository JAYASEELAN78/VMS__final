import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Loader, Package, Calendar, ChevronRight } from 'lucide-react';
import { ordersAPI } from '../services/api';

const STATUS_COLORS = {
    'Pending': 'bg-amber-100 text-amber-800',
    'Material Received': 'bg-purple-100 text-purple-800',
    'Processing': 'bg-blue-100 text-blue-800',
    'Completed': 'bg-emerald-100 text-emerald-800',
    'Delivered': 'bg-gray-100 text-gray-800',
    'Cancelled': 'bg-red-100 text-red-800'
};

const MyOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await ordersAPI.getAll();
            // In a real app, the backend should filter by the logged-in user.
            // For now, we'll just show all since we updated the Order model but the controller needs to filter.
            setOrders(response.data);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-6 md:px-10">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <ShoppingBag size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
                        <p className="text-gray-500">Track your purchases and order status.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                        <p className="text-gray-500">Retrieving your orders...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package size={32} className="text-gray-300" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">No orders yet</h2>
                        <p className="text-gray-500 mt-2 mb-6">Looks like you haven't placed any orders yet. Start shopping!</p>
                        <a href="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition">
                            Explore Shop
                            <ChevronRight size={18} />
                        </a>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map(order => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={order._id}
                                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition group"
                            >
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div className="flex gap-4">
                                        <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition">
                                            <Package size={28} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{order.order_id}</span>
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-1">{order.product_name}</h3>
                                            <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                                                <span className="flex items-center gap-1">Quantity: {order.quantity}</span>
                                                {order.price && <span className="flex items-center gap-1">Total: ₹{order.price * order.quantity}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-row md:flex-col justify-between items-end border-t md:border-t-0 border-gray-50 pt-3 md:pt-0">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold uppercase">
                                            <Calendar size={14} />
                                            {new Date(order.order_date).toLocaleDateString()}
                                        </div>
                                        {order.status === 'Pending' && (
                                            <span className="text-indigo-600 text-xs font-bold bg-indigo-50 px-3 py-1 rounded-lg mt-2">
                                                Pending Review
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyOrdersPage;
