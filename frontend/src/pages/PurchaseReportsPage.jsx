import { useState, useEffect } from 'react';
import { Search, ShoppingCart, X, Printer, FileSpreadsheet, Mail, FileText } from 'lucide-react';
import DateRangeFilter from '../components/reports/DateRangeFilter';
import ReportHeader from '../components/reports/ReportHeader';
import { exportToExcelStyled } from '../utils/exportToExcel';
import { printReport } from '../utils/printReport';
import { reportsAPI, emailAPI } from '../services/api';
import { useToast } from '../components/common';
import { formatDate } from '../utils/dateUtils';

const PurchaseReportsPage = () => {
    const toast = useToast();
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [supplierSearch, setSupplierSearch] = useState('');
    const [invoiceNo, setInvoiceNo] = useState('');
    const [reportData, setReportData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);

    // Initialize with current month dates
    useEffect(() => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        setFromDate(firstDay.toISOString().split('T')[0]);
        setToDate(today.toISOString().split('T')[0]);
    }, []);

    const handleSearch = async () => {
        setIsLoading(true);
        try {
            const response = await reportsAPI.getPurchaseReport({
                fromDate,
                toDate,
                supplier: supplierSearch,
                invNo: invoiceNo
            });

            setReportData(response.data.data || []);
        } catch (error) {
            console.error('Error fetching purchase data:', error);
            toast.error('Error loading purchase data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = () => {
        if (reportData.length === 0) {
            toast.warning('No data to export');
            return;
        }

        const columns = [
            { key: 'sno', header: 'S.No', width: 8, align: 'left' },
            { key: 'date', header: 'Date', width: 14, align: 'left' },
            { key: 'invNo', header: 'Invoice No', width: 16, align: 'left' },
            { key: 'item', header: 'Item', width: 28, align: 'left' },
            { key: 'rate', header: 'Rate', width: 14, align: 'right' },
            { key: 'qty', header: 'Quantity', width: 12, align: 'right' },
            { key: 'total', header: 'Total', width: 16, align: 'right' }
        ];

        const formattedData = reportData.map(row => ({
            ...row,
            date: formatDate(row.date),
            total: row.rate * row.qty
        }));

        const grandTotals = {
            rate: formattedData.reduce((sum, r) => sum + (r.rate || 0), 0),
            qty: formattedData.reduce((sum, r) => sum + (r.qty || 0), 0),
            total: formattedData.reduce((sum, r) => sum + (r.total || 0), 0)
        };

        exportToExcelStyled({
            title: 'Purchase Report',
            businessName: 'V.M.S GARMENTS',
            fromDate,
            toDate,
            columns,
            data: formattedData,
            totals: grandTotals,
            filename: 'purchase_report',
            sheetName: 'Purchase Report'
        });
    };

    const handlePrint = () => {
        printReport('printable-report');
    };

    const handleEmail = async () => {
        if (reportData.length === 0) {
            toast.warning('No data to email');
            return;
        }

        try {
            setIsLoading(true);
            const response = await emailAPI.sendReport({
                type: 'purchase',
                fromDate,
                toDate,
                data: reportData
            });

            if (response.data.success) {
                toast.success('Purchase report emailed successfully!');
            } else {
                toast.error(response.data.message || 'Failed to email report');
            }
        } catch (error) {
            console.error('Error emailing report:', error);
            toast.error(error.response?.data?.message || 'Error emailing report');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="text-indigo-600" size={20} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Purchase Reports</h1>
            </div>

            {/* Filters and Actions */}
            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex flex-wrap items-end gap-3">
                    {/* Inv No */}
                    <div className="shrink-0 w-32">
                        <label className="form-label">Inv No</label>
                        <input
                            type="text"
                            placeholder="Enter invoice num"
                            className="form-input"
                            value={invoiceNo}
                            onChange={(e) => setInvoiceNo(e.target.value)}
                        />
                    </div>

                    {/* Supplier */}
                    <div className="shrink-0 w-48">
                        <label className="form-label">Supplier</label>
                        <input
                            type="text"
                            placeholder="Enter supplier name"
                            className="form-input"
                            value={supplierSearch}
                            onChange={(e) => setSupplierSearch(e.target.value)}
                        />
                    </div>

                    {/* From Date */}
                    <div className="shrink-0 w-36">
                        <label className="form-label">From Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </div>

                    {/* To Date */}
                    <div className="shrink-0 w-36">
                        <label className="form-label">To Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                        />
                    </div>

                    {/* Search */}
                    <button
                        className="btn btn-primary"
                        onClick={handleSearch}
                        disabled={isLoading}
                    >
                        <Search size={16} />
                        Search
                    </button>

                    {/* Clear */}
                    <button
                        className="btn btn-secondary"
                        onClick={() => { setSupplierSearch(''); setInvoiceNo(''); setFromDate(''); setToDate(''); }}
                    >
                        <X size={16} />
                        Clear
                    </button>

                    {/* Divider */}
                    <div className="h-8 w-px bg-gray-300 mx-1 hidden md:block"></div>

                    {/* Actions */}
                    <button className="btn text-white bg-green-600 hover:bg-green-700" onClick={handleExport}>
                        <FileSpreadsheet size={16} />
                        Excel
                    </button>

                    <button className="btn btn-primary" onClick={handlePrint}>
                        <Printer size={16} />
                        Print
                    </button>

                    <button className="btn text-white bg-blue-600 hover:bg-blue-700" onClick={handleEmail}>
                        <Mail size={16} />
                        Mail
                    </button>

                    <button className="btn btn-ghost border" onClick={() => setShowInvoiceModal(true)}>
                        <FileText size={16} />
                    </button>
                </div>
            </div>

            {/* Report Content */}
            <div className="card p-0 print:shadow-none" id="printable-report">
                <div className="p-6">
                    <ReportHeader
                        reportTitle="Purchase Report"
                        fromDate={formatDate(fromDate)}
                        toDate={formatDate(toDate)}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-y-2 border-gray-300">
                                <th className="text-left py-4 px-4 font-bold text-gray-900 print:text-black">S.No</th>
                                <th className="text-left py-4 px-4 font-bold text-gray-900 print:text-black">Date</th>
                                <th className="text-left py-4 px-4 font-bold text-gray-900 print:text-black">Inv No</th>
                                <th className="text-left py-4 px-4 font-bold text-gray-900 print:text-black">Item</th>
                                <th className="text-right py-4 px-4 font-bold text-gray-900 print:text-black">Rate</th>
                                <th className="text-right py-4 px-4 font-bold text-gray-900 print:text-black">Qty</th>
                                <th className="text-right py-4 px-4 font-bold text-gray-900 print:text-black">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.length > 0 ? (
                                <>
                                    {reportData.map((row) => (
                                        <tr key={row.sno} className="border-b border-gray-200 hover:bg-gray-50 print:hover:bg-transparent">
                                            <td className="py-4 px-4 font-medium text-gray-900 print:text-black">{row.sno}</td>
                                            <td className="py-4 px-4 font-medium text-gray-900 print:text-black">{formatDate(row.date)}</td>
                                            <td className="py-4 px-4 font-medium text-gray-900 print:text-black">{row.invNo}</td>
                                            <td className="py-4 px-4 font-medium text-gray-900 print:text-black">{row.item}</td>
                                            <td className="py-4 px-4 text-right font-semibold text-gray-900 print:text-black">₹{row.rate}</td>
                                            <td className="py-4 px-4 text-right font-semibold text-gray-900 print:text-black">{row.qty}</td>
                                            <td className="py-4 px-4 text-right font-semibold text-gray-900 print:text-black">₹{row.rate * row.qty}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-100 border-t-2 border-gray-300">
                                        <td colSpan="6" className="py-4 px-4 text-right font-bold text-gray-900 print:text-black">Grand Total:</td>
                                        <td className="py-4 px-4 text-right font-bold text-blue-600 print:text-black text-lg">₹{reportData.reduce((sum, row) => sum + (row.rate * row.qty), 0).toLocaleString('en-IN')}</td>
                                    </tr>
                                </>
                            ) : (
                                <tr>
                                    <td colSpan="7" className="py-8 text-center text-gray-600 font-medium">
                                        {isLoading ? 'Loading...' : 'No data available. Click SEARCH to load purchase data.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invoice View Modal */}
            {showInvoiceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowInvoiceModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-[230mm] w-full max-h-[95vh] overflow-hidden mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900">Invoice View - Purchase Report</h3>
                            <div className="flex items-center gap-2">
                                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors">
                                    <Printer size={16} />
                                    Print
                                </button>
                                <button onClick={() => setShowInvoiceModal(false)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 overflow-auto max-h-[calc(95vh-80px)]" style={{ backgroundColor: '#e5e5e5' }}>
                            <div className="bg-white mx-auto shadow-lg" style={{ width: '210mm', minHeight: '297mm', padding: '15mm', boxSizing: 'border-box' }}>
                                <ReportHeader reportTitle="Purchase Report" fromDate={formatDate(fromDate)} toDate={formatDate(toDate)} />
                                <table className="w-full border-collapse mt-4">
                                    <thead>
                                        <tr className="bg-gray-100 border-y-2 border-gray-300">
                                            <th className="text-left py-3 px-3 font-bold text-gray-900 text-sm">S.No</th>
                                            <th className="text-left py-3 px-3 font-bold text-gray-900 text-sm">Date</th>
                                            <th className="text-left py-3 px-3 font-bold text-gray-900 text-sm">Inv No</th>
                                            <th className="text-left py-3 px-3 font-bold text-gray-900 text-sm">Item</th>
                                            <th className="text-right py-3 px-3 font-bold text-gray-900 text-sm">Rate</th>
                                            <th className="text-right py-3 px-3 font-bold text-gray-900 text-sm">Qty</th>
                                            <th className="text-right py-3 px-3 font-bold text-gray-900 text-sm">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.map((row) => (
                                            <tr key={row.sno} className="border-b border-gray-200">
                                                <td className="py-2 px-3 text-gray-900 text-sm">{row.sno}</td>
                                                <td className="py-2 px-3 text-gray-900 text-sm">{formatDate(row.date)}</td>
                                                <td className="py-2 px-3 text-gray-900 text-sm">{row.invNo}</td>
                                                <td className="py-2 px-3 text-gray-900 text-sm">{row.item}</td>
                                                <td className="py-2 px-3 text-right text-gray-900 text-sm">₹{row.rate}</td>
                                                <td className="py-2 px-3 text-right text-gray-900 text-sm">{row.qty}</td>
                                                <td className="py-2 px-3 text-right text-gray-900 text-sm">₹{row.rate * row.qty}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-gray-100 border-t-2 border-gray-300">
                                            <td colSpan="6" className="py-3 px-3 text-right font-bold text-gray-900 text-sm">Grand Total:</td>
                                            <td className="py-3 px-3 text-right font-bold text-blue-600 text-sm">₹{reportData.reduce((sum, row) => sum + (row.rate * row.qty), 0).toLocaleString('en-IN')}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseReportsPage;
