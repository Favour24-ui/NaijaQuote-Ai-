import React, { useState, useEffect } from "react";
import { Customer, Quotation, QuotationItem } from "../types";
import { Sparkles, Plus, Trash2, Calendar, FileText, Landmark, User, CreditCard, ChevronDown, Check, AlertCircle, Building, Phone, MapPin } from "lucide-react";

interface QuotationFormProps {
  token: string;
  customers: Customer[];
  userProfile: any;
  editQuotation: Quotation | null;
  onSaveSuccess: () => void;
  onCancel: () => void;
}

export default function QuotationForm({
  token,
  customers,
  userProfile,
  editQuotation,
  onSaveSuccess,
  onCancel
}: QuotationFormProps) {
  // AI Generation State
  const [aiPrompt, setAiPrompt] = useState("");
  const [industry, setIndustry] = useState("Software & IT Services");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLoadingMessage, setAiLoadingMessage] = useState("");
  const [aiWarning, setAiWarning] = useState("");

  // Form Fields
  const [quotationNumber, setQuotationNumber] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerCompany, setCustomerCompany] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  const [items, setItems] = useState<QuotationItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [vatRate, setVatRate] = useState<number>(7.5); // Standard VAT in Nigeria

  const [terms, setTerms] = useState("50% Mobilization, 50% on completion. Valid for 30 days.");
  const [notes, setNotes] = useState("Thank you for your business!");
  const [status, setStatus] = useState<'draft' | 'sent' | 'paid' | 'cancelled'>("draft");
  const [validUntil, setValidUntil] = useState("");

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Business/Sender Fields
  const [businessName, setBusinessName] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");

  const NIGERIAN_BANKS = [
    "Access Bank",
    "Citibank Nigeria",
    "Ecobank Nigeria",
    "Fidelity Bank",
    "First Bank of Nigeria",
    "First City Monument Bank (FCMB)",
    "Globus Bank",
    "Guaranty Trust Bank (GTBank)",
    "Heritage Bank",
    "Keystone Bank",
    "Lotus Bank",
    "Moniepoint MFB",
    "OPay MFB",
    "Palmpay MFB",
    "Parallex Bank",
    "Polaris Bank",
    "Providus Bank",
    "Signature Bank",
    "Stanbic IBTC Bank",
    "Standard Chartered Bank",
    "Sterling Bank",
    "SunTrust Bank",
    "Taj Bank",
    "Titan Trust Bank",
    "Union Bank of Nigeria",
    "United Bank for Africa (UBA)",
    "Unity Bank",
    "Wema Bank",
    "Zenith Bank"
  ];

  const INDUSTRIES = [
    "Software & IT Services",
    "Renewable Energy & Power Systems",
    "Building & Renovation Services",
    "Event Planning & Catering",
    "Retail & Product Wholesale",
    "Consulting & Business Training",
    "Logistics & Delivery",
    "Agriculture & Farm Supplies",
    "General Contracting"
  ];

  const AI_LOADING_MESSAGES = [
    "Consulting AI SME Estimator...",
    "Computing realistic Nigerian market pricing in Naira...",
    "Drafting optimal materials, technical labor, and scope line items...",
    "Formulating standard terms and local business conditions..."
  ];

  // If editing, fill fields
  useEffect(() => {
    if (editQuotation) {
      setQuotationNumber(editQuotation.quotationNumber);
      setSelectedCustomerId(editQuotation.customerId || "");
      setCustomerName(editQuotation.customerInfo.name);
      setCustomerCompany(editQuotation.customerInfo.company || "");
      setCustomerEmail(editQuotation.customerInfo.email || "");
      setCustomerPhone(editQuotation.customerInfo.phone || "");
      setCustomerAddress(editQuotation.customerInfo.address || "");
      setItems(editQuotation.items);
      setDiscount(editQuotation.discount);
      setVatRate(editQuotation.vatRate);
      setTerms(editQuotation.terms || "");
      setNotes(editQuotation.notes || "");
      setStatus(editQuotation.status);
      setValidUntil(editQuotation.validUntil.split("T")[0]);

      if (editQuotation.businessInfo) {
        setBusinessName(editQuotation.businessInfo.businessName || "");
        setBusinessPhone(editQuotation.businessInfo.businessPhone || "");
        setBusinessAddress(editQuotation.businessInfo.businessAddress || "");
        setBankName(editQuotation.businessInfo.bankName || "");
        setBankAccountName(editQuotation.businessInfo.bankAccountName || "");
        setBankAccountNumber(editQuotation.businessInfo.bankAccountNumber || "");
      }
    } else {
      // Auto generate a quotation number
      const rand = Math.floor(1000 + Math.random() * 9000);
      setQuotationNumber(`QTN-${new Date().getFullYear()}-${rand}`);
      
      // Default valid until date (30 days from now)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      setValidUntil(thirtyDaysFromNow.toISOString().split("T")[0]);

      // Initialize empty item list
      setItems([{ id: "item_1", description: "Design Phase / Consulting Setup", quantity: 1, unitPrice: 50000, amount: 50000 }]);
    }
  }, [editQuotation]);

  // Sync business details from userProfile if creating a new quotation
  useEffect(() => {
    if (!editQuotation && userProfile) {
      setBusinessName(userProfile.businessName || "");
      setBusinessPhone(userProfile.businessPhone || "");
      setBusinessAddress(userProfile.businessAddress || "");
      setBankName(userProfile.bankName || "");
      setBankAccountName(userProfile.bankAccountName || "");
      setBankAccountNumber(userProfile.bankAccountNumber || "");
    }
  }, [userProfile, editQuotation]);

  // Sync selected customer
  useEffect(() => {
    if (selectedCustomerId && selectedCustomerId !== "custom") {
      const selected = customers.find((c) => c.id === selectedCustomerId);
      if (selected) {
        setCustomerName(selected.name);
        setCustomerCompany(selected.company || "");
        setCustomerEmail(selected.email || "");
        setCustomerPhone(selected.phone || "");
        setCustomerAddress(selected.address || "");
      }
    } else if (selectedCustomerId === "custom") {
      setCustomerName("");
      setCustomerCompany("");
      setCustomerEmail("");
      setCustomerPhone("");
      setCustomerAddress("");
    }
  }, [selectedCustomerId, customers]);

  // AI Generation Handler
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      setError("Please describe the project details for the AI Assistant.");
      return;
    }

    setError("");
    setAiWarning("");
    setAiLoading(true);

    // Stagger loading messages for an amazing interactive feel
    let msgIndex = 0;
    setAiLoadingMessage(AI_LOADING_MESSAGES[0]);
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % AI_LOADING_MESSAGES.length;
      setAiLoadingMessage(AI_LOADING_MESSAGES[msgIndex]);
    }, 2500);

    try {
      const response = await fetch("/api/quotations/ai-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ description: aiPrompt, industry })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate AI estimate.");
      }

      // Populate quotation state
      if (data.items && data.items.length) {
        const mappedItems: QuotationItem[] = data.items.map((it: any, idx: number) => ({
          id: `ai_item_${idx}_${Date.now()}`,
          description: it.description,
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          amount: (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0)
        }));

        setItems(mappedItems);
        setTerms(data.suggestedTerms || terms);
        setNotes(data.suggestedNotes || notes);
        if (data.warning) {
          setAiWarning(data.warning);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate AI quotation.");
    } finally {
      clearInterval(msgInterval);
      setAiLoading(false);
    }
  };

  // Math Helpers
  const addItemRow = () => {
    const newId = `item_${Date.now()}`;
    setItems([...items, { id: newId, description: "", quantity: 1, unitPrice: 0, amount: 0 }]);
  };

  const removeItemRow = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((it) => it.id !== id));
  };

  const updateItemRow = (id: string, field: keyof QuotationItem, value: any) => {
    const updated = items.map((it) => {
      if (it.id === id) {
        const updatedItem = { ...it, [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          const qty = field === "quantity" ? Number(value) : it.quantity;
          const price = field === "unitPrice" ? Number(value) : it.unitPrice;
          updatedItem.amount = qty * price;
        }
        return updatedItem;
      }
      return it;
    });
    setItems(updated);
  };

  // Totals Calculations
  const getSubtotal = () => {
    return items.reduce((sum, it) => sum + it.amount, 0);
  };

  const getVatAmount = () => {
    const subtotal = getSubtotal();
    const discounted = subtotal - discount;
    return Math.max(0, discounted * (vatRate / 100));
  };

  const getTotal = () => {
    const subtotal = getSubtotal();
    return Math.max(0, subtotal - discount + getVatAmount());
  };

  // Save quotation to Database
  const handleSaveQuotation = async () => {
    if (!customerName.trim()) {
      setError("Please specify a customer name.");
      return;
    }

    if (items.some((it) => !it.description.trim() || it.unitPrice <= 0)) {
      setError("All item rows must have a valid description and a unit price greater than ₦0.");
      return;
    }

    setError("");
    setSaving(true);

    const subtotal = getSubtotal();
    const vatAmount = getVatAmount();
    const total = getTotal();

    const payload = {
      quotationNumber,
      customerId: selectedCustomerId !== "custom" ? selectedCustomerId : null,
      customerInfo: {
        name: customerName.trim(),
        company: customerCompany.trim(),
        email: customerEmail.trim(),
        phone: customerPhone.trim(),
        address: customerAddress.trim()
      },
      businessInfo: {
        businessName: businessName.trim() || "Nigerian Business Hub",
        businessPhone: businessPhone.trim(),
        businessAddress: businessAddress.trim(),
        bankName: bankName.trim(),
        bankAccountName: bankAccountName.trim(),
        bankAccountNumber: bankAccountNumber.trim()
      },
      items,
      subtotal,
      discount,
      vatRate,
      vatAmount,
      total,
      terms,
      notes,
      status,
      validUntil: new Date(validUntil).toISOString()
    };

    try {
      const method = editQuotation ? "PUT" : "POST";
      const url = editQuotation ? `/api/quotations/${editQuotation.id}` : "/api/quotations";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to save quotation.");
      }

      onSaveSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to commit quotation data.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* AI Estimator Card */}
      {!editQuotation && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-6 sm:p-8 shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="h-6 w-6 text-yellow-300 animate-bounce" />
            <h3 className="text-lg sm:text-xl font-bold">AI Assistant Quotation Estimator</h3>
          </div>
          <p className="text-sm text-blue-100 font-medium mb-4 max-w-xl">
            Type your project details (e.g. \"Supply 5 solar panels\" or \"Create a bakery website\") and let the AI generate customized Naira-priced items and terms instantly.
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe your project, materials, or required services in Nigeria..."
                  className="block w-full px-4 py-3 bg-white/10 text-white placeholder-blue-200 border border-white/20 rounded-xl focus:bg-white focus:text-slate-800 focus:placeholder-slate-400 focus:outline-none transition text-sm font-semibold"
                />
              </div>
              <div>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="block w-full px-3 py-3 bg-white/10 text-white border border-white/20 rounded-xl focus:bg-white focus:text-slate-800 focus:outline-none transition text-sm font-semibold"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind} className="text-slate-800 font-medium">
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={aiLoading}
                onClick={handleAiGenerate}
                className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-extrabold text-sm px-6 py-3 rounded-xl transition shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {aiLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <span>Generate AI Quotation</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Loader */}
          {aiLoading && (
            <div className="mt-4 pt-4 border-t border-white/10 text-center animate-fadeIn">
              <p className="text-xs sm:text-sm text-yellow-300 font-bold animate-pulse">{aiLoadingMessage}</p>
            </div>
          )}

          {aiWarning && (
            <div className="mt-4 bg-yellow-500/20 text-yellow-200 p-3 rounded-xl text-xs flex gap-2 items-center border border-yellow-500/10 animate-pulse">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{aiWarning}</span>
            </div>
          )}
        </div>
      )}

      {/* Main Quotation Builder */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {editQuotation ? "Edit Quotation Form" : "Create New Quotation"}
            </h2>
            <p className="text-sm text-slate-500">Draft professional invoice estimates for your customers</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Quotation No.</label>
              <input
                type="text"
                value={quotationNumber}
                onChange={(e) => setQuotationNumber(e.target.value)}
                className="block px-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50 font-bold text-sm text-slate-700"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Quote Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="block px-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-sm font-bold text-slate-700"
              >
                <option value="draft">Draft Estimate</option>
                <option value="sent">Sent to Client</option>
                <option value="paid">Paid & Approved</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 border border-red-100 animate-bounce text-sm font-semibold">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Customer Snapshot Selector */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <span>Customer / Recipient Profile</span>
            </h3>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Choose Existing Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ""}
                </option>
              ))}
              <option value="custom">-- Enter New Details manually --</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Contact Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer Contact Name"
                className="block w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:border-blue-500 transition font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Company / Organization</label>
              <input
                type="text"
                value={customerCompany}
                onChange={(e) => setCustomerCompany(e.target.value)}
                placeholder="e.g. Lagos Retail Hub"
                className="block w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:border-blue-500 transition font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email Address</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@domain.ng"
                className="block w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:border-blue-500 transition font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Phone Number</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. +234..."
                className="block w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:border-blue-500 transition font-semibold"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Billing / Delivery Address</label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Lagos, Nigeria"
                className="block w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:border-blue-500 transition font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Business / Sender Profile (Manual Customization Override) */}
        <div className="bg-blue-50/45 p-5 rounded-2xl border border-blue-100/70 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-blue-100 pb-3">
            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
              <Building className="h-4 w-4 text-blue-600" />
              <span>Sender Business Profile (Manual Customize)</span>
            </h3>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-md">
              Estimate Override
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">My Business Name *</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="My Company / Business Name"
                className="block w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:border-blue-500 transition font-semibold text-slate-800 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">My Business Phone</label>
              <input
                type="text"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                placeholder="e.g. +234..."
                className="block w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:border-blue-500 transition font-semibold text-slate-800 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">My Business Address</label>
              <input
                type="text"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder="Lagos, Nigeria"
                className="block w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:border-blue-500 transition font-semibold text-slate-800 shadow-sm"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-dashed border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">My Bank Name</label>
              <input
                type="text"
                list="nigerian-banks-quote-form"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. Access Bank, Zenith"
                className="block w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:border-blue-500 transition font-semibold text-slate-800 shadow-sm"
              />
              <datalist id="nigerian-banks-quote-form">
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Account Name</label>
              <input
                type="text"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                placeholder="Account Holder Name"
                className="block w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:border-blue-500 transition font-semibold text-slate-800 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Account Number (10 digits)</label>
              <input
                type="text"
                maxLength={10}
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="Account Number"
                className="block w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:border-blue-500 transition font-semibold text-slate-800 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Quotation Line Items Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span>Quotation Line Items</span>
            </h3>
            <button
              type="button"
              onClick={addItemRow}
              className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs px-3 py-1.5 rounded-xl transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Line Item</span>
            </button>
          </div>

          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Description / Scope Detail
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500 w-24">
                      Qty
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500 w-44">
                      Unit Price (₦)
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500 w-44">
                      Amount (₦)
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500 w-16"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {items.map((it, idx) => (
                    <tr key={it.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-2.5">
                        <input
                          type="text"
                          required
                          value={it.description}
                          onChange={(e) => updateItemRow(it.id, "description", e.target.value)}
                          placeholder="e.g. Design phase / Materials procurement"
                          className="block w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-500 focus:outline-none bg-white"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          min={1}
                          required
                          value={it.quantity}
                          onChange={(e) => updateItemRow(it.id, "quantity", parseInt(e.target.value) || 1)}
                          className="block w-full text-center px-2 py-1.5 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-500 focus:outline-none bg-white"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          min={0}
                          required
                          value={it.unitPrice}
                          onChange={(e) => updateItemRow(it.id, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="block w-full text-right px-2 py-1.5 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-500 focus:outline-none bg-white"
                        />
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-slate-800 text-sm pr-6">
                        ₦{it.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          type="button"
                          disabled={items.length <= 1}
                          onClick={() => removeItemRow(it.id)}
                          className="text-slate-400 hover:text-red-500 disabled:opacity-40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Financial Recap & Validity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1 flex items-center gap-1">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span>Estimate Valid Until</span>
              </label>
              <input
                type="date"
                required
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="block w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Suggested Payment Terms</label>
              <textarea
                rows={3}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="block w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 font-medium"
                placeholder="e.g. 70% mobilization, 30% final execution..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Client Notes / Warranty</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="block w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 font-medium"
                placeholder="Notes shown on quotation..."
              />
            </div>
          </div>

          {/* Financial calculations recap */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-between h-full space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">
              Financial Summary
            </h3>

            <div className="space-y-2.5 font-medium text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Gross Subtotal:</span>
                <span className="font-semibold text-slate-800">₦{getSubtotal().toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center">
                <span>Applied Discount (₦):</span>
                <input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-32 text-right px-2 py-1 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex justify-between items-center">
                <span>VAT Rate (%):</span>
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  value={vatRate}
                  onChange={(e) => setVatRate(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-24 text-right px-2 py-1 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex justify-between">
                <span>VAT Value ({vatRate}%):</span>
                <span>₦{getVatAmount().toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
              <span className="text-base font-bold text-slate-900">Total Estimation:</span>
              <span className="text-2xl font-black text-blue-600">
                ₦{getTotal().toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
          >
            Cancel Draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveQuotation}
            className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-md hover:shadow-lg flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving Quotation...</span>
              </>
            ) : (
              <span>Save & Register Quotation</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
