import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getOrderById } from '../services/orderService'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { ORDER_STATUSES, formatDate, formatDateTime, getStatusColor, getPriorityColor } from '../utils/helpers'
import Loader from '../components/Loader'
import toast from 'react-hot-toast'
import { HiOutlineArrowLeft, HiOutlineCheckCircle, HiOutlinePaperAirplane } from 'react-icons/hi'

const OrderDetails = () => {
    const { id } = useParams()
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([])
    const { user } = useAuth()

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { data } = await getOrderById(id);
                setOrder(data)
            } catch (err) { console.error(err) }
            finally { setLoading(false) }
        }
        fetchOrder()
    }, [id])

    // Fetch messages and auto-refresh so admin replies appear in real time
    const fetchMessages = async () => {
        try {
            const { data: msgs } = await api.get('/api/messages')
            // Fix: compare as strings since order_id is a populated ObjectId
            const orderMsgs = msgs.filter(m => {
                const oid = m.order_id?._id?.toString() || m.order_id?.toString()
                return oid === id
            })
            setMessages(orderMsgs.reverse())
        } catch (err) { console.error('Message fetch error:', err) }
    }

    useEffect(() => {
        fetchMessages()
        const interval = setInterval(fetchMessages, 5000) // poll every 5s
        return () => clearInterval(interval)
    }, [id])

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!message.trim()) return
        try {
            const { data } = await api.post('/api/messages', {
                client_id: user?._id || user?.id,
                order_id: id,
                message
            })
            setMessages(prev => [...prev, data])
            setMessage('')
            toast.success('Message sent to admin!')
        } catch (err) { toast.error('Failed to send') }
    }

    if (loading) return <Loader />
    if (!order) return <div className="text-center py-20 text-gray-400">Order not found</div>

    const currentIdx = ORDER_STATUSES.indexOf(order.status)

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/my-orders" className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors shadow-sm">
                    <HiOutlineArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{order.order_id || order.orderId}</h1>
                    <p className="text-gray-500 text-sm">{order.product_name || order.productName} · <span className={`font-semibold ${getPriorityColor(order.priority)}`}>{order.priority?.toUpperCase()}</span></p>
                </div>
                <span className={`status-badge border ml-auto ${getStatusColor(order.status)}`}>{order.status}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Timeline */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-6">Order Progress</h2>
                        <div className="relative">
                            {ORDER_STATUSES.map((status, index) => {
                                const isCompleted = index <= currentIdx
                                const isCurrent = index === currentIdx
                                const timelineEntry = order.timeline?.find(t => t.status === status)
                                return (
                                    <div key={status} className="flex gap-4 pb-6 last:pb-0">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isCurrent ? 'bg-red-500 shadow-lg shadow-red-500/30 ring-4 ring-red-100' :
                                                isCompleted ? 'bg-emerald-500 shadow-sm' : 'bg-gray-100 border-2 border-gray-300'}`}>
                                                {isCompleted ? <HiOutlineCheckCircle className="w-5 h-5 text-white" /> : <span className="text-xs text-gray-400">{index + 1}</span>}
                                            </div>
                                            {index < ORDER_STATUSES.length - 1 && <div className={`w-0.5 flex-1 mt-2 ${isCompleted ? 'bg-emerald-400' : 'bg-gray-200'}`}></div>}
                                        </div>
                                        <div className="flex-1 pt-1.5">
                                            <p className={`font-medium ${isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>{status}</p>
                                            {timelineEntry && <p className="text-xs text-gray-400 mt-1">{formatDateTime(timelineEntry.date)}{timelineEntry.note && ` — ${timelineEntry.note}`}</p>}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Messages</h2>
                        <div className="space-y-3 max-h-60 overflow-y-auto mb-4 pr-1">
                            {messages.length > 0 ? messages.map((msg, i) => (
                                <div key={i} className={`p-3 rounded-xl max-w-[80%] ${msg.sender === 'client' ? 'ml-auto bg-red-50 border border-red-100' : 'bg-gray-50 border border-gray-200'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-medium text-gray-600">{msg.sender === 'client' ? 'You' : 'Admin'}</span>
                                        <span className="text-[10px] text-gray-400">{formatDateTime(msg.createdAt || msg.date)}</span>
                                    </div>
                                    <p className="text-sm text-gray-700">{msg.message}</p>
                                </div>
                            )) : <p className="text-gray-400 text-sm text-center py-4">No messages yet. Send a message to the admin!</p>}
                        </div>
                        <form onSubmit={handleSendMessage} className="flex gap-3">
                            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} className="input-field flex-1" placeholder="Send a message to admin..." />
                            <button type="submit" className="btn-primary px-4"><HiOutlinePaperAirplane className="w-5 h-5 rotate-90" /></button>
                        </form>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Details</h3>
                        <div className="space-y-3 text-sm">
                            {[
                                { l: 'Product', v: order.product_name || order.productName },
                                { l: 'Quantity', v: `${order.quantity} ${order.unit}` },
                                { l: 'Priority', v: order.priority?.toUpperCase(), c: getPriorityColor(order.priority) },
                                { l: 'Delivery Date', v: formatDate(order.delivery_date || order.deliveryDate) },
                                { l: 'Est. Cost', v: order.estimatedCost ? `₹${order.estimatedCost.toLocaleString()}` : 'N/A' },
                                { l: 'Created', v: formatDate(order.createdAt) },
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                                    <span className="text-gray-400">{item.l}</span>
                                    <span className={`font-medium ${item.c || 'text-gray-800'}`}>{item.v}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {order.description && (
                        <div className="glass-card p-6">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Description</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">{order.description}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default OrderDetails
