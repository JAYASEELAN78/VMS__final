import { useState, useEffect } from 'react';
import { Scale, Search, X, Printer, FileSpreadsheet, Mail } from 'lucide-react';
import DateRangeFilter from '../components/reports/DateRangeFilter';
import ReportHeader from '../components/reports/ReportHeader';
import { exportToExcelStyled } from '../utils/exportToExcel';
import { printReport } from '../utils/printReport';
import { reportsAPI, emailAPI } from '../services/api';
import { useToast } from '../components/common';

const AuditorSalesPage = () => {
    const toast = useToast();
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [reportData, setReportData] = useState([]);
    const [totals, setTotals] = useState({
        taxableAmount: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        total: 0
    });
    const [isLoading, setIsLoading] = useState(false);

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
            const response = await reportsAPI.getAuditorSales({
                fromDate,
                toDate
            });

            const data = response.data.data || [];

            // Calculate totals
            const newTotals = data.reduce((acc, row) => ({
                taxableAmount: acc.taxableAmount + row.taxableAmount,
                cgst: acc.cgst + row.cgst,
                sgst: acc.sgst + row.sgst,
                igst: acc.igst + row.igst,
                total: acc.total + row.total
            }), { taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, total: 0 });

            setReportData(data);
            setTotals(newTotals);
        } catch (error) {
            console.error('Error fetching auditor sales data:', error);
            toast.error('Error loading auditor sales data. Please try again.');
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
            { key: 'companyName', header: 'Company Name', width: 28, align: 'left' },
            { key: 'gstin', header: 'GSTIN', width: 22, align: 'left' },
            { key: 'date', header: 'Date', width: 14, align: 'left' },
            { key: 'invNo', header: 'Inv No', width: 14, align: 'left' },
            { key: 'taxableAmount', header: 'Taxable Amount', width: 18, align: 'right' },
            { key: 'cgst', header: 'CGST', width: 12, align: 'right' },
            { key: 'sgst', header: 'SGST', width: 12, align: 'right' },
            { key: 'igst', header: 'IGST', width: 12, align: 'right' },
            { key: 'total', header: 'Total', width: 16, align: 'right' }
        ];

        exportToExcelStyled({
            title: 'Sales Report',
            businessName: 'V.M.S GARMENTS',
            fromDate,
            toDate,
            columns,
            data: reportData,
            totals,
            filename: 'auditor_sales_report',
            sheetName: 'Sales Report'
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
                type: 'auditor-sales',
                fromDate,
                toDate,
                data: reportData
            });

            if (response.data.success) {
                toast.success('Auditor sales report emailed successfully!');
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
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#dbeafe' }}>
                    <Scale style={{ color: '#1e40af' }} size={20} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Auditor Report - Sales</h1>
            </div>

            {/* Filters and Actions */}
            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex flex-wrap items-end gap-3">

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
                        onClick={() => { setFromDate(''); setToDate(''); }}
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
                </div>
            </div>

            {/* Report Content */}
            <div className="card print:shadow-none" id="printable-report">
                <ReportHeader
                    reportTitle="Sales Report"
                    fromDate={fromDate}
                    toDate={toDate}
                />

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-gray-300">
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 print:text-black">Company Name</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 print:text-black">GSTIN</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 print:text-black">Date</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 print:text-black">Inv No</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-700 print:text-black">Taxable Amount</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-700 print:text-black">CGST</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-700 print:text-black">SGST</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-700 print:text-black">IGST</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-700 print:text-black">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.length > 0 ? (
                                <>
                                    {reportData.map((row, index) => (
                                        <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 print:hover:bg-transparent">
                                            <td className="py-3 px-4 text-gray-900 print:text-black">{row.companyName}</td>
                                            <td className="py-3 px-4 text-gray-900 print:text-black">{row.gstin}</td>
                                            <td className="py-3 px-4 text-gray-900 print:text-black">{row.date}</td>
                                            <td className="py-3 px-4 text-gray-900 print:text-black">{row.invNo}</td>
                                            <td className="py-3 px-4 text-right text-gray-900 print:text-black">₹{row.taxableAmount.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right text-gray-900 print:text-black">₹{row.cgst.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right text-gray-900 print:text-black">₹{row.sgst.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right text-gray-900 print:text-black">₹{row.igst.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right text-gray-900 print:text-black">₹{row.total.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {/* Totals Row */}
                                    <tr className="border-t-2 border-gray-400 bg-gray-50 print:bg-gray-100 font-semibold">
                                        <td className="py-3 px-4 text-gray-900 print:text-black" colSpan="4">Total</td>
                                        <td className="py-3 px-4 text-right text-gray-900 print:text-black">₹{totals.taxableAmount.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-right text-gray-900 print:text-black">₹{totals.cgst.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-right text-gray-900 print:text-black">₹{totals.sgst.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-right text-gray-900 print:text-black">₹{totals.igst.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-right text-gray-900 print:text-black">₹{totals.total.toLocaleString()}</td>
                                    </tr>
                                </>
                            ) : (
                                <tr>
                                    <td colSpan="9" className="py-8 text-center text-gray-500">
                                        {isLoading ? 'Loading...' : 'No data available. Click SEARCH to load auditor sales data.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditorSalesPage;
