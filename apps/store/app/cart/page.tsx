'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  ArrowRight,
  ShieldCheck,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  Tag,
  Check,
  Truck,
  Sparkles
} from 'lucide-react';
import { Button } from '@prototype/ui';
import { getCart, updateCartQuantity, removeFromCart, type CartItem } from '@/lib/cart-state';

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setCartItems(getCart());

    const handleCartUpdated = () => setCartItems(getCart());
    window.addEventListener('cart_updated', handleCartUpdated);
    return () => window.removeEventListener('cart_updated', handleCartUpdated);
  }, []);

  const handleUpdateQty = (sku: string, currentQty: number, delta: number) => {
    const updated = updateCartQuantity(sku, currentQty + delta);
    setCartItems([...updated]);
  };

  const handleRemove = (sku: string) => {
    const updated = removeFromCart(sku);
    setCartItems([...updated]);
  };

  const applyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    const code = couponCode.trim().toUpperCase();
    if (code === 'GOODHAND10') {
      setAppliedDiscount({ code: 'GOODHAND10', percent: 10 });
    } else if (code === 'DISPATCH5') {
      setAppliedDiscount({ code: 'DISPATCH5', percent: 5 });
    } else {
      setCouponError('Invalid promo code. Try "GOODHAND10" for 10% off.');
    }
  };

  const rawSubtotal = cartItems.reduce((sum, item) => sum + item.pricePhp * item.quantity, 0);
  const discountAmount = appliedDiscount ? Math.round((rawSubtotal * appliedDiscount.percent) / 100) : 0;
  const finalSubtotal = Math.max(0, rawSubtotal - discountAmount);
  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const hasInstallation = cartItems.some(item => item.requiresInstallation);

  if (!mounted) {
    return <div className="max-w-5xl mx-auto px-6 py-16 text-center text-slate-500 font-medium">Loading your shopping cart...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 min-h-screen text-slate-800 space-y-8">
      {/* Top Header */}
      <div className="border-b pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/" className="text-slate-500 hover:text-[#0e2378] text-sm flex items-center gap-1.5 font-bold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Hardware Catalog
          </Link>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 mt-2 tracking-tight">Your Shopping Cart</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1 font-medium">
            {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} selected for purchasing and certified field dispatch
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-800 bg-emerald-50 px-4 py-2.5 rounded-2xl font-bold border border-emerald-300 shadow-sm self-start sm:self-auto">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>PostgreSQL Stock Ledger Verified</span>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-16 text-center space-y-6">
          <ShoppingCart className="w-20 h-20 text-slate-300 mx-auto" />
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800">Your shopping cart is currently empty</h2>
          <p className="text-slate-600 text-base max-w-md mx-auto">
            Browse through our CCTV, Smart Locks, Alarm Kits, and Perimeter Fencing to add equipment to your installation queue.
          </p>
          <Link href="/">
            <Button variant="primary" size="lg" className="bg-[#0e2378] hover:bg-[#193893] text-base font-extrabold px-8 py-3.5 rounded-2xl shadow-xl mt-3">
              Explore Hardware Catalog
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items List (2 Columns) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100 p-6 sm:p-8 space-y-6">
              {cartItems.map((item) => (
                <div key={item.sku} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-6 first:pt-0">
                  {/* Thumbnail & Meta */}
                  <div className="flex items-center gap-5 flex-1">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-50 border rounded-2xl p-3 flex items-center justify-center shrink-0 shadow-inner">
                      <img src={item.imagePath} alt={item.name} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#0e2378] uppercase tracking-wider">{item.category}</span>
                        <span className="text-xs font-mono text-slate-400">• {item.sku}</span>
                      </div>
                      <h3 className="font-black text-base sm:text-lg text-slate-900 leading-snug">{item.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {item.requiresInstallation && (
                          <span className="text-xs text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg font-bold border border-emerald-200">
                            ✓ Installation Included
                          </span>
                        )}
                        <span className="text-xs text-slate-500 font-semibold">
                          {item.warrantyMonths}mo Warranty
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Stepper & Price */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-0 pt-4 sm:pt-0">
                    <div className="flex items-center border border-slate-300 rounded-2xl bg-slate-50 p-1 shadow-inner">
                      <button
                        onClick={() => handleUpdateQty(item.sku, item.quantity, -1)}
                        className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-white rounded-xl font-bold transition-colors"
                        title="Decrease"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-9 text-center text-base font-black text-slate-900">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQty(item.sku, item.quantity, 1)}
                        className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-white rounded-xl font-bold transition-colors"
                        title="Increase"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right min-w-[120px]">
                      <div className="text-xl sm:text-2xl font-black text-[#D60000]">
                        ₱{(item.pricePhp * item.quantity).toLocaleString()}.00
                      </div>
                      <span className="text-xs text-slate-400 block font-medium">
                        ₱{item.pricePhp.toLocaleString()}.00 each
                      </span>
                    </div>

                    <button
                      onClick={() => handleRemove(item.sku)}
                      className="text-slate-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Service Guarantee Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 flex items-center gap-4 text-xs sm:text-sm text-blue-900">
              <Truck className="w-6 h-6 text-[#0e2378] shrink-0" />
              <div>
                <span className="font-black block text-sm text-[#0e2378]">GoodHand Field Service Coverage</span>
                <span>All scheduled items are physically inspected, loaded, and installed by certified technicians with 12-month digital warranty activation.</span>
              </div>
            </div>
          </div>

          {/* Order Summary & Checkout Card (1 Column) */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6 sticky top-24">
              <h2 className="text-xl font-black text-slate-900 border-b pb-4">Order Summary</h2>

              {/* Promo Code Input */}
              <form onSubmit={applyPromo} className="space-y-2">
                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider">
                  Discount Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter GOODHAND10"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-sm uppercase font-mono font-bold focus:ring-2 focus:ring-[#0e2378] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {appliedDiscount && (
                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 pt-1">
                    <Check className="w-3.5 h-3.5" /> Code &quot;{appliedDiscount.code}&quot; applied (-{appliedDiscount.percent}%)
                  </span>
                )}
                {couponError && (
                  <span className="text-xs text-red-600 font-semibold block pt-1">
                    {couponError}
                  </span>
                )}
              </form>

              {/* Calculations */}
              <div className="space-y-3 pt-3 border-t text-sm font-semibold text-slate-600">
                <div className="flex justify-between">
                  <span>Hardware Subtotal</span>
                  <span className="text-slate-900">₱{rawSubtotal.toLocaleString()}.00</span>
                </div>

                {appliedDiscount && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount ({appliedDiscount.percent}%)</span>
                    <span>-₱{discountAmount.toLocaleString()}.00</span>
                  </div>
                )}

                <div className="flex justify-between text-emerald-700">
                  <span>Certified Installation</span>
                  <span className="font-bold">FREE (Included)</span>
                </div>

                <div className="flex justify-between text-emerald-700">
                  <span>Metro Manila Dispatch</span>
                  <span className="font-bold">FREE</span>
                </div>

                <div className="pt-4 border-t flex justify-between items-baseline">
                  <div>
                    <span className="text-base font-black text-slate-900 block">Total Due</span>
                    <span className="text-[11px] text-slate-400 font-medium">VAT & service charges included</span>
                  </div>
                  <div className="text-3xl font-black text-[#0e2378]">
                    ₱{finalSubtotal.toLocaleString()}.00
                  </div>
                </div>
              </div>

              {/* Checkout CTA */}
              <Link href="/checkout">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full bg-[#0e2378] hover:bg-[#193893] text-base font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 mt-4 transition-transform hover:scale-102 active:scale-95"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-5 h-5 text-[#ffc107]" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
