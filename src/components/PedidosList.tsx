import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Order, OrderStatus, OrderType, PaymentMethod } from '../types';
import { playSirenSound } from '../utils/orderAlerts';
import { generateStatusNotificationText, openWhatsAppLink, cleanPhoneNumber } from '../utils/whatsappHelper';
import {
  ClipboardList,
  Search,
  CheckCircle,
  CheckCircle2,
  Clock,
  Truck,
  MessageCircle,
  Receipt,
  Phone,
  Calendar,
  ChevronRight,
  Filter,
  Trash2,
  X,
  AlertTriangle,
  RotateCcw,
  UtensilsCrossed,
  ShoppingBag,
  Store,
  DollarSign,
  Printer,
  ChevronDown,
  Layers,
  Flame,
  Sparkles,
} from 'lucide-react';

interface OrderGroup {
  id: string;
  phoneKey: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  orders: Order[];
  codes: string[];
  combinedCode: string;
  totalAmount: number;
  totalSubtotal: number;
  totalDeliveryFee: number;
  totalItemsCount: number;
  hasUnpaid: boolean;
  allPaid: boolean;
  earliestDate: string;
  latestDate: string;
  isAccumulated: boolean;
}

export const PedidosList: React.FC = () => {
  const {
    orders,
    updateOrderStatus,
    updateOrderPaymentMethod,
    deleteOrder,
    sendOrderToWhatsApp,
    setSelectedReceiptOrder,
    createOrder,
    settings,
    addToast,
  } = useApp();

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ativos');
  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [paymentFilter, setPaymentFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);
  const [orderToSettlePG, setOrderToSettlePG] = useState<Order | null>(null);
  const [settleMethod, setSettleMethod] = useState<PaymentMethod>('pix');

  // Quick order simulator for testing
  const handleSimulateOrder = (source: 'cardapio' | 'pdv' | 'mesa') => {
    if (source === 'cardapio') {
      createOrder({
        type: 'delivery',
        status: 'confirmado',
        customer: {
          name: 'Juliana Paes',
          phone: '5511987654321',
          address: 'Av. Paulista, 1000 - Bela Vista - Apto 42',
        },
        items: [
          {
            id: `ci-${Date.now()}-1`,
            productId: 'p1',
            name: 'X-Burguer Especial Duplo',
            price: 32.9,
            quantity: 2,
            selectedExtras: [
              { groupId: 'g1', groupTitle: 'Extras', optionId: 'o1', optionName: 'Bacon Crocante', price: 5.0 },
              { groupId: 'g1', groupTitle: 'Extras', optionId: 'o2', optionName: 'Queijo Cheddar Extra', price: 4.0 },
            ],
            observations: 'Sem cebola, por favor!',
            unitTotal: 41.9,
          },
          {
            id: `ci-${Date.now()}-2`,
            productId: 'p2',
            name: 'Coca-Cola Zero 350ml',
            price: 7.0,
            quantity: 2,
            selectedExtras: [],
            unitTotal: 7.0,
          },
        ],
        subtotal: 97.8,
        discount: 0,
        deliveryFee: 6.0,
        total: 103.8,
        paymentMethod: 'pix',
        paymentStatus: 'pago',
        notes: 'Campainha está quebrada, favor ligar ao chegar.',
      });
    } else if (source === 'pdv') {
      createOrder({
        type: 'pdv',
        status: 'confirmado',
        customer: { name: 'Cliente Balcão - Pedro', phone: '5511977778888' },
        items: [
          {
            id: `ci-${Date.now()}-3`,
            productId: 'p3',
            name: 'Açaí na Tigela 500ml',
            price: 22.0,
            quantity: 1,
            selectedExtras: [
              { groupId: 'g2', groupTitle: 'Acompanhamentos', optionId: 'o3', optionName: 'Leite Ninho e Leite Condensado', price: 4.0 },
            ],
            observations: 'Bastante leite condensado',
            unitTotal: 26.0,
          },
        ],
        subtotal: 26.0,
        discount: 0,
        deliveryFee: 0,
        total: 26.0,
        paymentMethod: 'cartao_credito',
        paymentStatus: 'pago',
      });
    } else {
      createOrder({
        type: 'mesa',
        status: 'confirmado',
        tableNumber: 3,
        waiterName: 'Gabriel Santos',
        customer: { name: 'Família Santos', phone: '5511966665555' },
        items: [
          {
            id: `ci-${Date.now()}-4`,
            productId: 'p4',
            name: 'Pizza Calabresa Especial (G)',
            price: 58.0,
            quantity: 1,
            selectedExtras: [
              { groupId: 'g3', groupTitle: 'Borda Recheada', optionId: 'o4', optionName: 'Borda de Catupiry', price: 8.0 },
            ],
            observations: 'Caprichar no orégano',
            unitTotal: 66.0,
          },
          {
            id: `ci-${Date.now()}-5`,
            productId: 'p5',
            name: 'Sucre de Laranja 500ml',
            price: 12.0,
            quantity: 2,
            selectedExtras: [],
            unitTotal: 12.0,
          },
        ],
        subtotal: 90.0,
        discount: 0,
        deliveryFee: 0,
        total: 90.0,
        paymentMethod: 'pix',
        paymentStatus: 'pago',
      });
    }
  };

  // Status Labels & Color Schemes
  const statusConfig: Record<
    OrderStatus,
    { label: string; bg: string; border: string; text: string; badge: string; icon: string }
  > = {
    confirmado: {
      label: 'Pedido Confirmado',
      bg: 'bg-amber-50/60',
      border: 'border-amber-200',
      text: 'text-amber-900',
      badge: 'bg-amber-500 text-white',
      icon: '🔔',
    },
    pronto_para_retirada: {
      label: 'Pronto p/ Retirada',
      bg: 'bg-purple-50/60',
      border: 'border-purple-200',
      text: 'text-purple-900',
      badge: 'bg-purple-600 text-white',
      icon: '✅',
    },
    entregue: {
      label: 'Entregue / Concluído',
      bg: 'bg-emerald-50/40',
      border: 'border-emerald-200',
      text: 'text-emerald-900',
      badge: 'bg-emerald-600 text-white',
      icon: '🛵',
    },
    cancelado: {
      label: 'Cancelado',
      bg: 'bg-rose-50/40',
      border: 'border-rose-200',
      text: 'text-rose-900',
      badge: 'bg-rose-600 text-white',
      icon: '❌',
    },
  };

  // Next status mapping
  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    switch (current) {
      case 'confirmado':
        return 'pronto_para_retirada';
      case 'pronto_para_retirada':
        return 'entregue';
      default:
        return null;
    }
  };

  // Previous status mapping
  const getPrevStatus = (current: OrderStatus): OrderStatus | null => {
    switch (current) {
      case 'pronto_para_retirada':
        return 'confirmado';
      case 'entregue':
        return 'pronto_para_retirada';
      default:
        return null;
    }
  };

  // Filter Orders
  const filteredOrders = orders.filter((ord) => {
    // Status Filter logic
    let matchesStatus = true;
    if (statusFilter === 'ativos') {
      matchesStatus = ord.status === 'confirmado' || ord.status === 'pronto_para_retirada';
    } else if (statusFilter !== 'todos') {
      matchesStatus = ord.status === statusFilter;
    }

    // Type Filter logic
    let matchesType = true;
    if (typeFilter !== 'todos') {
      matchesType = ord.type === typeFilter;
    }

    // Payment Filter logic
    let matchesPayment = true;
    if (paymentFilter !== 'todos') {
      matchesPayment = ord.paymentMethod === paymentFilter;
    }

    // Search Query matching
    const q = searchQuery.toLowerCase().trim();
    let matchesSearch = true;
    if (q) {
      const codeMatch = (ord.code || '').toLowerCase().includes(q);
      const nameMatch = (ord.customer?.name || '').toLowerCase().includes(q);
      const phoneMatch = (ord.customer?.phone || '').includes(q);
      const addressMatch = (ord.customer?.address || '').toLowerCase().includes(q);
      const notesMatch = (ord.notes || '').toLowerCase().includes(q);
      const itemMatch = ord.items?.some((i) => (i.name || '').toLowerCase().includes(q));
      const waiterMatch = (ord.waiterName || '').toLowerCase().includes(q);

      matchesSearch = codeMatch || nameMatch || phoneMatch || addressMatch || notesMatch || itemMatch || waiterMatch;
    }

    return matchesStatus && matchesType && matchesPayment && matchesSearch;
  });

  // Toggle for accumulating orders by customer phone number
  const [groupByPhone, setGroupByPhone] = useState<boolean>(true);

  // Group filtered orders by customer phone number
  const orderGroups = useMemo<OrderGroup[]>(() => {
    if (!groupByPhone) {
      return filteredOrders.map((ord) => ({
        id: ord.id,
        phoneKey: cleanPhoneNumber(ord.customer?.phone),
        customerName: ord.customer?.name || 'Cliente Balcão',
        customerPhone: ord.customer?.phone || '',
        customerAddress: ord.customer?.address,
        orders: [ord],
        codes: [ord.code || `#${ord.id}`],
        combinedCode: ord.code || `#${ord.id}`,
        totalAmount: ord.total || 0,
        totalSubtotal: ord.subtotal || 0,
        totalDeliveryFee: ord.deliveryFee || 0,
        totalItemsCount: ord.items ? ord.items.reduce((s, i) => s + i.quantity, 0) : 0,
        hasUnpaid: ord.paymentStatus !== 'pago',
        allPaid: ord.paymentStatus === 'pago',
        earliestDate: ord.createdAt,
        latestDate: ord.createdAt,
        isAccumulated: false,
      }));
    }

    const groupsMap = new Map<string, Order[]>();
    const unphonedOrders: Order[] = [];

    filteredOrders.forEach((ord) => {
      const pKey = cleanPhoneNumber(ord.customer?.phone);
      if (pKey && pKey.length >= 8) {
        if (!groupsMap.has(pKey)) {
          groupsMap.set(pKey, []);
        }
        groupsMap.get(pKey)!.push(ord);
      } else {
        unphonedOrders.push(ord);
      }
    });

    const result: OrderGroup[] = [];

    groupsMap.forEach((groupOrders, pKey) => {
      groupOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const newest = groupOrders[0];
      const customerName = groupOrders.find((o) => o.customer?.name)?.customer?.name || newest.customer?.name || 'Cliente';
      const customerPhone = groupOrders.find((o) => o.customer?.phone)?.customer?.phone || newest.customer?.phone || pKey;
      const customerAddress = groupOrders.find((o) => o.customer?.address)?.customer?.address || newest.customer?.address;

      const codes = groupOrders.map((o) => o.code || `#${o.id}`);
      const combinedCode = codes.join(' + ');

      const totalAmount = groupOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const totalSubtotal = groupOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
      const totalDeliveryFee = groupOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
      const totalItemsCount = groupOrders.reduce(
        (sum, o) => sum + (o.items ? o.items.reduce((iSum, i) => i.quantity + iSum, 0) : 0),
        0
      );

      const hasUnpaid = groupOrders.some((o) => o.paymentStatus !== 'pago');
      const allPaid = groupOrders.every((o) => o.paymentStatus === 'pago');

      const earliestDate = groupOrders[groupOrders.length - 1].createdAt;
      const latestDate = groupOrders[0].createdAt;

      result.push({
        id: `group-${pKey}-${newest.id}`,
        phoneKey: pKey,
        customerName,
        customerPhone,
        customerAddress,
        orders: groupOrders,
        codes,
        combinedCode,
        totalAmount,
        totalSubtotal,
        totalDeliveryFee,
        totalItemsCount,
        hasUnpaid,
        allPaid,
        earliestDate,
        latestDate,
        isAccumulated: groupOrders.length > 1,
      });
    });

    unphonedOrders.forEach((ord) => {
      result.push({
        id: ord.id,
        phoneKey: '',
        customerName: ord.customer?.name || 'Cliente Balcão',
        customerPhone: ord.customer?.phone || '',
        customerAddress: ord.customer?.address,
        orders: [ord],
        codes: [ord.code || `#${ord.id}`],
        combinedCode: ord.code || `#${ord.id}`,
        totalAmount: ord.total || 0,
        totalSubtotal: ord.subtotal || 0,
        totalDeliveryFee: ord.deliveryFee || 0,
        totalItemsCount: ord.items ? ord.items.reduce((s, i) => s + i.quantity, 0) : 0,
        hasUnpaid: ord.paymentStatus !== 'pago',
        allPaid: ord.paymentStatus === 'pago',
        earliestDate: ord.createdAt,
        latestDate: ord.createdAt,
        isAccumulated: false,
      });
    });

    result.sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime());

    return result;
  }, [filteredOrders, groupByPhone]);

  const accumulatedGroupsCount = orderGroups.filter((g) => g.isAccumulated).length;

  // Actions for accumulated group
  const handleAdvanceAllGroup = (group: OrderGroup) => {
    group.orders.forEach((ord) => {
      const next = getNextStatus(ord.status || 'confirmado');
      if (next) {
        updateOrderStatus(ord.id, next);
      }
    });
    addToast({
      title: 'Status dos Pedidos Atualizado',
      message: `Todos os pedidos acumulados de ${group.customerName} foram avançados!`,
      type: 'success',
    });
  };

  const handleSettleAllGroup = (group: OrderGroup) => {
    group.orders.forEach((ord) => {
      if (ord.paymentStatus !== 'pago') {
        updateOrderPaymentMethod(ord.id, ord.paymentMethod && ord.paymentMethod !== 'pg' ? ord.paymentMethod : 'pix', 'pago');
      }
    });
    addToast({
      title: 'Pagamentos Quitados!',
      message: `Todos os pedidos de ${group.customerName} foram marcados como pagos.`,
      type: 'success',
    });
  };

  const handleSendWhatsAppGroup = (group: OrderGroup) => {
    const storeName = settings.name || 'BAR DO ACANTO';
    let msg = `🛍️ *PEDIDOS ACUMULADOS (${group.combinedCode})* - *${storeName}*\n\n`;
    msg += `👤 *Cliente:* ${group.customerName}\n`;
    msg += `📱 *Telefone:* ${group.customerPhone}\n`;
    if (group.customerAddress) msg += `🏠 *Endereço:* ${group.customerAddress}\n`;
    msg += `📦 *Total de Pedidos:* ${group.orders.length}\n\n`;

    group.orders.forEach((ord, idx) => {
      msg += `--- *PEDIDO ${ord.code || `#${idx + 1}`}* (${ord.type.toUpperCase()}) ---\n`;
      ord.items?.forEach((i) => {
        msg += `• *${i.quantity}x ${i.name}* - R$ ${((i.unitTotal || i.price) * i.quantity).toFixed(2).replace('.', ',')}\n`;
        if (i.selectedExtras && i.selectedExtras.length > 0) {
          msg += `   └ _Adicionais: ${i.selectedExtras.map((e) => e.optionName).join(', ')}_\n`;
        }
        if (i.observations) msg += `   └ _Obs: ${i.observations}_\n`;
      });
      if (ord.notes) msg += `   └ _Obs Geral: ${ord.notes}_\n`;
      msg += `Subtotal: R$ ${(ord.total || 0).toFixed(2).replace('.', ',')}\n\n`;
    });

    msg += `💰 *TOTAL ACUMULADO:* *R$ ${group.totalAmount.toFixed(2).replace('.', ',')}*\n`;
    msg += `💳 *Status Pagamento:* ${group.allPaid ? '✅ TODOS PAGOS' : '⏳ POSSUI PENDÊNCIA'}\n\n`;
    msg += `Agradecemos a preferência! Qualquer dúvida responda por aqui. 😊`;

    openWhatsAppLink(group.customerPhone, msg);
    addToast({
      title: 'WhatsApp Aberto',
      message: `Resumo acumulado enviado para ${group.customerName}.`,
      type: 'info',
    });
  };

  const handlePrintGroupReceipt = (group: OrderGroup) => {
    const allItems = group.orders.flatMap((o) => o.items || []);
    const mergedOrder: Order = {
      id: group.id,
      code: group.combinedCode,
      type: group.orders[0]?.type || 'delivery',
      status: group.orders[0]?.status || 'confirmado',
      customer: {
        name: group.customerName,
        phone: group.customerPhone,
        address: group.customerAddress,
      },
      items: allItems,
      subtotal: group.totalSubtotal,
      deliveryFee: group.totalDeliveryFee,
      discount: 0,
      total: group.totalAmount,
      paymentMethod: group.allPaid ? (group.orders[0]?.paymentMethod || 'pix') : 'pg',
      paymentStatus: group.allPaid ? 'pago' : 'pendente',
      createdAt: group.earliestDate,
      notes: group.orders.map((o) => o.notes).filter(Boolean).join(' | '),
    };
    setSelectedReceiptOrder(mergedOrder);
  };

  // Calculate Counters
  const countAtivos = orders.filter((o) => o.status === 'confirmado' || o.status === 'pronto_para_retirada').length;
  const countConfirmado = orders.filter((o) => o.status === 'confirmado').length;
  const countProntoRetirada = orders.filter((o) => o.status === 'pronto_para_retirada').length;
  const countEntregue = orders.filter((o) => o.status === 'entregue').length;
  const countCancelado = orders.filter((o) => o.status === 'cancelado').length;

  // Format Created At time
  const formatOrderTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;

      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

      const timeFormatted = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      if (diffMinutes < 1) return `Às ${timeFormatted} (agora mesmo)`;
      if (diffMinutes < 60) return `Às ${timeFormatted} (há ${diffMinutes} min)`;
      return `Às ${timeFormatted}`;
    } catch {
      return isoString;
    }
  };

  // Helper to send status WhatsApp update
  const sendWhatsAppStatusUpdate = (ord: Order) => {
    const text = generateStatusNotificationText(ord, settings);
    const phone = ord.customer?.phone || settings.phone || '';
    openWhatsAppLink(phone, text);
    addToast({
      title: 'Notificação Enviada',
      message: `Status do pedido ${ord.code} enviado para o WhatsApp.`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-3 pb-6">
      
      {/* Header & Simulator Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-purple-600" /> Pedidos em Andamento & Cozinha (KDS)
              {countAtivos > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-black animate-pulse">
                  {countAtivos} em andamento
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-500">
              Gerencie a fila de preparo e acompanhe pedidos com atualização em tempo real.
            </p>
          </div>
        </div>

        {/* Search & Type Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por código (#1045), cliente, item ou mesa..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Type & Payment Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-0.5 scrollbar-none">
            {/* Phone Accumulation Toggle */}
            <button
              type="button"
              onClick={() => setGroupByPhone(!groupByPhone)}
              className={`px-3 py-1 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                groupByPhone
                  ? 'bg-amber-500 text-white hover:bg-amber-600 ring-2 ring-amber-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
              title="Acumular pedidos do mesmo número de telefone até ser finalizado"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{groupByPhone ? 'Acumular p/ Telefone: ATIVO' : 'Acumular p/ Telefone: OFF'}</span>
              {accumulatedGroupsCount > 0 && groupByPhone && (
                <span className="bg-white text-amber-950 px-1.5 py-0.2 rounded-full text-[10px] font-black animate-pulse">
                  {accumulatedGroupsCount}
                </span>
              )}
            </button>

            {[
              { id: 'todos', label: 'Todos os Tipos' },
              { id: 'delivery', label: '🛵 Delivery' },
              { id: 'pdv', label: '🏪 PDV / Balcão' },
              { id: 'mesa', label: '🍽️ Salão / Mesa' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  typeFilter === t.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}

            {/* Payment Method Filter Dropdown */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="todos">💳 Todos os Pagamentos</option>
              <option value="pg">📌 Apenas PG (A Receber)</option>
              <option value="pix">⚡ PIX</option>
              <option value="cartao_credito">💳 Cartão Crédito</option>
              <option value="cartao_debito">💳 Cartão Débito</option>
              <option value="dinheiro">💵 Dinheiro</option>
            </select>
          </div>
        </div>

        {/* Status Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none border-t border-slate-100 pt-2">
          {[
            { id: 'ativos', label: '⚡ Em Andamento (Ativos)', count: countAtivos },
            { id: 'todos', label: '📋 Todos os Pedidos', count: orders.length },
            { id: 'confirmado', label: '🔔 Pedido Confirmado', count: countConfirmado },
            { id: 'pronto_para_retirada', label: '✅ Pronto p/ Retirada', count: countProntoRetirada },
            { id: 'entregue', label: '🛵 Entregues', count: countEntregue },
            { id: 'cancelado', label: '❌ Cancelados', count: countCancelado },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  statusFilter === tab.id ? 'bg-white text-purple-900' : 'bg-slate-200 text-slate-800'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      {orderGroups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
          <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30 text-purple-600" />
          <p className="text-sm font-bold text-slate-700">Nenhum pedido encontrado nesta categoria.</p>
          <p className="text-xs text-slate-400 mt-1">Altere o filtro de pesquisa acima.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {orderGroups.map((group) => {
            if (group.isAccumulated) {
              // ACCUMULATED GROUP CARD (Multiple orders from same Customer Phone)
              return (
                <div
                  key={group.id}
                  className="bg-gradient-to-br from-amber-50/90 via-purple-50/40 to-white rounded-2xl border-2 border-amber-300 p-4 shadow-md flex flex-col justify-between space-y-3 relative overflow-hidden ring-1 ring-amber-400/30 col-span-1 sm:col-span-2 lg:col-span-2"
                >
                  <div>
                    {/* Header Badge */}
                    <div className="flex items-center justify-between pb-2 border-b border-amber-200/80">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-500 text-white font-black text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs animate-pulse">
                          <Flame className="w-3.5 h-3.5 fill-white" /> {group.orders.length} PEDIDOS ACUMULADOS
                        </span>
                        <span className="font-mono font-black text-slate-900 text-xs bg-white/90 px-2 py-0.5 rounded-lg border border-amber-200 shadow-2xs">
                          {group.combinedCode}
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                        Mesmo Telefone
                      </span>
                    </div>

                    {/* Customer Info Header */}
                    <div className="py-2.5 border-b border-amber-200/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                          👤 {group.customerName}
                        </h4>
                        <p className="text-xs text-amber-900 font-black flex items-center gap-1 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-amber-600" /> {group.customerPhone}
                        </p>
                        {group.customerAddress && (
                          <p className="text-[11px] text-slate-700 font-medium bg-white/90 p-1.5 rounded-lg border border-slate-200/80 mt-1 shadow-2xs">
                            📍 {group.customerAddress}
                          </p>
                        )}
                      </div>

                      <div className="text-left sm:text-right bg-white p-2.5 rounded-xl border border-amber-200 shadow-2xs w-full sm:w-auto">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Acumulado</span>
                        <span className="text-base font-black text-purple-700 block">
                          R$ {group.totalAmount.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-[10px] font-extrabold text-slate-500 block">
                          🛒 {group.totalItemsCount} itens ({group.orders.length} pedidos)
                        </span>
                      </div>
                    </div>

                    {/* Breakdown of Sub-orders */}
                    <div className="py-2.5 space-y-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                        <Layers className="w-3 h-3 text-purple-600" /> Detalhamento dos Pedidos Acumulados:
                      </span>

                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {group.orders.map((subOrd, idx) => {
                          const currentStatus = subOrd.status || 'confirmado';
                          const cfg = statusConfig[currentStatus] || statusConfig.confirmado;
                          const nextSt = getNextStatus(currentStatus);

                          return (
                            <div
                              key={subOrd.id}
                              className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2 relative"
                            >
                              {/* Sub-order Header */}
                              <div className="flex flex-wrap items-center justify-between gap-1 border-b border-slate-100 pb-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-slate-900 text-xs">{idx + 1}º Pedido:</span>
                                  <span className="font-black text-purple-700 text-xs">{subOrd.code || `#${subOrd.id}`}</span>
                                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                                    {subOrd.type === 'delivery' ? '🛵 Delivery' : subOrd.type === 'pdv' ? '🏪 Balcão' : '🍽️ Mesa'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${cfg.badge}`}>
                                    {cfg.icon} {cfg.label}
                                  </span>
                                  <span className="text-[11px] font-black text-slate-900">
                                    R$ {(subOrd.total || 0).toFixed(2).replace('.', ',')}
                                  </span>
                                </div>
                              </div>

                              {/* Sub-order Items List */}
                              <div className="space-y-1 text-[11px] text-slate-800 pl-1 border-l-2 border-purple-300">
                                {subOrd.items?.map((item) => (
                                  <div key={item.id} className="flex justify-between items-start font-medium">
                                    <span>
                                      <strong className="text-purple-700 font-bold">{item.quantity}x</strong> {item.name}
                                    </span>
                                    <span className="text-slate-600 font-bold text-[10px]">
                                      R$ {((item.unitTotal || item.price || 0) * item.quantity).toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>
                                ))}
                                {subOrd.notes && (
                                  <p className="text-[10px] italic text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                    💬 Obs: {subOrd.notes}
                                  </p>
                                )}
                              </div>

                              {/* Sub-order Controller Bar */}
                              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                                <span className="text-slate-400 font-medium flex items-center gap-0.5">
                                  <Clock className="w-3 h-3" /> {formatOrderTime(subOrd.createdAt)}
                                </span>

                                <div className="flex items-center gap-1">
                                  <select
                                    value={currentStatus}
                                    onChange={(e) => updateOrderStatus(subOrd.id, e.target.value as OrderStatus)}
                                    className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-800 focus:outline-none cursor-pointer"
                                  >
                                    <option value="confirmado">🔔 Confirmado</option>
                                    <option value="pronto_para_retirada">✅ Pronto p/ Retirada</option>
                                    <option value="entregue">🛵 Entregue</option>
                                    <option value="cancelado">❌ Cancelado</option>
                                  </select>

                                  {nextSt && (
                                    <button
                                      onClick={() => updateOrderStatus(subOrd.id, nextSt)}
                                      className="px-2 py-0.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-lg transition cursor-pointer text-[10px]"
                                      title={`Avançar para ${statusConfig[nextSt].label}`}
                                    >
                                      Avançar →
                                    </button>
                                  )}

                                  <button
                                    onClick={() => sendWhatsAppStatusUpdate(subOrd)}
                                    className="p-1 rounded-lg bg-emerald-500 text-white font-bold cursor-pointer hover:bg-emerald-600"
                                    title="Enviar Notificação do Pedido"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                  </button>

                                  <button
                                    onClick={() => setOrderToDelete(subOrd)}
                                    className="p-1 rounded-lg bg-rose-50 text-rose-600 font-bold cursor-pointer border border-rose-200 hover:bg-rose-100"
                                    title="Excluir este pedido"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Group Action Controls (Global for Accumulated Orders) */}
                  <div className="pt-2 border-t border-amber-200 space-y-2 bg-amber-50/80 -mx-4 -mb-4 p-3 rounded-b-2xl">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <button
                        onClick={() => handleAdvanceAllGroup(group)}
                        className="flex-1 py-2 px-3 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <span>🚀 Avançar Todos os Pedidos →</span>
                      </button>

                      {group.hasUnpaid && (
                        <button
                          onClick={() => handleSettleAllGroup(group)}
                          className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                          title="Marcar todos os pedidos pendentes como pagos"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Quitar Todos
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-1.5">
                      <button
                        onClick={() => handleSendWhatsAppGroup(group)}
                        className="flex-1 py-1.5 px-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                        title="Enviar resumo completo acumulado via WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Acumulado
                      </button>

                      <button
                        onClick={() => handlePrintGroupReceipt(group)}
                        className="py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                        title="Imprimir Comprovante com Todos os Itens Acumulados"
                      >
                        <Printer className="w-3.5 h-3.5" /> Imprimir Cupom Acumulado
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            // SINGLE ORDER CARD
            const ord = group.orders[0];
            const currentStatus = ord.status || 'confirmado';
            const cfg = statusConfig[currentStatus] || statusConfig.confirmado;
            const nextSt = getNextStatus(currentStatus);
            const prevSt = getPrevStatus(currentStatus);

            return (
              <div
                key={ord.id}
                className={`bg-white rounded-2xl border ${cfg.border} p-3.5 shadow-2xs flex flex-col justify-between space-y-2.5 transition hover:shadow-md ${cfg.bg} relative overflow-hidden`}
              >
                <div>
                  
                  {/* Card Header: Code, Type Badge, Time & Status */}
                  <div className="flex items-start justify-between gap-1.5 pb-2 border-b border-slate-200/60">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-900 text-base">{ord.code || `#${ord.id}`}</span>
                        <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded-md bg-white border border-slate-200 text-slate-700 shadow-2xs">
                          {ord.type === 'delivery'
                            ? '🛵 Delivery'
                            : ord.type === 'pdv'
                            ? '🏪 Balcão'
                            : ord.type === 'mesa'
                            ? '🍽️ Mesa'
                            : '🛍️ Retirada'}
                        </span>
                      </div>
                      <p className="text-[10px] font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" /> {formatOrderTime(ord.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase shadow-2xs ${cfg.badge}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                      {ord.tableNumber && (
                        <span className="text-[9px] font-extrabold text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded-md">
                          Mesa {ord.tableNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="py-2 text-xs space-y-0.5 text-slate-700 border-b border-slate-200/60">
                    <p className="font-extrabold text-slate-900 flex items-center gap-1 text-xs truncate">
                      👤 {ord.customer?.name || 'Cliente Balcão'}
                    </p>
                    {ord.customer?.phone && (
                      <p className="text-slate-600 font-medium flex items-center gap-1 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" /> {ord.customer.phone}
                      </p>
                    )}
                    {ord.customer?.address && (
                      <p className="text-[10px] text-slate-700 font-medium bg-white/90 p-1.5 rounded-lg border border-slate-200/80 mt-1 shadow-2xs line-clamp-2">
                        📍 {ord.customer.address}
                      </p>
                    )}
                    {ord.waiterName && (
                      <p className="text-[10px] font-bold text-purple-800">
                        👨‍🍳 Garçom: {ord.waiterName}
                      </p>
                    )}
                  </div>

                  {/* Items List with Extras & Observations */}
                  <div className="py-2 space-y-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      Itens ({ord.items?.length || 0}):
                    </span>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {ord.items?.map((item) => (
                        <div key={item.id} className="bg-white p-2 rounded-lg border border-slate-200/80 text-[11px] space-y-0.5 shadow-2xs">
                          <div className="flex justify-between items-start font-bold text-slate-900">
                            <span className="pr-1 leading-snug">
                              <strong className="text-purple-700 font-black">{item.quantity}x</strong> {item.name}
                            </span>
                            <span className="text-slate-900 font-black whitespace-nowrap text-[11px]">
                              R$ {((item.unitTotal || item.price || 0) * item.quantity).toFixed(2).replace('.', ',')}
                            </span>
                          </div>

                          {/* Selected Extras */}
                          {item.selectedExtras && item.selectedExtras.length > 0 && (
                            <div className="pl-2 border-l-2 border-purple-300 space-y-0.5 text-[10px] text-slate-600">
                              {item.selectedExtras.map((ex, idx) => (
                                <p key={idx} className="flex justify-between">
                                  <span>+ {ex.optionName}</span>
                                  {ex.price > 0 && <span>(R$ {ex.price.toFixed(2).replace('.', ' ')})</span>}
                                </p>
                              ))}
                            </div>
                          )}

                          {/* Item Observations */}
                          {item.observations && (
                            <p className="text-[10px] italic font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60">
                              📝 {item.observations}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* General Order Notes */}
                  {ord.notes && (
                    <div className="p-2 bg-amber-100/70 border border-amber-200 rounded-lg text-[10px] text-amber-900 mb-2 font-semibold">
                      💬 Obs: {ord.notes}
                    </div>
                  )}

                  {/* Total & Payment Summary */}
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Pagamento:</span>
                      <div className="flex items-center gap-1.5 font-extrabold text-slate-800 mt-0.5">
                        {ord.paymentStatus === 'pago' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="uppercase font-black text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-lg border border-emerald-300 flex items-center gap-1 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              {(ord.paymentMethod || 'pix').replace('_', ' ')} • PAGO
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setOrderToSettlePG(ord);
                                setSettleMethod(ord.paymentMethod || 'pix');
                              }}
                              className="text-[10px] text-slate-500 hover:text-purple-700 underline font-bold cursor-pointer"
                              title="Alterar forma de pagamento utilizada"
                            >
                              Alterar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="bg-amber-100 text-amber-950 border border-amber-300 px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1">
                              ⏳ {ord.paymentMethod === 'pg' ? '📌 PG (A RECEBER)' : 'PENDENTE'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setOrderToSettlePG(ord);
                                setSettleMethod(ord.paymentMethod && ord.paymentMethod !== 'pg' ? ord.paymentMethod : 'pix');
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg transition cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
                              title="Marcar como Pago e Selecionar Forma de Pagamento"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Marcar como Pago
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Total:</span>
                      <span className="text-sm font-black text-purple-700">
                        R$ {(ord.total || 0).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Actions & Status Controller Bar */}
                <div className="pt-2 border-t border-slate-200/80 space-y-2">
                  
                  {/* Status Progression Controls */}
                  <div className="flex items-center gap-1.5">
                    {/* Previous status button */}
                    {prevSt && (
                      <button
                        onClick={() => updateOrderStatus(ord.id, prevSt)}
                        title={`Voltar para ${statusConfig[prevSt].label}`}
                        className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer border border-slate-200"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Next status advance button */}
                    {nextSt ? (
                      <button
                        onClick={() => updateOrderStatus(ord.id, nextSt)}
                        className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <span>Avançar →</span>
                        <span className="text-[10px] font-bold bg-purple-800/60 px-1.5 py-0.5 rounded">
                          {statusConfig[nextSt].label}
                        </span>
                      </button>
                    ) : (
                      <div className="flex-1 py-2 text-center text-xs font-bold text-emerald-700 bg-emerald-100 rounded-xl">
                        ✓ Pedido Finalizado
                      </div>
                    )}
                  </div>

                  {/* Secondary Tools: Dropdown Status, WhatsApp, Receipt, Delete */}
                  <div className="flex items-center justify-between gap-1.5 pt-1">
                    
                    {/* Select Status directly */}
                    <div className="relative flex-1">
                      <select
                        value={currentStatus}
                        onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-800 focus:ring-1 focus:ring-purple-500 focus:outline-none cursor-pointer"
                      >
                        <option value="confirmado">🔔 Pedido Confirmado</option>
                        <option value="pronto_para_retirada">✅ Pronto para Retirada</option>
                        <option value="entregue">🛵 Entregue</option>
                        <option value="cancelado">❌ Cancelado</option>
                      </select>
                    </div>

                    {/* WhatsApp Status Notifier */}
                    <button
                      onClick={() => sendWhatsAppStatusUpdate(ord)}
                      className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition shrink-0 cursor-pointer shadow-2xs"
                      title="Enviar Atualização de Status via WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>

                    {/* Print / Receipt Modal */}
                    <button
                      onClick={() => setSelectedReceiptOrder(ord)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold transition shrink-0 cursor-pointer shadow-2xs"
                      title="Ver Comprovante / Imprimir Cupom Térmico"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {/* Delete Order */}
                    <button
                      onClick={() => setOrderToDelete(ord)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition shrink-0 cursor-pointer border border-rose-200/80"
                      title="Excluir Pedido"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SETTLE / UPDATE PAYMENT MODAL */}
      {orderToSettlePG && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center font-black">
                  💵
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Atualizar Pagamento ({orderToSettlePG.code})</h3>
                  <p className="text-xs text-slate-500 font-medium">Cliente: {orderToSettlePG.customer?.name || 'Cliente Balcão/Online'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOrderToSettlePG(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-purple-800 uppercase block">Valor do Pedido</span>
                <span className="text-xl font-black text-purple-950">
                  R$ {(orderToSettlePG.total || 0).toFixed(2).replace('.', ',')}
                </span>
              </div>
              <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                orderToSettlePG.paymentStatus === 'pago' ? 'bg-emerald-200 text-emerald-950' : 'bg-amber-200 text-amber-950'
              }`}>
                {orderToSettlePG.paymentStatus === 'pago' ? 'PAGO' : 'PENDENTE'}
              </span>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                Qual foi a Forma de Pagamento Utilizada? *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'pix', label: '⚡ Pix', desc: 'Transferência instantânea' },
                  { id: 'cartao_credito', label: '💳 Cartão Crédito', desc: 'Maquininha balcão / online' },
                  { id: 'cartao_debito', label: '💳 Cartão Débito', desc: 'Maquininha balcão / online' },
                  { id: 'dinheiro', label: '💵 Dinheiro', desc: 'Pagamento em espécie' },
                  { id: 'pg', label: '📌 PG (Pendência)', desc: 'A receber (Fiado)' },
                ].map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setSettleMethod(pm.id as PaymentMethod)}
                    className={`p-3 rounded-xl text-left border transition cursor-pointer flex flex-col ${
                      settleMethod === pm.id
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/20 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-extrabold text-xs">{pm.label}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{pm.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-snug">
              💡 <strong>Ao confirmar:</strong> O status do pagamento será atualizado para <strong>{settleMethod === 'pg' ? 'PENDENTE PG' : 'PAGO'}</strong> e o valor de <strong>R$ {(orderToSettlePG.total || 0).toFixed(2).replace('.', ',')}</strong> será contabilizado adequadamente no faturamento.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOrderToSettlePG(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  updateOrderPaymentMethod(orderToSettlePG.id, settleMethod);
                  setOrderToSettlePG(null);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 transition"
              >
                <CheckCircle2 className="w-4 h-4" /> Confirmar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE ORDER MODAL */}
      {orderToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Excluir Pedido {orderToDelete.code}?</h3>
                <p className="text-xs text-slate-500">
                  O registro do pedido será permanentemente removido do histórico.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteOrder(orderToDelete.id);
                  setOrderToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
