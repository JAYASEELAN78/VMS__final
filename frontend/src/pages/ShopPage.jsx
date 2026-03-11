import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingCart, Search, Filter, Package, X, Loader, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { productsAPI, ordersAPI, categoriesAPI } from '../services/api';
import { useToast } from '../components/common';

const ShopPage = () => {
    const toast = useToast();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortOption, setSortOption] = useState('newest');
    const [cart, setCart] = useState([]);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [productsRes, categoriesRes] = await Promise.all([
                productsAPI.getAll({ limit: 100 }),
                categoriesAPI.getAll()
            ]);
            setProducts(productsRes.data.data || []);
            setCategories([{ _id: 'All', name: 'All Products' }, ...(categoriesRes.data.data || [])]);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item._id === product._id);
            if (existing) {
                return prev.map(item => item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        toast.success(`Added ${product.name} to cart`);
    };

    const updateCartQuantity = (productId, delta) => {
        setCart(prev => prev.map(item => {
            if (item._id === productId) {
                const newQty = Math.max(0, item.quantity + delta);
                return newQty === 0 ? null : { ...item, quantity: newQty };
            }
            return item;
        }).filter(Boolean));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    let filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || p.category?._id === selectedCategory || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (sortOption === 'price_asc') {
        filteredProducts.sort((a, b) => a.sellingPrice - b.sellingPrice);
    } else if (sortOption === 'price_desc') {
        filteredProducts.sort((a, b) => b.sellingPrice - a.sellingPrice);
    }

    const handlePlaceOrder = async () => {
        if (cart.length === 0) return;
        setIsSubmitting(true);
        try {
            for (const item of cart) {
                const orderData = {
                    order_id: `ORD-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`,
                    product_name: item.name,
                    quantity: item.quantity,
                    price: item.sellingPrice,
                    status: 'Pending',
                    order_date: new Date().toISOString()
                };
                await ordersAPI.create(orderData);
            }
            toast.success('Your order has been placed successfully!');
            setCart([]);
            setIsCheckoutModalOpen(false);
        } catch (error) {
            console.error('Order failed:', error);
            toast.error('Failed to place order');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF9] font-sans pb-20">
            {/* Minimal Header */}
            <div className="bg-white border-b border-[#C7B7A3]/30 sticky top-0 z-10 py-4 px-6 md:px-12 shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#561C24] rounded-lg flex items-center justify-center text-[#FDFBF9]">
                            <Package size={24} />
                        </div>
                        <h1 className="text-2xl font-black tracking-wider text-[#561C24] uppercase">Brand Store</h1>
                    </div>

                    <div className="flex items-center gap-6 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search styles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full focus:ring-1 focus:ring-[#6D2932] focus:border-[#6D2932] transition outline-none text-sm"
                            />
                        </div>

                        <Link
                            to="/my-orders"
                            className="hidden sm:flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-[#6D2932] uppercase tracking-wide transition-colors"
                        >
                            <ShoppingBag size={20} />
                            <span>Orders</span>
                        </Link>

                        <button
                            onClick={() => setIsCheckoutModalOpen(true)}
                            className="relative flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-[#6D2932] uppercase tracking-wide transition-colors"
                        >
                            <ShoppingCart size={22} />
                            <span className="hidden sm:inline">Bag</span>
                            {cartCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-[#6D2932] text-white text-[10px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Layout: Sidebar + Grid */}
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 flex flex-col md:flex-row gap-12">

                {/* Sidebar Filters */}
                <aside className="w-full md:w-56 flex-shrink-0">
                    <div className="sticky top-28">
                        <h2 className="text-sm font-black text-gray-900 mb-6 uppercase tracking-widest border-b border-gray-200 pb-2">CATEGORIES</h2>
                        <ul className="space-y-3">
                            {categories.map(cat => (
                                <li key={cat._id}>
                                    <button
                                        onClick={() => setSelectedCategory(cat._id === 'All' ? 'All' : cat._id)}
                                        className={`text-sm w-full text-left transition-colors ${(selectedCategory === cat._id || (selectedCategory === 'All' && cat._id === 'All'))
                                                ? 'font-bold text-[#561C24]'
                                                : 'text-gray-600 hover:text-[#6D2932] font-medium'
                                            }`}
                                    >
                                        {cat.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>

                {/* Product Area */}
                <div className="flex-1">
                    {/* Header: Title and Sort */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-4 border-b border-gray-200 gap-4">
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide">
                            {selectedCategory === 'All' ? 'ALL STYLES' : categories.find(c => c._id === selectedCategory)?.name || 'STYLES'}
                            <span className="text-sm text-gray-500 font-medium ml-2 tracking-normal">({filteredProducts.length} items)</span>
                        </h2>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">Sort By:</span>
                            <select
                                className="text-sm border-none bg-transparent font-medium text-gray-600 hover:text-[#6D2932] focus:ring-0 cursor-pointer outline-none"
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                            >
                                <option value="newest">Newest</option>
                                <option value="price_asc">Price: Low - High</option>
                                <option value="price_desc">Price: High - Low</option>
                            </select>
                        </div>
                    </div>

                    {/* Products Grid */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader className="w-10 h-10 text-[#6D2932] animate-spin mb-4" />
                            <p className="text-gray-500 font-medium">Loading collection...</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-gray-100">
                                <Search size={24} className="text-gray-400" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">No items found</h2>
                            <p className="text-gray-500 mt-2 text-sm">Try exploring a different category.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                            {filteredProducts.map(product => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={product._id}
                                    className="group overflow-hidden flex flex-col cursor-pointer"
                                >
                                    {/* Product Image */}
                                    <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center relative mb-4 overflow-hidden rounded-md">
                                        {product.image ? (
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="w-full h-full object-cover object-top transition duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <Package size={40} className="text-gray-300" />
                                        )}

                                        {/* Quick Add Overlay */}
                                        <div className="absolute bottom-0 left-0 w-full p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                                                className="w-full py-2.5 bg-white/90 backdrop-blur text-gray-900 font-bold text-sm uppercase tracking-wide rounded hover:bg-[#561C24] hover:text-white transition-colors"
                                            >
                                                Quick Add
                                            </button>
                                        </div>

                                        {product.stock <= 5 && (
                                            <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm">
                                                Low Stock
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex flex-col">
                                        <div className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                                            {typeof product.category === 'object' ? product.category?.name : categories.find(c => c._id === product.category)?.name}
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1">{product.name}</h3>
                                        <span className="text-gray-600 font-medium text-sm">₹{product.sellingPrice}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Checkout Modal */}
            <AnimatePresence>
                {isCheckoutModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-[#FDFBF9]">
                                <h2 className="text-lg font-black tracking-wide uppercase text-[#561C24] flex items-center gap-2">
                                    Your Bag
                                </h2>
                                <button onClick={() => setIsCheckoutModalOpen(false)} className="p-2 hover:bg-[#E8D8C4] rounded-full text-gray-500 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {cart.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <ShoppingBag size={32} className="mx-auto mb-4 text-gray-300" />
                                        <p className="font-medium">Your bag is currently empty.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {cart.map(item => (
                                            <div key={item._id} className="flex gap-4 p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                                                <div className="w-20 h-24 bg-gray-50 rounded flex items-center justify-center overflow-hidden">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package size={24} className="text-gray-300" />
                                                    )}
                                                </div>
                                                <div className="flex-1 flex flex-col">
                                                    <h4 className="font-bold text-gray-900 text-sm leading-tight">{item.name}</h4>
                                                    <p className="text-gray-500 font-medium text-sm mt-1">₹{item.sellingPrice}</p>

                                                    <div className="mt-auto flex items-center gap-3">
                                                        <div className="flex items-center border border-gray-200 rounded">
                                                            <button
                                                                onClick={() => updateCartQuantity(item._id, -1)}
                                                                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#6D2932] hover:bg-gray-50 transition"
                                                            >
                                                                <Minus size={14} />
                                                            </button>
                                                            <span className="w-8 text-center text-sm font-bold text-gray-800">{item.quantity}</span>
                                                            <button
                                                                onClick={() => updateCartQuantity(item._id, 1)}
                                                                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#6D2932] hover:bg-gray-50 transition"
                                                            >
                                                                <Plus size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900 text-sm">₹{item.sellingPrice * item.quantity}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {cart.length > 0 && (
                                <div className="p-6 bg-[#FDFBF9] border-t border-gray-200">
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-gray-600 font-bold uppercase tracking-wide text-sm">Estimated Total</span>
                                        <span className="text-xl font-black text-gray-900">₹{cartTotal}</span>
                                    </div>

                                    <button
                                        disabled={isSubmitting}
                                        onClick={handlePlaceOrder}
                                        className="w-full py-4 bg-[#6D2932] hover:bg-[#561C24] text-white font-bold tracking-widest uppercase text-sm flex items-center justify-center gap-2 transition-colors rounded-sm"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader className="animate-spin" size={18} />
                                                Processing
                                            </>
                                        ) : (
                                            'Checkout'
                                        )}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ShopPage;
