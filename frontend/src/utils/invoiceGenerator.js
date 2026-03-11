import jsPDF from 'jspdf';

// ==============================
// Helpers
// ==============================

/** Convert number to words – Indian format */
const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if (num === 0) return 'Zero';
    if (num < 0) return 'Minus ' + numberToWords(-num);
    num = Math.floor(num);
    let words = '';
    if (Math.floor(num / 10000000) > 0) { words += numberToWords(Math.floor(num / 10000000)) + ' Crore '; num %= 10000000; }
    if (Math.floor(num / 100000) > 0) { words += numberToWords(Math.floor(num / 100000)) + ' Lakh '; num %= 100000; }
    if (Math.floor(num / 1000) > 0) { words += numberToWords(Math.floor(num / 1000)) + ' Thousand '; num %= 1000; }
    if (Math.floor(num / 100) > 0) { words += numberToWords(Math.floor(num / 100)) + ' Hundred '; num %= 100; }
    if (num > 0) {
        if (words !== '') words += 'and ';
        if (num < 20) words += ones[num];
        else { words += tens[Math.floor(num / 10)]; if (num % 10 > 0) words += ' ' + ones[num % 10]; }
    }
    return words.trim();
};

/** Format date as DD/MM/YYYY */
const fmtDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return `${dt.getDate().toString().padStart(2, '0')}/${(dt.getMonth() + 1).toString().padStart(2, '0')}/${dt.getFullYear()}`;
};

// Colors matching BillTemplate.css exactly
const BLUE = { r: 204, g: 0, b: 0 };   // #c00 (Red)
const BLACK = { r: 0, g: 0, b: 0 };
const RED = { r: 204, g: 0, b: 0 };       // #cc0000 (#c00)
const GRAY_TEXT = { r: 34, g: 34, b: 34 }; // #222
const GRAY_BORDER = { r: 51, g: 51, b: 51 }; // #333
const GRAY_LIGHT = { r: 85, g: 85, b: 85 }; // #555
const BANK_BG = { r: 255, g: 251, b: 230 }; // #fffbe6
const BANK_BORDER = { r: 212, g: 160, b: 23 }; // #d4a017

// Helper: set color
const setC = (pdf, c) => pdf.setTextColor(c.r, c.g, c.b);
const setD = (pdf, c) => pdf.setDrawColor(c.r, c.g, c.b);
const setF = (pdf, c) => pdf.setFillColor(c.r, c.g, c.b);

// ==============================
// Main generator — matches BillTemplate.css layout exactly
// The bill fits precisely on one A4 page.
// ==============================

export const generateInvoicePDF = (bill, settings = {}) => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Page dimensions
    const PW = 210;
    const PH = 297;
    const M = 8;       // 8mm margin (from CSS @page { margin: 8mm })
    const W = PW - M * 2; // content width
    const H = PH - M * 2; // content height

    // ---- Settings / defaults ----
    const co = settings?.company || {};
    const companyName = "V.M.S GARMENTS";
    const gstin = co.gstin || '33AZRPM4425F2ZA';
    const addr1 = co.address1 || '61C9, Anupparpalayam Puthur, Tirupur. 641652';
    const addr2 = co.address2 || '81 K, Madurai Road, SankerNager, Tirunelveli Dt. 627357';
    const state = co.state || 'Tamilnadu';
    const stateCode = co.stateCode || '33';
    const email = co.email || 'VMSgarments67@gmail.com';
    const phone = co.phone || '9080573831';

    const bk = settings?.bank || {};
    const bankName = bk.bankName || bk.name || 'SOUTH INDIAN BANK';
    const bankAcc = bk.accountNumber || bk.account || '0338073000002328';
    const bankBranch = bk.branchName || bk.branch || 'TIRUPUR';
    const bankIfsc = bk.ifscCode || bk.ifsc || 'SIBL0000338';
    const bankAccName = bk.accountHolderName || companyName;

    const cgstRate = settings?.tax?.cgstRate || 2.5;
    const sgstRate = settings?.tax?.sgstRate || 2.5;

    // ---- Bill data ----
    const items = bill.items || [];
    const productAmt = bill.subtotal || 0;
    const discount = bill.discountAmount || 0;
    const taxableAmt = productAmt - discount;
    const cgstAmt = (taxableAmt * cgstRate) / 100;
    const sgstAmt = (taxableAmt * sgstRate) / 100;
    const totalGst = cgstAmt + sgstAmt;
    const rawTotal = taxableAmt + totalGst;
    const roundOff = bill.roundOff || (Math.round(rawTotal) - rawTotal);
    const totalAmt = Math.round(rawTotal);
    const totalPacks = bill.totalPacks || items.reduce((s, i) => s + (i.noOfPacks || i.quantity || 0), 0) || 0;
    const numBundles = bill.numOfBundles || 1;

    // ===== Fixed section heights (mm) =====
    const row1H = 12;    // Company Name + GSTIN
    const row2H = 24;    // Address + Invoice Details
    const row3H = 8;     // TAX INVOICE title
    const row4H = 20;    // Buyer / Consignee
    const thH = 9;       // Table header
    const row6H = 32;    // Summary section
    const row7H = 34;    // Footer

    const fixedH = row1H + row2H + row3H + row4H + thH + row6H + row7H;
    const tableBodyH = H - fixedH;

    // Dynamic row height to fill remaining space
    const minRows = Math.max(items.length, 10);
    const rowH = tableBodyH / minRows;

    // ===== Outer border (2px solid #333) =====
    let y = M;
    setD(pdf, GRAY_BORDER);
    pdf.setLineWidth(0.6);
    pdf.rect(M, M, W, H, 'S');

    // Helpers
    const hLine = (yPos, lw = 0.5) => {
        setD(pdf, GRAY_BORDER);
        pdf.setLineWidth(lw);
        pdf.line(M, yPos, M + W, yPos);
    };
    const vLine = (x, y1, y2, lw = 0.5) => {
        setD(pdf, GRAY_BORDER);
        pdf.setLineWidth(lw);
        pdf.line(x, y1, x, y2);
    };

    const PX = 5; // horizontal padding in mm

    // =============================================
    // ROW 1: Company Name + GSTIN
    // =============================================
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    setC(pdf, BLUE);
    pdf.text(companyName.toUpperCase(), M + PX, y + 8);

    pdf.setFontSize(10);
    setC(pdf, BLACK);
    pdf.text(`GSTIN: ${gstin}`, M + W - PX, y + 8, { align: 'right' });

    y += row1H;
    hLine(y);

    // =============================================
    // ROW 2: Address (left) + Invoice Details (right)
    // Right panel = ~70mm (matching CSS 280px at 210mm)
    // =============================================
    const row2Top = y;
    const invDetW = 70;
    const addrW = W - invDetW;

    vLine(M + addrW, row2Top, row2Top + row2H);

    // Address
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    setC(pdf, GRAY_TEXT);
    const addrLines = [
        `OFF : ${addr1}`,
        `OFF : ${addr2}`,
        `State: ${state} (Code ${stateCode})`,
        `Email: ${email}`,
        `Mob: ${phone}`
    ];
    addrLines.forEach((l, i) => pdf.text(l, M + PX, row2Top + 4 + i * 3.8, { maxWidth: addrW - PX * 2 }));

    // Invoice details
    const detX = M + addrW + PX;
    const detLabelW = 26;
    let detY = row2Top + 4;
    const detRowH = 5;

    const drawDetailRow = (label, value) => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        setC(pdf, BLACK);
        pdf.text(label, detX, detY);
        pdf.text(':', detX + detLabelW, detY);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value || '', detX + detLabelW + 3, detY);
        detY += detRowH;
    };

    drawDetailRow('Invoice Number', bill.billNumber || '');
    drawDetailRow('Invoice Date', fmtDate(bill.date || bill.createdAt));
    drawDetailRow('From', bill.fromText || '');
    drawDetailRow('To', bill.toText || '');

    y += row2H;
    hLine(y);

    // =============================================
    // ROW 3: TAX INVOICE Title Bar
    // =============================================
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    setC(pdf, BLUE);
    const titleText = 'TAX INVOICE';
    pdf.text(titleText, M + W / 2, y + 5.5, { align: 'center' });
    // Underline
    const tw = pdf.getTextWidth(titleText);
    setD(pdf, BLUE);
    pdf.setLineWidth(0.3);
    pdf.line(M + W / 2 - tw / 2, y + 6.5, M + W / 2 + tw / 2, y + 6.5);

    y += row3H;
    hLine(y);

    // =============================================
    // ROW 4: Buyer / Consignee Section
    // Left (flex:1) | Right (280px → 70mm)
    // =============================================
    const row4Top = y;
    const buyerRightW = invDetW;
    const buyerLeftW = W - buyerRightW;

    vLine(M + buyerLeftW, row4Top, row4Top + row4H);

    // Left - Consignee Copy
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(6);
    setC(pdf, GRAY_LIGHT);
    pdf.text('Consignee Copy', M + PX, row4Top + 3);

    // Buyer fields
    const bFieldX = M + PX;
    const bLabelW = 22;
    let bFieldY = row4Top + 7;
    const bFieldRowH = 4.5;

    const drawBuyerField = (label, value) => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        setC(pdf, BLACK);
        pdf.text(label, bFieldX, bFieldY);
        pdf.text((value || '').toUpperCase(), bFieldX + bLabelW + 2, bFieldY, { maxWidth: buyerLeftW - PX * 2 - bLabelW - 2 });
        bFieldY += bFieldRowH;
    };

    drawBuyerField('BUYER:', bill.customer?.name || '');
    drawBuyerField('STATE:', bill.customer?.state || 'Tamilnadu');
    // Transport with normal weight value
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    setC(pdf, BLACK);
    pdf.text('TRANSPORT:', bFieldX, bFieldY);
    pdf.setFont('helvetica', 'normal');
    pdf.text((bill.transport || '').toUpperCase(), bFieldX + bLabelW + 2, bFieldY, { maxWidth: buyerLeftW - PX * 2 - bLabelW - 2 });

    // Right side
    const bRightX = M + buyerLeftW + PX;
    const bRLabelW = 14;
    let bRightY = row4Top + 7;
    const bRRowH = 4.5;

    const drawBuyerRight = (label, value) => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        setC(pdf, BLACK);
        pdf.text(label, bRightX, bRightY);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value || '', bRightX + bRLabelW, bRightY);
        bRightY += bRRowH;
    };

    drawBuyerRight('MOB:', bill.customer?.phone || '');
    drawBuyerRight('GSTIN:', bill.customer?.gstin || '');
    drawBuyerRight('CODE:', bill.customer?.stateCode || '33');

    y += row4H;
    hLine(y);

    // =============================================
    // ROW 5: Items Table (fills remaining A4 space)
    // Column widths: 5%, 18%, 9%, 10%, 10%, 8%, 11%, 9%, rest
    // =============================================
    const colPct = [0.05, 0.18, 0.09, 0.10, 0.10, 0.08, 0.11, 0.09];
    const colSum = colPct.reduce((a, b) => a + b, 0);
    colPct.push(1 - colSum);
    const colW = colPct.map(p => W * p);

    const headers = ['S.No', 'Product', 'HSN\nCode', 'Sizes/\nPieces', 'Rate Per\nPiece', 'Pcs in\nPack', 'Rate Per\nPack', 'No Of\nPacks', 'Amount\nRs.'];

    // Table header
    let tY = y;
    let tX = M;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    setC(pdf, BLACK);
    setD(pdf, GRAY_BORDER);
    pdf.setLineWidth(0.3);

    for (let i = 0; i < 9; i++) {
        pdf.rect(tX, tY, colW[i], thH, 'S');
        const lines = headers[i].split('\n');
        const lineH = 3;
        const startY = tY + (thH - lines.length * lineH) / 2 + lineH - 0.5;
        lines.forEach((line, li) => {
            pdf.text(line, tX + colW[i] / 2, startY + li * lineH, { align: 'center' });
        });
        tX += colW[i];
    }
    tY += thH;

    // Data rows — dynamically sized
    for (let r = 0; r < minRows; r++) {
        tX = M;
        const item = items[r];

        setD(pdf, GRAY_BORDER);
        pdf.setLineWidth(0.3);

        for (let c = 0; c < 9; c++) {
            // Left border
            pdf.line(tX, tY, tX, tY + rowH);
            // Right border on last column
            if (c === 8) pdf.line(tX + colW[c], tY, tX + colW[c], tY + rowH);

            if (item) {
                const rpp = item.ratePerPack || item.price || 0;
                const nop = item.noOfPacks || item.quantity || 0;
                const amt = item.total || (rpp * nop);

                let cellText = '';
                let align = 'center';

                switch (c) {
                    case 0: cellText = `${r + 1}`; break;
                    case 1: cellText = item.productName || item.name || ''; align = 'left'; break;
                    case 2: cellText = String(item.hsnCode || item.hsn || ''); break;
                    case 3: cellText = String(item.sizesOrPieces || ''); break;
                    case 4: cellText = item.ratePerPiece ? `${item.ratePerPiece}` : ''; break;
                    case 5: cellText = item.pcsInPack ? `${item.pcsInPack}` : ''; break;
                    case 6: cellText = `${rpp}`; break;
                    case 7: cellText = `${nop}`; break;
                    case 8: cellText = `${amt}`; break;
                }

                if (cellText) {
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(7);
                    setC(pdf, BLACK);
                    const txtX = align === 'left' ? tX + 2 : tX + colW[c] / 2;
                    pdf.text(cellText, txtX, tY + rowH / 2 + 1, { align, maxWidth: colW[c] - 3 });
                }
            }

            tX += colW[c];
        }
        tY += rowH;
    }

    // Bottom border of last row
    y = tY;
    hLine(y, 0.6);

    // =============================================
    // ROW 6: Summary (3-column, flex 1.2:0.8:1)
    // =============================================
    const sumTotalFlex = 3.0;
    const sumLeftW = W * (1.2 / sumTotalFlex);
    const sumMidW = W * (0.8 / sumTotalFlex);
    const sumRightW = W * (1.0 / sumTotalFlex);

    vLine(M + sumLeftW, y, y + row6H);
    vLine(M + sumLeftW + sumMidW, y, y + row6H);

    // Left column: Total Packs / Bill Amount / In Words
    const sLX = M + PX;
    let sLY = y + 4;
    const sLabelW = 22;
    const sRowGap = 5;

    const drawSummaryField = (label, value, isWords = false) => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(isWords ? 6.5 : 7.5);
        setC(pdf, BLACK);
        pdf.text(label, sLX, sLY);
        pdf.text(':', sLX + sLabelW, sLY);
        pdf.text(value, sLX + sLabelW + 3, sLY, { maxWidth: sumLeftW - PX * 2 - sLabelW - 5 });
        sLY += sRowGap;
    };

    drawSummaryField('Total Packs', `${totalPacks}`);
    drawSummaryField('Bill Amount', `${totalAmt}`);
    drawSummaryField('In words', `Rupees ${numberToWords(totalAmt)} Only`, true);

    // Middle column: Bundles + GST Box
    const sMX = M + sumLeftW + 4;
    const sMW = sumMidW - 8;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    setC(pdf, BLACK);
    pdf.text('NUM OF BUNDLES :', sMX, y + 5);
    pdf.setFontSize(9);
    pdf.text(`${numBundles}`, sMX + sMW, y + 5, { align: 'right' });

    // GST Box: border 2px solid #c00
    const gstBoxY = y + row6H - 12;
    const gstBoxH = 9;
    setD(pdf, RED);
    pdf.setLineWidth(0.6);
    pdf.rect(sMX, gstBoxY, sMW, gstBoxH, 'S');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    setC(pdf, RED);
    pdf.text('TOTAL GST', sMX + 3, gstBoxY + 6);
    pdf.setFontSize(10);
    pdf.text(`${totalGst.toFixed(0)}`, sMX + sMW - 3, gstBoxY + 6, { align: 'right' });

    // Right column: Tax breakdown
    const sRX = M + sumLeftW + sumMidW + PX;
    const sRW = sumRightW - PX * 2;
    const taxFontSize = 7.5;
    const taxRowH = 3.8;
    let txY = y + 3;

    const drawTaxRow = (label, value, isHighlight = false, isTotal = false) => {
        if (isTotal) {
            txY += 1;
            setD(pdf, BLACK);
            pdf.setLineWidth(0.4);
            pdf.line(sRX - 1, txY, sRX + sRW + 1, txY);
            txY += 1.5;
        }

        const color = isHighlight ? RED : BLACK;
        const fontSize = isTotal ? 8.5 : taxFontSize;

        pdf.setFont('helvetica', (isHighlight || isTotal) ? 'bold' : 'normal');
        pdf.setFontSize(fontSize);
        setC(pdf, color);
        pdf.text(label, sRX, txY);
        pdf.setFont('helvetica', 'bold');
        pdf.text(value, sRX + sRW, txY, { align: 'right' });
        txY += taxRowH;
    };

    drawTaxRow('Product Amt', productAmt.toFixed(2));
    drawTaxRow('Discount', discount.toFixed(0));
    drawTaxRow('Taxable Amt', taxableAmt.toFixed(2));
    drawTaxRow(`CGST @ ${cgstRate}%`, cgstAmt.toFixed(2), true);
    drawTaxRow(`SGST @ ${sgstRate}%`, sgstAmt.toFixed(2), true);
    drawTaxRow('Round Off', roundOff.toFixed(2));
    drawTaxRow('Total Amt', `${totalAmt}`, false, true);

    y += row6H;
    hLine(y, 0.5);

    // =============================================
    // ROW 7: Footer (Terms + Bank | Certification)
    // flex 1.2 : 1
    // =============================================
    const footFlex = 2.2;
    const footLeftW = W * (1.2 / footFlex);
    const footRightW = W * (1.0 / footFlex);

    vLine(M + footLeftW, y, y + row7H);

    // Left: Terms
    const fLX = M + PX;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    setC(pdf, BLUE);
    pdf.text('Terms And Conditions', fLX, y + 4);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5.5);
    setC(pdf, GRAY_BORDER);
    const termsLines = [
        'Subject to Tirupur Jurisdiction.',
        'Payment by Cheque/DD only, payable at Tirupur.',
        `Cheques made in favour of ${companyName} to be sent to Tirunelveli Address`,
        'All disputes are subjected to Tirunelveli Jurisdiction'
    ];
    termsLines.forEach((t, i) => pdf.text(t, fLX, y + 7.5 + i * 2.8, { maxWidth: footLeftW - PX * 2 }));

    // Bank box: yellow background, gold border
    const bankBoxY = y + 20;
    const bankBoxW = footLeftW - PX * 2;
    const bankBoxH = 12;

    setF(pdf, BANK_BG);
    pdf.rect(fLX, bankBoxY, bankBoxW, bankBoxH, 'F');
    setD(pdf, BANK_BORDER);
    pdf.setLineWidth(0.5);
    pdf.rect(fLX, bankBoxY, bankBoxW, bankBoxH, 'S');

    // Bank title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    setC(pdf, RED);
    pdf.text('Bank Details:', fLX + 3, bankBoxY + 3.5);

    // Bank info
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6);
    setC(pdf, BLUE);
    pdf.text(`ACC NAME: ${bankAccName}    BANK: ${bankName}`, fLX + 3, bankBoxY + 7, { maxWidth: bankBoxW - 6 });
    pdf.text(`ACC NUM: ${bankAcc}    BRANCH: ${bankBranch}    IFSC: ${bankIfsc}`, fLX + 3, bankBoxY + 10, { maxWidth: bankBoxW - 6 });

    // Right: Certification + Signature
    const fRX = M + footLeftW + PX;
    const fRW = footRightW - PX * 2;
    const fRCenterX = M + footLeftW + footRightW / 2;

    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(7.5);
    setC(pdf, GRAY_BORDER);
    pdf.text('Certified that above particulars are true', fRCenterX, y + 10, { align: 'center' });
    pdf.text('and correct', fRCenterX, y + 13.5, { align: 'center' });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    setC(pdf, BLUE);
    pdf.text(`For ${companyName}`, fRCenterX, y + 25, { align: 'center' });

    return pdf;
};

// ==============================
// Export helpers
// ==============================

/** Download Tax Invoice PDF */
export const downloadInvoicePDF = (bill, settings, filename) => {
    const fn = filename || `VMS_GARMENTS_Invoice_${bill.billNumber || 'bill'}.pdf`;
    const pdf = generateInvoicePDF(bill, settings);
    pdf.save(fn);
    return pdf;
};

/** Get invoice PDF as blob URL for preview */
export const getInvoicePreviewUrl = (bill, settings) => {
    const pdf = generateInvoicePDF(bill, settings);
    return URL.createObjectURL(pdf.output('blob'));
};

/** Get invoice PDF as base64 data URL */
export const getInvoiceDataUrl = (bill, settings) => {
    const pdf = generateInvoicePDF(bill, settings);
    return pdf.output('datauristring');
};

export { numberToWords };

export default {
    generateInvoicePDF,
    downloadInvoicePDF,
    getInvoicePreviewUrl,
    getInvoiceDataUrl,
    numberToWords
};
