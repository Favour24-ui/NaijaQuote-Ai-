import React from "react";
import { Quotation } from "../types";
import { jsPDF } from "jspdf";
import { Landmark, ArrowLeft, Download, Send, Receipt, Calendar, CreditCard, ShieldCheck } from "lucide-react";

interface QuotationViewProps {
  quotation: Quotation;
  onBack: () => void;
}

export default function QuotationView({ quotation, onBack }: QuotationViewProps) {
  const { quotationNumber, customerInfo, businessInfo, items, subtotal, discount, vatRate, vatAmount, total, terms, notes, validUntil, createdAt } = quotation;

  // Generate beautiful Client-side A4 Vector PDF using jsPDF
  const handleDownloadPdf = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // 1. Page Setup & Dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      
      // Secondary brand color (Dark Blue)
      const primaryColor = [28, 58, 140]; // RGB
      const textDark = [33, 37, 41];
      const textMuted = [108, 117, 125];

      // Draw Top decorative header accent line
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, pageWidth, 5, "F");

      let y = 18;

      // 2. Company / Header Section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(businessInfo.businessName, margin, y);

      // Document Title (Right-aligned)
      doc.setFontSize(20);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("QUOTATION", pageWidth - margin - 50, y);

      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      
      // Business Address line(s)
      if (businessInfo.businessAddress) {
        doc.text(businessInfo.businessAddress, margin, y);
      }
      doc.setFont("helvetica", "bold");
      doc.text(`No: ${quotationNumber}`, pageWidth - margin - 50, y);

      y += 5;
      doc.setFont("helvetica", "normal");
      if (businessInfo.businessPhone) {
        doc.text(`Phone: ${businessInfo.businessPhone}`, margin, y);
      }
      
      const formattedDate = new Date(createdAt).toLocaleDateString("en-NG", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      doc.text(`Date: ${formattedDate}`, pageWidth - margin - 50, y);

      y += 12;

      // 3. Divider Line
      doc.setDrawColor(220, 225, 230);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);

      y += 10;

      // 4. Billing / Client Information Section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("PREPARED FOR / BILL TO:", margin, y);

      doc.text("VALIDITY INFORMATION:", pageWidth / 2 + 10, y);

      y += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(customerInfo.name, margin, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      
      const expDate = new Date(validUntil).toLocaleDateString("en-NG", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      doc.text(`Validity Period: Up to ${expDate}`, pageWidth / 2 + 10, y);

      if (customerInfo.company) {
        y += 5;
        doc.text(customerInfo.company, margin, y);
      }
      if (customerInfo.phone) {
        y += 5;
        doc.text(`Phone: ${customerInfo.phone}`, margin, y);
      }
      if (customerInfo.email) {
        y += 5;
        doc.text(`Email: ${customerInfo.email}`, margin, y);
      }
      if (customerInfo.address) {
        y += 5;
        doc.text(`Address: ${customerInfo.address}`, margin, y);
      }

      y += 15;

      // 5. Line Items Table Headings
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, pageWidth - (margin * 2), 8, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      
      doc.text("Description of Scope / Materials", margin + 3, y + 5.5);
      doc.text("Qty", margin + 110, y + 5.5);
      doc.text("Unit Price (NGN)", margin + 130, y + 5.5);
      doc.text("Total (NGN)", pageWidth - margin - 30, y + 5.5);

      y += 8;

      // Table Row Data
      doc.setFont("helvetica", "normal");
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      
      items.forEach((item) => {
        y += 7;
        // Safeguard to prevent page overflow
        if (y > pageHeight - 60) {
          doc.addPage();
          y = 20;
          // Re-draw table header decoration
          doc.setFillColor(241, 245, 249);
          doc.rect(margin, y, pageWidth - (margin * 2), 8, "F");
          doc.setFont("helvetica", "bold");
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.text("Description of Scope / Materials", margin + 3, y + 5.5);
          doc.text("Qty", margin + 110, y + 5.5);
          doc.text("Unit Price (NGN)", margin + 130, y + 5.5);
          doc.text("Total (NGN)", pageWidth - margin - 30, y + 5.5);
          y += 15;
          doc.setFont("helvetica", "normal");
          doc.setTextColor(textDark[0], textDark[1], textDark[2]);
        }

        // Draw light horizontal separator line
        doc.setDrawColor(241, 245, 249);
        doc.line(margin, y + 2, pageWidth - margin, y + 2);

        doc.text(item.description, margin + 3, y);
        doc.text(String(item.quantity), margin + 112, y);
        doc.text(item.unitPrice.toLocaleString(), margin + 130, y);
        doc.text(item.amount.toLocaleString(), pageWidth - margin - 30, y);
      });

      y += 12;

      // 6. Summary Totals Box (Right aligned)
      const summaryLeft = pageWidth - margin - 80;
      doc.setDrawColor(220, 225, 230);
      doc.line(summaryLeft, y, pageWidth - margin, y);

      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Gross Subtotal:", summaryLeft, y);
      doc.text(`NGN ${subtotal.toLocaleString()}`, pageWidth - margin - 30, y);

      if (discount > 0) {
        y += 5;
        doc.text("Applied Discount:", summaryLeft, y);
        doc.text(`- NGN ${discount.toLocaleString()}`, pageWidth - margin - 30, y);
      }

      y += 5;
      doc.text(`VAT (${vatRate}%):`, summaryLeft, y);
      doc.text(`NGN ${vatAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, pageWidth - margin - 30, y);

      y += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("Net Total Estimate:", summaryLeft, y);
      doc.text(`NGN ${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, pageWidth - margin - 30, y);

      y += 15;

      // 7. Payment Bank details Box (If provided)
      if (businessInfo.bankName && businessInfo.bankAccountNumber) {
        // Safeguard height check
        if (y > pageHeight - 50) {
          doc.addPage();
          y = 20;
        }

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.rect(margin, y, 110, 24, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("PAYMENT METHOD / DIRECT DEPOSIT:", margin + 4, y + 5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);
        doc.text(`Bank Name:   ${businessInfo.bankName}`, margin + 4, y + 10);
        doc.text(`Account Name: ${businessInfo.bankAccountName || businessInfo.businessName}`, margin + 4, y + 15);
        doc.text(`Account No:   ${businessInfo.bankAccountNumber}`, margin + 4, y + 20);
      }

      // Terms of business (If provided)
      if (terms) {
        y += 30;
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("Terms & Conditions:", margin, y);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
        doc.text(terms, margin, y + 4.5);
      }

      // Footer branding
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(180, 185, 190);
      doc.text("Generated securely via AI Quotation Generator", margin, pageHeight - 8);

      doc.save(`Quotation_${quotationNumber}.pdf`);
    } catch (err) {
      console.error("PDF download error:", err);
      alert("Error generating your PDF. Please try again.");
    }
  };

  // Build perfectly customized professional WhatsApp Sharing link
  const handleShareToWhatsapp = () => {
    const formattedTotal = total.toLocaleString(undefined, { maximumFractionDigits: 2 });
    const formattedDate = new Date(createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" });
    const validityDate = new Date(validUntil).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" });

    // Custom text summary optimized for mobile readability
    let msg = `*BUSINESS QUOTATION ESTIMATE*\n`;
    msg += `------------------------------------------\n`;
    msg += `*From:* ${businessInfo.businessName}\n`;
    if (businessInfo.businessPhone) msg += `*Phone:* ${businessInfo.businessPhone}\n`;
    msg += `*Quote No:* ${quotationNumber}\n`;
    msg += `*Date Issued:* ${formattedDate}\n`;
    msg += `*Valid Until:* ${validityDate}\n\n`;

    msg += `*CLIENT DETAILS:*\n`;
    msg += `*Name:* ${customerInfo.name}\n`;
    if (customerInfo.company) msg += `*Company:* ${customerInfo.company}\n\n`;

    msg += `*ESTIMATE BREAKDOWN:*\n`;
    items.forEach((it, index) => {
      msg += `${index + 1}. ${it.description} (Qty: ${it.quantity}) - *₦${it.unitPrice.toLocaleString()}*\n`;
    });
    msg += `------------------------------------------\n`;
    msg += `*Gross Subtotal:* ₦${subtotal.toLocaleString()}\n`;
    if (discount > 0) msg += `*Discount Applied:* -₦${discount.toLocaleString()}\n`;
    msg += `*VAT (${vatRate}%):* ₦${vatAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}\n`;
    msg += `*NET TOTAL AMOUNT:* *₦${formattedTotal}*\n\n`;

    if (businessInfo.bankName && businessInfo.bankAccountNumber) {
      msg += `*PAYMENT INSTRUCTIONS:*\n`;
      msg += `Bank Name: ${businessInfo.bankName}\n`;
      msg += `Account Name: ${businessInfo.bankAccountName || businessInfo.businessName}\n`;
      msg += `Account Number: ${businessInfo.bankAccountNumber}\n\n`;
    }

    if (terms) {
      msg += `*Terms:* ${terms}\n\n`;
    }
    
    msg += `_Drafted using AI Quotation Generator_`;

    const cleanPhone = customerInfo.phone ? customerInfo.phone.replace(/[^0-9+]/g, "") : "";
    const encodedText = encodeURIComponent(msg);
    
    // Create WhatsApp URL
    const url = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(url, "_blank");
  };

  const formattedDate = new Date(createdAt).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const formattedValidUntil = new Date(validUntil).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="space-y-6 font-sans max-w-4xl mx-auto">
      {/* Control Actions bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-sm px-4 py-2 hover:bg-slate-50 rounded-xl transition self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition shadow-md hover:shadow-lg"
          >
            <Download className="h-4 w-4" />
            <span>Download A4 PDF</span>
          </button>
          <button
            onClick={handleShareToWhatsapp}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition shadow-md hover:shadow-lg"
          >
            <Send className="h-4 w-4" />
            <span>Send via WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Corporate Quotation Statement View */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-6 sm:p-12 overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-2 bg-blue-600"></div>

        {/* Corporate Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 border-b border-slate-100 pb-8">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {businessInfo.businessName}
            </h1>
            <div className="text-xs sm:text-sm text-slate-500 font-medium space-y-0.5">
              {businessInfo.businessAddress && <p>{businessInfo.businessAddress}</p>}
              {businessInfo.businessPhone && <p>Phone: {businessInfo.businessPhone}</p>}
            </div>
          </div>

          <div className="text-left md:text-right space-y-1 sm:space-y-1.5 md:self-stretch flex flex-col justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-blue-600 uppercase tracking-widest">
              Quotation
            </h2>
            <div className="text-xs sm:text-sm text-slate-600 font-bold">
              <p>No: {quotationNumber}</p>
              <p className="font-medium text-slate-500">Issued: {formattedDate}</p>
            </div>
          </div>
        </div>

        {/* Client & Validity info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-slate-100">
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Prepared For / Recipient:
            </h3>
            <div className="space-y-1">
              <p className="font-extrabold text-slate-800 text-base">{customerInfo.name}</p>
              {customerInfo.company && <p className="font-bold text-sm text-blue-600">{customerInfo.company}</p>}
              <div className="text-xs sm:text-sm text-slate-500 font-medium space-y-0.5">
                {customerInfo.phone && <p>Phone: {customerInfo.phone}</p>}
                {customerInfo.email && <p>Email: {customerInfo.email}</p>}
                {customerInfo.address && <p>Address: {customerInfo.address}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Validity Information:
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-slate-700">
                <Calendar className="h-4.5 w-4.5 text-blue-600 shrink-0" />
                <span className="text-sm font-bold">Valid Until: {formattedValidUntil}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <ShieldCheck className="h-4.5 w-4.5 text-blue-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                  Firm Estimate
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Deliverables Table */}
        <div className="py-8 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Scope Details & Materials Supplies
          </h3>
          <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Description of Scope / Materials
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-slate-500 w-20">
                      Qty
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-slate-500 w-36">
                      Unit Price (₦)
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-slate-500 w-36">
                      Total (₦)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {items.map((it) => (
                    <tr key={it.id}>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                        {it.description}
                      </td>
                      <td className="px-5 py-4 text-center text-sm font-semibold text-slate-600">
                        {it.quantity}
                      </td>
                      <td className="px-5 py-4 text-right text-sm font-semibold text-slate-600">
                        {it.unitPrice.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right text-sm font-bold text-slate-900">
                        {it.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom Financial summary, payment, terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
          <div className="space-y-6">
            {/* Payment banking details */}
            {businessInfo.bankName && businessInfo.bankAccountNumber && (
              <div className="bg-slate-50 border border-slate-150 p-5 rounded-xl space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Landmark className="h-4 w-4 text-blue-600" />
                  <span>Payment / Account Information</span>
                </h4>
                <div className="text-xs sm:text-sm text-slate-600 space-y-1 font-medium">
                  <p><span className="text-slate-400 font-bold">Bank:</span> {businessInfo.bankName}</p>
                  <p><span className="text-slate-400 font-bold">Account Name:</span> {businessInfo.bankAccountName || businessInfo.businessName}</p>
                  <p><span className="text-slate-400 font-bold">Account No:</span> {businessInfo.bankAccountNumber}</p>
                </div>
              </div>
            )}

            {/* Terms */}
            {terms && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Terms & Conditions
                </h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {terms}
                </p>
              </div>
            )}
          </div>

          {/* Sum details */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-150 flex flex-col justify-center gap-3">
            <div className="flex justify-between text-xs sm:text-sm text-slate-600 font-medium">
              <span>Gross Subtotal:</span>
              <span className="font-semibold text-slate-800">₦{subtotal.toLocaleString()}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-xs sm:text-sm text-slate-600 font-medium">
                <span>Applied Discount:</span>
                <span className="font-semibold text-red-600">- ₦{discount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-xs sm:text-sm text-slate-600 font-medium">
              <span>VAT ({vatRate}%):</span>
              <span className="font-semibold text-slate-800">
                ₦{vatAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="border-t border-slate-200 pt-3.5 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-900">Net Total Payable:</span>
              <span className="text-xl sm:text-2xl font-black text-blue-600">
                ₦{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer info banner */}
        {notes && (
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs sm:text-sm text-slate-500 font-medium italic">
              &ldquo;{notes}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
