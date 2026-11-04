export type UserRole = 'admin' | 'garcom';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  pin: string;
  status: 'ativo' | 'inativo';
  avatarEmoji?: string;
  avatarUrl?: string;
  phone?: string;
}

export type OrderStatus = 'confirmado' | 'pronto_para_retirada' | 'entregue' | 'cancelado';

export type OrderType = 'pdv' | 'delivery' | 'retirada' | 'mesa';

export type PaymentMethod = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'pg';

export interface ExtraOption {
  id: string;
  name: string;
  price: number;
}

export interface ProductExtraGroup {
  id: string;
  title: string;
  min: number;
  max: number;
  options: ExtraOption[];
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  image: string;
  available: boolean;
  code?: string;
  extraGroupIds?: string[];
  customExtras?: ExtraOption[];
  removableItems?: string[];
}

export interface CartItemExtra {
  groupId: string;
  groupTitle: string;
  optionId: string;
  optionName: string;
  price: number;
}

export interface CartItem {
  id: string; // unique item instance id
  productId: string;
  name: string;
  price: number; // base price
  quantity: number;
  selectedExtras: CartItemExtra[];
  removedItems?: string[];
  observations?: string;
  unitTotal: number; // base + extras
}

export interface Customer {
  id: string;
  name: string;
  phone: string; // e.g., 5511999998888
  email?: string;
  address?: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    complement?: string;
  };
  totalSpent: number;
  totalOrders: number;
  createdAt: string;
  notes?: string;
}

export interface Order {
  id: string;
  code: string; // Short display code like #1042
  type: OrderType;
  status: OrderStatus;
  createdAt: string;
  customer?: {
    name: string;
    phone: string;
    address?: string;
  };
  tableNumber?: number;
  comandaNumber?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pendente' | 'pago';
  notes?: string;
  waiterName?: string;
  deliveryDriverName?: string;
}

export interface Table {
  id: number; // Table number e.g. 1, 2, 3...
  name: string;
  capacity: number;
  status: 'livre' | 'ocupada' | 'fechando' | 'reservada';
  currentOrderIds: string[];
  openedAt?: string;
  waiterName?: string;
  customerName?: string;
}

export interface Comanda {
  id: string;
  code: string; // e.g. "C-101"
  customerName: string;
  customerPhone?: string;
  tableNumber?: number;
  status: 'aberta' | 'fechada';
  items: CartItem[];
  createdAt: string;
  total: number;
}

export interface Waiter {
  id: string;
  name: string;
  phone: string;
  status: 'ativo' | 'inativo';
  activeTables: number;
}

export interface DeliveryDriver {
  id: string;
  name: string;
  phone: string;
  status: 'disponivel' | 'em_rota' | 'indisponivel';
  completedToday: number;
}

export interface TimeSlot {
  open: string;
  close: string;
}

export interface DaySchedule {
  dayId: 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo';
  dayName: string;
  active: boolean;
  slots: TimeSlot[];
}

export interface StoreSettings {
  name: string;
  slogan: string;
  phone: string; // WhatsApp number
  whatsappPhone?: string;
  address: string;
  cnpj: string;
  pixKey: string;
  pixName?: string;
  pixCity?: string;
  deliveryFeeDefault: number;
  isOpen: boolean;
  isStoreActive?: boolean;
  allowOrdersWhenClosed?: boolean;
  storeTimezone?: string;
  weeklySchedule?: DaySchedule[];
  operatingHours: string;
  logoUrl: string;
  autoSendWhatsApp: boolean;
  enableWhatsAppBot?: boolean;
  welcomeWhatsAppMsg: string;
  orderConfirmedMsg?: string;
  orderDispatchedMsg?: string;
  orderReadyMsg?: string;
  pixRequestMsg?: string;
  thermalPaperWidth?: '58mm' | '80mm';
  // Configurações da Impressora Local e Impressão Automática
  printerName?: string;
  printerModel?: string;
  printerLocation?: string;
  printerInterface?: 'padrao_sistema' | 'usb' | 'rede' | 'bluetooth';
  printerIpAddress?: string;
  printerCutPaper?: boolean;
  printerBeepAlert?: boolean;
  autoPrintOnlineOrders?: boolean;
  autoPrintPdvOrders?: boolean;
  autoPrintTableBills?: boolean;
  autoPrintSilentMode?: boolean;
  menuSlug?: string;
  customDomain?: string;
}

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'order_pdv' | 'order_cardapio' | 'info' | 'success' | 'warning';
  order?: Order;
  createdAt: string;
  autoClose?: boolean;
  skipSound?: boolean;
}

