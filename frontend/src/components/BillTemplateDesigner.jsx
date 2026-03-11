import { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, Type, Columns, Layout } from 'lucide-react';

const BillTemplateDesigner = ({ formData, setFormData }) => {
    const [expandedSections, setExpandedSections] = useState({
        invoiceLabels: true,
        buyerLabels: false,
        tableColumns: false,
        footerLabels: false,
        bankLabels: false,
        visibility: false
    });

    // Default bill template structure
    const defaultBillTemplate = {
        labels: {
            invoiceNumber: 'INVOICE NUMBER',
            invoiceDate: 'INVOICE DATE',
            from: 'FROM',
            to: 'TO',
            buyer: 'BUYER',
            gstin: 'GSTIN',
            state: 'STATE',
            transport: 'TRANSPORT',
            mob: 'MOB',
            code: 'CODE',
            sno: 'S.No',
            product: 'Product',
            hsnCode: 'HSN CODE',
            sizesPieces: 'Sizes/Pieces',
            ratePerPiece: 'Rate Per Piece',
            pcsInPack: 'Pcs in Pack',
            ratePerPack: 'Rate Per Pack',
            noOfPacks: 'No Of Packs',
            amount: 'Amount Rs',
            totalPacks: 'Total Packs',
            billAmount: 'Bill Amount',
            inWords: 'In words',
            numOfBundles: 'NUM OF BUNDLES',
            totalGst: 'TOTAL GST',
            productAmt: 'Product Amt',
            discount: 'Discount',
            taxableAmt: 'Taxable Amt',
            roundOff: 'Round Off',
            totalAmt: 'Total Amt',
            accName: 'ACC NAME',
            bank: 'BANK',
            accNum: 'ACC NUM',
            branch: 'BRANCH',
            ifsc: 'IFSC'
        },
        columns: {
            sno: true,
            product: true,
            hsnCode: true,
            sizesPieces: true,
            ratePerPiece: true,
            pcsInPack: true,
            ratePerPack: true,
            noOfPacks: true,
            amount: true
        },
        sections: {
            fromToDate: true,
            transport: true,
            consignerCopy: true,
            numOfBundles: true,
            bankDetails: true,
            termsConditions: true
        },
        itemRowCount: 15
    };

    const billTemplate = formData.billTemplate || defaultBillTemplate;

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const updateLabel = (key, value) => {
        setFormData({
            ...formData,
            billTemplate: {
                ...billTemplate,
                labels: {
                    ...billTemplate.labels,
                    [key]: value
                }
            }
        });
    };

    const updateColumn = (key, value) => {
        setFormData({
            ...formData,
            billTemplate: {
                ...billTemplate,
                columns: {
                    ...billTemplate.columns,
                    [key]: value
                }
            }
        });
    };

    const updateSection = (key, value) => {
        setFormData({
            ...formData,
            billTemplate: {
                ...billTemplate,
                sections: {
                    ...billTemplate.sections,
                    [key]: value
                }
            }
        });
    };

    const updateItemRowCount = (value) => {
        setFormData({
            ...formData,
            billTemplate: {
                ...billTemplate,
                itemRowCount: parseInt(value) || 15
            }
        });
    };

    const AccordionHeader = ({ title, icon: Icon, section }) => (
        <button
            type="button"
            onClick={() => toggleSection(section)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
            <div className="flex items-center gap-2">
                <Icon size={18} className="text-blue-600" />
                <span className="font-medium text-gray-900">{title}</span>
            </div>
            {expandedSections[section] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
    );

    const LabelInput = ({ label, labelKey, description }) => (
        <div className="flex items-center gap-3 py-2">
            <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">{description}</label>
            </div>
            <input
                type="text"
                value={billTemplate.labels?.[labelKey] || label}
                onChange={(e) => updateLabel(labelKey, e.target.value)}
                className="form-input w-48 text-sm"
            />
        </div>
    );

    const ToggleSwitch = ({ label, checked, onChange }) => (
        <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Bill Template Designer</h3>
            <p className="text-sm text-gray-600">Customize labels, toggle columns, and configure your bill structure.</p>

            <div className="space-y-3">
                {/* Invoice Labels Section */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <AccordionHeader title="Invoice & Header Labels" icon={Type} section="invoiceLabels" />
                    {expandedSections.invoiceLabels && (
                        <div className="p-4 space-y-2 border-t">
                            <LabelInput labelKey="invoiceNumber" label="INVOICE NUMBER" description="Invoice Number Label" />
                            <LabelInput labelKey="invoiceDate" label="INVOICE DATE" description="Invoice Date Label" />
                            <LabelInput labelKey="from" label="FROM" description="From Date Label" />
                            <LabelInput labelKey="to" label="TO" description="To Date Label" />
                        </div>
                    )}
                </div>

                {/* Buyer Labels Section */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <AccordionHeader title="Buyer Section Labels" icon={Type} section="buyerLabels" />
                    {expandedSections.buyerLabels && (
                        <div className="p-4 space-y-2 border-t">
                            <LabelInput labelKey="buyer" label="BUYER" description="Buyer Label" />
                            <LabelInput labelKey="gstin" label="GSTIN" description="GSTIN Label" />
                            <LabelInput labelKey="state" label="STATE" description="State Label" />
                            <LabelInput labelKey="transport" label="TRANSPORT" description="Transport Label" />
                            <LabelInput labelKey="mob" label="MOB" description="Mobile Label" />
                            <LabelInput labelKey="code" label="CODE" description="State Code Label" />
                        </div>
                    )}
                </div>

                {/* Table Columns Section */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <AccordionHeader title="Table Column Settings" icon={Columns} section="tableColumns" />
                    {expandedSections.tableColumns && (
                        <div className="p-4 border-t">
                            <p className="text-xs text-gray-500 mb-3">Toggle visibility and customize column names</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm text-gray-900 flex items-center gap-2"><Eye size={14} /> Show/Hide</h4>
                                    <ToggleSwitch label="S.No" checked={billTemplate.columns?.sno !== false} onChange={(v) => updateColumn('sno', v)} />
                                    <ToggleSwitch label="Product" checked={billTemplate.columns?.product !== false} onChange={(v) => updateColumn('product', v)} />
                                    <ToggleSwitch label="HSN Code" checked={billTemplate.columns?.hsnCode !== false} onChange={(v) => updateColumn('hsnCode', v)} />
                                    <ToggleSwitch label="Sizes/Pieces" checked={billTemplate.columns?.sizesPieces !== false} onChange={(v) => updateColumn('sizesPieces', v)} />
                                    <ToggleSwitch label="Rate Per Piece" checked={billTemplate.columns?.ratePerPiece !== false} onChange={(v) => updateColumn('ratePerPiece', v)} />
                                    <ToggleSwitch label="Pcs in Pack" checked={billTemplate.columns?.pcsInPack !== false} onChange={(v) => updateColumn('pcsInPack', v)} />
                                    <ToggleSwitch label="Rate Per Pack" checked={billTemplate.columns?.ratePerPack !== false} onChange={(v) => updateColumn('ratePerPack', v)} />
                                    <ToggleSwitch label="No Of Packs" checked={billTemplate.columns?.noOfPacks !== false} onChange={(v) => updateColumn('noOfPacks', v)} />
                                    <ToggleSwitch label="Amount" checked={billTemplate.columns?.amount !== false} onChange={(v) => updateColumn('amount', v)} />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm text-gray-900 flex items-center gap-2"><Type size={14} /> Column Names</h4>
                                    <LabelInput labelKey="sno" label="S.No" description="" />
                                    <LabelInput labelKey="product" label="Product" description="" />
                                    <LabelInput labelKey="hsnCode" label="HSN CODE" description="" />
                                    <LabelInput labelKey="sizesPieces" label="Sizes/Pieces" description="" />
                                    <LabelInput labelKey="ratePerPiece" label="Rate Per Piece" description="" />
                                    <LabelInput labelKey="pcsInPack" label="Pcs in Pack" description="" />
                                    <LabelInput labelKey="ratePerPack" label="Rate Per Pack" description="" />
                                    <LabelInput labelKey="noOfPacks" label="No Of Packs" description="" />
                                    <LabelInput labelKey="amount" label="Amount Rs" description="" />
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t">
                                <label className="text-sm font-medium text-gray-700">Number of Item Rows</label>
                                <input
                                    type="number"
                                    min="5"
                                    max="30"
                                    value={billTemplate.itemRowCount || 15}
                                    onChange={(e) => updateItemRowCount(e.target.value)}
                                    className="form-input w-24 ml-3"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Labels Section */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <AccordionHeader title="Footer & Summary Labels" icon={Type} section="footerLabels" />
                    {expandedSections.footerLabels && (
                        <div className="p-4 space-y-2 border-t">
                            <LabelInput labelKey="totalPacks" label="Total Packs" description="Total Packs Label" />
                            <LabelInput labelKey="billAmount" label="Bill Amount" description="Bill Amount Label" />
                            <LabelInput labelKey="inWords" label="In words" description="Amount in Words Label" />
                            <LabelInput labelKey="numOfBundles" label="NUM OF BUNDLES" description="Bundles Label" />
                            <LabelInput labelKey="totalGst" label="TOTAL GST" description="Total GST Label" />
                            <LabelInput labelKey="productAmt" label="Product Amt" description="Product Amount Label" />
                            <LabelInput labelKey="discount" label="Discount" description="Discount Label" />
                            <LabelInput labelKey="taxableAmt" label="Taxable Amt" description="Taxable Amount Label" />
                            <LabelInput labelKey="roundOff" label="Round Off" description="Round Off Label" />
                            <LabelInput labelKey="totalAmt" label="Total Amt" description="Total Amount Label" />
                        </div>
                    )}
                </div>

                {/* Bank Labels Section */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <AccordionHeader title="Bank Details Labels" icon={Type} section="bankLabels" />
                    {expandedSections.bankLabels && (
                        <div className="p-4 space-y-2 border-t">
                            <LabelInput labelKey="accName" label="ACC NAME" description="Account Name Label" />
                            <LabelInput labelKey="bank" label="BANK" description="Bank Label" />
                            <LabelInput labelKey="accNum" label="ACC NUM" description="Account Number Label" />
                            <LabelInput labelKey="branch" label="BRANCH" description="Branch Label" />
                            <LabelInput labelKey="ifsc" label="IFSC" description="IFSC Label" />
                        </div>
                    )}
                </div>

                {/* Section Visibility */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <AccordionHeader title="Section Visibility" icon={Layout} section="visibility" />
                    {expandedSections.visibility && (
                        <div className="p-4 space-y-2 border-t">
                            <p className="text-xs text-gray-500 mb-3">Toggle sections on/off in your bill</p>
                            <ToggleSwitch label="From/To Date Fields" checked={billTemplate.sections?.fromToDate !== false} onChange={(v) => updateSection('fromToDate', v)} />
                            <ToggleSwitch label="Transport Field" checked={billTemplate.sections?.transport !== false} onChange={(v) => updateSection('transport', v)} />
                            <ToggleSwitch label="Consigner Copy Text" checked={billTemplate.sections?.consignerCopy !== false} onChange={(v) => updateSection('consignerCopy', v)} />
                            <ToggleSwitch label="Number of Bundles" checked={billTemplate.sections?.numOfBundles !== false} onChange={(v) => updateSection('numOfBundles', v)} />
                            <ToggleSwitch label="Bank Details Section" checked={billTemplate.sections?.bankDetails !== false} onChange={(v) => updateSection('bankDetails', v)} />
                            <ToggleSwitch label="Terms & Conditions" checked={billTemplate.sections?.termsConditions !== false} onChange={(v) => updateSection('termsConditions', v)} />
                        </div>
                    )}
                </div>

                {/* Terms and Footer */}
                <div className="border border-gray-200 rounded-lg overflow-hidden p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Terms & Footer Content</h4>
                    <div className="space-y-4">
                        <div>
                            <label className="form-label">Terms & Conditions</label>
                            <textarea
                                className="form-input h-24"
                                value={formData.billTerms || ''}
                                onChange={(e) => setFormData({ ...formData, billTerms: e.target.value })}
                                placeholder="Enter terms and conditions..."
                            />
                        </div>
                        <div>
                            <label className="form-label">Footer Text</label>
                            <textarea
                                className="form-input h-16"
                                value={formData.billFooter || ''}
                                onChange={(e) => setFormData({ ...formData, billFooter: e.target.value })}
                                placeholder="Enter footer text..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillTemplateDesigner;
