import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  upsertStoreSettingsToSupabase,
  upsertCategoryToSupabase,
  deleteCategoryFromSupabase,
  upsertProductToSupabase,
  deleteProductFromSupabase,
  upsertCustomerToSupabase,
  deleteCustomerFromSupabase,
  upsertOrderToSupabase,
  upsertTableToSupabase,
  deleteTableFromSupabase,
  upsertComandaToSupabase,
  deleteComandaFromSupabase,
  upsertWaiterToSupabase,
  deleteWaiterFromSupabase,
  upsertDriverToSupabase,
  deleteDriverFromSupabase,
  syncCategoriesFromSupabase,
  syncProductsFromSupabase,
  syncOrdersFromSupabase,
  syncTablesFromSupabase,
  syncComandasFromSupabase,
  syncCustomersFromSupabase,
  syncStoreSettingsFromSupabase,
  exportAllDataToSupabase,
} from '../services/supabaseService';
import {
  handleDigitalMenuOrderAlerts,
  getAlertedOrderIds,
  markOrderAsAlerted,
  markOrdersAsAlerted,
  markOrderObjectAlerted,
  isOrderAlerted,
  isOrderObjectAlerted,
} from '../utils/orderAlerts';
import { cleanPhoneNumber, buildWhatsAppLink } from '../utils/whatsappHelper';
import { getSWRCache, setSWRCache, isRecentLocalMutation } from '../utils/swrCache';
import {
  Product,
  Category,
  ProductExtraGroup,
  Customer,
  Order,
  Table,
  Comanda,
  Waiter,
  DeliveryDriver,
  StoreSettings,
  CartItem,
  OrderStatus,
  OrderType,
  PaymentMethod,
  ToastNotification,
} from '../types';

export const playNotificationSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    
    // Tone 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Tone 2
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12); // A5
    gain2.gain.setValueAtTime(0.2, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.4);
  } catch {
    // Autoplay restrictions or audio context error
  }
};

import {
  INITIAL_CATEGORIES,
  INITIAL_EXTRA_GROUPS,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_TABLES,
  INITIAL_COMANDAS,
  INITIAL_ORDERS,
  INITIAL_WAITERS,
  INITIAL_DRIVERS,
  INITIAL_STORE_SETTINGS,
  INITIAL_USERS,
} from '../data/mockData';
import { AppUser } from '../types';

export type NavigationTab =
  | 'resumo'
  | 'faturamento'
  | 'pedidos'
  | 'pdv'
  | 'mesas'
  | 'comandas'
  | 'clientes'
  | 'produtos'
  | 'categorias'
  | 'cardapio_publico'
  | 'whatsapp'
  | 'garcons'
  | 'entregadores'
  | 'usuarios'
  | 'config';

interface AppContextType {
  // Navigation & View Mode
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  viewMode: 'admin' | 'public';
  setViewMode: (mode: 'admin' | 'public') => void;

  // Users & Auth
  users: AppUser[];
  currentUser: AppUser | null;
  loginUser: (identifier: string, pinInput?: string) => { success: boolean; message?: string };
  logoutUser: () => void;
  addUser: (user: Omit<AppUser, 'id'>) => void;
  updateUser: (id: string, user: Partial<AppUser>) => void;
  deleteUser: (id: string) => void;

  // Store Settings
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;

  // Categories & Products & Extras
  categories: Category[];
  products: Product[];
  extraGroups: ProductExtraGroup[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductAvailable: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Orders
  orders: Order[];
  createOrder: (orderData: Omit<Order, 'id' | 'code' | 'createdAt'>) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateOrderPaymentMethod: (orderId: string, paymentMethod: PaymentMethod) => void;
  deleteOrder: (orderId: string) => void;

  // Tables
  tables: Table[];
  addTable: (data: { name?: string; capacity?: number; waiterName?: string; customerName?: string; status?: Table['status'] }) => Table;
  deleteTable: (id: number) => void;
  updateTableStatus: (tableId: number, status: Table['status'], customerName?: string) => void;
  updateTable: (id: number, data: Partial<Pick<Table, 'name' | 'capacity' | 'waiterName' | 'customerName' | 'status'>>) => void;
  addItemToTable: (tableId: number, item: CartItem) => void;
  closeTableBill: (tableId: number) => void;

  // Comandas
  comandas: Comanda[];
  createComanda: (customerName: string, customerPhone?: string, tableNumber?: number) => Comanda;
  addItemToComanda: (comandaId: string, item: CartItem) => void;
  closeComanda: (comandaId: string, paymentMethod: PaymentMethod, serviceFee?: number) => void;

  // Customers
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'totalSpent' | 'totalOrders' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Waiters & Drivers
  waiters: Waiter[];
  addWaiter: (data: { name: string; phone: string }) => void;
  deleteWaiter: (id: string) => void;
  drivers: DeliveryDriver[];
  addDriver: (data: { name: string; phone: string }) => void;
  deleteDriver: (id: string) => void;

  // Cart for PDV / Public Menu
  pdvCart: CartItem[];
  addToPdvCart: (item: CartItem) => void;
  removeFromPdvCart: (index: number) => void;
  updatePdvCartQty: (index: number, quantity: number) => void;
  clearPdvCart: () => void;

  // Receipt Modal trigger
  selectedReceiptOrder: Order | null;
  setSelectedReceiptOrder: (order: Order | null) => void;

  // Helper for WhatsApp messaging & Checkout Link Generation
  buildOrderWhatsAppText: (order: Order) => string;
  sendOrderToWhatsApp: (order: Order, phoneOverride?: string) => void;
  generateWhatsAppCheckoutLink: (order: Order, phoneOverride?: string) => string;
  generateCartWhatsAppCheckoutLink: (
    items: CartItem[],
    customerInfo: { name: string; phone?: string; address?: string },
    orderType: OrderType,
    paymentMethod: PaymentMethod,
    deliveryFee?: number,
    subtotal?: number,
    total?: number
  ) => string;

  // Toast Notifications & Sound
  toasts: ToastNotification[];
  addToast: (toast: Omit<ToastNotification, 'id' | 'createdAt'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;

  // Backup & Storage Management
  lastAutoBackup: string | null;
  exportDatabaseJSON: () => void;
  importDatabaseJSON: (jsonString: string) => boolean;
  performManualBackup: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to safely load state from localStorage with fallback and object merging
const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    if (parsed === null || parsed === undefined) return fallback;
    if (typeof fallback === 'object' && !Array.isArray(fallback) && fallback !== null) {
      return { ...fallback, ...parsed };
    }
    return parsed as T;
  } catch (err) {
    console.warn(`[Storage] Erro ao carregar '${key}' do localStorage:`, err);
    return fallback;
  }
};

// Helper to broadcast state sync across open tabs, windows and local components
const broadcastSyncKey = (key: string, value?: string) => {
  if (typeof window === 'undefined') return;
  try {
    // Record SWR mutation timestamp
    localStorage.setItem(`fzp_swr_meta_${key}`, JSON.stringify({ key, timestamp: Date.now(), updatedBy: 'admin' }));

    // Dispatch DOM Custom Event for instant same-window reactivity
    window.dispatchEvent(
      new CustomEvent('fzp_cache_update', {
        detail: { key, value },
      })
    );

    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('fzp_app_sync');
      channel.postMessage({ key, timestamp: Date.now() });
      channel.close();
    }
  } catch {}
};

// Helper to write to localStorage silently without triggering same-window custom events
const writeStorageSilent = (key: string, value: string): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn(`[Storage Warning] Impossível salvar ${key} no localStorage:`, err);
    try {
      localStorage.removeItem('fzp_auto_backup');
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
};

// Helper to safely write to localStorage without throwing QuotaExceededError
const safeSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    broadcastSyncKey(key, value);
    return true;
  } catch (err) {
    console.warn(`[Storage Warning] Impossível salvar ${key} no localStorage:`, err);
    if (key === 'fzp_auto_backup') {
      try {
        localStorage.removeItem('fzp_auto_backup');
      } catch {}
      return false;
    }
    try {
      localStorage.removeItem('fzp_auto_backup');
      localStorage.setItem(key, value);
      broadcastSyncKey(key, value);
      return true;
    } catch {
      if (key === 'fzp_orders') {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed) && parsed.length > 25) {
            const pruned = parsed.slice(0, 25);
            localStorage.setItem(key, JSON.stringify(pruned));
            broadcastSyncKey(key, JSON.stringify(pruned));
            return true;
          }
        } catch {}
      }
      return false;
    }
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<NavigationTab>(() => {
    if (typeof window !== 'undefined' && window.location) {
      const search = window.location.search.toLowerCase();
      const match = search.match(/tab=([a-z_]+)/);
      if (match && match[1]) {
        return match[1] as NavigationTab;
      }
    }
    return loadFromStorage<NavigationTab>('fzp_active_tab', 'resumo');
  });

  const setActiveTab = useCallback((tab: NavigationTab) => {
    setActiveTabState(tab);
    safeSetItem('fzp_active_tab', tab);
    if (typeof window !== 'undefined' && window.history) {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const [viewMode, setViewModeState] = useState<'admin' | 'public'>(() => {
    if (typeof window !== 'undefined' && window.location) {
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (
        search.includes('view=admin') ||
        search.includes('mode=admin') ||
        search.includes('panel=admin') ||
        hash === '#admin'
      ) {
        return 'admin';
      }
      if (
        search.includes('view=public') ||
        search.includes('mode=cardapio') ||
        search.includes('mode=public') ||
        search.includes('cardapio') ||
        search.includes('menu=') ||
        hash === '#cardapio'
      ) {
        return 'public';
      }
    }
    const saved = localStorage.getItem('fzp_view_mode');
    return saved === 'public' ? 'public' : 'admin';
  });

  const setViewMode = useCallback((mode: 'admin' | 'public') => {
    setViewModeState(mode);
    safeSetItem('fzp_view_mode', mode);
    if (typeof window !== 'undefined' && window.history) {
      const url = new URL(window.location.href);
      if (mode === 'public') {
        url.searchParams.set('view', 'public');
      } else {
        url.searchParams.set('view', 'admin');
        url.searchParams.delete('cardapio');
        url.searchParams.delete('mode');
      }
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  // Sync activeTab and viewMode to URL and localStorage on change/mount
  useEffect(() => {
    if (activeTab) {
      safeSetItem('fzp_active_tab', activeTab);
      if (typeof window !== 'undefined' && window.history) {
        const url = new URL(window.location.href);
        if (url.searchParams.get('tab') !== activeTab) {
          url.searchParams.set('tab', activeTab);
          window.history.replaceState({}, '', url.toString());
        }
      }
    }
  }, [activeTab]);

  useEffect(() => {
    if (viewMode) {
      safeSetItem('fzp_view_mode', viewMode);
    }
  }, [viewMode]);

  // Persistent States
  const [users, setUsers] = useState<AppUser[]>(() => loadFromStorage('fzp_users', INITIAL_USERS));

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('fzp_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      } catch {}
    }
    const isExplicitlyLoggedOut = localStorage.getItem('fzp_user_logged_out');
    if (isExplicitlyLoggedOut === 'true') return null;
    return INITIAL_USERS[0] || null;
  });

  const [settings, setSettings] = useState<StoreSettings>(() => loadFromStorage('fzp_settings', INITIAL_STORE_SETTINGS));
  const [categories, setCategories] = useState<Category[]>(() => loadFromStorage('fzp_categories', INITIAL_CATEGORIES));
  const [products, setProducts] = useState<Product[]>(() => loadFromStorage('fzp_products', INITIAL_PRODUCTS));
  const [extraGroups] = useState<ProductExtraGroup[]>(INITIAL_EXTRA_GROUPS);
  const [customers, setCustomers] = useState<Customer[]>(() => loadFromStorage('fzp_customers', INITIAL_CUSTOMERS));
  const [orders, setOrders] = useState<Order[]>(() => loadFromStorage('fzp_orders', INITIAL_ORDERS));
  const [tables, setTables] = useState<Table[]>(() => loadFromStorage('fzp_tables', INITIAL_TABLES));
  const [comandas, setComandas] = useState<Comanda[]>(() => loadFromStorage('fzp_comandas', INITIAL_COMANDAS));
  const [waiters, setWaiters] = useState<Waiter[]>(() => loadFromStorage('fzp_waiters', INITIAL_WAITERS));
  const [drivers, setDrivers] = useState<DeliveryDriver[]>(() => loadFromStorage('fzp_drivers', INITIAL_DRIVERS));

  // Auto-Save Effects (Run whenever state updates)
  useEffect(() => { writeStorageSilent('fzp_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { writeStorageSilent('fzp_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { writeStorageSilent('fzp_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { writeStorageSilent('fzp_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { writeStorageSilent('fzp_customers', JSON.stringify(customers)); }, [customers]);
  useEffect(() => { writeStorageSilent('fzp_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { writeStorageSilent('fzp_tables', JSON.stringify(tables)); }, [tables]);
  useEffect(() => { writeStorageSilent('fzp_comandas', JSON.stringify(comandas)); }, [comandas]);
  useEffect(() => { writeStorageSilent('fzp_waiters', JSON.stringify(waiters)); }, [waiters]);
  useEffect(() => { writeStorageSilent('fzp_drivers', JSON.stringify(drivers)); }, [drivers]);

  // Processed order alert IDs to avoid duplicate alerts across refreshes
  const processedOrderAlertsRef = React.useRef<Set<string>>(new Set());
  const appInitTimestampRef = React.useRef<number>(Date.now());
  const isBootstrapReadyRef = React.useRef<boolean>(false);

  // Initialize immediately from persistent storage, current orders state, and INITIAL_ORDERS
  if (processedOrderAlertsRef.current.size === 0) {
    const existingAlerted = getAlertedOrderIds();
    existingAlerted.forEach((id) => processedOrderAlertsRef.current.add(id));
    orders.forEach((ord) => {
      if (ord?.id) processedOrderAlertsRef.current.add(String(ord.id).trim());
      if (ord?.code) processedOrderAlertsRef.current.add(String(ord.code).trim());
    });
    INITIAL_ORDERS.forEach((ord) => {
      if (ord?.id) processedOrderAlertsRef.current.add(String(ord.id).trim());
      if (ord?.code) processedOrderAlertsRef.current.add(String(ord.code).trim());
    });
  }

  // Helper to trigger audio siren & kitchen thermal print for new online orders
  const triggerNewOnlineOrderAlert = (ord: Order) => {
    if (!ord || !ord.id) return;
    const ordIdStr = String(ord.id).trim();
    const ordCodeStr = ord.code ? String(ord.code).trim() : '';

    // If order was already alerted or is known in persistent storage, ignore
    if (
      processedOrderAlertsRef.current.has(ordIdStr) ||
      (ordCodeStr && processedOrderAlertsRef.current.has(ordCodeStr)) ||
      isOrderAlerted(ordIdStr) ||
      (ordCodeStr && isOrderAlerted(ordCodeStr)) ||
      isOrderObjectAlerted(ord)
    ) {
      return;
    }

    // Immediately mark as processed in memory and persistent storage
    processedOrderAlertsRef.current.add(ordIdStr);
    if (ordCodeStr) processedOrderAlertsRef.current.add(ordCodeStr);
    markOrderObjectAlerted(ord);

    // If app is still bootstrapping or order is from before app initialization, ignore
    if (!isBootstrapReadyRef.current) {
      return;
    }

    // Historical order safeguard: If order timestamp is earlier than or equal to current page boot, do not alert
    if (ord.createdAt) {
      const orderTimestamp = new Date(ord.createdAt).getTime();
      if (!isNaN(orderTimestamp) && orderTimestamp <= appInitTimestampRef.current) {
        return;
      }
    }

    const isPdv = ord.type === 'pdv';
    const isFinalized = ord.status === 'entregue' || ord.status === 'cancelado';

    if (!isPdv && !isFinalized) {
      // 1. Audio siren & auto print ticket for kitchen
      handleDigitalMenuOrderAlerts(ord, setSelectedReceiptOrder);

      // 2. Notification toast in store
      const itemsCount = ord.items ? ord.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
      addToast({
        title: `🔔 Novo Pedido Cardápio Digital ${ord.code || '#' + String(ord.id).slice(-4)}`,
        message: `${ord.customer?.name || 'Cliente'} — ${itemsCount} itens — R$ ${(ord.total || 0).toFixed(2).replace('.', ',')}`,
        type: 'order_cardapio',
        order: ord,
        skipSound: true,
      });
    }
  };

  // Enable live alerts after initial mount bootstrap window (3.5s)
  useEffect(() => {
    const timer = setTimeout(() => {
      isBootstrapReadyRef.current = true;
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  // Real-Time Cross-Tab & Cross-Window Instant Sync (storage events & BroadcastChannel)
  useEffect(() => {
    const applySyncedData = <T,>(
      setter: React.Dispatch<React.SetStateAction<T>>,
      rawJson: string,
      transform?: (val: any) => T
    ) => {
      try {
        const parsed = JSON.parse(rawJson);
        const transformed = transform ? transform(parsed) : (parsed as T);
        setter((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(transformed)) {
            return prev;
          }
          return transformed;
        });
      } catch {}
    };

    const syncKeyToState = (key: string, raw: string) => {
      if (key === 'fzp_products') {
        applySyncedData(setProducts, raw, (list: Product[]) =>
          list.map((p) => ({
            ...p,
            extraGroupIds: p.extraGroupIds || [],
            customExtras: p.customExtras || [],
          }))
        );
      } else if (key === 'fzp_categories') {
        applySyncedData(setCategories, raw);
      } else if (key === 'fzp_settings') {
        applySyncedData(setSettings, raw);
      } else if (key === 'fzp_orders') {
        applySyncedData(setOrders, raw);
        if (viewMode !== 'public') {
          try {
            const parsed: Order[] = JSON.parse(raw);
            parsed.forEach((ord) => {
              const ordIdStr = String(ord.id || '').trim();
              const ordCodeStr = ord.code ? String(ord.code).trim() : '';
              if (!isBootstrapReadyRef.current) {
                // Register silently during boot
                if (ordIdStr) processedOrderAlertsRef.current.add(ordIdStr);
                if (ordCodeStr) processedOrderAlertsRef.current.add(ordCodeStr);
                markOrderObjectAlerted(ord);
              } else if (ordIdStr && !processedOrderAlertsRef.current.has(ordIdStr) && !isOrderObjectAlerted(ord)) {
                triggerNewOnlineOrderAlert(ord);
              }
            });
          } catch {}
        }
      } else if (key === 'fzp_tables') {
        applySyncedData(setTables, raw);
      } else if (key === 'fzp_comandas') {
        applySyncedData(setComandas, raw);
      }
    };

    const handleStorageSync = (e: StorageEvent) => {
      if (!e.key || !e.newValue) return;
      syncKeyToState(e.key, e.newValue);
    };

    const handleCustomCacheSync = (e: Event) => {
      const customEvt = e as CustomEvent<{ key: string; value?: string }>;
      if (!customEvt.detail || !customEvt.detail.key) return;
      const key = customEvt.detail.key;
      const raw = customEvt.detail.value || localStorage.getItem(key);
      if (!raw) return;
      syncKeyToState(key, raw);
    };

    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel('fzp_app_sync');
      channel.onmessage = (e) => {
        if (!e.data || !e.data.key) return;
        const key = e.data.key;
        const raw = localStorage.getItem(key);
        if (!raw) return;
        syncKeyToState(key, raw);
      };
    }

    window.addEventListener('storage', handleStorageSync);
    window.addEventListener('fzp_cache_update', handleCustomCacheSync);
    return () => {
      window.removeEventListener('storage', handleStorageSync);
      window.removeEventListener('fzp_cache_update', handleCustomCacheSync);
      if (channel) channel.close();
    };
  }, [viewMode]);

  // Seed initial order IDs into processed set on mount to prevent false alerts on historical orders
  useEffect(() => {
    if (orders && orders.length > 0) {
      orders.forEach((ord) => {
        if (ord?.id) processedOrderAlertsRef.current.add(String(ord.id).trim());
        if (ord?.code) processedOrderAlertsRef.current.add(String(ord.code).trim());
        markOrderObjectAlerted(ord);
      });
    }
  }, []);

  // Supabase Initial Sync (loads remote data if Supabase is configured)
  useEffect(() => {
    let isMounted = true;
    async function loadFromSupabase() {
      try {
        const [supSettings, supCategories, supProducts, supTables, supComandas, supCustomers, supOrders] = await Promise.all([
          syncStoreSettingsFromSupabase(),
          syncCategoriesFromSupabase(),
          syncProductsFromSupabase(),
          syncTablesFromSupabase(),
          syncComandasFromSupabase(),
          syncCustomersFromSupabase(),
          syncOrdersFromSupabase(),
        ]);

        if (!isMounted) return;
        if (supSettings) setSettings(supSettings);
        if (supCategories && supCategories.length > 0) setCategories(supCategories);
        if (supProducts && supProducts.length > 0) setProducts(supProducts);
        if (supTables && supTables.length > 0) setTables(supTables);
        if (supComandas && supComandas.length > 0) setComandas(supComandas);
        if (supCustomers && supCustomers.length > 0) setCustomers(supCustomers);
        if (supOrders && supOrders.length > 0) {
          // Pre-seed all existing remote orders so they NEVER trigger false alerts on page load/refresh
          supOrders.forEach((o) => {
            if (o?.id) processedOrderAlertsRef.current.add(String(o.id).trim());
            if (o?.code) processedOrderAlertsRef.current.add(String(o.code).trim());
            markOrderObjectAlerted(o);
          });
          setOrders(supOrders);
        }
        isBootstrapReadyRef.current = true;
      } catch (err) {
        // Fallback to local storage
        isBootstrapReadyRef.current = true;
      }
    }
    loadFromSupabase();
    return () => {
      isMounted = false;
    };
  }, []);

  // Periodic polling to fetch new orders from Supabase (for multi-device setups)
  useEffect(() => {
    if (viewMode === 'public') return;

    const interval = setInterval(async () => {
      try {
        if (!isBootstrapReadyRef.current) return;
        const supOrders = await syncOrdersFromSupabase();
        if (supOrders && supOrders.length > 0) {
          let hasNewOrders = false;
          supOrders.forEach((ord) => {
            const ordIdStr = String(ord.id || '').trim();
            const ordCodeStr = ord.code ? String(ord.code).trim() : '';
            const alreadyKnown =
              (ordIdStr && processedOrderAlertsRef.current.has(ordIdStr)) ||
              (ordCodeStr && processedOrderAlertsRef.current.has(ordCodeStr)) ||
              isOrderObjectAlerted(ord);

            if (!alreadyKnown) {
              hasNewOrders = true;
              triggerNewOnlineOrderAlert(ord);
            }
          });

          if (hasNewOrders) {
            setOrders(supOrders);
            writeStorageSilent('fzp_orders', JSON.stringify(supOrders));
          }
        }
      } catch {}
    }, 6000);

    return () => clearInterval(interval);
  }, [viewMode]);

  useEffect(() => {
    if (currentUser) {
      safeSetItem('fzp_current_user', JSON.stringify(currentUser));
      try { localStorage.removeItem('fzp_user_logged_out'); } catch {}
    } else {
      try { localStorage.removeItem('fzp_current_user'); } catch {}
    }
  }, [currentUser]);

  const loginUser = (identifier: string, pinInput?: string): { success: boolean; message?: string } => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPin = (pinInput || '').trim();

    let found = users.find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        u.id.toLowerCase() === cleanId ||
        u.name.toLowerCase() === cleanId
    );

    if (!found && !pinInput && cleanId) {
      found = users.find((u) => u.pin === cleanId);
    }

    if (!found) {
      return { success: false, message: 'Usuário não encontrado. Verifique os dados inseridos.' };
    }

    if (found.status === 'inativo') {
      return { success: false, message: 'Usuário está inativo. Fale com o gerente ou administrador.' };
    }

    const requiredPin = found.pin;
    const providedPin = pinInput !== undefined && pinInput !== '' ? cleanPin : cleanId;

    if (requiredPin !== providedPin && found.pin !== providedPin) {
      return { success: false, message: 'PIN de acesso incorreto. Tente novamente.' };
    }

    setCurrentUser(found);
    setViewMode('admin');

    if (found.role === 'garcom') {
      setActiveTab('mesas');
    }

    addToast({
      title: `Bem-vindo(a), ${found.name}!`,
      message: `Acesso realizado como ${found.role === 'admin' ? 'Administrador' : 'Garçom'}.`,
      type: 'success',
    });

    return { success: true };
  };

  const logoutUser = () => {
    setCurrentUser(null);
    try { localStorage.removeItem('fzp_current_user'); } catch {}
    setViewMode('admin');
    addToast({
      title: 'Sessão encerrada',
      message: 'Sua sessão foi encerrada. Para acessar a área de administração novamente, informe o login e senha/PIN.',
      type: 'info',
    });
  };

  const addUser = (userData: Omit<AppUser, 'id'>) => {
    const newUser: AppUser = {
      ...userData,
      id: `usr-${Date.now()}`,
    };
    setUsers((prev) => [newUser, ...prev]);
    addToast({
      title: 'Usuário criado com sucesso',
      message: `Novo ${userData.role === 'admin' ? 'Administrador' : 'Garçom'} adicionado: ${userData.name}`,
      type: 'success',
    });
  };

  const updateUser = (id: string, userData: Partial<AppUser>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...userData };
          if (currentUser?.id === id) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
  };

  const deleteUser = (id: string) => {
    const targetUser = users.find((u) => u.id === id);
    if (!targetUser) return;

    // Prevent deleting the last admin
    const remainingAdmins = users.filter((u) => u.role === 'admin' && u.id !== id);
    if (targetUser.role === 'admin' && remainingAdmins.length === 0) {
      addToast({
        title: 'Ação não permitida',
        message: 'O sistema deve ter pelo menos um usuário Administrador.',
        type: 'warning',
      });
      return;
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));

    if (currentUser?.id === id) {
      setCurrentUser(null);
    }
  };

  // PDV / Store Cart
  const [pdvCart, setPdvCart] = useState<CartItem[]>(() => loadFromStorage<CartItem[]>('fzp_pdv_cart', []));

  useEffect(() => {
    safeSetItem('fzp_pdv_cart', JSON.stringify(pdvCart));
  }, [pdvCart]);

  // Receipt modal
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  // Toast Notifications & Sound State
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Periodic Backup & Storage Management State
  const [lastAutoBackup, setLastAutoBackup] = useState<string | null>(() => {
    return localStorage.getItem('fzp_last_backup_time');
  });

  const performAutoBackup = useCallback(() => {
    try {
      const nowIso = new Date().toISOString();
      safeSetItem('fzp_last_backup_time', nowIso);
      setLastAutoBackup(nowIso);

      // Save key entities to ensure standard state is preserved
      safeSetItem('fzp_settings', JSON.stringify(settings));
      safeSetItem('fzp_products', JSON.stringify(products));
      safeSetItem('fzp_categories', JSON.stringify(categories));
      safeSetItem('fzp_customers', JSON.stringify(customers));
      safeSetItem('fzp_orders', JSON.stringify(orders));
      safeSetItem('fzp_tables', JSON.stringify(tables));
      safeSetItem('fzp_comandas', JSON.stringify(comandas));

      const backupPayload = {
        version: '1.0.0',
        backupTimestamp: nowIso,
        settings,
        products,
        categories,
        customers,
        orders,
        tables,
        comandas,
        users,
        waiters,
        drivers,
      };
      // Try writing full backup snapshot if quota allows
      safeSetItem('fzp_auto_backup', JSON.stringify(backupPayload));
      return true;
    } catch (err) {
      console.warn('Erro ao realizar backup automático:', err);
      return false;
    }
  }, [settings, products, categories, customers, orders, tables, comandas, users, waiters, drivers]);

  // Automatic periodic backup every 3 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      performAutoBackup();
    }, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [performAutoBackup]);

  const performManualBackup = () => {
    const ok = performAutoBackup();
    if (ok) {
      addToast({
        title: 'Backup Salvo com Sucesso!',
        message: 'Cópia de segurança completa gravada no navegador.',
        type: 'success',
      });
    }
  };

  const exportDatabaseJSON = () => {
    try {
      const nowStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const backupPayload = {
        system: 'Faz o Pedido OS',
        version: '1.0.0',
        backupTimestamp: new Date().toISOString(),
        settings,
        products,
        categories,
        customers,
        orders,
        tables,
        comandas,
        users,
        waiters,
        drivers,
      };

      const jsonStr = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_sistema_faz_o_pedido_${nowStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      performAutoBackup();

      addToast({
        title: 'Backup JSON Exportado!',
        message: 'Arquivo do banco de dados (pedidos, clientes e produtos) foi baixado.',
        type: 'success',
      });
    } catch (err) {
      console.error('Erro ao exportar JSON:', err);
      addToast({
         title: 'Erro na Exportação',
         message: 'Não foi possível gerar o arquivo JSON de backup.',
         type: 'warning',
      });
    }
  };

  const importDatabaseJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Formato JSON inválido');
      }

      if (parsed.settings) setSettings(parsed.settings);
      if (Array.isArray(parsed.products)) setProducts(parsed.products);
      if (Array.isArray(parsed.categories)) setCategories(parsed.categories);
      if (Array.isArray(parsed.customers)) setCustomers(parsed.customers);
      if (Array.isArray(parsed.orders)) setOrders(parsed.orders);
      if (Array.isArray(parsed.tables)) setTables(parsed.tables);
      if (Array.isArray(parsed.comandas)) setComandas(parsed.comandas);
      if (Array.isArray(parsed.users)) setUsers(parsed.users);
      if (Array.isArray(parsed.waiters)) setWaiters(parsed.waiters);
      if (Array.isArray(parsed.drivers)) setDrivers(parsed.drivers);

      // Async sync to Supabase if configured
      exportAllDataToSupabase(parsed).catch(() => {});

      const nowIso = new Date().toISOString();
      localStorage.setItem('fzp_last_backup_time', nowIso);
      setLastAutoBackup(nowIso);

      addToast({
        title: 'Banco de Dados Restaurado!',
        message: 'Todos os pedidos, clientes, produtos e configurações foram importados com sucesso.',
        type: 'success',
      });

      return true;
    } catch (err) {
      console.error('Erro ao importar JSON:', err);
      addToast({
        title: 'Falha na Importação',
        message: 'O arquivo JSON selecionado é inválido ou incompatível.',
        type: 'warning',
      });
      return false;
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  const addToast = (toastData: Omit<ToastNotification, 'id' | 'createdAt'>) => {
    const newToast: ToastNotification = {
      ...toastData,
      id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    setToasts((prev) => [newToast, ...prev].slice(0, 6));
    if (soundEnabled && !toastData.skipSound) {
      playNotificationSound();
    }
  };




  // Actions
  // Actions
  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    let updated: StoreSettings | null = null;
    setSettings((prev) => {
      const next = { ...prev, ...newSettings };
      if (newSettings.name !== undefined) {
        if (!prev.pixName || prev.pixName === prev.name || prev.pixName === "BAR DO ACANTO" || prev.pixName === "ACANTO'S BAR") {
          next.pixName = newSettings.name;
        }
        document.title = `${newSettings.name} - PDV & Cardápio Digital`;
      }
      updated = next;
      safeSetItem('fzp_settings', JSON.stringify(next));
      return next;
    });

    if (updated) {
      upsertStoreSettingsToSupabase(updated).catch(() => {});
    }
  };

  const addProduct = (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => {
      const next = [newProduct, ...prev];
      safeSetItem('fzp_products', JSON.stringify(next));
      return next;
    });
    upsertProductToSupabase(newProduct).catch(() => {});
  };

  const updateProduct = (id: string, productData: Partial<Product>) => {
    let updatedProduct: Product | null = null;
    setProducts((prev) => {
      const next = prev.map((p) => {
        if (p.id === id) {
          updatedProduct = { ...p, ...productData };
          return updatedProduct;
        }
        return p;
      });
      safeSetItem('fzp_products', JSON.stringify(next));
      return next;
    });

    if (updatedProduct) {
      upsertProductToSupabase(updatedProduct).catch(() => {});
    }
  };

  const deleteProduct = (id: string) => {
    let deletedName = '';
    setProducts((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) deletedName = target.name;
      const next = prev.filter((p) => p.id !== id);
      safeSetItem('fzp_products', JSON.stringify(next));
      return next;
    });
    deleteProductFromSupabase(id).catch(() => {});
    if (deletedName) {
      addToast({
        title: 'Produto Excluído',
        message: `O produto "${deletedName}" foi removido do cardápio.`,
        type: 'info',
      });
    }
  };

  const toggleProductAvailable = (id: string) => {
    let updatedProduct: Product | null = null;
    setProducts((prev) => {
      const next = prev.map((p) => {
        if (p.id === id) {
          updatedProduct = { ...p, available: !p.available };
          return updatedProduct;
        }
        return p;
      });
      safeSetItem('fzp_products', JSON.stringify(next));
      return next;
    });

    if (updatedProduct) {
      const isAvailable = (updatedProduct as Product).available;
      const prodName = (updatedProduct as Product).name;
      upsertProductToSupabase(updatedProduct).catch(() => {});
      addToast({
        title: isAvailable ? 'Produto Disponível' : 'Produto Pausado',
        message: `O produto "${prodName}" agora está ${isAvailable ? 'disponível' : 'pausado'} no cardápio.`,
        type: isAvailable ? 'success' : 'info',
      });
    }
  };

  const addCategory = (categoryData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...categoryData,
      id: `cat-${Date.now()}`,
    };
    setCategories((prev) => {
      const next = [...prev, newCat];
      safeSetItem('fzp_categories', JSON.stringify(next));
      return next;
    });
    upsertCategoryToSupabase(newCat).catch(() => {});
    addToast({
      title: 'Categoria Criada',
      message: `A categoria "${newCat.name}" foi adicionada com sucesso.`,
      type: 'success',
    });
  };

  const updateCategory = (id: string, data: Partial<Category>) => {
    let updatedCat: Category | null = null;
    setCategories((prev) => {
      const next = prev.map((c) => {
        if (c.id === id) {
          updatedCat = { ...c, ...data };
          return updatedCat;
        }
        return c;
      });
      safeSetItem('fzp_categories', JSON.stringify(next));
      return next;
    });

    if (updatedCat) {
      upsertCategoryToSupabase(updatedCat).catch(() => {});
    }
    addToast({
      title: 'Categoria Atualizada',
      message: 'As alterações na categoria foram salvas com sucesso.',
      type: 'success',
    });
  };

  const deleteCategory = (id: string) => {
    let catName = '';
    setCategories((prev) => {
      const target = prev.find((c) => c.id === id);
      if (target) catName = target.name;
      const next = prev.filter((c) => c.id !== id);
      safeSetItem('fzp_categories', JSON.stringify(next));
      return next;
    });
    deleteCategoryFromSupabase(id).catch(() => {});
    if (catName) {
      addToast({
        title: 'Categoria Excluída',
        message: `A categoria "${catName}" foi removida.`,
        type: 'info',
      });
    }
  };

  // Customers
  const addCustomer = (data: Omit<Customer, 'id' | 'totalSpent' | 'totalOrders' | 'createdAt'>): Customer => {
    const existing = customers.find((c) => c.phone.replace(/\D/g, '') === data.phone.replace(/\D/g, ''));
    if (existing) {
      return existing;
    }
    const newCustomer: Customer = {
      ...data,
      id: `cli-${Date.now()}`,
      totalSpent: 0,
      totalOrders: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    upsertCustomerToSupabase(newCustomer).catch(() => {});
    return newCustomer;
  };

  const updateCustomer = (id: string, data: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...data };
          upsertCustomerToSupabase(updated).catch(() => {});
          return updated;
        }
        return c;
      })
    );
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    deleteCustomerFromSupabase(id).catch(() => {});
  };

  // Cart
  const addToPdvCart = (item: CartItem) => {
    setPdvCart((prev) => [...prev, item]);
  };

  const removeFromPdvCart = (index: number) => {
    setPdvCart((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePdvCartQty = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromPdvCart(index);
      return;
    }
    setPdvCart((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity } : item))
    );
  };

  const clearPdvCart = () => {
    setPdvCart([]);
  };

  // Create Order
  const createOrder = (orderData: Omit<Order, 'id' | 'code' | 'createdAt'>): Order => {
    const nextCodeNumber = 1046 + orders.length;
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      code: `#${nextCodeNumber}`,
      createdAt: new Date().toISOString(),
    };

    // Trava de segurança contra disparo duplicado de alerta
    processedOrderAlertsRef.current.add(newOrder.id);
    if (newOrder.code) processedOrderAlertsRef.current.add(newOrder.code);
    markOrderObjectAlerted(newOrder);

    setOrders((prev) => [newOrder, ...prev]);
    upsertOrderToSupabase(newOrder).catch(() => {});

    // Trigger visual Toast notification & audio alert ONLY for new pending orders when in admin mode
    const isPdv = newOrder.type === 'pdv';
    const isFinalizedSale = newOrder.status === 'entregue' || newOrder.status === 'cancelado' || isPdv;

    if (!isFinalizedSale && viewMode !== 'public') {
      const sourceTitle = 'Cardápio Digital';
      const sourceType: ToastNotification['type'] = 'order_cardapio';
      const itemsCount = newOrder.items.reduce((sum, item) => sum + item.quantity, 0);
      const formattedTotal = `R$ ${newOrder.total.toFixed(2).replace('.', ',')}`;
      const customerNameStr = newOrder.customer?.name ? ` • ${newOrder.customer.name}` : '';

      addToast({
        title: `${sourceTitle} ${newOrder.code}`,
        message: `${itemsCount} ${itemsCount === 1 ? 'item' : 'itens'} (${formattedTotal})${customerNameStr}`,
        type: sourceType,
        order: newOrder,
        autoClose: true,
      });

      handleDigitalMenuOrderAlerts(newOrder, setSelectedReceiptOrder);
    }

    // Update customer stats if applicable
    if (orderData.customer?.phone) {
      const cleanPhone = orderData.customer.phone.replace(/\D/g, '');
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.phone.replace(/\D/g, '') === cleanPhone) {
            const updated = {
              ...c,
              totalOrders: c.totalOrders + 1,
              totalSpent: c.totalSpent + newOrder.total,
            };
            upsertCustomerToSupabase(updated).catch(() => {});
            return updated;
          }
          return c;
        })
      );
    }

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const updated = { ...ord, status };
          upsertOrderToSupabase(updated).catch(() => {});
          return updated;
        }
        return ord;
      })
    );
  };

  const updateOrderPaymentMethod = (orderId: string, paymentMethod: PaymentMethod) => {
    let orderCode = '';
    let orderTotal = 0;
    let isPgSettled = false;
    const newPaymentStatus = paymentMethod === 'pg' ? 'pendente' : 'pago';

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          orderCode = ord.code;
          orderTotal = ord.total;
          if (ord.paymentMethod === 'pg' && paymentMethod !== 'pg') {
            isPgSettled = true;
          }
          const updated = {
            ...ord,
            paymentMethod,
            paymentStatus: newPaymentStatus,
          };
          upsertOrderToSupabase(updated).catch(() => {});
          return updated;
        }
        return ord;
      })
    );

    if (isPgSettled) {
      addToast({
        title: `Conta PG Quitada! (${orderCode})`,
        message: `O pagamento de R$ ${orderTotal.toFixed(2).replace('.', ',')} foi efetuado via ${paymentMethod.replace('_', ' ').toUpperCase()} e somado ao faturamento real.`,
        type: 'success',
      });
    } else {
      addToast({
        title: `Pagamento Confirmado! (${orderCode})`,
        message: `Pedido marcado como PAGO via ${paymentMethod.replace('_', ' ').toUpperCase()}.`,
        type: 'success',
      });
    }
  };

  const deleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((ord) => ord.id !== orderId));
  };

  // Tables
  const addTable = (data: { name?: string; capacity?: number; waiterName?: string; customerName?: string; status?: Table['status'] }) => {
    const nextId = tables.length > 0 ? Math.max(...tables.map((t) => t.id)) + 1 : 1;
    const customer = data.customerName?.trim();
    const initialStatus = customer ? 'ocupada' : (data.status || 'livre');

    const newTable: Table = {
      id: nextId,
      name: data.name?.trim() || `Mesa ${nextId.toString().padStart(2, '0')}`,
      capacity: data.capacity || 4,
      status: initialStatus,
      currentOrderIds: [],
      waiterName: data.waiterName?.trim() || undefined,
      customerName: customer || undefined,
      openedAt: initialStatus === 'ocupada' ? new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : undefined,
    };
    setTables((prev) => [...prev, newTable]);
    upsertTableToSupabase(newTable).catch(() => {});

    // Auto-create an open comanda if customerName is provided or status is occupied
    if (initialStatus === 'ocupada') {
      const custName = customer || `Cliente ${newTable.name}`;
      createComanda(custName, '', newTable.id);
    }

    addToast({
      title: 'Mesa Criada',
      message: `${newTable.name} adicionada ao mapa do salão!`,
      type: 'success',
      skipSound: true,
    });
    return newTable;
  };

  const deleteTable = (id: number) => {
    const tableIdNum = Number(id);
    const updatedTables = tables.filter((t) => Number(t.id) !== tableIdNum);
    setTables(updatedTables);
    setSWRCache('fzp_tables', updatedTables, 'admin');
    localStorage.setItem('fzp_tables_initialized', 'true');

    // Close/remove any active open comanda for this deleted table
    setComandas((prevComandas) => {
      const openComanda = prevComandas.find((c) => c.tableId === tableIdNum && c.status === 'aberta');
      if (openComanda) {
        const nextComandas = prevComandas.filter((c) => c.id !== openComanda.id);
        deleteComandaFromSupabase(openComanda.id).catch(() => {});
        setSWRCache('fzp_comandas', nextComandas, 'admin');
        return nextComandas;
      }
      return prevComandas;
    });

    deleteTableFromSupabase(String(tableIdNum)).catch(() => {});

    addToast({
      title: 'Mesa Removida',
      message: `A mesa foi excluída permanentemente com sucesso.`,
      type: 'info',
      skipSound: true,
    });
  };

  const updateTableStatus = (tableId: number, status: Table['status'], customerName?: string) => {
    const isLivre = status === 'livre';
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === Number(tableId)) {
          const updated: Table = {
            ...t,
            status,
            openedAt: status === 'ocupada' && !t.openedAt ? new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : (isLivre ? undefined : t.openedAt),
            customerName: isLivre ? undefined : (customerName !== undefined ? (customerName.trim() || undefined) : t.customerName),
            currentOrderIds: isLivre ? [] : t.currentOrderIds,
          };
          upsertTableToSupabase(updated).catch(() => {});
          return updated;
        }
        return t;
      })
    );
  };

  const updateTable = (id: number, data: Partial<Pick<Table, 'name' | 'capacity' | 'waiterName' | 'customerName' | 'status'>>) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updatedName = data.name !== undefined ? data.name.trim() : t.name;
          const updatedCustomer = data.customerName !== undefined ? data.customerName.trim() : t.customerName;
          const updatedStatus = data.status !== undefined ? data.status : (updatedCustomer ? 'ocupada' : t.status);
          const isLivre = updatedStatus === 'livre';
          const updatedWaiter = data.waiterName !== undefined ? data.waiterName.trim() : t.waiterName;
          const updatedCapacity = data.capacity !== undefined ? data.capacity : t.capacity;

          const updated: Table = {
            ...t,
            name: updatedName || t.name,
            customerName: isLivre ? undefined : (updatedCustomer || undefined),
            waiterName: updatedWaiter || undefined,
            capacity: updatedCapacity,
            status: updatedStatus,
            openedAt: isLivre
              ? undefined
              : (t.openedAt || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })),
          };
          upsertTableToSupabase(updated).catch(() => {});
          return updated;
        }
        return t;
      })
    );

    if (data.status === 'livre') {
      setComandas((prev) =>
        prev.map((c) => {
          if (c.tableNumber === id && c.status === 'aberta') {
            const updated: Comanda = { ...c, status: 'fechada' };
            upsertComandaToSupabase(updated).catch(() => {});
            return updated;
          }
          return c;
        })
      );
    } else if (data.customerName !== undefined) {
      const newCustName = data.customerName.trim();
      setComandas((prev) =>
        prev.map((c) => {
          if (c.tableNumber === id && c.status === 'aberta') {
            const updated = { ...c, customerName: newCustName || `Cliente ${data.name || `Mesa ${id}`}` };
            upsertComandaToSupabase(updated).catch(() => {});
            return updated;
          }
          return c;
        })
      );
    }

    addToast({
      title: 'Mesa Atualizada',
      message: 'Identificação e informações da mesa atualizadas com sucesso.',
      type: 'success',
      skipSound: true,
    });
  };

  const addItemToTable = (tableId: number, item: CartItem) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;

    // Check if table has an active comanda
    let comanda = comandas.find((c) => c.tableNumber === tableId && c.status === 'aberta');
    if (!comanda) {
      comanda = createComanda(`Cliente Mesa ${tableId}`, '', tableId);
    }
    addItemToComanda(comanda.id, item);

    // Ensure table is marked as occupied
    updateTableStatus(tableId, 'ocupada');
  };

  const closeTableBill = (tableId: number) => {
    updateTableStatus(tableId, 'fechando');
  };

  // Comandas
  const createComanda = (customerName: string, customerPhone?: string, tableNumber?: number): Comanda => {
    const newComanda: Comanda = {
      id: `cmd-${Date.now()}`,
      code: `C-${Math.floor(100 + Math.random() * 900)}`,
      customerName: customerName || 'Cliente sem nome',
      customerPhone,
      tableNumber,
      status: 'aberta',
      items: [],
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      total: 0,
    };
    setComandas((prev) => [newComanda, ...prev]);
    upsertComandaToSupabase(newComanda).catch(() => {});
    return newComanda;
  };

  const addItemToComanda = (comandaId: string, item: CartItem) => {
    setComandas((prev) =>
      prev.map((c) => {
        if (c.id === comandaId) {
          const newItems = [...c.items, item];
          const newTotal = newItems.reduce((acc, it) => acc + it.unitTotal * it.quantity, 0);
          const updated = { ...c, items: newItems, total: newTotal };
          upsertComandaToSupabase(updated).catch(() => {});
          return updated;
        }
        return c;
      })
    );
  };

  const closeComanda = (comandaId: string, paymentMethod: PaymentMethod, serviceFee: number = 0) => {
    const comanda = comandas.find((c) => c.id === comandaId);
    if (!comanda) return;

    const grandTotal = (comanda.total || 0) + serviceFee;

    // Create a final order for this comanda
    const order = createOrder({
      type: comanda.tableNumber ? 'mesa' : 'pdv',
      status: 'entregue',
      customer: { name: comanda.customerName || 'Cliente Balcão', phone: comanda.customerPhone || '' },
      tableNumber: comanda.tableNumber,
      comandaNumber: comanda.code,
      items: comanda.items || [],
      subtotal: comanda.total || 0,
      discount: 0,
      deliveryFee: 0,
      total: grandTotal,
      paymentMethod: paymentMethod || 'dinheiro',
      paymentStatus: paymentMethod === 'pg' ? 'pendente' : 'pago',
    });

    // Mark comanda as closed and close any other open comandas for this table
    setComandas((prev) =>
      prev.map((c) => {
        if (c.id === comandaId || (comanda.tableNumber && c.tableNumber === comanda.tableNumber && c.status === 'aberta')) {
          const updated: Comanda = { ...c, status: 'fechada' };
          upsertComandaToSupabase(updated).catch(() => {});
          return updated;
        }
        return c;
      })
    );

    // If linked to a table, set table as free
    if (comanda.tableNumber) {
      updateTableStatus(comanda.tableNumber, 'livre');
    }

    setSelectedReceiptOrder(order);
  };

  // WhatsApp text formatting tool
  const buildOrderWhatsAppText = (order: Order): string => {
    const itemsText = order.items
      .map((item) => {
        const extrasStr = item.selectedExtras.length
          ? `\n   └ Extras: ${item.selectedExtras.map((e) => e.optionName).join(', ')}`
          : '';
        const obsStr = item.observations ? `\n   └ Obs: ${item.observations}` : '';
        return `• *${item.quantity}x ${item.name}* - R$ ${(item.unitTotal * item.quantity).toFixed(2).replace('.', ',')}${extrasStr}${obsStr}`;
      })
      .join('\n');

    const typeLabel =
      order.type === 'delivery'
        ? '🛵 *Entrega / Delivery*'
        : order.type === 'retirada'
        ? '🛍️ *Retirada no Balcão*'
        : order.type === 'mesa'
        ? `🍽️ *Mesa ${order.tableNumber || ''}*`
        : '🏪 *Venda no Balcão (PDV)*';

    const addressText = order.customer?.address ? `\n\n📍 *Endereço:* ${order.customer.address}` : '';

    return encodeURIComponent(
      `*${settings.name.toUpperCase()}*\n` +
      `-----------------------------------\n` +
      `🧾 *Pedido ${order.code}*\n` +
      `Tipo: ${typeLabel}\n` +
      `Status: *${order.status.toUpperCase()}*\n` +
      `Cliente: ${order.customer?.name || 'Cliente'}\n` +
      `${addressText}\n\n` +
      `*ITENS DO PEDIDO:*\n${itemsText}\n\n` +
      `-----------------------------------\n` +
      `Subtotal: R$ ${order.subtotal.toFixed(2).replace('.', ',')}\n` +
      (order.discount > 0 ? `Desconto: -R$ ${order.discount.toFixed(2).replace('.', ',')}\n` : '') +
      (order.deliveryFee > 0 ? `Taxa Entrega: R$ ${order.deliveryFee.toFixed(2).replace('.', ',')}\n` : '') +
      `*TOTAL: R$ ${order.total.toFixed(2).replace('.', ',')}*\n` +
      `Forma de Pagamento: *${order.paymentMethod.toUpperCase()}*\n\n` +
      `Agradecemos a sua preferência! Qualquer dúvida fale conosco.`
    );
  };

  const generateWhatsAppCheckoutLink = (order: Order, phoneOverride?: string): string => {
    const rawPhone = phoneOverride || order.customer?.phone || settings.whatsappPhone || settings.phone;
    const cleanPhone = cleanPhoneNumber(rawPhone);
    const text = buildOrderWhatsAppText(order);
    return cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${text}`
      : `https://wa.me/?text=${text}`;
  };

  const generateCartWhatsAppCheckoutLink = (
    items: CartItem[],
    customerInfo: { name: string; phone?: string; address?: string },
    orderType: OrderType,
    paymentMethod: PaymentMethod,
    deliveryFee: number = 0,
    subtotalOverride?: number,
    totalOverride?: number
  ): string => {
    const subtotal = subtotalOverride ?? items.reduce((acc, i) => acc + i.unitTotal * i.quantity, 0);
    const total = totalOverride ?? (subtotal + deliveryFee);

    const itemsText = items
      .map((item) => {
        const extrasStr = item.selectedExtras.length
          ? `\n   └ Extras: ${item.selectedExtras.map((e) => e.optionName).join(', ')}`
          : '';
        const obsStr = item.observations ? `\n   └ Obs: ${item.observations}` : '';
        return `• *${item.quantity}x ${item.name}* - R$ ${(item.unitTotal * item.quantity).toFixed(2).replace('.', ',')}${extrasStr}${obsStr}`;
      })
      .join('\n');

    const typeLabel =
      orderType === 'delivery'
        ? `🛵 *Entrega / Delivery*${customerInfo.address ? `\n📍 *Endereço:* ${customerInfo.address}` : ''}`
        : orderType === 'retirada'
        ? '🛍️ *Retirada no Balcão*'
        : orderType === 'mesa'
        ? '🍽️ *Consumo na Mesa*'
        : '🏪 *Venda no Balcão (PDV)*';

    const rawMessage =
      `*CHECKOUT DE PEDIDO - ${settings.name.toUpperCase()}*\n` +
      `-----------------------------------\n` +
      `Cliente: *${customerInfo.name || 'Cliente'}*\n` +
      (customerInfo.phone ? `WhatsApp: ${customerInfo.phone}\n` : '') +
      `Tipo: ${typeLabel}\n\n` +
      `*ITENS DO PEDIDO:*\n${itemsText}\n\n` +
      `-----------------------------------\n` +
      `Subtotal: R$ ${subtotal.toFixed(2).replace('.', ',')}\n` +
      (deliveryFee > 0 ? `Taxa de Entrega: R$ ${deliveryFee.toFixed(2).replace('.', ',')}\n` : '') +
      `*TOTAL DO PEDIDO: R$ ${total.toFixed(2).replace('.', ',')}*\n` +
      `Forma de Pagamento: *${paymentMethod.toUpperCase()}*\n\n` +
      `Aguardo confirmação do restaurante! Obrigado.`;

    const storePhone = settings.whatsappPhone || settings.phone;
    const cleanStorePhone = cleanPhoneNumber(storePhone);
    const textEncoded = encodeURIComponent(rawMessage);
    return cleanStorePhone
      ? `https://wa.me/${cleanStorePhone}?text=${textEncoded}`
      : `https://wa.me/?text=${textEncoded}`;
  };

  const sendOrderToWhatsApp = (order: Order, phoneOverride?: string) => {
    const link = generateWhatsAppCheckoutLink(order, phoneOverride);
    window.open(link, '_blank');
  };

  const addWaiter = (data: { name: string; phone: string }) => {
    const newW: Waiter = {
      id: `gar-${Date.now()}`,
      name: data.name,
      phone: data.phone,
      status: 'ativo',
      activeTables: 0,
    };
    setWaiters((prev) => [...prev, newW]);
    upsertWaiterToSupabase(newW).catch(() => {});
    addToast({
      title: 'Garçom Cadastrado',
      message: `${newW.name} cadastrado na equipe!`,
      type: 'success',
    });
  };

  const deleteWaiter = (id: string) => {
    setWaiters((prev) => prev.filter((w) => w.id !== id));
    deleteWaiterFromSupabase(id).catch(() => {});
  };

  const addDriver = (data: { name: string; phone: string }) => {
    const newD: DeliveryDriver = {
      id: `ent-${Date.now()}`,
      name: data.name,
      phone: data.phone,
      status: 'disponivel',
      completedToday: 0,
    };
    setDrivers((prev) => [...prev, newD]);
    upsertDriverToSupabase(newD).catch(() => {});
    addToast({
      title: 'Entregador Cadastrado',
      message: `${newD.name} cadastrado na equipe!`,
      type: 'success',
    });
  };

  const deleteDriver = (id: string) => {
    setDrivers((prev) => prev.filter((d) => d.id !== id));
    deleteDriverFromSupabase(id).catch(() => {});
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        viewMode,
        setViewMode,
        users,
        currentUser,
        loginUser,
        logoutUser,
        addUser,
        updateUser,
        deleteUser,
        settings,
        updateSettings,
        categories,
        products,
        extraGroups,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductAvailable,
        addCategory,
        updateCategory,
        deleteCategory,
        orders,
        createOrder,
        updateOrderStatus,
        updateOrderPaymentMethod,
        deleteOrder,
        tables,
        addTable,
        deleteTable,
        updateTableStatus,
        updateTable,
        addItemToTable,
        closeTableBill,
        comandas,
        createComanda,
        addItemToComanda,
        closeComanda,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        waiters,
        addWaiter,
        deleteWaiter,
        drivers,
        addDriver,
        deleteDriver,
        pdvCart,
        addToPdvCart,
        removeFromPdvCart,
        updatePdvCartQty,
        clearPdvCart,
        selectedReceiptOrder,
        setSelectedReceiptOrder,
        buildOrderWhatsAppText,
        sendOrderToWhatsApp,
        generateWhatsAppCheckoutLink,
        generateCartWhatsAppCheckoutLink,
        toasts,
        addToast,
        removeToast,
        clearToasts,
        soundEnabled,
        setSoundEnabled,
        lastAutoBackup,
        exportDatabaseJSON,
        importDatabaseJSON,
        performManualBackup,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
