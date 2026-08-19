import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { Product, Category, Customer, Order, Table, Comanda, StoreSettings, AppUser, UserRole } from '../types';

// Helper to safely parse JSON
function safeParse<T>(data: any, fallback: T): T {
  if (!data) return fallback;
  if (typeof data === 'object') return data as T;
  try {
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
}

// ==========================================
// TEST CONNECTION
// ==========================================
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  tablesFound?: string[];
  latencyMs?: number;
}> {
  // First, try server-side verification endpoint
  try {
    const serverRes = await fetch('/api/supabase/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    if (serverRes.ok) {
      const data = await serverRes.json();
      return {
        success: data.success,
        message: data.message,
        latencyMs: data.latencyMs,
      };
    }
  } catch {
    // If server route not accessible, fallback to client test
  }

  const supabase = getSupabase();
  if (!supabase) {
    return {
      success: false,
      message: 'Supabase não está configurado. Verifique a URL e a Anon Key.',
    };
  }

  const startTime = Date.now();
  try {
    // Attempt a lightweight select on store_settings
    const { error: testError } = await supabase.from('store_settings').select('id').limit(1);
    const latency = Date.now() - startTime;

    if (testError) {
      // If table doesn't exist yet, it's still reachable
      if (
        testError.code === '42P01' || 
        testError.code === 'PGRST204' || 
        testError.message?.includes('does not exist') ||
        testError.message?.includes('relation')
      ) {
        return {
          success: true,
          message: 'Conexão com Supabase efetuada com sucesso! (Tabelas prontas para criação via SQL)',
          latencyMs: latency,
        };
      }
      return {
        success: false,
        message: `Falha na conexão: ${testError.message} (Código: ${testError.code || 'Desconhecido'})`,
        latencyMs: latency,
      };
    }

    return {
      success: true,
      message: `Conexão estabelecida com sucesso! (${latency}ms)`,
      latencyMs: latency,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro ao conectar: ${err?.message || 'Falha de rede'}`,
    };
  }
}

// ==========================================
// CATEGORIES
// ==========================================
export async function syncCategoriesFromSupabase(): Promise<Category[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) {
      console.warn('[Supabase Sync Error - Categories]:', error.message);
      return null;
    }
    if (!data) return [];

    return data.map((item: any) => ({
      id: String(item.id),
      name: item.name || '',
      icon: item.icon || undefined,
      active: item.active !== false,
    }));
  } catch (e) {
    return null;
  }
}

export async function upsertCategoryToSupabase(cat: Category): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('categories').upsert({
      id: cat.id,
      name: cat.name,
      icon: cat.icon || null,
      active: cat.active,
    });
    if (error) {
      console.error('[Supabase Upsert Error - Category]:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

export async function deleteCategoryFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// PRODUCTS
// ==========================================
export async function syncProductsFromSupabase(): Promise<Product[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('products').select('*').order('name');
    if (error) {
      console.warn('[Supabase Sync Error - Products]:', error.message);
      return null;
    }
    if (!data) return [];

    return data.map((item: any) => ({
      id: String(item.id),
      name: item.name || '',
      description: item.description || '',
      price: Number(item.price) || 0,
      categoryId: String(item.category_id || item.categoryId || ''),
      image: item.image || '',
      available: item.available !== false,
      code: item.code || undefined,
      extraGroupIds: safeParse(item.extra_group_ids, []),
      customExtras: safeParse(item.custom_extras, []),
      removableItems: safeParse(item.removable_items, []),
    }));
  } catch {
    return null;
  }
}

export async function upsertProductToSupabase(product: Product): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('products').upsert({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price,
      category_id: product.categoryId,
      image: product.image || '',
      available: product.available,
      code: product.code || null,
      extra_group_ids: product.extraGroupIds || [],
      custom_extras: product.customExtras || [],
      removable_items: product.removableItems || [],
    });
    if (error) {
      console.error('[Supabase Upsert Error - Product]:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function deleteProductFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('products').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// ORDERS
// ==========================================
export async function syncOrdersFromSupabase(): Promise<Order[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('[Supabase Sync Error - Orders]:', error.message);
      return null;
    }
    if (!data) return [];

    return data.map((item: any) => ({
      id: String(item.id),
      code: item.code || `#${String(item.id).slice(-4)}`,
      type: item.type || 'pdv',
      status: item.status || 'confirmado',
      createdAt: item.created_at || new Date().toISOString(),
      customer: safeParse(item.customer, undefined),
      tableNumber: item.table_number ? Number(item.table_number) : undefined,
      comandaNumber: item.comanda_number || undefined,
      items: safeParse(item.items, []),
      subtotal: Number(item.subtotal) || 0,
      discount: Number(item.discount) || 0,
      deliveryFee: Number(item.delivery_fee) || 0,
      total: Number(item.total) || 0,
      paymentMethod: item.payment_method || 'dinheiro',
      paymentStatus: item.payment_status || 'pago',
      notes: item.notes || undefined,
      waiterName: item.waiter_name || undefined,
      deliveryDriverName: item.delivery_driver_name || undefined,
    }));
  } catch {
    return null;
  }
}

export async function upsertOrderToSupabase(order: Order): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('orders').upsert({
      id: order.id,
      code: order.code,
      type: order.type,
      status: order.status,
      created_at: order.createdAt,
      customer: order.customer || null,
      table_number: order.tableNumber || null,
      comanda_number: order.comandaNumber || null,
      items: order.items || [],
      subtotal: order.subtotal || 0,
      discount: order.discount || 0,
      delivery_fee: order.deliveryFee || 0,
      total: order.total,
      payment_method: order.paymentMethod,
      payment_status: order.paymentStatus,
      notes: order.notes || null,
      waiter_name: order.waiterName || null,
      delivery_driver_name: order.deliveryDriverName || null,
    });
    if (error) {
      console.error('[Supabase Upsert Error - Order]:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function deleteOrderFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) {
      console.error('[Supabase Delete Error - Order]:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// ==========================================
// TABLES
// ==========================================
export async function syncTablesFromSupabase(): Promise<Table[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('tables').select('*').order('id');
    if (error) {
      console.warn('[Supabase Sync Error - Tables]:', error.message);
      return null;
    }
    if (!data) return [];

    return data.map((item: any) => ({
      id: Number(item.id),
      name: item.name || `Mesa ${item.id}`,
      capacity: Number(item.capacity) || 4,
      status: item.status || 'livre',
      currentOrderIds: safeParse(item.current_order_ids, []),
      openedAt: item.opened_at || undefined,
      waiterName: item.waiter_name || undefined,
      customerName: item.customer_name || undefined,
    }));
  } catch {
    return null;
  }
}

export async function upsertTableToSupabase(table: Table): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('tables').upsert({
      id: table.id,
      name: table.name,
      capacity: table.capacity,
      status: table.status,
      current_order_ids: table.currentOrderIds || [],
      opened_at: table.openedAt || null,
      waiter_name: table.waiterName || null,
      customer_name: table.customerName || null,
    });
    if (error) {
      console.error('[Supabase Upsert Error - Table]:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function deleteTableFromSupabase(id: number | string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('tables').delete().eq('id', Number(id));
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// COMANDAS
// ==========================================
export async function syncComandasFromSupabase(): Promise<Comanda[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('comandas').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('[Supabase Sync Error - Comandas]:', error.message);
      return null;
    }
    if (!data) return [];

    return data.map((item: any) => ({
      id: String(item.id),
      code: item.code || `C-${item.id}`,
      customerName: item.customer_name || 'Cliente',
      customerPhone: item.customer_phone || undefined,
      tableNumber: item.table_number ? Number(item.table_number) : undefined,
      status: item.status || 'aberta',
      items: safeParse(item.items, []),
      createdAt: item.created_at || new Date().toISOString(),
      total: Number(item.total) || 0,
    }));
  } catch {
    return null;
  }
}

export async function upsertComandaToSupabase(comanda: Comanda): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('comandas').upsert({
      id: comanda.id,
      code: comanda.code,
      customer_name: comanda.customerName,
      customer_phone: comanda.customerPhone || null,
      table_number: comanda.tableNumber || null,
      status: comanda.status,
      items: comanda.items || [],
      created_at: comanda.createdAt,
      total: comanda.total,
    });
    if (error) {
      console.error('[Supabase Upsert Error - Comanda]:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function deleteComandaFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('comandas').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// CUSTOMERS
// ==========================================
export async function syncCustomersFromSupabase(): Promise<Customer[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('customers').select('*').order('name');
    if (error) {
      console.warn('[Supabase Sync Error - Customers]:', error.message);
      return null;
    }
    if (!data) return [];

    return data.map((item: any) => ({
      id: String(item.id),
      name: item.name || '',
      phone: item.phone || '',
      email: item.email || undefined,
      address: safeParse(item.address, undefined),
      totalSpent: Number(item.total_spent) || 0,
      totalOrders: Number(item.total_orders) || 0,
      createdAt: item.created_at || new Date().toISOString(),
      notes: item.notes || undefined,
    }));
  } catch {
    return null;
  }
}

export async function upsertCustomerToSupabase(customer: Customer): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('customers').upsert({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email || null,
      address: customer.address || null,
      total_spent: customer.totalSpent || 0,
      total_orders: customer.totalOrders || 0,
      created_at: customer.createdAt,
      notes: customer.notes || null,
    });
    if (error) {
      console.error('[Supabase Upsert Error - Customer]:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function deleteCustomerFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// WAITERS & DRIVERS
// ==========================================
export async function upsertWaiterToSupabase(waiter: { id: string; name: string; phone?: string; status?: string; activeTables?: number }): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('waiters').upsert({
      id: waiter.id,
      name: waiter.name,
      phone: waiter.phone || null,
      status: waiter.status || 'ativo',
      active_tables: waiter.activeTables || 0,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteWaiterFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('waiters').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

export async function upsertDriverToSupabase(driver: { id: string; name: string; phone?: string; status?: string; completedToday?: number }): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('drivers').upsert({
      id: driver.id,
      name: driver.name,
      phone: driver.phone || null,
      status: driver.status || 'disponivel',
      completed_today: driver.completedToday || 0,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteDriverFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('drivers').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// USERS (ADMINS & GARÇONS)
// ==========================================
export async function syncUsersFromSupabase(): Promise<AppUser[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    let { data, error } = await supabase.from('app_users').select('*').order('name');
    if (error && (error.code === 'PGRST205' || error.message?.includes('does not exist'))) {
      const fallbackRes = await supabase.from('users').select('*').order('name');
      if (!fallbackRes.error) {
        data = fallbackRes.data;
        error = null;
      }
    }
    if (error) {
      console.warn('[Supabase Sync Error - Users]:', error.message);
      return null;
    }
    if (!data) return [];

    return data.map((item: any) => ({
      id: String(item.id),
      name: item.name || '',
      email: item.email || '',
      role: (item.role === 'admin' ? 'admin' : 'garcom') as UserRole,
      pin: String(item.pin || '1234'),
      status: (item.status === 'inativo' ? 'inativo' : 'ativo') as 'ativo' | 'inativo',
      phone: item.phone || undefined,
      avatarEmoji: item.avatar_emoji || undefined,
      avatarUrl: item.avatar_url || undefined,
    }));
  } catch {
    return null;
  }
}

export async function upsertUserToSupabase(user: AppUser): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email || '',
      role: user.role,
      pin: user.pin,
      status: user.status || 'ativo',
      phone: user.phone || null,
      avatar_emoji: user.avatarEmoji || null,
      avatar_url: user.avatarUrl || null,
    };

    let { error } = await supabase.from('app_users').upsert(payload);
    if (error && (error.code === 'PGRST205' || error.message?.includes('does not exist'))) {
      const fallbackRes = await supabase.from('users').upsert(payload);
      error = fallbackRes.error;
    }

    if (error) {
      console.error('[Supabase Upsert Error - User]:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function deleteUserFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    let { error } = await supabase.from('app_users').delete().eq('id', id);
    if (error && (error.code === 'PGRST205' || error.message?.includes('does not exist'))) {
      const fallbackRes = await supabase.from('users').delete().eq('id', id);
      error = fallbackRes.error;
    }

    if (error) {
      console.error('[Supabase Delete Error - User]:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// ==========================================
// STORE SETTINGS
// ==========================================
export async function syncStoreSettingsFromSupabase(): Promise<StoreSettings | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('store_settings').select('*').eq('id', 'default').single();
    if (error || !data) return null;

    if (data.data) {
      return safeParse<StoreSettings>(data.data, null as any);
    }

    return {
      name: data.name || '',
      slogan: data.slogan || '',
      phone: data.phone || '',
      whatsappPhone: data.whatsapp_phone || undefined,
      address: data.address || '',
      cnpj: data.cnpj || '',
      pixKey: data.pix_key || '',
      pixName: data.pix_name || undefined,
      pixCity: data.pix_city || undefined,
      deliveryFeeDefault: Number(data.delivery_fee_default) || 0,
      isOpen: data.is_open !== false,
      isStoreActive: data.is_store_active !== false,
      allowOrdersWhenClosed: Boolean(data.allow_orders_when_closed),
      storeTimezone: data.store_timezone || 'America/Sao_Paulo',
      weeklySchedule: safeParse(data.weekly_schedule, undefined),
      operatingHours: data.operating_hours || '',
      logoUrl: data.logo_url || '',
      autoSendWhatsApp: data.auto_send_whatsapp !== false,
      enableWhatsAppBot: Boolean(data.enable_whatsapp_bot),
      welcomeWhatsAppMsg: data.welcome_whatsapp_msg || '',
      orderConfirmedMsg: data.order_confirmed_msg || undefined,
      orderDispatchedMsg: data.order_dispatched_msg || undefined,
      orderReadyMsg: data.order_ready_msg || undefined,
      pixRequestMsg: data.pix_request_msg || undefined,
      thermalPaperWidth: data.thermal_paper_width || '80mm',
      menuSlug: data.menu_slug || undefined,
      customDomain: data.custom_domain || undefined,
    };
  } catch {
    return null;
  }
}

export async function upsertStoreSettingsToSupabase(settings: StoreSettings): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('store_settings').upsert({
      id: 'default',
      data: settings,
      name: settings.name,
      slogan: settings.slogan,
      phone: settings.phone,
      whatsapp_phone: settings.whatsappPhone || null,
      address: settings.address,
      cnpj: settings.cnpj,
      pix_key: settings.pixKey,
      pix_name: settings.pixName || null,
      pix_city: settings.pixCity || null,
      delivery_fee_default: settings.deliveryFeeDefault,
      is_open: settings.isOpen,
      is_store_active: settings.isStoreActive !== false,
      allow_orders_when_closed: settings.allowOrdersWhenClosed || false,
      store_timezone: settings.storeTimezone || 'America/Sao_Paulo',
      weekly_schedule: settings.weeklySchedule || [],
      operating_hours: settings.operatingHours || '',
      logo_url: settings.logoUrl || '',
      auto_send_whatsapp: settings.autoSendWhatsApp,
      enable_whatsapp_bot: settings.enableWhatsAppBot || false,
      welcome_whatsapp_msg: settings.welcomeWhatsAppMsg,
      order_confirmed_msg: settings.orderConfirmedMsg || null,
      order_dispatched_msg: settings.orderDispatchedMsg || null,
      order_ready_msg: settings.orderReadyMsg || null,
      pix_request_msg: settings.pixRequestMsg || null,
      thermal_paper_width: settings.thermalPaperWidth || '80mm',
      menu_slug: settings.menuSlug || null,
      custom_domain: settings.customDomain || null,
    });
    if (error) {
      console.error('[Supabase Upsert Error - StoreSettings]:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// ==========================================
// EXPORT / PUSH ALL DATA
// ==========================================
export async function exportAllDataToSupabase(data: {
  settings?: StoreSettings;
  categories?: Category[];
  products?: Product[];
  tables?: Table[];
  comandas?: Comanda[];
  customers?: Customer[];
  orders?: Order[];
  users?: AppUser[];
}): Promise<{ success: boolean; count: number; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, count: 0, error: 'Supabase não está configurado.' };
  }

  let totalUpserted = 0;
  try {
    if (data.settings) {
      await upsertStoreSettingsToSupabase(data.settings);
      totalUpserted++;
    }
    if (data.categories) {
      for (const cat of data.categories) {
        await upsertCategoryToSupabase(cat);
        totalUpserted++;
      }
    }
    if (data.products) {
      for (const prod of data.products) {
        await upsertProductToSupabase(prod);
        totalUpserted++;
      }
    }
    if (data.tables) {
      for (const tbl of data.tables) {
        await upsertTableToSupabase(tbl);
        totalUpserted++;
      }
    }
    if (data.comandas) {
      for (const com of data.comandas) {
        await upsertComandaToSupabase(com);
        totalUpserted++;
      }
    }
    if (data.customers) {
      for (const cust of data.customers) {
        await upsertCustomerToSupabase(cust);
        totalUpserted++;
      }
    }
    if (data.orders) {
      for (const ord of data.orders) {
        await upsertOrderToSupabase(ord);
        totalUpserted++;
      }
    }
    if (data.users) {
      for (const usr of data.users) {
        await upsertUserToSupabase(usr);
        totalUpserted++;
      }
    }

    return { success: true, count: totalUpserted };
  } catch (err: any) {
    return { success: false, count: totalUpserted, error: err?.message || 'Falha ao sincronizar dados' };
  }
}
