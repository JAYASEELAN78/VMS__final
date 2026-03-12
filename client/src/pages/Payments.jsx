import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { getOrders } from '../services/orderService'
import toast from 'react-hot-toast'
import {
    HiOutlineCurrencyRupee,
    HiOutlineCreditCard,
    HiOutlineRefresh,
    HiOutlineDocumentText,
    HiOutlineQrcode,
    HiOutlineLibrary,
    HiX
} from 'react-icons/hi'
import { SiPhonepe, SiGooglepay } from 'react-icons/si'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDate } from '../utils/helpers'

const Payments = () => {
    const navigate = useNavigate()
    const [payments, setPayments] = useState([])
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [selectedMethod, setSelectedMethod] = useState(null)

    const paymentMethods = [
        { id: 'upi', name: 'UPI', icon: <SiPhonepe className="text-purple-600" />, desc: 'PhonePe, GPay, Paytm' },
        { id: 'card', name: 'Card', icon: <HiOutlineCreditCard className="text-blue-600" />, desc: 'Debit / Credit Card' },
        { id: 'netbanking', name: 'Net Banking', icon: <HiOutlineLibrary className="text-green-600" />, desc: 'All Indian Banks' },
        { id: 'qr', name: 'QR Code', icon: <HiOutlineQrcode className="text-red-600" />, desc: 'Scan and Pay' }
    ]

    useEffect(() => {
        fetchData()
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true
        document.body.appendChild(script)
        return () => { document.body.removeChild(script) }
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [paymentsRes, ordersRes] = await Promise.all([
                api.get('/api/payments'),
                getOrders()
            ])
            setPayments(paymentsRes.data.data || paymentsRes.data)
            const fetchedOrders = Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data.orders || [])
            setOrders(fetchedOrders.filter(o => o.status?.toUpperCase() === 'DELIVERED'))
        } catch (err) {
            toast.error('Failed to fetch data')
        } finally {
            setLoading(false)
        }
    }

    const initiatePayment = (order) => {
        setSelectedOrder(order)
        setShowModal(true)
    }

    const handlePayment = async () => {
        if (!selectedMethod) {
            toast.error('Please select a payment method')
            return
        }

        const order = selectedOrder
        setShowModal(false)

        try {
            const { data: orderData } = await api.post('/api/razorpay/order', {
                amount: order.estimatedCost || order.price || 0,
                orderId: order._id
            })

            if (!orderData.success) throw new Error('Order creation failed')

            if (orderData.simulated) {
                toast.loading(`Processing ${selectedMethod.name} payment...`, { id: 'sim-pay' })
                setTimeout(async () => {
                    try {
                        const { data: verifyData } = await api.post('/api/razorpay/verify', {
                            razorpay_order_id: orderData.order.id,
                            razorpay_payment_id: `sim_${selectedMethod.id}_123`,
                            razorpay_signature: 'sim_signature',
                            orderId: order._id
                        })
                        if (verifyData.success) {
                            toast.success(`${selectedMethod.name} Payment Successful!`, { id: 'sim-pay' })
                            setTimeout(() => navigate('/invoices'), 1500)
                        }
                    } catch (e) {
                        toast.error('Payment failed', { id: 'sim-pay' })
                    }
                }, 2000)
                return
            }

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_dummy_key',
                amount: orderData.order.amount,
                currency: orderData.order.currency,
                name: "V.M.S GARMENTS",
                description: `Payment for Order ${order.order_id}`,
                order_id: orderData.order.id,
                prefill: { method: selectedMethod.id === 'card' ? 'card' : (selectedMethod.id === 'upi' ? 'upi' : '') },
                handler: async (response) => {
                    try {
                        const { data: verifyData } = await api.post('/api/razorpay/verify', {
                            ...response,
                            orderId: order._id
                        })
                        if (verifyData.success) {
                            toast.success('Payment Successful!')
                            setTimeout(() => navigate('/invoices'), 1500)
                        }
                    } catch (err) {
                        toast.error('Verification error')
                    }
                },
                theme: { color: "#dc2626" }
            }
            const rzp = new window.Razorpay(options)
            rzp.open()
        } catch (err) {
            toast.error(err.message || 'Payment initiation failed')
        }
    }

    return (
        <div className="space-y-8 animate-fade-in relative">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">My Payments</h1>
                    <p className="text-gray-500 text-sm mt-1">Track your financial transactions and order details</p>
                </div>
                <button
                    onClick={fetchData}
                    className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all shadow-sm"
                >
                    <HiOutlineRefresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Order Details Section */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <HiOutlineDocumentText className="w-5 h-5 text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-700">Order Details (Delivered)</h2>
                </div>
                <div className="glass-card overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                {['Order ID', 'Product', 'Quantity', 'Amount', 'Status', 'Date', 'Action'].map(h => (
                                    <th key={h} className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="7" className="px-6 py-12 text-center"><div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
                            ) : orders.length > 0 ? orders.map(order => (
                                <tr key={order._id} className="hover:bg-gray-50 transition-colors text-sm">
                                    <td className="px-6 py-4 font-mono font-medium text-red-600">{order.order_id || order.orderId}</td>
                                    <td className="px-6 py-4 font-bold text-gray-800">{order.product_name || order.productName}</td>
                                    <td className="px-6 py-4 text-gray-600">{order.quantity} {order.unit}</td>
                                    <td className="px-6 py-4 font-bold text-gray-900">₹{order.estimatedCost?.toLocaleString() || order.price?.toLocaleString() || 0}</td>
                                    <td className="px-6 py-4">
                                        <span className={`status-badge border bg-green-100 text-green-600 border-green-200`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{formatDate(order.delivery_date || order.deliveryDate)}</td>
                                    <td className="px-6 py-4">
                                        {order.payment_status === 'Paid' ? (
                                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-black uppercase tracking-wider border border-green-100">
                                                <HiOutlineCurrencyRupee className="w-4 h-4" /> Paid
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => initiatePayment(order)}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-xs font-bold hover:from-red-700 hover:to-red-800 transition-all shadow-md shadow-red-200 uppercase tracking-wider"
                                            >
                                                <HiOutlineCurrencyRupee className="w-4 h-4" /> Pay Now
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">No delivered orders found in your history</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment History Section */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <HiOutlineCreditCard className="w-5 h-5 text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-700">Payment History</h2>
                </div>
                <div className="glass-card overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                {['Payment ID', 'Type', 'Amount', 'Date', 'Status'].map(h => (
                                    <th key={h} className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center"><div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
                            ) : payments.length > 0 ? payments.map(pmt => (
                                <tr key={pmt._id} className="hover:bg-gray-50 transition-colors text-sm">
                                    <td className="px-6 py-4 font-bold text-gray-800">#{pmt._id?.slice(-8).toUpperCase()}</td>
                                    <td className="px-6 py-4 text-gray-700">{pmt.type}</td>
                                    <td className="px-6 py-4 font-bold text-gray-900">₹{pmt.amount?.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-gray-500">{formatDate(pmt.date)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`status-badge border ${pmt.status === 'Completed' ? 'bg-green-100 text-green-600 border-green-200' : 'bg-amber-100 text-amber-600 border-amber-200'}`}>
                                            {pmt.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">No payment records found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Method Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">Select Payment Method</h3>
                                        <p className="text-gray-500 text-sm">Secure payment for Order {selectedOrder?.order_id}</p>
                                    </div>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <HiX className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-3 mb-8">
                                    {paymentMethods.map((method) => (
                                        <button
                                            key={method.id}
                                            onClick={() => setSelectedMethod(method)}
                                            className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${selectedMethod?.id === method.id
                                                ? 'border-red-600 bg-red-50 ring-4 ring-red-50'
                                                : 'border-gray-100 hover:border-red-100 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl">
                                                {method.icon}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-800">{method.name}</div>
                                                <div className="text-xs text-gray-500">{method.desc}</div>
                                            </div>
                                            {selectedMethod?.id === method.id && (
                                                <div className="ml-auto w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
                                                    <div className="w-2 h-2 rounded-full bg-white" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-6 py-3 rounded-2xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        disabled={!selectedMethod}
                                        onClick={handlePayment}
                                        className="flex-1 px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-200 disabled:opacity-50 disabled:shadow-none"
                                    >
                                        Proceed to Pay
                                    </button>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 flex items-center justify-center gap-2 border-t border-gray-100">
                                <HiOutlineCurrencyRupee className="text-gray-400" />
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Amount to Pay:</span>
                                <span className="text-sm font-black text-gray-800">₹{(selectedOrder?.estimatedCost || selectedOrder?.price || 0).toLocaleString()}</span>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default Payments
