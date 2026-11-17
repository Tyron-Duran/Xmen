export interface CartItem {
  sku: string;
  name: string;
  category: string;
  brand: string;
  pricePhp: number;
  imagePath: string;
  quantity: number;
  requiresInstallation: boolean;
  warrantyMonths: number;
}

const CART_STORAGE_KEY = 'goodhand_cart';

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      // Default initial item so cart isn't empty on first visit
      const initial: CartItem[] = [
        {
          sku: 'GH-CCTV-001',
          name: 'Dahua DH-IPC-HDBW1431E-S4 4MP Entry IR Fixed Dome Camera',
          category: 'cctv',
          brand: 'Dahua',
          pricePhp: 3850,
          imagePath: '/_clone/images/cctv-dahua-dome-4mp.svg',
          quantity: 2,
          requiresInstallation: true,
          warrantyMonths: 12
        }
      ];
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('cart_updated'));
  } catch (err) {
    console.error('Failed to save cart to localStorage', err);
  }
}

export function addToCart(product: any, qty: number = 1): CartItem[] {
  const current = getCart();
  const existingIndex = current.findIndex(item => item.sku === product.sku);
  const price = typeof product.price_php === 'number' ? product.price_php : parseFloat(product.price_php || product.pricePhp || '0');

  if (existingIndex >= 0) {
    current[existingIndex].quantity = Math.min(99, current[existingIndex].quantity + qty);
  } else {
    current.push({
      sku: product.sku,
      name: product.name,
      category: product.category,
      brand: product.brand || 'GoodHand',
      pricePhp: price,
      imagePath: product.image_path || product.imagePath || '/_clone/images/cctv-dahua-dome-4mp.svg',
      quantity: Math.min(99, Math.max(1, qty)),
      requiresInstallation: product.requires_installation ?? product.requiresInstallation ?? false,
      warrantyMonths: product.warranty_months || product.warrantyMonths || 12
    });
  }

  saveCart(current);
  return current;
}

export function updateCartQuantity(sku: string, newQty: number): CartItem[] {
  const current = getCart();
  if (newQty <= 0) {
    return removeFromCart(sku);
  }
  const item = current.find(i => i.sku === sku);
  if (item) {
    item.quantity = Math.min(99, Math.max(1, newQty));
    saveCart(current);
  }
  return current;
}

export function removeFromCart(sku: string): CartItem[] {
  const filtered = getCart().filter(i => i.sku !== sku);
  saveCart(filtered);
  return filtered;
}

export function getCartTotal(): number {
  return getCart().reduce((sum, item) => sum + item.pricePhp * item.quantity, 0);
}

export function getCartCount(): number {
  return getCart().reduce((count, item) => count + item.quantity, 0);
}
