import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createOrder } from '../services/orderService'
import toast from 'react-hot-toast'
import { HiOutlineCube, HiOutlineDocumentAdd, HiOutlineCalendar, HiOutlineUpload } from 'react-icons/hi'

const PlaceOrder = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({ productName: '', quantity: '', unit: 'pcs', description: '', deliveryDate: '', priority: 'medium', estimatedCost: '' })
    const [file, setFile] = useState(null)
    const [dragActive, setDragActive] = useState(false)

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
    const handleFile = (f) => { if (f && f.size > 10 * 1024 * 1024) return toast.error('File size should be under 10MB'); setFile(f) }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.productName || !form.quantity) return toast.error('Product name and quantity are required')
        setLoading(true)
        try {
            const formData = new FormData()
            Object.entries(form).forEach(([key, val]) => { if (val) formData.append(key, val) })
            if (file) formData.append('designFile', file)
            await createOrder(formData)
            toast.success('Order placed successfully!')
            navigate('/my-orders')
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to place order') }
        finally { setLoading(false) }
    }

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Place New Order</h1>
                <p className="text-gray-500 text-sm mt-1">Fill in the details for your new manufacturing order</p>
            </div>
            <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
                <div className="space-y-5">
                    <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><HiOutlineCube className="w-5 h-5 text-red-500" /> Product Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-600 mb-2">Product Name <span className="text-red-500">*</span></label>
                            <input type="text" name="productName" value={form.productName} onChange={handleChange} className="input-field" placeholder="e.g., Steel Brackets Type-A" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Quantity <span className="text-red-500">*</span></label>
                            <input type="number" name="quantity" value={form.quantity} onChange={handleChange} className="input-field" placeholder="100" min="1" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Unit</label>
                            <select name="unit" value={form.unit} onChange={handleChange} className="input-field">
                                {['pcs', 'kg', 'meters', 'liters', 'boxes', 'sets'].map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Priority</label>
                            <select name="priority" value={form.priority} onChange={handleChange} className="input-field">
                                {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Estimated Cost (₹)</label>
                            <input type="number" name="estimatedCost" value={form.estimatedCost} onChange={handleChange} className="input-field" placeholder="0" min="0" />
                        </div>
                    </div>
                </div>
                <div className="space-y-5 pt-4 border-t border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><HiOutlineCalendar className="w-5 h-5 text-red-500" /> Delivery Details</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Expected Delivery Date</label>
                        <input type="date" name="deliveryDate" value={form.deliveryDate} onChange={handleChange} className="input-field" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Description / Special Instructions</label>
                        <textarea name="description" value={form.description} onChange={handleChange} rows="3" className="input-field resize-none" placeholder="Any specific requirements or notes..." />
                    </div>
                </div>
                <div className="space-y-5 pt-4 border-t border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2"><HiOutlineDocumentAdd className="w-5 h-5 text-red-500" /> Design File</h3>
                    <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${dragActive ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
                        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }} onDragLeave={() => setDragActive(false)}
                        onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files[0]) }}
                        onClick={() => document.getElementById('file-upload').click()}>
                        <input id="file-upload" type="file" className="hidden" onChange={(e) => handleFile(e.target.files[0])} accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xlsx,.csv" />
                        <HiOutlineUpload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        {file ? (<div><p className="text-red-600 font-medium">{file.name}</p><p className="text-xs text-gray-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p></div>)
                            : (<div><p className="text-gray-500">Drag & drop your design file here</p><p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG, DOC, XLSX (max 10MB)</p></div>)}
                    </div>
                </div>
                <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
                    <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Place Order'}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default PlaceOrder
