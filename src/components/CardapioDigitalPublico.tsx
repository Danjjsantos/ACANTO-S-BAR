import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product, CartItem, OrderType, PaymentMethod, CartItemExtra } from '../types';
import { PixQrCodeDisplay } from './PixQrCodeDisplay';
import { cleanPhoneNumber, buildWhatsAppLink, openWhatsAppLink } from '../utils/whatsappHelper';
import { getStoreOperatingStatus } from '../utils/operatingHoursHelper';
import {
  ShoppingBag,
  Search,
  Plus,
  Minus,
  X,
  CheckCircle,
  Truck,
  Store,
  UtensilsCrossed,
  MessageCircle,
  Clock,
  MapPin,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Copy,
  Link,
  AlertTriangle,
  ExternalLink,
  Lock,
} from 'lucide-react';

export const CardapioDigitalPublico: React.FC = () => {
  const {
    settings,
    products,
    categories,
    extraGroups,
    createOrder,
    setViewMode,
    tables,
    generateCartWhatsAppCheckoutLink,
    addToast,
    currentUser,
  } = useApp();

  const handleCopyWhatsAppLink = () => {
    if (cart.length === 0) return;
    const addressStr = orderType === 'delivery' ? `${street}, ${number} - ${neighborhood}` : undefined;
    const link = generateCartWhatsAppCheckoutLink(
      cart,
      { name: customerName || 'Cliente', phone: customerPhone, address: addressStr },
      orderType,
      paymentMethod,
      deliveryFee,
      cartSubtotal,
      cartTotal
    );
    navigator.clipboard.writeText(link);
    addToast({
      title: 'Link de Checkout WhatsApp Gerado!',
      message: 'O link direto de pedido foi copiado. Você pode colar no WhatsApp para o cliente!',
      type: 'success',
    });
  };

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart state for public menu
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCartDrawer, setShowCartDrawer] = useState(false);

  // Customization modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customQty, setCustomQty] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<CartItemExtra[]>([]);
  const [selectedRemovedItems, setSelectedRemovedItems] = useState<string[]>([]);
  const [observations, setObservations] = useState('');

  // Sync selectedProduct if the product is updated or paused by admin live
  React.useEffect(() => {
    if (selectedProduct) {
      const updated = products.find((p) => p.id === selectedProduct.id);
      if (updated) {
        if (!updated.available) {
          setSelectedProduct(null);
        } else if (JSON.stringify(updated) !== JSON.stringify(selectedProduct)) {
          setSelectedProduct(updated);
        }
      }
    }
  }, [products]);

  // Checkout form state
  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [selectedTableNumber, setSelectedTableNumber] = useState<number>(1);
  const [tableLocation, setTableLocation] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [changeFor, setChangeFor] = useState<string>('');

  // Filter products
  const availableProducts = products.filter((p) => p.available);
  const filteredProducts = availableProducts.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const cartSubtotal = cart.reduce((sum, item) => sum + item.unitTotal * item.quantity, 0);
  const deliveryFee = orderType === 'delivery' ? settings.deliveryFeeDefault : 0;
  const cartTotal = cartSubtotal + deliveryFee;

  // Add customized item to public cart
  const handleAddToCart = () => {
    if (!selectedProduct) return;

    const extrasCost = selectedExtras.reduce((sum, e) => sum + e.price, 0);
    const unitTotal = selectedProduct.price + extrasCost;

    const newItem: CartItem = {
      id: `pub-ci-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      productId: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedProduct.price,
      quantity: customQty,
      selectedExtras,
      removedItems: selectedRemovedItems,
      observations,
      unitTotal,
    };

    setCart((prev) => [...prev, newItem]);
    setSelectedProduct(null);
  };

  const handleUpdateQty = (index: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item, i) => {
          if (i === index) {
            const newQ = item.quantity + delta;
            return newQ > 0 ? { ...item, quantity: newQ } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const storeStatus = getStoreOperatingStatus(settings);

  // Submit Order and Trigger WhatsApp
  const handleSubmitOrderToWhatsApp = () => {
    if (!storeStatus.isOpen && !storeStatus.allowOrdersWhenClosed) {
      const closedStoreMsg = `Nosso estabelecimento encontra-se fechado neste momento. No momento não é possível receber o seu pedido. Retornamos em breve! ${settings.name || "BAR DO ACANTO"} agradece!`;
      alert(`⚠️ LOJA FECHADA NO MOMENTO\n\n${closedStoreMsg}`);
      addToast({
        title: '⚠️ LOJA FECHADA NO MOMENTO',
        message: closedStoreMsg,
        type: 'warning',
      });
      return;
    }

    if (cart.length === 0) return;

    if (!customerName.trim()) {
      alert('Por favor, preencha o seu nome!');
      return;
    }

    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 8) {
      alert('Por favor, informe um número de WhatsApp válido com DDD!');
      return;
    }

    if (orderType === 'delivery') {
      if (!street.trim() || !number.trim()) {
        alert('Por favor, preencha o Endereço (Rua e Número) para a entrega!');
        return;
      }
    }

    if (orderType === 'mesa') {
      if (!tableLocation.trim()) {
        alert('Por favor, informe a descrição ou localização de onde você está sentado(a)!');
        return;
      }
    }

    const cleanCustPhone = customerPhone.replace(/\D/g, '');
    const addressStr =
      orderType === 'delivery' ? `${street}, ${number}${neighborhood ? ` - ${neighborhood}` : ''}` : undefined;

    const parsedTableNum = orderType === 'mesa' ? parseInt(tableLocation.replace(/\D/g, ''), 10) : NaN;
    const finalTableNum = !isNaN(parsedTableNum) && parsedTableNum > 0 ? parsedTableNum : undefined;

    const tableDescStr = tableLocation.trim();

    // Create order in store database
    const newOrder = createOrder({
      type: orderType,
      status: 'confirmado',
      customer: {
        name: customerName,
        phone: cleanCustPhone,
        ...(addressStr ? { address: addressStr } : {}),
      },
      ...(orderType === 'mesa' && finalTableNum ? { tableNumber: finalTableNum } : {}),
      items: cart,
      subtotal: cartSubtotal,
      discount: 0,
      deliveryFee,
      total: cartTotal,
      paymentMethod: orderType === 'mesa' ? 'dinheiro' : paymentMethod,
      paymentStatus: 'pendente',
      notes: orderType === 'mesa' ? `Localização / Mesa: ${tableLocation.trim()}` : undefined,
    });

    // Build WhatsApp Message
    const itemsText = cart
      .map((i) => {
        const extrasStr = i.selectedExtras.length
          ? `\n   └ Extras: ${i.selectedExtras.map((e) => e.optionName).join(', ')}`
          : '';
        const removedStr = (i.removedItems && i.removedItems.length)
          ? `\n   └ Retirar: ${i.removedItems.join(', ')}`
          : '';
        const obsStr = i.observations ? `\n   └ Obs: ${i.observations}` : '';
        return `• *${i.quantity}x ${i.name}* - R$ ${(i.unitTotal * i.quantity).toFixed(2).replace('.', ',')}${extrasStr}${removedStr}${obsStr}`;
      })
      .join('\n');

    const typeLabel =
      orderType === 'delivery'
        ? `🛵 *Entrega no Endereço:*\n${addressStr}`
        : orderType === 'retirada'
        ? '🛍️ *Retirada no Balcão*'
        : `🍽️ *Atendimento na Mesa:*\n📍 ${tableDescStr}`;

    const paymentText =
      orderType === 'mesa'
        ? '🍽️ Pagamento na Mesa (Fechamento da Conta)'
        : paymentMethod === 'pix'
        ? '⚡ Pix'
        : paymentMethod === 'cartao_credito'
        ? '💳 Cartão de Crédito'
        : paymentMethod === 'cartao_debito'
        ? '💳 Cartão de Débito'
        : `💵 Dinheiro${changeFor ? ` (Troco para R$ ${changeFor})` : ''}`;

    const closedNotice = !storeStatus.isOpen && storeStatus.allowOrdersWhenClosed
      ? `\n⚠️ *AVISO: PEDIDO ENVIADO FORA DO HORÁRIO DA LOJA*\n(O restaurante processará o seu pedido assim que abrir)\n\n`
      : '\n\n';

    const rawMessage =
      `*NOVO PEDIDO - ${settings.name.toUpperCase()}*\n` +
      `-----------------------------------\n` +
      `🧾 *Pedido ${newOrder.code}*\n` +
      `Cliente: *${customerName}*\n` +
      `WhatsApp: ${customerPhone}\n` +
      closedNotice +
      `${typeLabel}\n\n` +
      `*ITENS DO PEDIDO:*\n${itemsText}\n\n` +
      `-----------------------------------\n` +
      `Subtotal: R$ ${cartSubtotal.toFixed(2).replace('.', ',')}\n` +
      (deliveryFee > 0 ? `Taxa Entrega: R$ ${deliveryFee.toFixed(2).replace('.', ',')}\n` : '') +
      `*TOTAL: R$ ${cartTotal.toFixed(2).replace('.', ',')}*\n` +
      `Forma de Pagamento: *${paymentText}*\n\n` +
      `Aguardo confirmação do restaurante! Obrigado.`;

    const storePhone = settings.whatsappPhone || settings.phone;
    const cleanStorePhone = cleanPhoneNumber(storePhone);

    // Open WhatsApp directly with order details
    openWhatsAppLink(cleanStorePhone, rawMessage);

    // Clear cart, reset fields and close drawer (returns directly to the menu)
    setCart([]);
    setShowCartDrawer(false);
    setStreet('');
    setNumber('');
    setNeighborhood('');
    setTableLocation('');
    setChangeFor('');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-24">
      
      {/* Top Banner & Store Header */}
      <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 text-white relative overflow-hidden pb-6 shadow-md">
        {/* Banner image overlay */}
        <div className="absolute inset-0 opacity-15 bg-cover bg-center" style={{ backgroundImage: `url(${settings.logoUrl})` }}></div>
        
        <div className="relative max-w-2xl mx-auto px-4 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 text-white text-[11px] font-bold backdrop-blur-md border border-white/10">
                <span>📱 Cardápio Digital Online</span>
              </div>
              <button
                type="button"
                onClick={() => setViewMode('admin')}
                className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold text-orange-100 hover:text-white px-2.5 py-1 rounded-full bg-black/25 hover:bg-black/40 border border-white/15 transition cursor-pointer"
                title="Acessar Plataforma do Administrador (Exige Senha)"
              >
                <Lock className="w-3 h-3 text-amber-300" />
                <span>Área Admin</span>
              </button>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase shadow-xs ${
                storeStatus.isOpen
                  ? 'bg-emerald-500 text-white'
                  : storeStatus.allowOrdersWhenClosed
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-rose-500 text-white'
              }`}
            >
              {storeStatus.isOpen
                ? '🟢 Aberto Agora'
                : storeStatus.allowOrdersWhenClosed
                ? '🟡 Loja Fechada (Aceita Pedidos)'
                : '🔴 Loja Fechada'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <img
              src={settings.logoUrl}
              alt={settings.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white/40 shadow-lg"
            />
            <div>
              <h1 className="text-lg font-extrabold text-white leading-tight">{settings.name}</h1>
              <p className="text-xs text-orange-100 font-medium mt-0.5">{settings.slogan}</p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-amber-100 font-semibold mt-2">
                <span className="flex items-center gap-1 bg-black/20 px-2.5 py-1 rounded-lg border border-white/10">
                  <Clock className="w-3.5 h-3.5 text-amber-300" />
                  <span>Hoje ({storeStatus.shortDayName}): <strong className="text-white">{storeStatus.todayFormattedHours}</strong></span>
                </span>
                <span className="flex items-center gap-1 bg-black/20 px-2.5 py-1 rounded-lg border border-white/10">
                  <MapPin className="w-3.5 h-3.5 text-amber-300" /> Entrega R$ {settings.deliveryFeeDefault.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Store Closed Warning Banner */}
      {!storeStatus.isOpen && (
        <div
          className={`px-4 py-2.5 shadow-md flex items-center justify-center gap-2 text-xs font-bold text-center border-b ${
            storeStatus.allowOrdersWhenClosed
              ? 'bg-amber-500 text-slate-950 border-amber-600 font-bold'
              : 'bg-rose-600 text-white border-rose-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            {storeStatus.allowOrdersWhenClosed
              ? `🟡 LOJA FECHADA NO MOMENTO — Hoje (${storeStatus.fullDayName}): ${storeStatus.todayFormattedHours}. Aceitamos pedidos agendados que serão atendidos assim que a loja abrir!`
              : `🔴 LOJA FECHADA NO MOMENTO — Hoje (${storeStatus.fullDayName}): ${storeStatus.todayFormattedHours}. No momento o estabelecimento não aceita novos pedidos.`}
          </span>
        </div>
      )}

      {/* Main Content Container */}
      <div className="max-w-2xl mx-auto px-4 -mt-3 space-y-4">
        
        {/* Search & Categories Bar */}
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200/80 space-y-3 sticky top-2 z-20">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="O que você quer comer hoje?..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 text-black"
            />
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-black hover:bg-orange-50'
              }`}
            >
              Todos
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition flex items-center gap-1.5 ${
                  selectedCategory === c.id
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-black hover:bg-orange-50'
                }`}
              >
                <span>{c.icon || '🍔'}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards List */}
        <div className="space-y-3">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              onClick={() => {
                setSelectedProduct(p);
                setCustomQty(1);
                setSelectedExtras([]);
                setSelectedRemovedItems([]);
                setObservations('');
              }}
              className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs hover:shadow-md transition cursor-pointer flex gap-3.5 items-center justify-between group min-h-[112px]"
            >
              <div className="flex-1 flex flex-col justify-between self-stretch pr-1">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-700 transition leading-snug">
                    {p.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">{p.description}</p>
                </div>
                <div className="mt-2">
                  <span className="font-extrabold text-sm text-slate-900">
                    R$ {p.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 aspect-square">
                <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                <span className="absolute bottom-1 right-1 bg-purple-600 text-white p-1.5 rounded-lg font-bold text-xs shadow-md">
                  <Plus className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Public Cardápio Footer */}
        <div className="mt-12 pt-8 border-t border-slate-200/80 text-center space-y-2.5 pb-8">
          <p className="text-xs font-extrabold text-slate-700">
            {settings.name} — Cardápio Digital Online
          </p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            {settings.address || 'Atendimento presencial no salão e delivery com pedidos via WhatsApp.'}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setViewMode('admin')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-700 hover:text-slate-900 text-[11px] font-extrabold transition cursor-pointer shadow-2xs"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Acesso Restrito / Área Administrativa</span>
            </button>
          </div>
        </div>

      </div>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-3 left-0 right-0 px-4 z-30 max-w-2xl mx-auto">
          <button
            onClick={() => setShowCartDrawer(true)}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:opacity-95 text-white rounded-2xl shadow-xl flex items-center justify-between font-extrabold text-sm transition active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <span className="bg-white text-orange-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold shadow-2xs">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
              <span>Ver Seu Pedido</span>
            </div>
            <span>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
          </button>
        </div>
      )}

      {/* PRODUCT CUSTOMIZATION MODAL */}
      {selectedProduct && (() => {
        const basePrice = Number(selectedProduct.price) || 0;
        const extrasCost = selectedExtras.reduce((sum, e) => sum + (Number(e.price) || 0), 0);
        const unitTotal = basePrice + extrasCost;
        const totalModalPrice = unitTotal * (Number(customQty) || 1);

        // Only show extra groups if explicitly assigned to this product
        const groupsToShow = (selectedProduct.extraGroupIds && selectedProduct.extraGroupIds.length > 0)
          ? selectedProduct.extraGroupIds.map((id) => extraGroups.find((g) => g.id === id)).filter((g): g is NonNullable<typeof g> => Boolean(g))
          : [];

        return (
          <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[88vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
              
              {/* Standardized Modal Image Header */}
              <div className="relative h-56 sm:h-60 w-full bg-slate-100 shrink-0 overflow-hidden">
                <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition shadow-md cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 flex-1 overflow-y-auto space-y-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">{selectedProduct.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{selectedProduct.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-extrabold text-purple-700 text-base">
                      R$ {basePrice.toFixed(2).replace('.', ',')}
                    </span>
                    {extrasCost > 0 && (
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        + R$ {extrasCost.toFixed(2).replace('.', ',')} em adicionais
                      </span>
                    )}
                  </div>
                </div>

                {/* Product Custom Extras */}
                {selectedProduct.customExtras && selectedProduct.customExtras.length > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-xs text-slate-900">Adicionais do Produto</h4>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">+R$ Opcional</span>
                    </div>
                    <div className="space-y-1.5">
                      {selectedProduct.customExtras.map((opt) => {
                        const isSelected = selectedExtras.some((e) => e.optionId === opt.id);
                        const optPrice = Number(opt.price) || 0;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedExtras((prev) => prev.filter((e) => e.optionId !== opt.id));
                              } else {
                                setSelectedExtras((prev) => [
                                  ...prev,
                                  { groupId: 'custom-grp', groupTitle: 'Adicionais', optionId: opt.id, optionName: opt.name, price: optPrice },
                                ]);
                              }
                            }}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                              isSelected
                                ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-2xs ring-1 ring-purple-500/30'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className={`w-4 h-4 rounded-md border flex items-center justify-center ${isSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300'}`}>
                                {isSelected && <span className="text-[10px] font-black">✓</span>}
                              </span>
                              <span>{opt.name}</span>
                            </span>
                            <span className="font-bold text-slate-900">
                              + R$ {optPrice.toFixed(2).replace('.', ',')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Extras list */}
                {groupsToShow.map((group) => {
                  if (!group) return null;

                  return (
                    <div key={group.id} className="pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-xs text-slate-900">{group.title}</h4>
                        {group.max === 1 && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">Escolha 1</span>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {group.options.map((opt) => {
                          const isSelected = selectedExtras.some((e) => e.optionId === opt.id);
                          const optPrice = Number(opt.price) || 0;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedExtras((prev) => prev.filter((e) => e.optionId !== opt.id));
                                } else {
                                  if (group.max === 1) {
                                    setSelectedExtras((prev) => [
                                      ...prev.filter((e) => e.groupId !== group.id),
                                      { groupId: group.id, groupTitle: group.title, optionId: opt.id, optionName: opt.name, price: optPrice },
                                    ]);
                                  } else {
                                    setSelectedExtras((prev) => [
                                      ...prev,
                                      { groupId: group.id, groupTitle: group.title, optionId: opt.id, optionName: opt.name, price: optPrice },
                                    ]);
                                  }
                                }
                              }}
                              className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                                isSelected
                                  ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-2xs ring-1 ring-purple-500/30'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span className={`w-4 h-4 rounded-${group.max === 1 ? 'full' : 'md'} border flex items-center justify-center ${isSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300'}`}>
                                  {isSelected && <span className="text-[10px] font-black">✓</span>}
                                </span>
                                <span>{opt.name}</span>
                              </span>
                              <span className="font-bold text-slate-900">
                                + R$ {optPrice.toFixed(2).replace('.', ',')}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Removable Items Section (Sem...) */}
                {selectedProduct.removableItems && selectedProduct.removableItems.length > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-xs text-rose-900 flex items-center gap-1">
                        <span>🚫 Retirar Ingredientes (Sem...)</span>
                      </h4>
                      <span className="text-[10px] text-slate-500 font-medium">Toque para retirar</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProduct.removableItems.map((ing) => {
                        const isRemoved = selectedRemovedItems.includes(ing);
                        return (
                          <button
                            key={ing}
                            type="button"
                            onClick={() =>
                              setSelectedRemovedItems((prev) =>
                                prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing]
                              )
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                              isRemoved
                                ? 'bg-rose-50 border-rose-500 text-rose-900 ring-1 ring-rose-500/30 font-extrabold'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${isRemoved ? 'bg-rose-600 text-white font-black' : 'border border-slate-300'}`}>
                              {isRemoved ? '✕' : ''}
                            </span>
                            <span>{isRemoved ? `Sem ${ing}` : ing}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Observation note */}
                <div className="pt-3 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alguma observação?</label>
                  <input
                    type="text"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Ex: sem molho, ponto bem passado..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setCustomQty((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 font-bold hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-extrabold text-sm w-6 text-center">{customQty}</span>
                  <button
                    type="button"
                    onClick={() => setCustomQty((q) => q + 1)}
                    className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 font-bold hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-between gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <span className="font-extrabold text-xs sm:text-sm">Add ao Carrinho</span>
                  <span className="bg-white/20 px-2.5 py-1 rounded-lg text-xs sm:text-sm font-black tracking-wide shrink-0">
                    R$ {totalModalPrice.toFixed(2).replace('.', ',')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* CHECKOUT CART DRAWER / MODAL */}
      {showCartDrawer && (
        <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-purple-600" /> Finalizar Seu Pedido
              </h3>
              <button
                onClick={() => setShowCartDrawer(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              
              {/* Order Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Tipo de Atendimento:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'delivery', label: 'Entrega', icon: <Truck className="w-4 h-4" /> },
                    { id: 'retirada', label: 'Retirada', icon: <Store className="w-4 h-4" /> },
                    { id: 'mesa', label: 'Mesa', icon: <UtensilsCrossed className="w-4 h-4" /> },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setOrderType(t.id as OrderType)}
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold border transition ${
                        orderType === t.id
                          ? 'bg-purple-600 text-white border-purple-700 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {t.icon}
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Info Form */}
              <div className="space-y-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Seu Nome *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: Carlos Silva"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Seu WhatsApp (com DDD) *</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Ex: 11999998888"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                {orderType === 'delivery' && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-700">Endereço de Entrega:</label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Rua / Avenida"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        placeholder="Número"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                      />
                      <input
                        type="text"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        placeholder="Bairro"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                      />
                    </div>
                  </div>
                )}

                {orderType === 'mesa' && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Descrição da Localização / Onde você está sentado(a) *
                      </label>
                      <input
                        type="text"
                        value={tableLocation}
                        onChange={(e) => setTableLocation(e.target.value)}
                        placeholder="Ex: Mesa 04 na Varanda, Perto do Palco, ou Balcão..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Informe o número da sua mesa ou detalhes de onde está sentado(a) para a equipe te encontrar.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Items in cart */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700">Itens Selecionados:</label>
                {cart.map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{item.quantity}x {item.name}</span>
                      {item.selectedExtras.length > 0 && (
                        <p className="text-[10px] text-slate-500">
                          + {item.selectedExtras.map((e) => e.optionName).join(', ')}
                        </p>
                      )}
                      {item.removedItems && item.removedItems.length > 0 && (
                        <p className="text-[10px] font-bold text-rose-700">
                          🚫 Sem: {item.removedItems.join(', ')}
                        </p>
                      )}
                      {item.observations && (
                        <p className="text-[10px] italic text-amber-800">
                          Obs: {item.observations}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900">
                        R$ {(item.unitTotal * item.quantity).toFixed(2).replace('.', ',')}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(idx, -1)}
                        className="text-rose-600 font-bold px-1.5 py-0.5 rounded bg-white hover:bg-rose-50 cursor-pointer"
                      >
                        -
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment method selection - Hidden for Table orders */}
              {orderType !== 'mesa' ? (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Forma de Pagamento *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'pix', label: '⚡ Pix', desc: 'Aprovação rápida' },
                      { id: 'cartao_credito', label: '💳 Cartão Crédito', desc: 'Na entrega / balcão' },
                      { id: 'cartao_debito', label: '💳 Cartão Débito', desc: 'Na entrega / balcão' },
                      { id: 'dinheiro', label: '💵 Dinheiro', desc: 'Troco se preciso' },
                    ].map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
                        className={`p-2.5 rounded-xl text-left border transition cursor-pointer flex flex-col ${
                          paymentMethod === pm.id
                            ? 'bg-purple-50 border-purple-600 text-purple-950 ring-2 ring-purple-500/20'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-extrabold text-xs">{pm.label}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{pm.desc}</span>
                      </button>
                    ))}
                  </div>

                  {paymentMethod === 'dinheiro' && (
                    <div className="pt-1 animate-in fade-in duration-150">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Precisa de troco? Troco para quanto?
                      </label>
                      <input
                        type="text"
                        value={changeFor}
                        onChange={(e) => setChangeFor(e.target.value)}
                        placeholder="Ex: R$ 50,00 ou R$ 100,00"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {paymentMethod === 'pix' && (
                    <div className="pt-2 animate-in fade-in zoom-in-95 duration-150">
                      <PixQrCodeDisplay
                        pixKey={settings.pixKey}
                        merchantName={settings.pixName || settings.name}
                        amount={cartTotal}
                        orderCode={customerPhone ? customerPhone.slice(-4) : 'CARDAPIO'}
                        title="Pagamento Pix para o Pedido"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="pt-3 border-t border-slate-100">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2.5">
                    <UtensilsCrossed className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <p className="font-extrabold">Pagamento na Mesa / Salão</p>
                      <p className="text-[11px] text-amber-800 font-medium">Não é necessário selecionar forma de pagamento agora. O pagamento será feito na mesa ao fechar a conta com o garçom.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Submit Button */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2.5">
              {!storeStatus.isOpen && (
                <div
                  className={`p-3.5 border rounded-xl flex items-start gap-2.5 text-xs shadow-2xs ${
                    storeStatus.allowOrdersWhenClosed
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                  }`}
                >
                  <AlertTriangle
                    className={`w-5 h-5 shrink-0 mt-0.5 ${
                      storeStatus.allowOrdersWhenClosed ? 'text-amber-600' : 'text-rose-600'
                    }`}
                  />
                  <div>
                    <p className="font-extrabold">
                      {storeStatus.allowOrdersWhenClosed
                        ? '🟡 LOJA FECHADA (ACEITA PEDIDOS AGENDADOS)'
                        : '⚠️ LOJA FECHADA (PEDIDOS BLOQUEADOS)'}
                    </p>
                    <p className="text-xs mt-1 font-medium leading-relaxed opacity-90">
                      {storeStatus.allowOrdersWhenClosed
                        ? 'O seu pedido será enviado para o WhatsApp do restaurante e preparado assim que a loja abrir!'
                        : 'Nosso estabelecimento encontra-se fechado neste momento. Não é possível receber o seu pedido agora.'}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-sm font-extrabold text-slate-900">
                <span>Total a Pagar:</span>
                <span className="text-purple-700">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
              </div>

              <button
                onClick={handleSubmitOrderToWhatsApp}
                disabled={!storeStatus.isOpen && !storeStatus.allowOrdersWhenClosed}
                className={`w-full py-3.5 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 uppercase tracking-wider ${
                  storeStatus.isOpen
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.99] cursor-pointer'
                    : storeStatus.allowOrdersWhenClosed
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black active:scale-[0.99] cursor-pointer'
                    : 'bg-slate-300 text-slate-500 border border-slate-300 cursor-not-allowed shadow-none'
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                <span>
                  {storeStatus.isOpen
                    ? 'FINALIZAR PEDIDO NO WHATSAPP'
                    : storeStatus.allowOrdersWhenClosed
                    ? 'ENVIAR PEDIDO AGENDADO (FORA DO HORÁRIO)'
                    : 'LOJA FECHADA (PEDIDOS BLOQUEADOS)'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
