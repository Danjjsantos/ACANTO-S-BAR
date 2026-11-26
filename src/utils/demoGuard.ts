import {
  AppUser,
  Category,
  Comanda,
  Customer,
  DeliveryDriver,
  Order,
  Product,
  StoreSettings,
  Table,
  Waiter,
} from '../types';

export const DEMO_USER_IDS = new Set(['usr-1', 'usr-2', 'usr-3']);
export const DEMO_USER_EMAILS = new Set([
  'admin@fazopedido.com',
  'lucas@fazopedido.com',
  'fernanda@fazopedido.com',
]);

export const DEMO_CATEGORY_IDS = new Set([
  'cat-1',
  'cat-2',
  'cat-3',
  'cat-4',
  'cat-5',
  'cat-6',
]);

export const DEMO_PRODUCT_IDS = new Set([
  'prod-1',
  'prod-2',
  'prod-3',
  'prod-4',
  'prod-5',
  'prod-6',
  'prod-7',
  'prod-8',
  'prod-9',
  'prod-10',
  'prod-11',
]);

export const DEMO_CUSTOMER_IDS = new Set(['cli-1', 'cli-2', 'cli-3']);

export const DEMO_COMANDA_IDS = new Set(['cmd-1', 'cmd-2']);

export const DEMO_ORDER_IDS = new Set([
  'ord-101',
  'ord-102',
  'ord-103',
  'ord-104',
  'ord-105',
  'ord-106',
  'ord-107',
  'ord-108',
  'ord-109',
]);

export const DEMO_WAITER_IDS = new Set(['wai-1', 'wai-2']);
export const DEMO_DRIVER_IDS = new Set(['drv-1', 'drv-2']);

export const isDemoUser = (u: Partial<AppUser> | null | undefined): boolean => {
  if (!u) return false;
  if (u.id && DEMO_USER_IDS.has(String(u.id))) return true;
  if (u.email && DEMO_USER_EMAILS.has(u.email.trim().toLowerCase())) return true;
  return false;
};

export const isDemoCategory = (c: Partial<Category> | null | undefined): boolean =>
  Boolean(c?.id && DEMO_CATEGORY_IDS.has(String(c.id)));

export const isDemoProduct = (p: Partial<Product> | null | undefined): boolean =>
  Boolean(p?.id && DEMO_PRODUCT_IDS.has(String(p.id)));

export const isDemoCustomer = (c: Partial<Customer> | null | undefined): boolean =>
  Boolean(c?.id && DEMO_CUSTOMER_IDS.has(String(c.id)));

export const isDemoComanda = (c: Partial<Comanda> | null | undefined): boolean =>
  Boolean(c?.id && DEMO_COMANDA_IDS.has(String(c.id)));

export const isDemoOrder = (o: Partial<Order> | null | undefined): boolean =>
  Boolean(o?.id && DEMO_ORDER_IDS.has(String(o.id)));

export const isDemoWaiter = (w: { id?: string } | null | undefined): boolean =>
  Boolean(w?.id && DEMO_WAITER_IDS.has(String(w.id)));

export const isDemoDriver = (d: { id?: string } | null | undefined): boolean =>
  Boolean(d?.id && DEMO_DRIVER_IDS.has(String(d.id)));

export const isDemoTable = (t: Partial<Table> | null | undefined): boolean => {
  if (!t) return false;
  if (t.customerName === 'Reserva Família Costa') return true;
  if (t.waiterName === 'Lucas' || t.waiterName === 'Fernanda') return true;
  if (
    Array.isArray(t.currentOrderIds) &&
    t.currentOrderIds.some((oid) => DEMO_ORDER_IDS.has(String(oid)))
  ) {
    return true;
  }
  return false;
};

export const filterNonDemoUsers = (list: AppUser[]): AppUser[] =>
  (list || []).filter((u) => !isDemoUser(u));

export const filterNonDemoCategories = (list: Category[]): Category[] =>
  (list || []).filter((c) => !isDemoCategory(c));

export const filterNonDemoProducts = (list: Product[]): Product[] =>
  (list || []).filter((p) => !isDemoProduct(p));

export const filterNonDemoCustomers = (list: Customer[]): Customer[] =>
  (list || []).filter((c) => !isDemoCustomer(c));

export const filterNonDemoComandas = (list: Comanda[]): Comanda[] =>
  (list || []).filter((c) => !isDemoComanda(c));

export const filterNonDemoOrders = (list: Order[]): Order[] =>
  (list || []).filter((o) => !isDemoOrder(o));

export const filterNonDemoWaiters = (list: Waiter[]): Waiter[] =>
  (list || []).filter((w) => !isDemoWaiter(w));

export const filterNonDemoDrivers = (list: DeliveryDriver[]): DeliveryDriver[] =>
  (list || []).filter((d) => !isDemoDriver(d));

export const filterNonDemoTables = (list: Table[]): Table[] =>
  (list || []).filter((t) => !isDemoTable(t));

export const sanitizeDemoSettings = (s: StoreSettings): StoreSettings => {
  const cleaned = { ...s };
  if (cleaned.cnpj === '12.345.678/0001-90') cleaned.cnpj = '';
  if (cleaned.pixKey === '12.345.678/0001-90') cleaned.pixKey = '';
  if (cleaned.phone === '5511999998888') cleaned.phone = '';
  if (cleaned.whatsappPhone === '5511999998888') cleaned.whatsappPhone = '';
  if (cleaned.address === 'Rua Augusta, 1000 - Consolação, São Paulo - SP') cleaned.address = '';
  if (cleaned.pixCity === 'SAO PAULO') cleaned.pixCity = '';
  if (cleaned.logoUrl === '/src/assets/images/roboto_store_logo_1785442408017.jpg') {
    cleaned.logoUrl = '';
  }
  return cleaned;
};

const PURGE_FLAG_KEY = 'fzp_demo_purged_v1';

/**
 * Purges any previously cached demo records created by the system from localStorage/sessionStorage
 * while preserving all real records created by the administrator.
 */
export function purgeDemoDataFromLocalStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    if (localStorage.getItem(PURGE_FLAG_KEY) === 'true') {
      return;
    }

    const filterKey = <T,>(key: string, filterFn: (items: T[]) => T[]) => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const filtered = filterFn(parsed);
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      } catch {}
    };

    filterKey<AppUser>('fzp_users', filterNonDemoUsers);
    filterKey<Category>('fzp_categories', filterNonDemoCategories);
    filterKey<Product>('fzp_products', filterNonDemoProducts);
    filterKey<Customer>('fzp_customers', filterNonDemoCustomers);
    filterKey<Comanda>('fzp_comandas', filterNonDemoComandas);
    filterKey<Order>('fzp_orders', filterNonDemoOrders);
    filterKey<Waiter>('fzp_waiters', filterNonDemoWaiters);
    filterKey<DeliveryDriver>('fzp_drivers', filterNonDemoDrivers);

    // Special handling for tables: if the stored tables contain the demo set signature, remove the demo tables
    try {
      const rawTables = localStorage.getItem('fzp_tables');
      if (rawTables) {
        const parsedTables: Table[] = JSON.parse(rawTables);
        if (Array.isArray(parsedTables)) {
          const hasDemoSignature = parsedTables.some((t) => isDemoTable(t));
          if (hasDemoSignature) {
            const remaining = parsedTables.filter(
              (t) => !isDemoTable(t) && Number(t.id) > 8
            );
            localStorage.setItem('fzp_tables', JSON.stringify(remaining));
          }
        }
      }
    } catch {}

    // Sanitize demo placeholder settings if untouched
    try {
      const rawSettings = localStorage.getItem('fzp_settings');
      if (rawSettings) {
        const parsedSettings: StoreSettings = JSON.parse(rawSettings);
        if (parsedSettings && typeof parsedSettings === 'object') {
          localStorage.setItem(
            'fzp_settings',
            JSON.stringify(sanitizeDemoSettings(parsedSettings))
          );
        }
      }
    } catch {}

    // Clear old demo auto-backup snapshot
    try {
      localStorage.removeItem('fzp_auto_backup');
    } catch {}

    // If current session belongs to a demo user, clear it
    try {
      const rawSession = sessionStorage.getItem('fzp_admin_session');
      if (rawSession) {
        const parsedSession: AppUser = JSON.parse(rawSession);
        if (isDemoUser(parsedSession)) {
          sessionStorage.removeItem('fzp_admin_session');
        }
      }
    } catch {}

    localStorage.setItem(PURGE_FLAG_KEY, 'true');
  } catch {}
}
