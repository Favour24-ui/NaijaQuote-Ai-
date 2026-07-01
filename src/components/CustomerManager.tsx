import React, { useState, useEffect } from "react";
import { Customer } from "../types";
import { User, Building2, Mail, Phone, MapPin, Plus, Edit2, Trash2, Search, X } from "lucide-react";

interface CustomerManagerProps {
  token: string;
  onCustomersChange?: () => void;
}

export default function CustomerManager({ token, onCustomersChange }: CustomerManagerProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState("");

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error("Error fetching customers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Customer name is required.");
      return;
    }

    const payload = {
      name: name.trim(),
      company: company.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim()
    };

    try {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing ? `/api/customers/${editId}` : "/api/customers";
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
        throw new Error(errData.error || "Failed to save customer.");
      }

      await fetchCustomers();
      if (onCustomersChange) onCustomersChange();
      resetForm();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    }
  };

  const handleEdit = (customer: Customer) => {
    setIsEditing(true);
    setEditId(customer.id);
    setName(customer.name);
    setCompany(customer.company || "");
    setEmail(customer.email || "");
    setPhone(customer.phone || "");
    setAddress(customer.address || "");
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setCustomers(customers.filter(c => c.id !== id));
        if (onCustomersChange) onCustomersChange();
      }
    } catch (err) {
      console.error("Error deleting customer", err);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setName("");
    setCompany("");
    setEmail("");
    setPhone("");
    setAddress("");
    setFormOpen(false);
    setError("");
  };

  const filteredCustomers = customers.filter(c => {
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      (c.company && c.company.toLowerCase().includes(query)) ||
      (c.email && c.email.toLowerCase().includes(query)) ||
      (c.phone && c.phone.includes(query))
    );
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Customer Management</h2>
          <p className="text-sm text-slate-500">Add and search customer information securely</p>
        </div>
        {!formOpen && (
          <button
            onClick={() => { resetForm(); setFormOpen(true); }}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition shadow-md hover:shadow-lg"
          >
            <Plus className="h-4 w-4" />
            <span>Add Customer</span>
          </button>
        )}
      </div>

      {/* Form Section */}
      {formOpen && (
        <div className="bg-slate-50 p-6 border-b border-slate-100 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              {isEditing ? "Edit Customer details" : "Register New Customer"}
            </h3>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-xs font-semibold">{error}</div>}

          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Customer Name *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alhaji Chinedu"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Company / Organization</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Building2 className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Dangote Cement, Lekki Hub"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. customer@domain.ng"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Phone Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +234 803 000 0000"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Business/Home Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <MapPin className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Suite 4B, Ikoyi Plaza, Lagos"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition"
                />
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition"
              >
                {isEditing ? "Save Updates" : "Register Customer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Box */}
      <div className="p-4 bg-slate-50/50 border-b border-slate-100">
        <div className="relative max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, email, or company..."
            className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition"
          />
        </div>
      </div>

      {/* Customer List */}
      <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-slate-500">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span className="text-sm font-medium">Loading customers list...</span>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <User className="h-8 w-8 mx-auto mb-2 opacity-50 text-slate-400" />
            <span className="text-sm font-medium">No matching customers found.</span>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <div key={customer.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm sm:text-base">{customer.name}</span>
                  {customer.company && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600">
                      {customer.company}
                    </span>
                  )}
                  {customer.userId === "system" && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500">
                      Sample Template
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500 font-medium">
                  {customer.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center gap-1.5 sm:col-span-2">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{customer.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {customer.userId !== "system" && (
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleEdit(customer)}
                    className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                    title="Edit Customer"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(customer.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                    title="Delete Customer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
