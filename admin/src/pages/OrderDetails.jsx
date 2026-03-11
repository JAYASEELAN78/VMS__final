import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { ArrowLeft, Box, Calendar, DollarSign, FileText } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import api from '../services/api';
import toast from 'react-hot-toast';

const WORKFLOW_STEPS = [
    'Pending', 'Material Received', 'Processing', 'Quality Check', 'Completed', 'Dispatched', 'Delivered'
];

const OrderTimeline = ({ currentStatus }) => {
    // Rough mapping to handle legacy/mismatched statuses
    const currentIndex = Math.max(0, WORKFLOW_STEPS.indexOf(currentStatus));

    return (
        <div className="py-6">
            <div className="relative flex justify-between">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200"></div>
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 transition-all duration-500"
                    style={{ width: `${(currentIndex / (WORKFLOW_STEPS.length - 1)) * 100}%` }}
                ></div>

                {WORKFLOW_STEPS.map((step, index) => {
                    const isCompleted = index <= currentIndex;
                    const isActive = index === currentIndex;

                    return (
                        <div key={step} className="relative z-10 flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${isActive ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100' :
                                    isCompleted ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-400'
                                }`}>
                                {index + 1}
                            </div>
                            <span className={`mt-2 text-xs font-medium max-w-[80px] text-center ${isActive ? 'text-blue-700' : isCompleted ? 'text-gray-800' : 'text-gray-400'
                                }`}>
                                {step}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const OrderDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                // Assume API supports getting single order by ID or we filter
                const { data } = await api.get(`/api/orders`);
                const found = data.find(o => o._id === id);
                if (found) setOrder(found);
            } catch (error) {
                toast.error('Failed to load order details');
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    const handleUpdateStatus = async (newStatus) => {
        setUpdating(true);
        try {
            await api.put(`/api/orders/${id}`, { status: newStatus });
            setOrder({ ...order, status: newStatus });
            toast.success(`Order status updated to ${newStatus}`);
        } catch (error) {
            toast.error('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="p-8">Loading details...</div>;
    if (!order) return <div className="p-8 text-red-500">Order not found</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/orders')} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        Order {order.order_id} <StatusBadge status={order.status} />
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">From: {order.company_id?.name || 'Unknown Client'}</p>
                </div>
            </div>

            <Card>
                <CardHeader title="Order Workflow Timeline" />
                <CardContent>
                    <OrderTimeline currentStatus={order.status} />

                    <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 pt-6">
                        <select
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                            onChange={(e) => handleUpdateStatus(e.target.value)}
                            value={order.status}
                            disabled={updating}
                        >
                            {WORKFLOW_STEPS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button disabled={updating} className="btn-primary">Update Status</button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader title="Product Specs" />
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                            <Box className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Product Name</p>
                                <p className="font-semibold text-gray-900">{order.product_name}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Quantity</p>
                                <p className="font-semibold text-gray-900">{order.quantity} {order.unit || 'pcs'}</p>
                            </div>
                        </div>
                        {order.description && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
                                <span className="font-semibold">Description: </span> {order.description}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader title="Order Information" />
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Order Date / Delivery Date</p>
                                <p className="font-semibold text-gray-900">
                                    {new Date(order.order_date).toLocaleDateString()} / {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'TBD'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Estimated Cost & Payment</p>
                                <p className="font-semibold text-gray-900">
                                    ₹{order.estimatedCost || order.price || 0}
                                </p>
                                <div className="mt-1"><StatusBadge status={order.payment_status || 'Pending'} /></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default OrderDetailsPage;
