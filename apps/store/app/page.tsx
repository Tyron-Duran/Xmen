'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Truck,
  Clock,
  Wrench,
  ShoppingCart,
  Search,
  CheckCircle2,
  Filter,
  Eye,
  X,
  ArrowRight,
  Star,
  PhoneCall,
  Award,
  Sparkles,
  Check,
  Plus,
  Minus,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { addToCart, getCart, getCartCount, getCartTotal, type CartItem } from '@/lib/cart-state';

interface Product {
  sku: string;
  name: string;
  category: string;
  brand: string;
  price_php: string | number;
  requires_installation: boolean;
  warranty_months: number;
  image_path: string;
  description: string;
}

const SKU_IMAGE_MAP: Record<string, string> = {
  'GH-CCTV-001': '/_clone/images/cctv-dahua-dome-4mp.svg',
  'GH-CCTV-002': '/_clone/images/cctv-dahua-motorized.svg',
  'GH-CCTV-003': '/_clone/images/cctv-dahua-fisheye.svg',
  'GH-CCTV-004': '/_clone/images/cctv-hikvision-acusense.svg',
  'GH-ALM-001': '/_clone/images/alarm-patrolhawk-main.svg',
  'GH-ALM-002': '/_clone/images/alarm-pir-sensor.svg',
  'GH-ALM-003': '/_clone/images/alarm-outdoor-siren.svg',
  'GH-ALM-004': '/_clone/images/alarm-door-sensor.svg',
  'GH-LCK-001': '/_clone/images/lock-epic-es-ff730g.svg',
  'GH-LCK-002': '/_clone/images/lock-epic-rim.svg',
  'GH-LCK-003': '/_clone/images/access-terminal-biometric.svg',
  'GH-LCK-004': '/_clone/images/lock-magnetic-600lbs.svg',
  'GH-FNC-001': '/_clone/images/fence-energizer-steward.svg',
  'GH-FNC-002': '/_clone/images/fence-siren-beacon.svg',
  'GH-FNC-003': '/_clone/images/fence-strain-insulator.svg',
  'GH-FNC-004': '/_clone/images/fence-aluminum-wire.svg',
  'GH-RAD-001': '/_clone/images/radio-motorola-cp1660.svg',
  'GH-RAD-002': '/_clone/images/radio-baofeng-uv82.svg',
  'GH-RAD-003': '/_clone/images/radio-kenwood-tk3000.svg',
  'GH-NET-001': '/_clone/images/network-poe-switch-8p.svg',
  'GH-NET-002': '/_clone/images/network-cat6-reel.svg',
  'GH-NET-003': '/_clone/images/network-4g-router.svg',
  'GH-STR-001': '/_clone/images/storage-seagate-4tb.svg',
  'GH-STR-002': '/_clone/images/storage-wd-purple-6tb.svg'
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [cardQuantities, setCardQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch('/api/v1/catalog')
      .then(res => res.json())
      .then(data => {
        if (data.products) {
          setProducts(data.products.map((p: any) => ({
            ...p,
            price_php: p.pricePhp,
            requires_installation: p.requiresInstallation,
            warranty_months: p.warrantyMonths,
            image_path: SKU_IMAGE_MAP[p.sku] || '/_clone/images/cctv-dahua-dome-4mp.svg'
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    updateCartDisplay();
    const handleCartUpdated = () => updateCartDisplay();
    window.addEventListener('cart_updated', handleCartUpdated);
    return () => window.removeEventListener('cart_updated', handleCartUpdated);
  }, []);

  const updateCartDisplay = () => {
    setCartCount(getCartCount());
    setCartTotal(getCartTotal());
  };

  const getQty = (sku: string) => cardQuantities[sku] || 1;

  const setQty = (sku: string, val: number) => {
    setCardQuantities(prev => ({
      ...prev,
      [sku]: Math.max(1, Math.min(99, val))
    }));
  };

  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const qty = getQty(product.sku);
    addToCart(product, qty);
    setToastMessage(`✓ Added ${qty}x "${product.name}" to cart!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const categories = [
    { id: 'all', label: 'All Equipment' },
    { id: 'cctv', label: 'CCTV Kits' },
    { id: 'locks', label: 'Smart Locks' },
    { id: 'alarms', label: 'Burglar Alarms' },
    { id: 'fence', label: 'Electric Fencing' },
    { id: 'radios', label: 'Two-Way Radios' },
    { id: 'network', label: 'Enterprise Network' },
    { id: 'storage', label: 'CCTV Storage' }
  ];

  const brands = ['all', 'Dahua', 'Hikvision', 'GoodHand', 'Yale', 'Seagate', 'Ubiquiti'];

  const filteredProducts = products
    .filter(p => {
      const matchesCat = selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesBrand = selectedBrand === 'all' || p.brand.toLowerCase() === selectedBrand.toLowerCase();
      const matchesSearch = !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesBrand && matchesSearch;
    })
    .sort((a, b) => {
      const priceA = Number(a.price_php);
      const priceB = Number(b.price_php);
      if (sortBy === 'price-low') return priceA - priceB;
      if (sortBy === 'price-high') return priceB - priceA;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0e2378] text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-[#ffc107] text-sm sm:text-base font-bold animate-in slide-in-from-bottom">
          <CheckCircle2 className="w-6 h-6 text-[#ffc107] shrink-0" />
          <span>{toastMessage}</span>
          <Link
            href="/cart"
            className="ml-2 bg-[#ffc107] text-slate-900 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold hover:bg-yellow-400 transition-transform active:scale-95"
          >
            Open Cart
          </Link>
        </div>
      )}

      {/* Floating Sticky Cart Summary Pill */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-5 border border-slate-700 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#ffc107] text-slate-900 flex items-center justify-center font-black text-xs">
              {cartCount}
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider block">Cart Subtotal</span>
              <span className="text-sm sm:text-base font-black text-white">₱{cartTotal.toLocaleString()}.00</span>
            </div>
          </div>
          <Link
            href="/checkout"
            className="bg-[#D60000] hover:bg-red-700 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-full transition-all flex items-center gap-1.5 hover:shadow-lg active:scale-95"
          >
            Fast Checkout
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Top Notification Bar */}
      <div className="bg-[#09164d] text-white py-2 px-4 text-xs sm:text-sm font-semibold">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#ffc107]" />
            <span>Official GoodHand Distributor • 100% Genuine Certified Security Equipment</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <span className="flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-[#ffc107]" /> Dispatch Hotline: (02) 8888-GOOD
            </span>
            <span>Same-Day Metro Manila Delivery</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-[#0e2378] text-white py-4 px-4 sm:px-8 shadow-xl sticky top-0 z-40 border-b border-blue-900">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-7 h-7 text-[#ffc107]" />
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black tracking-tight block">GoodHand Security</span>
              <span className="block text-xs sm:text-sm text-blue-200 font-medium">Enterprise Integration Store (System A)</span>
            </div>
          </Link>

          <nav className="flex items-center gap-3 sm:gap-6 text-sm sm:text-base font-bold">
            <a
              href="#catalog"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-[#ffc107] transition-colors py-1 cursor-pointer flex items-center gap-1"
            >
              Hardware Catalog
            </a>
            <Link
              href="/cart"
              className="hover:text-[#ffc107] transition-colors flex items-center gap-2.5 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl border border-white/20 shadow-sm"
            >
              <ShoppingCart className="w-5 h-5 text-[#ffc107]" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="bg-[#D60000] text-white text-xs font-black px-2 py-0.5 rounded-full shadow animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link
              href="/demo"
              className="bg-[#ffc107] text-slate-900 px-4 py-2 rounded-xl font-black hover:bg-yellow-400 transition-all text-xs sm:text-sm shadow-md flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Demo Panel
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-[#0e2378] via-[#122e8f] to-[#081546] text-white py-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent_50%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/25 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold text-[#ffc107] backdrop-blur-md">
            <Award className="w-4 h-4" />
            PostgreSQL GiST Non-Double Booking & Stock Ledger Protected
          </div>

          <h1 className="text-3xl sm:text-6xl font-black tracking-tight leading-tight max-w-4xl mx-auto">
            Professional Security Equipment with Certified Field Installation
          </h1>

          <p className="max-w-3xl mx-auto text-blue-100 text-base sm:text-xl font-normal leading-relaxed">
            Protect your commercial premises and residential properties with authentic CCTV, smart digital locks, perimeter electric fences, and alarms.
          </p>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 pt-4 text-xs sm:text-sm text-blue-100">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-2xl border border-white/15 backdrop-blur-sm shadow-sm">
              <Truck className="w-5 h-5 text-[#ffc107]" />
              <span className="font-semibold">Metro Manila & Calabarzon Service Areas</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-2xl border border-white/15 backdrop-blur-sm shadow-sm">
              <Wrench className="w-5 h-5 text-[#ffc107]" />
              <span className="font-semibold">Certified Installation Included</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-2xl border border-white/15 backdrop-blur-sm shadow-sm">
              <Clock className="w-5 h-5 text-[#ffc107]" />
              <span className="font-semibold">12-Month Digital Warranty Guaranteed</span>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Search & Filter Controls */}
      <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-8 py-12 w-full space-y-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Hardware Catalog
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-1 font-medium">
                Showing {filteredProducts.length} verified products with real-time stock ledger synchronization
              </p>
            </div>

            {/* Search and Sort Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search brand, SKU, product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e2378] shadow-sm font-medium"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 rounded-2xl border border-slate-300 bg-white text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0e2378] shadow-sm cursor-pointer"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
                  selectedCategory === c.id
                    ? 'bg-[#0e2378] text-white shadow-md scale-105'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Brand Filter Chips */}
          <div className="flex items-center gap-2 text-xs sm:text-sm pt-2 border-t border-slate-100 overflow-x-auto pb-1">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] shrink-0">Brand:</span>
            {brands.map(b => (
              <button
                key={b}
                onClick={() => setSelectedBrand(b)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-colors ${
                  selectedBrand === b
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {b === 'all' ? 'All Brands' : b}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="p-16 text-center text-slate-500 font-medium">Loading security hardware catalog...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <p className="text-xl font-bold text-slate-800">No security equipment matches your current filters.</p>
            <button
              onClick={() => { setSelectedCategory('all'); setSelectedBrand('all'); setSearchQuery(''); }}
              className="bg-[#0e2378] text-white px-6 py-2.5 rounded-2xl font-bold text-sm hover:bg-[#193893]"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((p) => {
              const qty = getQty(p.sku);
              return (
                <div
                  key={p.sku}
                  onClick={() => setViewProduct(p)}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-2xl hover:border-blue-400 transition-all overflow-hidden flex flex-col cursor-pointer group"
                >
                  {/* Card Image Area */}
                  <div className="p-6 bg-slate-50 flex items-center justify-center border-b h-56 relative group-hover:bg-blue-50/40 transition-colors">
                    <img
                      src={p.image_path}
                      alt={p.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      In Stock
                    </div>
                    <span className="absolute top-3 right-3 bg-white/95 text-slate-700 text-[11px] font-black px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
                      {p.brand}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                        <span className="font-black uppercase text-[#0e2378] tracking-wider text-[11px]">
                          {p.category}
                        </span>
                        <div className="flex items-center text-amber-500 font-bold text-xs gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>4.9</span>
                        </div>
                      </div>

                      <h3 className="font-black text-slate-900 text-base sm:text-lg line-clamp-2 leading-snug group-hover:text-[#0e2378] transition-colors">
                        {p.name}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>

                      <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                        <span>SKU: {p.sku}</span>
                      </div>
                    </div>

                    {/* Price and Cart Buttons */}
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-2xl sm:text-3xl font-black text-[#D60000]">
                            ₱{Number(p.price_php).toLocaleString()}.00
                          </span>
                          {p.requires_installation && (
                            <span className="block text-[11px] text-emerald-700 font-extrabold mt-0.5">
                              ✓ Free Installation Included
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {p.warranty_months}mo warranty
                        </span>
                      </div>

                      {/* Quantity Stepper and Add to Cart */}
                      <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center border border-slate-300 rounded-xl bg-slate-50 shadow-inner">
                          <button
                            type="button"
                            onClick={() => setQty(p.sku, qty - 1)}
                            className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg font-bold"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-black text-slate-900">{qty}</span>
                          <button
                            type="button"
                            onClick={() => setQty(p.sku, qty + 1)}
                            className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg font-bold"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleAddToCart(p, e)}
                          className="flex-1 bg-[#0e2378] hover:bg-[#193893] text-white text-xs sm:text-sm font-black py-2.5 px-3 rounded-xl shadow-md transition-all hover:scale-102 active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <ShoppingCart className="w-4 h-4 text-[#ffc107]" />
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Product Detail Modal */}
      {viewProduct && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto relative border border-slate-200">
            <button
              onClick={() => setViewProduct(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2.5 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <div className="w-48 h-48 bg-slate-50 rounded-2xl border p-4 flex items-center justify-center shrink-0">
                <img src={viewProduct.image_path} alt={viewProduct.name} className="max-h-full max-w-full object-contain" />
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-xs font-black uppercase text-[#0e2378] tracking-wider">{viewProduct.category}</span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-bold text-slate-700">{viewProduct.brand}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">{viewProduct.name}</h3>
                <span className="font-mono text-xs text-slate-500 block">SKU: {viewProduct.sku}</span>
                <div className="text-3xl font-black text-[#D60000] pt-1">
                  ₱{Number(viewProduct.price_php).toLocaleString()}.00
                </div>
              </div>
            </div>

            <div className="border-t border-b py-5 space-y-3">
              <h4 className="font-black text-xs text-slate-500 uppercase tracking-wider">Specifications & Hardware Details</h4>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">{viewProduct.description}</p>
              <div className="grid grid-cols-2 gap-3 pt-3 text-xs sm:text-sm">
                <div className="bg-slate-50 p-4 rounded-2xl border">
                  <span className="text-slate-500 block font-semibold">Warranty Protection</span>
                  <span className="font-black text-slate-900">{viewProduct.warranty_months} Months Digital Hardware Warranty</span>
                </div>
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                  <span className="text-emerald-700 block font-semibold">Installation Status</span>
                  <span className="font-black text-emerald-950">{viewProduct.requires_installation ? 'Certified Field Dispatch Included' : 'Direct Dispatch'}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                onClick={() => setViewProduct(null)}
                className="w-1/2 py-3.5 border border-slate-300 rounded-2xl font-bold text-slate-700 hover:bg-slate-100 transition-colors text-sm sm:text-base"
              >
                Continue Browsing
              </button>
              <button
                onClick={() => {
                  handleAddToCart(viewProduct);
                  setViewProduct(null);
                }}
                className="w-1/2 py-3.5 bg-[#0e2378] hover:bg-[#193893] text-white rounded-2xl font-black shadow-xl transition-transform hover:scale-102 active:scale-95 text-sm sm:text-base flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5 text-[#ffc107]" />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
