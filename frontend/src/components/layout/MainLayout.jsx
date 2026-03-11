import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { logout } from '../../store/slices/authSlice';
import { dashboardAPI } from '../../services/api';
import { formatDate } from '../../utils/dateUtils';
import {
    LayoutDashboard,
    Receipt,
    Package,
    Settings,
    Search,
    Bell,
    ChevronDown,
    ChevronRight,
    Menu,
    X,
    LogOut,
    User,
    Store,
    Calculator,
    IndianRupee,
    ShoppingCart,
    TrendingUp,
    Users,
    Truck
} from 'lucide-react';

import logoImage from '../../assets/logo.jpg';

const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
}).format(amount || 0);

const navigationSections = [
    {
        title: 'OVERVIEW',
        items: [
            { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        ]
    },
    {
        title: 'WORK MANAGEMENT',
        items: [
            { name: 'Companies', href: '/dashboard/companies', icon: Store },
            { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
            { name: 'Items', href: '/dashboard/items', icon: Package },
            { name: 'Raw Materials', href: '/dashboard/raw-materials', icon: Package },
            { name: 'Production', href: '/dashboard/production', icon: TrendingUp },
            { name: 'Finished Goods', href: '/dashboard/finished-goods', icon: Package },
        ]
    },
    {
        title: 'LOGISTICS & FINANCE',
        items: [
            { name: 'Dispatch', href: '/dashboard/dispatch', icon: Truck },
            { name: 'Billing', href: '/dashboard/billing', icon: Receipt },
        ]
    },
    {
        title: 'ANALYTICS & SETTINGS',
        items: [
            { name: 'Reports', href: '/dashboard/reports', icon: TrendingUp },
            { name: 'Settings', href: '/dashboard/settings', icon: Settings },
        ]
    },
];

const MainLayout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector((state) => state.auth);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [collapsedSections, setCollapsedSections] = useState({});
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [notificationsError, setNotificationsError] = useState('');
    const [notifications, setNotifications] = useState([]);
    const searchRef = useRef(null);
    const notificationsRef = useRef(null);

    const unreadCount = useMemo(
        () => notifications.filter((notification) => !notification.read).length,
        [notifications]
    );

    // Page transition animation variants are now defined outside the component for performance

    const searchSuggestions = [
        { label: 'Dashboard', path: '/dashboard', keywords: ['dashboard', 'home', 'overview'] },
        { label: 'Purchase Entry', path: '/dashboard/purchase/entry', keywords: ['purchase', 'buy', 'supplier', 'invoice'] },

        { label: 'Purchase Reports', path: '/dashboard/reports/purchase', keywords: ['purchase', 'report', 'analysis'] },
        { label: 'Sales Entry', path: '/dashboard/sales/entry', keywords: ['sales', 'sell', 'customer', 'invoice'] },

        { label: 'Sales Reports', path: '/dashboard/reports/sales', keywords: ['sales', 'report', 'analysis'] },
        { label: 'Billing', path: '/dashboard/billing', keywords: ['billing', 'bill', 'invoice', 'receipt'] },
        { label: 'Products', path: '/dashboard/inventory', keywords: ['inventory', 'stock', 'product', 'item'] },
        { label: 'Stock Reports', path: '/dashboard/reports/stock', keywords: ['stock', 'report', 'inventory'] },
        { label: 'Suppliers', path: '/dashboard/master/suppliers', keywords: ['supplier', 'vendor', 'entry', 'master'] },
        { label: 'Customers', path: '/dashboard/master/customers', keywords: ['customer', 'entry', 'master', 'company'] },
        { label: 'Items', path: '/dashboard/master/items', keywords: ['items', 'hsn', 'product', 'master'] },
        { label: 'Settings', path: '/dashboard/settings', keywords: ['settings', 'config', 'preferences'] },
    ];

    const filteredSuggestions = searchQuery.trim()
        ? searchSuggestions.filter(s =>
            s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.keywords.some(k => k.includes(searchQuery.toLowerCase()))
        )
        : [];

    const handleSearchSelect = (path) => {
        navigate(path);
        setSearchQuery('');
        setShowSearchDropdown(false);
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter' && filteredSuggestions.length > 0) {
            handleSearchSelect(filteredSuggestions[0].path);
        }
        if (e.key === 'Escape') {
            setShowSearchDropdown(false);
        }
    };

    const toggleSection = (sectionTitle) => {
        setCollapsedSections(prev => ({
            ...prev,
            [sectionTitle]: !prev[sectionTitle]
        }));
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearchDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadNotifications = useCallback(async () => {
        setNotificationsLoading(true);
        setNotificationsError('');
        try {
            const [lowStockResponse, recentBillsResponse] = await Promise.all([
                dashboardAPI.getLowStockAlerts(),
                dashboardAPI.getRecentBills(5)
            ]);

            const lowStockItems = lowStockResponse?.data?.data || [];
            const recentBills = recentBillsResponse?.data?.data || [];

            const nextNotifications = [
                ...recentBills.map((bill) => {
                    const customerName = bill?.customer?.name || 'Customer';
                    const paymentStatus = bill?.paymentStatus
                        ? bill.paymentStatus.charAt(0).toUpperCase() + bill.paymentStatus.slice(1)
                        : 'Pending';
                    return {
                        id: `bill:${bill._id || bill.billNumber}`,
                        type: 'bill',
                        title: `Bill #${bill.billNumber}`,
                        message: `${customerName} | ${formatCurrency(bill.grandTotal)} | ${paymentStatus}`,
                        date: bill.date,
                        action: '/dashboard/billing'
                    };
                }),
                ...lowStockItems.map((product) => ({
                    id: `stock:${product._id || product.name}`,
                    type: 'low-stock',
                    title: `Low stock: ${product.name}`,
                    message: `Stock ${product.stock} / ${product.lowStockThreshold}`,
                    action: '/dashboard/inventory'
                }))
            ];

            setNotifications((prev) => {
                const readMap = new Map(prev.map((item) => [item.id, item.read]));
                return nextNotifications.map((item) => ({
                    ...item,
                    read: readMap.get(item.id) ?? false
                }));
            });
        } catch (error) {
            setNotificationsError('Failed to load notifications');
        } finally {
            setNotificationsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (notificationsOpen) {
            loadNotifications();
        }
    }, [notificationsOpen, loadNotifications]);

    const handleLogout = () => {
        dispatch(logout());
    };

    const handleNotificationClick = (notification) => {
        setNotifications((prev) =>
            prev.map((item) => (item.id === notification.id ? { ...item, read: true } : item))
        );
        if (notification.action) {
            navigate(notification.action);
        }
        setNotificationsOpen(false);
    };

    const markAllNotificationsRead = () => {
        setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 lg:hidden bg-black/20 backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
                style={{
                    background: 'linear-gradient(160deg, #f0f4ff 0%, #e8eeff 40%, #f5e8ff 80%, #fef0ff 100%)',
                    borderRight: '1px solid rgba(99,102,241,0.12)',
                    boxShadow: '4px 0 24px rgba(99,102,241,0.08)'
                }}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
                    <div className="bg-white p-1 rounded-xl shadow-[0_4px_16px_rgba(99,102,241,0.15)] ring-1 ring-indigo-100 flex-shrink-0">
                        <img
                            src={logoImage}
                            alt="Logo"
                            className="w-12 h-12 object-contain rounded-lg"
                        />
                    </div>
                    <div className="hidden lg:block">
                        <h1 className="text-base font-serif font-black tracking-wider leading-tight" style={{ color: '#3730a3' }}>
                            V.M.S<br />GARMENTS
                        </h1>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col py-4 px-3 space-y-1 overflow-y-auto h-[calc(100vh-140px)]">
                    {navigationSections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className={sectionIndex > 0 ? 'mt-4' : ''}>
                            <button
                                onClick={() => toggleSection(section.title)}
                                className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-wider mb-2 px-3 py-1 transition-colors"
                                style={{ color: '#6366f1', opacity: 0.7 }}
                            >
                                {section.title}
                                <ChevronRight
                                    size={14}
                                    className={`transition-transform duration-200 ${!collapsedSections[section.title] ? 'rotate-90' : ''}`}
                                />
                            </button>

                            <AnimatePresence>
                                {!collapsedSections[section.title] && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden space-y-0.5"
                                    >
                                        {section.items.map((item) => (
                                            <NavLink
                                                key={item.name}
                                                to={item.href}
                                                end={item.href === '/dashboard'}
                                                className={({ isActive }) => `
                                                    flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                                                    ${isActive
                                                        ? 'shadow-[0_2px_12px_rgba(99,102,241,0.2)]'
                                                        : 'hover:bg-indigo-50/60'}
                                                `}
                                                style={({ isActive }) => isActive ? {
                                                    background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.1) 100%)',
                                                    border: '1px solid rgba(99,102,241,0.2)'
                                                } : {}}
                                                onClick={() => setSidebarOpen(false)}
                                            >
                                                {({ isActive }) => (
                                                    <>
                                                        <item.icon
                                                            size={18}
                                                            className={`transition-colors`}
                                                            style={{ color: isActive ? '#6366f1' : '#94a3b8' }}
                                                            strokeWidth={2}
                                                        />
                                                        <span className="text-sm font-semibold" style={{ color: isActive ? '#3730a3' : '#475569' }}>{item.name}</span>
                                                    </>
                                                )}
                                            </NavLink>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </nav>

                {/* Logout */}
                <div className="absolute bottom-0 left-0 right-0 px-3 py-4" style={{ borderTop: '1px solid rgba(99,102,241,0.1)', background: 'rgba(240,244,255,0.8)', backdropFilter: 'blur(8px)' }}>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-xl transition-colors hover:bg-red-50"
                        style={{ color: '#ef4444' }}
                    >
                        <LogOut size={18} />
                        <span className="text-sm font-semibold">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen lg:ml-64 transition-all duration-300">
                {/* Header */}
                <header className="h-16 flex items-center justify-between px-4 lg:px-8 py-3 bg-white border-b border-gray-200 sticky top-0 z-30">
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>

                        <div className="hidden md:block relative w-full max-w-md" ref={searchRef}>
                            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus-within:bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                                <Search size={18} className="text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search bills, products, pages..."
                                    className="bg-transparent border-none outline-none text-sm w-full text-gray-900 placeholder:text-gray-400"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setShowSearchDropdown(true);
                                    }}
                                    onFocus={() => setShowSearchDropdown(true)}
                                    onKeyDown={handleSearchKeyDown}
                                />
                            </div>

                            <AnimatePresence>
                                {showSearchDropdown && filteredSuggestions.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 4 }}
                                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50 max-h-64 overflow-y-auto"
                                    >
                                        {filteredSuggestions.map((suggestion, index) => (
                                            <div
                                                key={suggestion.path}
                                                className={`px-4 py-2.5 cursor-pointer flex items-center gap-3 hover:bg-gray-50 transition-colors ${index === 0 ? 'bg-blue-50/50' : ''}`}
                                                onClick={() => handleSearchSelect(suggestion.path)}
                                            >
                                                <Search size={16} className={index === 0 ? 'text-blue-500' : 'text-gray-400'} />
                                                <span className={index === 0 ? 'text-blue-700 font-medium' : 'text-gray-700'}>{suggestion.label}</span>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative" ref={notificationsRef}>
                            <button
                                className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                                onClick={() => setNotificationsOpen((prev) => !prev)}
                                aria-label="Notifications"
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full border-2 border-white flex items-center justify-center">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            <AnimatePresence>
                                {notificationsOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 8 }}
                                        className="absolute right-0 mt-3 w-96 max-w-[90vw] bg-white rounded-xl shadow-xl border border-gray-100 z-50"
                                    >
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900">Notifications</div>
                                                <div className="text-xs text-gray-500">Latest updates and alerts</div>
                                            </div>
                                            {unreadCount > 0 && (
                                                <button
                                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                                                    onClick={markAllNotificationsRead}
                                                >
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>

                                        <div className="max-h-96 overflow-y-auto">
                                            {notificationsLoading && (
                                                <div className="px-4 py-6 text-sm text-gray-500 text-center">
                                                    Loading notifications...
                                                </div>
                                            )}

                                            {!notificationsLoading && notificationsError && (
                                                <div className="px-4 py-6 text-sm text-red-600 text-center">
                                                    {notificationsError}
                                                </div>
                                            )}

                                            {!notificationsLoading && !notificationsError && notifications.length === 0 && (
                                                <div className="px-4 py-6 text-sm text-gray-500 text-center">
                                                    No notifications yet.
                                                </div>
                                            )}

                                            {!notificationsLoading && !notificationsError && notifications.length > 0 && (
                                                <>
                                                    {notifications.filter((n) => n.type === 'bill').length > 0 && (
                                                        <div className="px-4 pt-3 text-xs font-semibold text-gray-400 uppercase">
                                                            Recent Bills
                                                        </div>
                                                    )}
                                                    {notifications
                                                        .filter((n) => n.type === 'bill')
                                                        .map((notification) => (
                                                            <button
                                                                key={notification.id}
                                                                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3"
                                                                onClick={() => handleNotificationClick(notification)}
                                                            >
                                                                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                                                    <Receipt size={18} />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-sm font-semibold text-gray-900 truncate">
                                                                        {notification.title}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {notification.message}
                                                                    </div>
                                                                    {notification.date && (
                                                                        <div className="text-xs text-gray-400 mt-1">
                                                                            {formatDate(notification.date)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {!notification.read && (
                                                                    <span className="mt-1 w-2 h-2 rounded-full bg-blue-500" />
                                                                )}
                                                            </button>
                                                        ))}

                                                    {notifications.filter((n) => n.type === 'low-stock').length > 0 && (
                                                        <div className="px-4 pt-3 text-xs font-semibold text-gray-400 uppercase">
                                                            Low Stock Alerts
                                                        </div>
                                                    )}
                                                    {notifications
                                                        .filter((n) => n.type === 'low-stock')
                                                        .map((notification) => (
                                                            <button
                                                                key={notification.id}
                                                                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3"
                                                                onClick={() => handleNotificationClick(notification)}
                                                            >
                                                                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                                                    <Package size={18} />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-sm font-semibold text-gray-900 truncate">
                                                                        {notification.title}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {notification.message}
                                                                    </div>
                                                                </div>
                                                                {!notification.read && (
                                                                    <span className="mt-1 w-2 h-2 rounded-full bg-amber-500" />
                                                                )}
                                                            </button>
                                                        ))}
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="relative">
                            <div
                                className="flex items-center gap-3 cursor-pointer pl-2"
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                            >
                                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm">
                                    {user?.name?.charAt(0) || 'A'}
                                </div>
                                <div className="hidden md:block">
                                    <div className="text-sm font-semibold text-gray-900 leading-tight">
                                        {user?.name || 'Admin User'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {user?.role || 'admin'}
                                    </div>
                                </div>
                                <ChevronDown
                                    size={16}
                                    className={`text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                                />
                            </div>

                            <AnimatePresence>
                                {userMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 8 }}
                                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 origin-top-right"
                                    >
                                        <div className="px-4 py-3 border-b border-gray-100 md:hidden">
                                            <p className="text-sm font-semibold text-gray-900">{user?.name || 'Admin User'}</p>
                                            <p className="text-xs text-gray-500">{user?.email || 'admin@example.com'}</p>
                                        </div>
                                        <button
                                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                            onClick={() => navigate('/dashboard/settings')}
                                        >
                                            <User size={16} className="text-gray-400" />
                                            <span>Profile</span>
                                        </button>
                                        <button
                                            className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                            onClick={handleLogout}
                                        >
                                            <LogOut size={16} className="text-red-500" />
                                            <span>Logout</span>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
