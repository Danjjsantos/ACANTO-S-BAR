import {
  Category,
  Product,
  ProductExtraGroup,
  Customer,
  Order,
  Table,
  Comanda,
  Waiter,
  DeliveryDriver,
  StoreSettings,
  AppUser,
} from '../types';
import { DEFAULT_WEEKLY_SCHEDULE } from '../utils/operatingHoursHelper';

// Sem cadastros de demonstração: apenas dados cadastrados pelo administrador
export const INITIAL_USERS: AppUser[] = [];

export const INITIAL_CATEGORIES: Category[] = [];

export const INITIAL_EXTRA_GROUPS: ProductExtraGroup[] = [];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_TABLES: Table[] = [];

export const INITIAL_COMANDAS: Comanda[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_WAITERS: Waiter[] = [];

export const INITIAL_DRIVERS: DeliveryDriver[] = [];

export const INITIAL_STORE_SETTINGS: StoreSettings = {
  name: 'BAR DO ACANTO',
  slogan: '',
  phone: '',
  whatsappPhone: '',
  address: '',
  cnpj: '',
  pixKey: '',
  pixName: 'BAR DO ACANTO',
  pixCity: '',
  deliveryFeeDefault: 0,
  isOpen: true,
  isStoreActive: true,
  allowOrdersWhenClosed: true,
  storeTimezone: 'America/Sao_Paulo',
  weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
  operatingHours: '',
  logoUrl: '',
  autoSendWhatsApp: true,
  enableWhatsAppBot: true,
  welcomeWhatsAppMsg:
    '👋 Olá, [NOME]! Obrigado por escolher a [LOJA]. Recebemos seu pedido [CODIGO] no valor de R$ [VALOR]! Já estamos preparando tudo com muito carinho.',
  orderConfirmedMsg:
    '✅ Ótimas notícias, [NOME]! Seu pedido [CODIGO] foi confirmado e já está na cozinha em fase de preparo.',
  orderDispatchedMsg:
    '🛵 Oba, [NOME]! Seu pedido [CODIGO] acabou de sair para entrega com o nosso motoboy [MOTOBOY]! Previsão de chegada: 15-25 min.',
  orderReadyMsg:
    '🛍️ Olá, [NOME]! Seu pedido [CODIGO] está pronto para retirada no nosso balcão! Pode vir buscar.',
  pixRequestMsg:
    '⚡ Para realizar o pagamento do pedido [CODIGO] no valor de R$ [VALOR], utilize nossa chave Pix: [PIX] (Titular: [LOJA]).',
  thermalPaperWidth: '80mm',
  printerName: 'Impressora POS-80 (Térmica)',
  printerModel: 'POS-80 (Térmica 80mm - Padrão)',
  printerLocation: 'Balcão de Atendimento',
  printerInterface: 'padrao_sistema',
  printerCutPaper: true,
  printerBeepAlert: true,
  autoPrintOnlineOrders: true,
  autoPrintPdvOrders: true,
  autoPrintTableBills: true,
  autoPrintSilentMode: false,
  menuSlug: 'acantosbar',
  customDomain: '',
};
