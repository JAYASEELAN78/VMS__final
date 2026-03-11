import './BillTemplate.css';

// Convert number to words in Indian format
const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (num === 0) return 'Zero';
    if (num < 0) return 'Minus ' + numberToWords(-num);

    num = Math.floor(num);
    let words = '';

    if (Math.floor(num / 10000000) > 0) {
        words += numberToWords(Math.floor(num / 10000000)) + ' Crore ';
        num %= 10000000;
    }
    if (Math.floor(num / 100000) > 0) {
        words += numberToWords(Math.floor(num / 100000)) + ' Lakh ';
        num %= 100000;
    }
    if (Math.floor(num / 1000) > 0) {
        words += numberToWords(Math.floor(num / 1000)) + ' Thousand ';
        num %= 1000;
    }
    if (Math.floor(num / 100) > 0) {
        words += numberToWords(Math.floor(num / 100)) + ' Hundred ';
        num %= 100;
    }
    if (num > 0) {
        if (words !== '') words += 'and ';
        if (num < 20) words += ones[num];
        else {
            words += tens[Math.floor(num / 10)];
            if (num % 10 > 0) words += ' ' + ones[num % 10];
        }
    }
    return words.trim();
};

const BillTemplate = ({ bill, settings, forPrint = false }) => {
    if (!bill || !settings) return null;

    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Calculate totals
    const productAmt = bill.subtotal || 0;
    const discount = bill.discountAmount || 0;
    const taxableAmt = productAmt - discount;
    const cgstRate = settings?.tax?.cgstRate || 2.5;
    const sgstRate = settings?.tax?.sgstRate || 2.5;
    const cgstAmt = (taxableAmt * cgstRate) / 100;
    const sgstAmt = (taxableAmt * sgstRate) / 100;
    const totalGst = cgstAmt + sgstAmt;
    const rawTotal = taxableAmt + totalGst;
    const roundOff = bill.roundOff || (Math.round(rawTotal) - rawTotal);
    const totalAmt = Math.round(rawTotal);
    const totalPacks = bill.totalPacks || bill.items?.reduce((sum, item) => sum + (item.noOfPacks || item.quantity || 0), 0) || 0;
    const numBundles = bill.numOfBundles || 1;

    // Company details
    const companyName = settings?.company?.name || 'V.M.S GARMENTS';
    const companyGstin = settings?.company?.gstin || '33AZRPM4425F2ZA';
    const companyAddress1 = settings?.company?.address1 || 'OFF : 61C9, Anupparpalayam Puthur, Tirupur. 641652';
    const companyAddress2 = settings?.company?.address2 || 'OFF : B1 K, Madurai Raod, SankerNager, Tirunelveli Dt. 627357';
    const companyState = settings?.company?.state || 'Tamilnadu';
    const companyStateCode = settings?.company?.stateCode || '33';
    const companyEmail = settings?.company?.email || 'vmsgarments67@gmail.com';
    const companyPhone = settings?.company?.phone || '9080573831';
    const companyMob = settings?.company?.mob || '8248893759';

    // Bank details
    const bankName = settings?.bank?.name || 'South Indian Bank';
    const bankAccount = settings?.bank?.account || '0338073000002328';
    const bankBranch = settings?.bank?.branch || 'TIRUPUR';
    const bankIfsc = settings?.bank?.ifsc || 'SIBL0000338';

    // Empty rows to fill the table to a minimum height
    const minRows = 10;
    const items = bill.items || [];
    const emptyRowsCount = Math.max(0, minRows - items.length);

    return (
        <div className={`bill-template-tax ${forPrint ? 'for-print' : ''}`} id="bill-template">
            <div className="tax-invoice-page">

                {/* ===== ROW 1: Company Name + GSTIN ===== */}
                <div className="ti-header-row">
                    <div className="ti-company-name">{companyName}</div>
                    <div className="ti-gstin-header">GSTIN: {companyGstin}</div>
                </div>

                {/* ===== ROW 2: Company Address + Invoice Details ===== */}
                <div className="ti-info-row">
                    <div className="ti-company-address">
                        <div>{companyAddress1}</div>
                        <div>{companyAddress2}</div>
                        <div>State: {companyState} (Code {companyStateCode})</div>
                        <div>Email: {companyEmail}</div>
                        <div>Mob: {companyPhone}</div>
                    </div>
                    <div className="ti-invoice-details">
                        <div className="ti-detail-row">
                            <span className="ti-detail-label">Invoice Number</span>
                            <span className="ti-detail-sep">:</span>
                            <span className="ti-detail-value">{bill.billNumber || ''}</span>
                        </div>
                        <div className="ti-detail-row">
                            <span className="ti-detail-label">Invoice Date</span>
                            <span className="ti-detail-sep">:</span>
                            <span className="ti-detail-value">{formatDate(bill.date || bill.createdAt)}</span>
                        </div>
                        <div className="ti-detail-row">
                            <span className="ti-detail-label">From</span>
                            <span className="ti-detail-sep">:</span>
                            <span className="ti-detail-value">{bill.fromText || bill.fromDate || ''}</span>
                        </div>
                        <div className="ti-detail-row">
                            <span className="ti-detail-label">To</span>
                            <span className="ti-detail-sep">:</span>
                            <span className="ti-detail-value">{bill.toText || bill.toDate || ''}</span>
                        </div>
                    </div>
                </div>

                {/* ===== ROW 3: TAX INVOICE Title ===== */}
                <div className="ti-title-row">
                    <span className="ti-title-text">
                        {bill.billType === 'SALES' ? 'GST TAX INVOICE - SALES' :
                            bill.billType === 'PURCHASE' ? 'GST PURCHASE BILL' :
                                'TAX INVOICE'}
                    </span>
                </div>

                {/* ===== ROW 4: Consignee / Buyer Details ===== */}
                <div className="ti-buyer-row">
                    <div className="ti-buyer-left">
                        <div className="ti-buyer-heading">{bill.billType === 'PURCHASE' ? 'Supplier Copy' : 'Consignee Copy'}</div>
                        <div className="ti-buyer-field">
                            <span className="ti-buyer-label">{bill.billType === 'PURCHASE' ? 'SUPPLIER:' : 'BUYER:'}</span>
                            <span className="ti-buyer-value">{bill.customer?.name || ''}</span>
                        </div>
                        <div className="ti-buyer-field">
                            <span className="ti-buyer-label">STATE:</span>
                            <span className="ti-buyer-value">{bill.customer?.state || 'Tamilnadu'}</span>
                        </div>
                        <div className="ti-buyer-field">
                            <span className="ti-buyer-label">TRANSPORT:</span>
                            <span className="ti-buyer-value">{bill.transport || ''}</span>
                        </div>
                    </div>
                    <div className="ti-buyer-right">
                        <div className="ti-detail-row">
                            <span className="ti-detail-label">MOB:</span>
                            <span className="ti-detail-sep"></span>
                            <span className="ti-detail-value">{bill.customer?.phone || companyMob}</span>
                        </div>
                        <div className="ti-detail-row">
                            <span className="ti-detail-label">GSTIN:</span>
                            <span className="ti-detail-sep"></span>
                            <span className="ti-detail-value">{bill.customer?.gstin || ''}</span>
                        </div>
                        <div className="ti-detail-row">
                            <span className="ti-detail-label">CODE:</span>
                            <span className="ti-detail-sep"></span>
                            <span className="ti-detail-value">{bill.customer?.stateCode || '33'}</span>
                        </div>
                    </div>
                </div>

                {/* ===== ROW 5: Items Table ===== */}
                <table className="ti-items-table">
                    <thead>
                        <tr>
                            <th className="ti-col-sno">S.No</th>
                            <th className="ti-col-product">Product</th>
                            <th className="ti-col-hsn">HSN<br />Code</th>
                            <th className="ti-col-sizes">Sizes/<br />Pieces</th>
                            <th className="ti-col-ratepc">Rate Per<br />Piece</th>
                            <th className="ti-col-pcsinpk">Pcs in<br />Pack</th>
                            <th className="ti-col-ratepk">Rate Per<br />Pack</th>
                            <th className="ti-col-nopacks">No Of<br />Packs</th>
                            <th className="ti-col-amount">Amount<br />Rs.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => {
                            const ratePerPack = item.ratePerPack || item.price || 0;
                            const noOfPacks = item.noOfPacks || item.quantity || 0;
                            const amount = item.total || (ratePerPack * noOfPacks);
                            return (
                                <tr key={index}>
                                    <td className="ti-col-sno">{index + 1}</td>
                                    <td className="ti-col-product ti-text-left">{item.productName || item.name || ''}</td>
                                    <td className="ti-col-hsn">{item.hsnCode || item.hsn || ''}</td>
                                    <td className="ti-col-sizes">{item.sizesOrPieces || ''}</td>
                                    <td className="ti-col-ratepc">{item.ratePerPiece || ''}</td>
                                    <td className="ti-col-pcsinpk">{item.pcsInPack || ''}</td>
                                    <td className="ti-col-ratepk">{ratePerPack}</td>
                                    <td className="ti-col-nopacks">{noOfPacks}</td>
                                    <td className="ti-col-amount">{amount}</td>
                                </tr>
                            );
                        })}
                        {/* Empty rows to fill space */}
                        {Array.from({ length: emptyRowsCount }).map((_, i) => (
                            <tr key={`empty-${i}`} className="ti-empty-row">
                                <td className="ti-col-sno">&nbsp;</td>
                                <td className="ti-col-product">&nbsp;</td>
                                <td className="ti-col-hsn">&nbsp;</td>
                                <td className="ti-col-sizes">&nbsp;</td>
                                <td className="ti-col-ratepc">&nbsp;</td>
                                <td className="ti-col-pcsinpk">&nbsp;</td>
                                <td className="ti-col-ratepk">&nbsp;</td>
                                <td className="ti-col-nopacks">&nbsp;</td>
                                <td className="ti-col-amount">&nbsp;</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* ===== ROW 6: Summary Section ===== */}
                <div className="ti-summary-row">
                    {/* Left: Total Packs, Bill Amount, In Words */}
                    <div className="ti-summary-left">
                        <div className="ti-summary-field">
                            <span className="ti-summary-label">Total Packs</span>
                            <span className="ti-summary-sep">:</span>
                            <span className="ti-summary-value">{totalPacks}</span>
                        </div>
                        <div className="ti-summary-field">
                            <span className="ti-summary-label">Bill Amount</span>
                            <span className="ti-summary-sep">:</span>
                            <span className="ti-summary-value">{totalAmt}</span>
                        </div>
                        <div className="ti-summary-field">
                            <span className="ti-summary-label">In words</span>
                            <span className="ti-summary-sep">:</span>
                            <span className="ti-summary-value ti-words">Rupees {numberToWords(totalAmt)} Only</span>
                        </div>
                    </div>

                    {/* Middle: Num of Bundles + Total GST */}
                    <div className="ti-summary-middle">
                        <div className="ti-bundles-box">
                            <span className="ti-bundles-label">NUM OF BUNDLES :</span>
                            <span className="ti-bundles-value">{numBundles}</span>
                        </div>
                        <div className="ti-gst-box">
                            <span className="ti-gst-label">TOTAL GST</span>
                            <span className="ti-gst-value">{totalGst.toFixed(0)}</span>
                        </div>
                    </div>

                    {/* Right: Tax Breakdown */}
                    <div className="ti-summary-right">
                        <div className="ti-tax-row">
                            <span>Product Amt</span>
                            <span>{productAmt.toFixed(2)}</span>
                        </div>
                        <div className="ti-tax-row">
                            <span>Discount</span>
                            <span>{discount.toFixed(0)}</span>
                        </div>
                        <div className="ti-tax-row">
                            <span>Taxable Amt</span>
                            <span>{taxableAmt.toFixed(2)}</span>
                        </div>
                        <div className="ti-tax-row ti-tax-highlight">
                            <span>CGST @ {cgstRate}%</span>
                            <span>{cgstAmt.toFixed(2)}</span>
                        </div>
                        <div className="ti-tax-row ti-tax-highlight">
                            <span>SGST @ {sgstRate}%</span>
                            <span>{sgstAmt.toFixed(2)}</span>
                        </div>
                        <div className="ti-tax-row">
                            <span>Round Off</span>
                            <span>{roundOff.toFixed(2)}</span>
                        </div>
                        <div className="ti-tax-row ti-tax-total">
                            <span>Total Amt</span>
                            <span>{totalAmt}</span>
                        </div>
                    </div>
                </div>

                {/* ===== ROW 7: Footer - Terms, Bank, Certification ===== */}
                <div className="ti-footer-row">
                    <div className="ti-footer-left">
                        <div className="ti-terms-title">Terms And Conditions</div>
                        <div className="ti-terms-text">
                            Subject to Tirupur Jurisdiction.<br />
                            Payment by Cheque/DD only, payable at Tirupur.<br />
                            Cheques made in favour of {companyName} to be sent to Tirunelveli Address All disputes are subjected to Tirunelveli Jurisdiction
                        </div>
                        <div className="ti-bank-box">
                            <div className="ti-bank-title">Bank Details:</div>
                            <div className="ti-bank-info">
                                {bankName}, Account: {bankAccount}<br />
                                Branch: {bankBranch}, IFSC: {bankIfsc}
                            </div>
                        </div>
                    </div>
                    <div className="ti-footer-right">
                        <div className="ti-certified">
                            Certified that above particulars are true<br />and correct
                        </div>
                        <div className="ti-signature">
                            For {companyName}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BillTemplate;
