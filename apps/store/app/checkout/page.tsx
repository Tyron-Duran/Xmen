'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Calendar,
  MapPin,
  CreditCard,
  AlertCircle,
  ShoppingCart,
  ArrowLeft,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { Button } from '@prototype/ui';
import { getCart, saveCart, type CartItem } from '@/lib/cart-state';

export default function CheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Customer & Address Form
  const [customerName, setCustomerName] = useState('Juan Dela Cruz');
  const [customerPhone, setCustomerPhone] = useState('+639171234567');
  const [customerEmail, setCustomerEmail] = useState('juan@example.com');
  const [line1, setLine1] = useState('123 Ayala Avenue, Tower One');
  const [city, setCity] = useState('Makati');
  const [province, setProvince] = useState('Metro Manila');
  const [postalCode, setPostalCode] = useState('1226');
  const [includeInstallation, setIncludeInstallation] = useState(true);

  // Time Window
  const tomorrow = new Date(Date.now() + 48 * 3600 * 1000);
  const defaultStart = new Date(tomorrow.setHours(9, 0, 0, 0)).toISOString().slice(0, 16);
  const defaultEnd = new Date(tomorrow.setHours(12, 0, 0, 0)).toISOString().slice(0, 16);

  const [preferredStart, setPreferredStart] = useState(defaultStart);
  const [preferredEnd, setPreferredEnd] = useState(defaultEnd);
  const [specialInstructions, setSpecialInstructions] = useState('Please call upon arrival at the security guardhouse.');
  const [simulateFailure, setSimulateFailure] = useState(false);

  useEffect(() => {
    setCartItems(getCart());
  }, []);

  const totalAmount = cartItems.reduce((sum, item) => sum + item.pricePhp * item.quantity, 0);

  const cityPresets = [
    { name: 'Makati', province: 'Metro Manila', zip: '1226' },
    { name: 'Taguig (BGC)', province: 'Metro Manila', zip: '1634' },
    { name: 'Quezon City', province: 'Metro Manila', zip: '1100' },
    { name: 'Pasig', province: 'Metro Manila', zip: '1600' },
    { name: 'Bacoor', province: 'Cavite', zip: '4102' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const itemsToSend = cartItems.length > 0
      ? cartItems.map(item => ({
          sku: item.sku,
          quantity: item.quantity,
          unitPricePhp: item.pricePhp.toFixed(2)
        }))
      : [
          {
            sku: 'GH-CCTV-001',
            quantity: 2,
            unitPricePhp: '3850.00'
          }
        ];

    const payload = {
      customerName,
      customerPhone,
      customerEmail,
      address: {
        line1,
        city,
        province,
        postalCode
      },
      items: itemsToSend,
      includeInstallation,
      preferredStart: includeInstallation ? new Date(preferredStart).toISOString() : undefined,
      preferredEnd: includeInstallation ? new Date(preferredEnd).toISOString() : undefined,
      specialInstructions,
      simulatePaymentFailure: simulateFailure
    };

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Checkout submission failed');
      }

      saveCart([]);
      router.push(`/orders/${data.orderNumber}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred during checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 min-h-screen text-slate-800 space-y-8">
      {/* Header */}
      <div className="border-b pb-6">
        <Link href="/cart" className="text-slate-500 hover:text-[#0e2378] text-sm flex items-center gap-1.5 font-bold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Return to Cart
        </Link>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 mt-2 tracking-tight">Checkout & Installation Dispatch</h1>
        <p className="text-sm sm:text-base text-slate-600 mt-1 font-medium">
          Step 2 of 2: Confirm contact details, delivery address, and preferred technician appointment window
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-red-800 text-sm font-bold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Customer Information */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2.5">
              <User className="w-5 h-5 text-[#0e2378]" />
              1. Customer Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1.5">
                  Full Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm sm:text-base font-semibold focus:ring-2 focus:ring-[#0e2378] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1.5">
                  Contact Mobile (+63 RFC Format)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    required
                    placeholder="+639171234567"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 text-sm sm:text-base font-semibold focus:ring-2 focus:ring-[#0e2378] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1.5">
                  Email for Warranty Notice
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 text-sm sm:text-base font-semibold focus:ring-2 focus:ring-[#0e2378] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Installation Site Address */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2.5">
              <MapPin className="w-5 h-5 text-[#0e2378]" />
              2. Installation Site Address
            </h2>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="font-bold text-slate-500 uppercase text-[10px] shrink-0">Quick Fill:</span>
              {cityPresets.map(preset => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setCity(preset.name);
                    setProvince(preset.province);
                    setPostalCode(preset.zip);
                  }}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold whitespace-nowrap"
                >
                  {preset.name}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1.5">
                  Street Address / Building / Unit Number
                </label>
                <input
                  type="text"
                  value={line1}
                  onChange={e => setLine1(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm sm:text-base font-semibold focus:ring-2 focus:ring-[#0e2378] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1.5">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm sm:text-base font-semibold focus:ring-2 focus:ring-[#0e2378] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1.5">Province</label>
                  <input
                    type="text"
                    value={province}
                    onChange={e => setProvince(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm sm:text-base font-semibold focus:ring-2 focus:ring-[#0e2378] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1.5">Postal Code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={e => setPostalCode(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm sm:text-base font-semibold focus:ring-2 focus:ring-[#0e2378] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Professional Installation Window */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-[#0e2378]" />
                3. Technician Appointment Window
              </h2>
              <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-300">
                Installation Included
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1.5">
                  Preferred Arrival Window (From)
                </label>
                <input
                  type="datetime-local"
                  value={preferredStart}
                  onChange={e => setPreferredStart(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm sm:text-base font-semibold focus:ring-2 focus:ring-[#0e2378] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1.5">
                  Preferred Completion Window (To)
                </label>
                <input
                  type="datetime-local"
                  value={preferredEnd}
                  onChange={e => setPreferredEnd(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm sm:text-base font-semibold focus:ring-2 focus:ring-[#0e2378] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1.5">
                  Special Instructions for Field Technician
                </label>
                <textarea
                  value={specialInstructions}
                  onChange={e => setSpecialInstructions(e.target.value)}
                  rows={2}
                  maxLength={500}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm sm:text-base font-semibold focus:ring-2 focus:ring-[#0e2378] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Order Summary & Payment Button */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6 sticky top-24">
            <h2 className="text-xl font-black text-slate-900 border-b pb-4 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs bg-slate-100 px-2.5 py-1 rounded-lg text-slate-600 font-bold">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)} Items
              </span>
            </h2>

            {/* Cart Items List */}
            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto space-y-2">
              {cartItems.map((item) => (
                <div key={item.sku} className="pt-2 flex items-center justify-between text-xs sm:text-sm">
                  <div className="pr-2">
                    <span className="font-black text-slate-900 block leading-tight">{item.name}</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Qty: {item.quantity} × ₱{item.pricePhp.toLocaleString()}.00
                    </span>
                  </div>
                  <span className="font-black text-slate-900 shrink-0">
                    ₱{(item.pricePhp * item.quantity).toLocaleString()}.00
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t pt-4 space-y-2 text-sm font-semibold text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-slate-900">₱{totalAmount.toLocaleString()}.00</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Field Service Installation</span>
                <span className="font-bold">FREE</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Digital Warranty Coverage</span>
                <span className="font-bold">12 Months</span>
              </div>

              <div className="pt-3 border-t flex justify-between items-baseline">
                <div>
                  <span className="text-base font-black text-slate-900 block">Total Due</span>
                  <span className="text-[11px] text-slate-400">VAT Included</span>
                </div>
                <div className="text-3xl font-black text-[#0e2378]">
                  ₱{totalAmount.toLocaleString()}.00
                </div>
              </div>
            </div>

            {/* Simulated Payment Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Simulated Enterprise Payment</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-amber-800 font-bold pt-1">
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={e => setSimulateFailure(e.target.checked)}
                  className="rounded text-[#0e2378]"
                />
                Simulate Payment Failure (Demo)
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full bg-[#0e2378] hover:bg-[#193893] text-base font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-transform hover:scale-102 active:scale-95"
            >
              Confirm Order & Dispatch
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
