import './BillTemplate.css';

const EmptyBillTemplate = ({ settings, forPrint = false }) => {
    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const today = formatDate(new Date());

    // Generate 20 empty rows for the table
    const emptyRows = Array(20).fill(null);

    return (
        <div className={`bill-template ${forPrint ? 'for-print' : ''}`} id="empty-bill-template">
            {/* HEADER ROW 1 - Company Name and GSTIN */}
            <div className="bill-header">
                <div className="company-name">{settings?.company?.name || 'V.M.S GARMENTS'}</div>
                <div className="gstin">GSTIN: {settings?.company?.gstin || '33AZRPM4425F2ZA'}</div>
            </div>

            {/* HEADER ROWS 2-5 - Company Info and Invoice Details */}
            <div className="bill-info-section">
                <div className="address-section">
                    <div className="address-line">OFF : {settings?.company?.address1 || '61C9, Anupparpalayam Puthur, Tirupur. 641652'}</div>
                    <div className="address-line">OFF : {settings?.company?.address2 || '81 K, Madurai Road, SankerNager, Tirunelveli Dt. 627357'}</div>
                    <div className="address-line">State: {settings?.company?.state || 'Tamil Nadu'} (Code {settings?.company?.stateCode || '33'})</div>
                    <div className="address-line">Email: {settings?.company?.email || 'vmsgarments67@gmail.com'}</div>
                    <div className="address-line">Mob: {settings?.company?.phone || '9080573831'}</div>
                </div>
                <div className="invoice-section">
                    <div className="invoice-row">
                        <span className="invoice-label">Invoice Number</span>
                        <span className="invoice-colon">:</span>
                        <span className="invoice-value" style={{ borderBottom: '1px solid #000', minWidth: '100px' }}>&nbsp;</span>
                    </div>
                    <div className="invoice-row">
                        <span className="invoice-label">Invoice Date</span>
                        <span className="invoice-colon">:</span>
                        <span className="invoice-value">{today}</span>
                    </div>
                    <div className="invoice-row">
                        <span className="invoice-label">Payment Mode</span>
                        <span className="invoice-colon">:</span>
                        <span className="invoice-value" style={{ borderBottom: '1px solid #000', minWidth: '80px' }}>&nbsp;</span>
                    </div>
                </div>
            </div>

            {/* BILLING TO SECTION */}
            <div className="billing-to-section">
                <div className="billing-to-left">
                    <div className="billing-row">
                        <span className="billing-label">Name of Buyer</span>
                        <span className="billing-colon">:</span>
                        <span className="billing-value" style={{ borderBottom: '1px solid #000', minWidth: '200px' }}>&nbsp;</span>
                    </div>
                    <div className="billing-row">
                        <span className="billing-label">Address</span>
                        <span className="billing-colon">:</span>
                        <span className="billing-value" style={{ borderBottom: '1px solid #000', minWidth: '200px' }}>&nbsp;</span>
                    </div>
                </div>
                <div className="billing-to-right">
                    <div className="billing-row">
                        <span className="billing-label">Ph No</span>
                        <span className="billing-colon">:</span>
                        <span className="billing-value" style={{ borderBottom: '1px solid #000', minWidth: '100px' }}>&nbsp;</span>
                    </div>
                    <div className="billing-row">
                        <span className="billing-label">State</span>
                        <span className="billing-colon">:</span>
                        <span className="billing-value">{settings?.company?.state || 'Tamil Nadu'}</span>
                    </div>
                    <div className="billing-row">
                        <span className="billing-label">State Code</span>
                        <span className="billing-colon">:</span>
                        <span className="billing-value">{settings?.company?.stateCode || '33'}</span>
                    </div>
                </div>
            </div>

            {/* ITEMS TABLE */}
            <table className="items-table">
                <thead>
                    <tr>
                        <th style={{ width: '40px' }}>Sl.No</th>
                        <th style={{ width: '35%' }}>Description of Goods</th>
                        <th>HSN Code</th>
                        <th>No of Packs</th>
                        <th>Pcs</th>
                        <th>Rate per Piece</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {emptyRows.map((_, index) => (
                        <tr key={index}>
                            <td>{index + 1}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="totals-row">
                        <td colSpan="3" style={{ textAlign: 'left', paddingLeft: '10px', fontWeight: 'bold' }}>Total</td>
                        <td style={{ borderBottom: '1px solid #000' }}></td>
                        <td style={{ borderBottom: '1px solid #000' }}></td>
                        <td></td>
                        <td style={{ borderBottom: '1px solid #000' }}></td>
                    </tr>
                </tfoot>
            </table>

            {/* AMOUNT DETAILS SECTION */}
            <div className="amount-section">
                <div className="amount-words">
                    <div className="amount-in-words-label">Amount in Words:</div>
                    <div className="amount-in-words-value" style={{ borderBottom: '1px solid #000', minHeight: '20px' }}>&nbsp;</div>
                </div>
                <div className="amount-breakdown">
                    <div className="amount-row">
                        <span>Product Amount</span>
                        <span style={{ borderBottom: '1px solid #000', minWidth: '80px' }}>&nbsp;</span>
                    </div>
                    <div className="amount-row">
                        <span>Discount</span>
                        <span style={{ borderBottom: '1px solid #000', minWidth: '80px' }}>&nbsp;</span>
                    </div>
                    <div className="amount-row">
                        <span>Taxable Amount</span>
                        <span style={{ borderBottom: '1px solid #000', minWidth: '80px' }}>&nbsp;</span>
                    </div>
                    <div className="amount-row">
                        <span>CGST @ {settings?.tax?.cgstRate || 2.5}%</span>
                        <span style={{ borderBottom: '1px solid #000', minWidth: '80px' }}>&nbsp;</span>
                    </div>
                    <div className="amount-row">
                        <span>SGST @ {settings?.tax?.sgstRate || 2.5}%</span>
                        <span style={{ borderBottom: '1px solid #000', minWidth: '80px' }}>&nbsp;</span>
                    </div>
                    <div className="amount-row">
                        <span>Round Off</span>
                        <span style={{ borderBottom: '1px solid #000', minWidth: '80px' }}>&nbsp;</span>
                    </div>
                    <div className="amount-row total-row">
                        <span>Total Amount</span>
                        <span style={{ borderBottom: '2px solid #000', minWidth: '80px' }}>&nbsp;</span>
                    </div>
                </div>
            </div>

            {/* BANK DETAILS & SIGNATURES */}
            <div className="footer-section">
                <div className="bank-details">
                    <div className="bank-title">Bank Details</div>
                    <div>A/C No: {settings?.company?.bankAccount || '920020000914655'}</div>
                    <div>IFSC: {settings?.company?.bankIfsc || 'UTIB0001252'}</div>
                    <div>Bank: {settings?.company?.bankName || 'Axis Bank, Tirupur'}</div>
                </div>
                <div className="signature-section">
                    <div className="signature-label">For {settings?.company?.name || 'V.M.S GARMENTS'}</div>
                    <div className="signature-line"></div>
                    <div className="signature-title">Authorised Signatory</div>
                </div>
            </div>

            {/* TERMS */}
            <div className="terms-section">
                <div className="terms-title">Terms & Conditions:</div>
                <ol className="terms-list">
                    <li>Goods once sold will not be taken back.</li>
                    <li>Interest at 24% will be charged for overdue bills.</li>
                    <li>Subject to Tirupur jurisdiction.</li>
                </ol>
            </div>
        </div>
    );
};

export default EmptyBillTemplate;
