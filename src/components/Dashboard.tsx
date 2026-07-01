import React, { useState, useEffect } from "react";
import { User, Quotation, Customer } from "../types";
import CustomerManager from "./CustomerManager";
import QuotationForm from "./QuotationForm";
import QuotationView from "./QuotationView";
import {
  FileText,
  Users,
  Settings,
  Plus,
  LogOut,
  TrendingUp,
  Clock,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  Building,
  Phone,
  MapPin,
  Landmark,
  CreditCard,
  UserCheck
} from "lucide-react";

interface DashboardProps {
  user: User;
  token: string;
  onLogout: () => void;
}

export default function Dashboard({ user, token, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"quotations" | "customers" | "settings">("quotations");
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create / Edit Wizard states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  
  // Viewer state
  const [viewingQuotation, setViewingQuotation] = useState<Quotation | null>(null);

  // Profile Settings form states
  const [businessName, setBusinessName] = useState(user.businessName || "");
  const [businessPhone, setBusinessPhone] = useState(user.businessPhone || "");
  const [businessAddress, setBusinessAddress] = useState(user.businessAddress || "");
  const [bankName, setBankName] = useState(user.bankName || "");
  const [bankAccountName, setBankAccountName] = useState(user.bankAccountName || "");
  const [bankAccountNumber, setBankAccountNumber] = useState(user.bankAccountNumber || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Suggested bank names for Nigerian businesses
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

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [quotesRes, custRes] = await Promise.all([
        fetch("/api/quotations", { headers }),
        fetch("/api/customers", { headers })
      ]);

      if (quotesRes.ok) {
        const quotesData = await quotesRes.json();
        setQuotations(quotesData);
      }
      if (custRes.ok) {
        const custData = await custRes.json();
        setCustomers(custData);
      }
    } catch (err) {
      setError("Failed to fetch dashboard intelligence.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  // Logout trigger
  const handleLogoutClick = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error(err);
    }
    localStorage.removeItem("session_token");
    onLogout();
  };

  // Profile update submission
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(false);
    setError("");

    try {
      const response = await fetch("/api/auth/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          businessName: businessName.trim(),
          businessPhone: businessPhone.trim(),
          businessAddress: businessAddress.trim(),
          bankName,
          bankAccountName: bankAccountName.trim(),
          bankAccountNumber: bankAccountNumber.trim()
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update business profile.");
      }

      setProfileSuccess(true);
      // Update global session properties safely
      user.businessName = businessName.trim();
      user.businessPhone = businessPhone.trim();
      user.businessAddress = businessAddress.trim();
      user.bankName = bankName;
      user.bankAccountName = bankAccountName.trim();
      user.bankAccountNumber = bankAccountNumber.trim();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setProfileSaving(false);
    }
  };

  // Delete Quotation
  const handleDeleteQuotation = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this quotation?")) return;
    try {
      const response = await fetch(`/api/quotations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setQuotations(quotations.filter((q) => q.id !== id));
      }
    } catch (err) {
      console.error("Error deleting quotation", err);
    }
  };

  // Calculations for stats summary cards
  const totalRevenue = quotations
    .filter((q) => q.status === "paid")
    .reduce((sum, q) => sum + q.total, 0);

  const outstandingRevenue = quotations
    .filter((q) => q.status === "sent")
    .reduce((sum, q) => sum + q.total, 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Top Professional Navigation Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow shadow-blue-200">
                AQ
              </div>
              <div>
                <span className="font-extrabold text-slate-900 block tracking-tight">
                  {user.businessName || "AI Quotation Hub"}
                </span>
                <span className="text-xs text-slate-500 font-medium">{user.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleLogoutClick}
                className="inline-flex items-center gap-2 text-slate-500 hover:text-red-600 font-semibold text-sm px-3.5 py-2 hover:bg-slate-50 rounded-xl transition"
              >
                <LogOut className="h-4.5 w-4.5 shrink-0" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewingQuotation ? (
          /* Active Quotation Detail Viewer */
          <QuotationView quotation={viewingQuotation} onBack={() => setViewingQuotation(null)} />
        ) : isFormOpen ? (
          /* Active Create / Edit Form Wizard */
          <QuotationForm
            token={token}
            customers={customers}
            userProfile={user}
            editQuotation={editingQuotation}
            onSaveSuccess={() => {
              setIsFormOpen(false);
              setEditingQuotation(null);
              fetchDashboardData();
            }}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingQuotation(null);
            }}
          />
        ) : (
          /* Main Dashboard layout */
          <div className="space-y-8">
            {/* Quick Stats Grid Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Outstanding (Sent)
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900">
                    ₦{outstandingRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shadow-inner">
                  <Clock className="h-6 w-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Revenue Approved (Paid)
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-600">
                    ₦{totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-inner">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Saved Quotations
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900">
                    {quotations.length}
                  </span>
                </div>
                <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-inner">
                  <FileText className="h-6 w-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Client Base
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900">
                    {customers.length}
                  </span>
                </div>
                <div className="h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 shadow-inner">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Sub navigation bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-sm gap-4">
              <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab("quotations")}
                  className={`flex-1 sm:flex-initial px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
                    activeTab === "quotations" ? "bg-white text-blue-600 shadow" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Quotations
                </button>
                <button
                  onClick={() => setActiveTab("customers")}
                  className={`flex-1 sm:flex-initial px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
                    activeTab === "customers" ? "bg-white text-blue-600 shadow" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Customers Directory
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`flex-1 sm:flex-initial px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
                    activeTab === "settings" ? "bg-white text-blue-600 shadow" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Business Profile
                </button>
              </div>

              <button
                onClick={() => {
                  setEditingQuotation(null);
                  setIsFormOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition shadow-md hover:shadow-lg w-full sm:w-auto"
              >
                <Plus className="h-4.5 w-4.5" />
                <span>Create Quotation</span>
              </button>
            </div>

            {/* Render selected module tab */}
            <div className="space-y-6">
              {activeTab === "quotations" && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900">Your Quotations & Estimates</h3>
                    <p className="text-sm text-slate-500">Track states, export professional PDF or send directly to client</p>
                  </div>

                  {loading ? (
                    <div className="p-12 text-center text-slate-500 font-medium">
                      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                      <span>Synching Quotation list...</span>
                    </div>
                  ) : quotations.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                      <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-semibold">No quotations saved yet.</p>
                      <button
                        onClick={() => setIsFormOpen(true)}
                        className="mt-4 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
                      >
                        Draft First Quote
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50/50">
                          <tr>
                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                              Quotation Info
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                              Customer Name
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                              Amount (NGN)
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                          {quotations.map((q) => (
                            <tr key={q.id} className="hover:bg-slate-50/50 transition">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-extrabold text-slate-900">{q.quotationNumber}</div>
                                <div className="text-xs text-slate-500 font-medium">
                                  Valid until: {new Date(q.validUntil).toLocaleDateString("en-NG")}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">
                                {q.customerInfo.name}
                                {q.customerInfo.company && (
                                  <span className="block text-[10px] font-semibold text-slate-400">
                                    {q.customerInfo.company}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span
                                  className={`inline-flex px-2.5 py-1 text-xs font-extrabold rounded-full ${
                                    q.status === "paid"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                      : q.status === "sent"
                                      ? "bg-blue-50 text-blue-700 border border-blue-100"
                                      : q.status === "cancelled"
                                      ? "bg-slate-100 text-slate-600"
                                      : "bg-yellow-50 text-yellow-700 border border-yellow-100"
                                  }`}
                                >
                                  {q.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-slate-900">
                                ₦{q.total.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => setViewingQuotation(q)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                                    title="View Quotation Statement"
                                  >
                                    <Eye className="h-4.5 w-4.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingQuotation(q);
                                      setIsFormOpen(true);
                                    }}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                                    title="Edit Quotation"
                                  >
                                    <Edit className="h-4.5 w-4.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteQuotation(q.id)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                                    title="Delete Quotation"
                                  >
                                    <Trash2 className="h-4.5 w-4.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "customers" && (
                <CustomerManager token={token} onCustomersChange={fetchDashboardData} />
              )}

              {activeTab === "settings" && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Corporate Settings & Bank Details</h3>
                    <p className="text-sm text-slate-500">Configure parameters used to brand and finalize your dynamic quotations</p>
                  </div>

                  {profileSuccess && (
                    <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl flex items-center gap-3 border border-emerald-100 animate-fadeIn text-sm font-bold">
                      <CheckCircle className="h-5 w-5 shrink-0" />
                      <span>Business settings successfully synchronized!</span>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100 animate-fadeIn text-sm font-bold">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleProfileSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Corporate Brand Name
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                            <Building className="h-4.5 w-4.5" />
                          </span>
                          <input
                            type="text"
                            required
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-800 font-semibold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Business Phone
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                            <Phone className="h-4.5 w-4.5" />
                          </span>
                          <input
                            type="tel"
                            value={businessPhone}
                            onChange={(e) => setBusinessPhone(e.target.value)}
                            className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-800 font-semibold"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Corporate Address
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                            <MapPin className="h-4.5 w-4.5" />
                          </span>
                          <input
                            type="text"
                            value={businessAddress}
                            onChange={(e) => setBusinessAddress(e.target.value)}
                            className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-800 font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider pt-4 border-t border-slate-100">
                      Standard Direct-Deposit Banking Details
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Direct Deposit Bank (Type manually or select)
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                            <Landmark className="h-4.5 w-4.5" />
                          </span>
                          <input
                            type="text"
                            list="nigerian-banks-dashboard"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="e.g. Moniepoint MFB, GTBank"
                            className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-800 font-semibold"
                          />
                        </div>
                        <datalist id="nigerian-banks-dashboard">
                          {NIGERIAN_BANKS.map((b) => (
                            <option key={b} value={b} />
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Account Number (10 digits)
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                            <CreditCard className="h-4.5 w-4.5" />
                          </span>
                          <input
                            type="text"
                            maxLength={10}
                            value={bankAccountNumber}
                            onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ""))}
                            className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-800 font-semibold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Account Name
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                            <UserCheck className="h-4.5 w-4.5" />
                          </span>
                          <input
                            type="text"
                            value={bankAccountName}
                            onChange={(e) => setBankAccountName(e.target.value)}
                            className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-800 font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                      <button
                        type="submit"
                        disabled={profileSaving}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition shadow-md hover:shadow-lg flex items-center gap-2"
                      >
                        {profileSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Saving Changes...</span>
                          </>
                        ) : (
                          <span>Update Profile Parameters</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
