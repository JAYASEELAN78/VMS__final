import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Users, ShoppingCart, Activity,
    Truck, FileText, MessageSquare, User, Settings, PieChart
} from 'lucide-react';

const MENU_ITEMS = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Clients', path: '/clients', icon: Users },
    { name: 'Orders', path: '/orders', icon: ShoppingCart },
    { name: 'Production', path: '/production', icon: Activity },
    { name: 'Dispatch', path: '/dispatch', icon: Truck },
    { name: 'Invoices', path: '/invoices', icon: FileText },
    { name: 'Reports', path: '/reports', icon: PieChart },
    { name: 'Messages', path: '/messages', icon: MessageSquare },
    { name: 'Profile', path: '/profile', icon: User },
];

const Sidebar = () => {
    return (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm hidden md:flex">
            <div className="h-16 flex items-center justify-center border-b border-gray-200 px-4">
                <h1 className="text-lg font-bold text-gray-800 tracking-wide uppercase">Smart Admin</h1>
            </div>
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {MENU_ITEMS.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        {item.name}
                    </NavLink>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;
