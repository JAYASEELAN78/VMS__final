import './reports/ReportStyles.css';

const EmptyReportTemplate = ({ type = 'sales', settings, forPrint = false }) => {
    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const today = formatDate(new Date());

    const reportTitles = {
        sales: 'Sales Report',
        purchase: 'Purchase Report',
        stock: 'Stock Report',
        'auditor-sales': 'Auditor Sales Report',
        'auditor-purchase': 'Auditor Purchase Report'
    };

    const reportColumns = {
        sales: ['Sl.No', 'Date', 'Bill No', 'Customer Name', 'Items', 'Subtotal', 'Tax', 'Total'],
        purchase: ['Sl.No', 'Date', 'Invoice No', 'Supplier', 'Items', 'Amount', 'Tax', 'Total'],
        stock: ['Sl.No', 'Product Code', 'Product Name', 'Category', 'In Stock', 'Unit Price', 'Total Value'],
        'auditor-sales': ['Sl.No', 'Date', 'Bill No', 'Customer', 'Amount', 'GST', 'Total', 'Status'],
        'auditor-purchase': ['Sl.No', 'Date', 'Invoice No', 'Supplier', 'Amount', 'GST', 'Total', 'Status']
    };

    const columns = reportColumns[type] || reportColumns.sales;
    const emptyRows = Array(15).fill(null);

    return (
        <div className={`report-template ${forPrint ? 'for-print' : ''}`} id="empty-report-template" style={{
            background: 'white',
            padding: '30px',
            fontFamily: 'Arial, sans-serif',
            color: '#000'
        }}>
            {/* Report Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '15px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 5px 0' }}>
                    {settings?.company?.name || 'V.M.S GARMENTS'}
                </h1>
                <p style={{ fontSize: '12px', margin: '2px 0' }}>
                    {settings?.company?.address1 || '61C9, Anupparpalayam Puthur, Tirupur. 641652'}
                </p>
                <p style={{ fontSize: '12px', margin: '2px 0' }}>
                    GSTIN: {settings?.company?.gstin || '33AZRPM4425F2ZA'} | Phone: {settings?.company?.phone || '9080573831'}
                </p>
            </div>

            {/* Report Title */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0', textDecoration: 'underline' }}>
                    {reportTitles[type]}
                </h2>
            </div>

            {/* Report Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '12px' }}>
                <div>
                    <strong>From Date:</strong> _____________ &nbsp;&nbsp;&nbsp; <strong>To Date:</strong> _____________
                </div>
                <div>
                    <strong>Generated Date:</strong> {today}
                </div>
            </div>

            {/* Report Table */}
            <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '11px'
            }}>
                <thead>
                    <tr>
                        {columns.map((col, idx) => (
                            <th key={idx} style={{
                                border: '1px solid #000',
                                padding: '8px 6px',
                                backgroundColor: '#f0f0f0',
                                fontWeight: 'bold',
                                textAlign: 'center'
                            }}>
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {emptyRows.map((_, rowIdx) => (
                        <tr key={rowIdx}>
                            {columns.map((__, colIdx) => (
                                <td key={colIdx} style={{
                                    border: '1px solid #000',
                                    padding: '10px 6px',
                                    height: '25px'
                                }}>
                                    {colIdx === 0 ? rowIdx + 1 : ''}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan={columns.length - 2} style={{
                            border: '1px solid #000',
                            padding: '8px 6px',
                            fontWeight: 'bold',
                            textAlign: 'right'
                        }}>
                            Total:
                        </td>
                        <td style={{ border: '1px solid #000', padding: '8px 6px' }}></td>
                        <td style={{ border: '1px solid #000', padding: '8px 6px' }}></td>
                    </tr>
                </tfoot>
            </table>

            {/* Summary Section */}
            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '12px' }}>
                    <p><strong>Total Records:</strong> _______</p>
                    <p><strong>Total Amount:</strong> ₹ ___________</p>
                </div>
                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                    <div style={{ borderTop: '1px solid #000', width: '150px', paddingTop: '5px' }}>
                        Authorized Signature
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '30px', borderTop: '1px solid #000', paddingTop: '10px', fontSize: '10px', textAlign: 'center' }}>
                <p>This is a computer generated report. | {settings?.company?.name || 'V.M.S GARMENTS'}</p>
            </div>
        </div>
    );
};

export default EmptyReportTemplate;
