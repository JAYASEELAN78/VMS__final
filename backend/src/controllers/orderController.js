import Order from '../models/Order.js';

export const createOrder = async (req, res) => {
    try {
        // Handle fields from both the React Client app and the web app
        const { productName, product_name, quantity, unit, description, deliveryDate, delivery_date, priority, estimatedCost } = req.body;

        const generatedOrderId = `ORD-${Date.now()}`;

        const orderData = {
            order_id: req.body.order_id || generatedOrderId,
            user_id: req.user?._id, // Set by protect middleware
            product_name: productName || product_name,
            quantity: quantity,
            unit,
            description,
            delivery_date: deliveryDate || delivery_date,
            priority,
            estimatedCost,
            designFile: req.file ? `/uploads/${req.file.filename}` : undefined
        };

        const order = new Order({ ...req.body, ...orderData });
        await order.save();
        res.status(201).json(order);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const getOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('company_id')
            .populate('user_id', 'name email')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('company_id')
            .populate('user_id', 'name email');
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const updateOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(order);
    } catch (err) { res.status(400).json({ error: err.message }); }
};

export const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json({ message: 'Order deleted successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};