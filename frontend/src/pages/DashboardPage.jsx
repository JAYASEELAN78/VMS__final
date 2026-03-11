import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, emailAPI } from '../services/api';
import { useToast } from '../components/common';
import {
    TrendingUp,
    ShoppingBag,
    Users,
    IndianRupee,
    ArrowUpRight,
    ArrowDownRight,
    AlertTriangle,
    Mail,
    Loader2
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { formatDate } from '../utils/dateUtils';

const DashboardPage = () => {
    const [stats, setStats] = useState(null);
    const [recentBills, setRecentBills] = useState([]);
    const [revenueData, setRevenueData] = useState([]);
    const [lowStockAlerts, setLowStockAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sendingSummary, setSendingSummary] = useState(false);
    const toast = useToast();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleSendSummary = async () => {
        try {
            setSendingSummary(true);
            const response = await emailAPI.sendDailySummary();
            if (response.data.success) {
                toast.success('Daily summary email sent successfully!');
            } else {
                toast.error(response.data.message || 'Failed to send summary email');
            }
        } catch (error) {
            console.error('Error sending daily summary:', error);
            toast.error(error.response?.data?.message || 'Error sending daily summary email');
        } finally {
            setSendingSummary(false);
        }
    };

    const fetchDashboardData = async () => {
        try {
            const [statsRes, billsRes, chartRes, alertsRes] = await Promise.all([
                dashboardAPI.getStats(),
                dashboardAPI.getRecentBills(5),
                dashboardAPI.getRevenueChart('month'),
                dashboardAPI.getLowStockAlerts()
            ]);
            setStats(statsRes.data.data || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, totalCustomers: 0, revenueGrowth: 0, ordersGrowth: 0 });
            setRecentBills(billsRes.data.data || []);
            setRevenueData((chartRes.data.data || []).map(d => ({ date: d._id, revenue: d.revenue })));
            setLowStockAlerts(alertsRes.data.data || []);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            setStats({ totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, totalCustomers: 0, revenueGrowth: 0, ordersGrowth: 0 });
            setRecentBills([]);
            setRevenueData([]);
            setLowStockAlerts([]);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    // Format today's date as dd/mm/yyyy
    const getTodayFormatted = () => {
        const today = new Date();
        const day = today.getDate().toString().padStart(2, '0');
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const year = today.getFullYear();
        const weekday = today.toLocaleDateString('en-IN', { weekday: 'long' });
        return `${weekday}, ${day}/${month}/${year}`;
    };

    const statsCards = [
        {
            title: 'Total Revenue',
            value: formatCurrency(stats?.totalRevenue || 0),
            change: stats?.revenueGrowth || 0,
            icon: IndianRupee,
            color: 'sage'
        },
        {
            title: 'Total Orders',
            value: stats?.totalOrders || 0,
            change: stats?.ordersGrowth || 0,
            icon: ShoppingBag,
            color: 'blue'
        },
        {
            title: 'Avg Order Value',
            value: formatCurrency(stats?.avgOrderValue || 0),
            change: null,
            icon: TrendingUp,
            color: 'green'
        },
        {
            title: 'Total Customers',
            value: stats?.totalCustomers || 0,
            change: null,
            icon: Users,
            color: 'orange'
        }
    ];

    const colorClasses = {
        sage: 'bg-green-100 text-green-700',
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        orange: 'bg-orange-100 text-orange-600'
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#3b82f6', borderTopColor: 'transparent' }} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSendSummary}
                        disabled={sendingSummary}
                        className="btn btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {sendingSummary ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Mail size={18} className="group-hover:scale-110 transition-transform" />
                        )}
                        <span>{sendingSummary ? 'Sending...' : 'Send Daily Summary'}</span>
                    </button>
                    <p className="text-gray-600 font-medium whitespace-nowrap">
                        {getTodayFormatted()}
                    </p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Link
                    to="/dashboard/items"
                    className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                >
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <ShoppingBag size={24} />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900">Add Product</p>
                        <p className="text-xs text-gray-500 font-medium">Create new inventory item</p>
                    </div>
                </Link>

                <Link
                    to="/dashboard/billing"
                    className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                >
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                        <IndianRupee size={24} />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900">New Sale</p>
                        <p className="text-xs text-gray-500 font-medium">Generate a new bill</p>
                    </div>
                </Link>

                <Link
                    to="/dashboard/orders"
                    className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                >
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900">New Order</p>
                        <p className="text-xs text-gray-500 font-medium">Book a manufacturing order</p>
                    </div>
                </Link>

                <Link
                    to="/dashboard/companies"
                    className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                >
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900">Add Company</p>
                        <p className="text-xs text-gray-500 font-medium">Register a client company</p>
                    </div>
                </Link>
            </div>

            {/* Stats Cards - Modern Premium Design */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {statsCards.map((stat, index) => (
                    <div key={index} className="relative bg-white rounded-2xl p-5 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
                        {/* Gradient Accent Bar */}
                        <div className={`absolute top-0 left-0 w-full h-1 ${stat.color === 'sage' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
                            stat.color === 'blue' ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                                stat.color === 'green' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                                    'bg-gradient-to-r from-orange-400 to-amber-500'
                            }`}></div>

                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
                                <p className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</p>
                                {stat.change != null && (
                                    <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${stat.change >= 0
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                        }`}>
                                        {stat.change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                        <span>{Math.abs(stat.change)}% vs last month</span>
                                    </div>
                                )}
                            </div>
                            <div className={`p-3 rounded-xl ${stat.color === 'sage' ? 'bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600' :
                                stat.color === 'blue' ? 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600' :
                                    stat.color === 'green' ? 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-600' :
                                        'bg-gradient-to-br from-orange-100 to-amber-100 text-orange-600'
                                } group-hover:scale-110 transition-transform duration-300`}>
                                <stat.icon size={24} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 card">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Overview</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={revenueData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" stroke="#4b5563" tick={{ fontSize: 12, fill: '#374151' }} />
                            <YAxis stroke="#4b5563" tick={{ fontSize: 12, fill: '#374151' }} tickFormatter={(v) => `₹${v / 1000}K`} />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fill="url(#colorRevenue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Low Stock Alerts */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Low Stock Alerts</h3>
                        <span className="badge badge-error">{lowStockAlerts.length}</span>
                    </div>
                    <div className="space-y-3">
                        {lowStockAlerts.length === 0 ? (
                            <p className="text-gray-600 text-center py-4 font-medium">No low stock alerts</p>
                        ) : (
                            lowStockAlerts.map((item) => (
                                <div key={item._id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                                    <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                        <AlertTriangle size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                                        <p className="text-xs font-medium text-gray-600">{item.stock} left (min: {item.lowStockThreshold})</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Bills */}
            <div className="card p-0">
                <div className="flex items-center justify-between p-6 pb-4">
                    <h3 className="text-lg font-bold text-gray-900">Recent Bills</h3>
                    <Link to="/dashboard/billing" className="text-sm font-semibold hover:underline">View All</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-y border-gray-200">
                                <th className="text-left p-4 text-sm font-bold text-gray-900">Bill No</th>
                                <th className="text-left p-4 text-sm font-bold text-gray-900">Date</th>
                                <th className="text-left p-4 text-sm font-bold text-gray-900">Customer</th>
                                <th className="text-left p-4 text-sm font-bold text-gray-900">Amount</th>
                                <th className="text-left p-4 text-sm font-bold text-gray-900">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentBills.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-600 font-medium">
                                        No recent bills found
                                    </td>
                                </tr>
                            ) : (
                                recentBills.map((bill) => (
                                    <tr key={bill._id} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="p-4 text-sm font-semibold text-gray-900">{bill.billNumber}</td>
                                        <td className="p-4 text-sm font-medium text-gray-900">{formatDate(bill.date || bill.createdAt)}</td>
                                        <td className="p-4 text-sm font-medium text-gray-900">{bill.customer?.name || '-'}</td>
                                        <td className="p-4 text-sm font-bold text-gray-900">{formatCurrency(bill.grandTotal)}</td>
                                        <td className="p-4">
                                            <span className={`badge ${bill.paymentStatus === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                                                {bill.paymentStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
