import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Product, CartItem, PaymentMethod, CartItemExtra, Order } from '../types';
import { PixQrCodeDisplay } from './PixQrCodeDisplay';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  UserCheck,
  CreditCard,
  QrCode,
  DollarSign,
  Receipt,
  Sparkles,
  X,
  CheckCircle,
  Tag,
  ShoppingBag,
  Send,
  Zap,
  Printer,
  MessageCircle,
  Copy,
  Clock,
} from 'lucide-react';

export const PDVBalcao: React.FC = () => {
  const {
    products,
    categories,
    extraGroups,
    pdvCart,
    addToPdvCart,
    removeFromPdvCart,
    updatePdvCartQty,
    clearPdvCart,
    createOrder,
    orders,
    setSelectedReceiptOrder,
    customers,
    addCustomer,
    settings,
    generateCartWhatsAppCheckoutLink,
    addToast,
  } = useApp();

  const [pdvSubTab, setPdvSubTab] = useState<'venda' | 'pedidos'>(() => {
    try {
      const saved = localStorage.getItem('fzp_pdv_subtab');
      if (saved === 'pedidos' || saved === 'venda') return saved;
    } catch {}
    return 'venda';
  });

  useEffect(() => {
    try {
      localStorage.setItem('fzp_pdv_subtab', pdvSubTab);
    } catch {}
  }, [pdvSubTab]);

  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');

  const handleGenerateWhatsAppCheckoutLink = (shouldOpen: boolean = false) => {
    if (pdvCart.length === 0) return;

    let custName = customerName.trim() || 'Cliente Balcão';
    let custPhone = customerPhone.replace(/\D/g, '');

    const link = generateCartWhatsAppCheckoutLink(
      pdvCart,
      { name: custName, phone: custPhone },
      'pdv',
      paymentMethod,
      0,
      subtotal - discount,
      total
    );

    if (shouldOpen) {
      window.open(link, '_blank');
    } else {
      navigator.clipboard.writeText(link);
      addToast({
        title: 'Link do WhatsApp Copiado!',
        message: 'Resumo do pedido gerado com sucesso. Cole no WhatsApp do cliente!',
        type: 'success',
      });
    }
  };

  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [showPixModal, setShowPixModal] = useState<boolean>(false);

  // Item customization modal state
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [selectedExtras, setSelectedExtras] = useState<CartItemExtra[]>([]);
  const [selectedRemovedItems, setSelectedRemovedItems] = useState<string[]>([]);
  const [itemObservation, setItemObservation] = useState<string>('');

  // Sync customizingProduct if the product is updated or paused by admin live
  useEffect(() => {
    if (customizingProduct) {
      const updated = products.find((p) => p.id === customizingProduct.id);
      if (updated) {
        if (!updated.available) {
          setCustomizingProduct(null);
        } else if (JSON.stringify(updated) !== JSON.stringify(customizingProduct)) {
          setCustomizingProduct(updated);
        }
      }
    }
  }, [products]);

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (!p.available) return false;
    const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.code && p.code.includes(searchQuery));
    return matchesCat && matchesSearch;
  });

  // Calculate Subtotal & Total
  const totalCartItemsCount = pdvCart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = pdvCart.reduce((sum, item) => sum + item.unitTotal * item.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  // Handle clicking a product card
  const handleProductClick = (product: Product) => {
    const hasGroupExtras = Boolean(product.extraGroupIds && product.extraGroupIds.length > 0);
    const hasCustomExtras = Boolean(product.customExtras && product.customExtras.length > 0);
    const hasRemovables = Boolean(product.removableItems && product.removableItems.length > 0);

    if (hasGroupExtras || hasCustomExtras || hasRemovables) {
      setCustomizingProduct(product);
      setItemQuantity(1);
      setSelectedExtras([]);
      setSelectedRemovedItems([]);
      setItemObservation('');
    } else {
      // Direct add to cart
      const cartItem: CartItem = {
        id: `ci-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        selectedExtras: [],
        removedItems: [],
        unitTotal: product.price,
      };
      addToPdvCart(cartItem);
    }
  };

  // Add customized item from modal
  const handleConfirmCustomizedItem = () => {
    if (!customizingProduct) return;

    const extrasCost = selectedExtras.reduce((sum, e) => sum + e.price, 0);
    const unitTotal = customizingProduct.price + extrasCost;

    const cartItem: CartItem = {
      id: `ci-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      productId: customizingProduct.id,
      name: customizingProduct.name,
      price: customizingProduct.price,
      quantity: itemQuantity,
      selectedExtras,
      removedItems: selectedRemovedItems,
      observations: itemObservation,
      unitTotal,
    };

    addToPdvCart(cartItem);
    setCustomizingProduct(null);
  };

  // Toggle extra choice
  const toggleExtraChoice = (
    groupId: string,
    groupTitle: string,
    optionId: string,
    optionName: string,
    price: number
  ) => {
    const group = extraGroups.find((g) => g.id === groupId);
    const isSingleChoice = group?.max === 1;

    const exists = selectedExtras.some((e) => e.optionId === optionId);
    if (exists) {
      setSelectedExtras((prev) => prev.filter((e) => e.optionId !== optionId));
    } else {
      if (isSingleChoice) {
        setSelectedExtras((prev) => [
          ...prev.filter((e) => e.groupId !== groupId),
          { groupId, groupTitle, optionId, optionName, price },
        ]);
      } else {
        setSelectedExtras((prev) => [...prev, { groupId, groupTitle, optionId, optionName, price }]);
      }
    }
  };

  // Print Draft / Preview WITHOUT finalizing sale or clearing cart
  const handlePrintOnly = () => {
    if (pdvCart.length === 0) return;

    let custName = customerName.trim() || 'Cliente Balcão';
    let custPhone = customerPhone.replace(/\D/g, '');

    const draftOrder: Order = {
      id: `draft-${Date.now()}`,
      code: `PRÉVIA`,
      type: 'pdv',
      status: 'confirmado',
      createdAt: new Date().toISOString(),
      customer: { name: custName, phone: custPhone },
      items: pdvCart,
      subtotal,
      discount,
      deliveryFee: 0,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'pg' ? 'pendente' : 'pago',
      notes: orderNotes,
    };

    // Open receipt modal for preview/print without creating order or clearing cart
    setSelectedReceiptOrder(draftOrder);

    addToast({
      title: 'Imprimindo Prévia do Pedido',
      message: 'A conferência está sendo gerada. A venda ainda NÃO foi finalizada.',
      type: 'info',
    });

    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Finalize Sale
  const handleFinalizeSale = () => {
    if (pdvCart.length === 0) return;

    let custName = customerName.trim() || 'Cliente Balcão';
    let custPhone = customerPhone.replace(/\D/g, '');

    if (custPhone) {
      addCustomer({
        name: custName,
        phone: custPhone,
      });
    }

    const newOrder = createOrder({
      type: 'pdv',
      status: 'entregue',
      customer: { name: custName, phone: custPhone },
      items: pdvCart,
      subtotal,
      discount,
      deliveryFee: 0,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'pg' ? 'pendente' : 'pago',
      notes: orderNotes,
    });

    // Reset PDV state
    clearPdvCart();
    setDiscount(0);
    setCustomerName('');
    setCustomerPhone('');
    setOrderNotes('');

    // Open receipt modal for finalized order
    setSelectedReceiptOrder(newOrder);
  };

  return (
    <div className="flex flex-col gap-4 min-h-[600px] pb-16 lg:pb-0">
      
      {/* Top Navigation Mode Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPdvSubTab('venda')}
            className={`flex-1 sm:flex-initial py-2 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
              pdvSubTab === 'venda'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>🛒 Nova Venda / Caixa</span>
          </button>

          <button
            type="button"
            onClick={() => setPdvSubTab('pedidos')}
            className={`flex-1 sm:flex-initial py-2 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer relative ${
              pdvSubTab === 'pedidos'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>📋 Pedidos Realizados no PDV</span>
            <span className="bg-amber-400 text-slate-900 font-black text-[10px] px-1.5 py-0.2 rounded-full">
              {orders.filter((o) => o.type === 'pdv').length}
            </span>
          </button>
        </div>

        {pdvSubTab === 'venda' && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium px-2">
            <span>Terminal: <strong className="text-slate-800">Caixa Principal / PDV</strong></span>
          </div>
        )}
      </div>

      {pdvSubTab === 'pedidos' ? (
        /* PDV Orders History with Detailed Included Items Visualization */
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Receipt className="w-5 h-5 text-purple-600" /> Pedidos Registrados no PDV Balcão
              </h2>
              <p className="text-xs text-slate-500">
                Visualize os itens incluídos em cada pedido do PDV, status de pagamento e comprovantes.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                placeholder="Buscar por código (#PDV-102), cliente ou item..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Orders List Grid */}
          {(() => {
            const pdvOrdersList = orders.filter((o) => o.type === 'pdv');
            const filteredPdvOrders = pdvOrdersList.filter((ord) => {
              if (!historySearchQuery.trim()) return true;
              const q = historySearchQuery.toLowerCase();
              const codeMatch = (ord.code || '').toLowerCase().includes(q);
              const nameMatch = (ord.customer?.name || '').toLowerCase().includes(q);
              const phoneMatch = (ord.customer?.phone || '').includes(q);
              const itemMatch = ord.items?.some((i) => i.name.toLowerCase().includes(q));
              return codeMatch || nameMatch || phoneMatch || itemMatch;
            });

            if (filteredPdvOrders.length === 0) {
              return (
                <div className="text-center py-12 text-slate-400">
                  <Receipt className="w-12 h-12 mx-auto mb-2 opacity-30 text-purple-600" />
                  <p className="text-sm font-bold text-slate-700">Nenhum pedido encontrado no histórico do PDV.</p>
                  <p className="text-xs text-slate-400 mt-1">Finalize uma venda no balcão para visualizar aqui os itens incluídos.</p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredPdvOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-slate-50/70 rounded-2xl border border-slate-200 p-4 space-y-3 hover:border-purple-300 transition shadow-2xs"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs bg-purple-600 text-white px-2.5 py-1 rounded-lg shadow-2xs">
                          {ord.code || `#${ord.id.slice(-4)}`}
                        </span>
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-900">
                            👤 {ord.customer?.name || 'Cliente Balcão'}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {new Date(ord.createdAt).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-sm text-purple-700 block">
                          R$ {(ord.total || 0).toFixed(2).replace('.', ',')}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-block ${
                            ord.paymentMethod === 'pg'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}
                        >
                          {ord.paymentMethod === 'pg' ? '📌 PG (A RECEBER)' : `💳 ${ord.paymentMethod?.toUpperCase()}`}
                        </span>
                      </div>
                    </div>

                    {/* Visually Display Included Items */}
                    <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
                      <h5 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide flex items-center justify-between mb-1">
                        <span>📦 Itens Incluídos no Pedido:</span>
                        <span className="text-slate-500 font-bold">
                          {ord.items?.reduce((s, i) => s + i.quantity, 0) || 0} {ord.items?.reduce((s, i) => s + i.quantity, 0) === 1 ? 'item' : 'itens'}
                        </span>
                      </h5>

                      <div className="space-y-2 divide-y divide-slate-100">
                        {ord.items?.map((it, itIdx) => {
                          const matchedProduct = products.find((p) => p.id === it.productId);
                          return (
                            <div key={itIdx} className="pt-2 first:pt-0 flex items-start gap-2.5">
                              {/* Product Thumbnail */}
                              {matchedProduct?.image ? (
                                <img
                                  src={matchedProduct.image}
                                  alt={it.name}
                                  className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 text-xs font-bold shrink-0">
                                  🍔
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-1">
                                  <span className="font-extrabold text-xs text-slate-900">
                                    <strong className="text-purple-700 font-black mr-1">{it.quantity}x</strong>
                                    {it.name}
                                  </span>
                                  <span className="font-extrabold text-xs text-slate-900 shrink-0">
                                    R$ {((it.unitTotal || it.price) * it.quantity).toFixed(2).replace('.', ',')}
                                  </span>
                                </div>

                                <div className="text-[10px] text-slate-500 font-medium">
                                  Un: R$ {(it.unitTotal || it.price).toFixed(2).replace('.', ',')}
                                </div>

                                {/* Extras */}
                                {it.selectedExtras && it.selectedExtras.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {it.selectedExtras.map((e, exI) => (
                                      <span
                                        key={exI}
                                        className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200"
                                      >
                                        + {e.optionName} {e.price > 0 ? `(+R$ ${e.price.toFixed(2).replace('.', ',')})` : ''}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Removed Items */}
                                {it.removedItems && it.removedItems.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    <span className="text-[9px] font-bold text-rose-800 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                      🚫 Sem: {it.removedItems.join(', ')}
                                    </span>
                                  </div>
                                )}

                                {/* Observations */}
                                {it.observations && (
                                  <p className="text-[10px] italic text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded mt-1 border border-amber-200">
                                    Obs: {it.observations}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Order Footer & Reprint Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-500 font-medium">
                        {ord.notes ? `Obs: ${ord.notes}` : 'Sem observações gerais.'}
                      </span>

                      <button
                        type="button"
                        onClick={() => setSelectedReceiptOrder(ord)}
                        className="py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-400" />
                        <span>Reimprimir Comprovante</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      ) : (
      /* Standard PDV Checkout & Catalog View */
      <div className="flex flex-col gap-4">
      {/* Mobile Tab Toggle Bar (Visible on phone/tablet < lg) */}
      <div className="flex lg:hidden bg-slate-200 p-1 rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition ${
            mobileTab === 'catalog'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-transparent text-slate-700 hover:bg-slate-300'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Cardápio / Produtos</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition relative ${
            mobileTab === 'cart'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-transparent text-slate-700 hover:bg-slate-300'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Comanda</span>
          {pdvCart.length > 0 && (
            <span className="bg-amber-400 text-slate-900 font-black text-[10px] px-1.5 py-0.2 rounded-full">
              {pdvCart.length}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 h-auto min-h-[680px]">
        
        {/* Left Column: Catalog & Search (Visible always on lg+, or when mobileTab === 'catalog') */}
        <div className={`flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden ${
          mobileTab === 'catalog' ? 'flex' : 'hidden lg:flex'
        }`}>
          
          {/* Search & Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-purple-600" /> PDV Balcão / Caixa
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {filteredProducts.length} itens disponíveis
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome do produto ou código (ex: 101)..."
                className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            {/* Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-2xs'
                    : 'bg-white text-black border border-slate-200 hover:bg-orange-50'
                }`}
              >
                Todos ({products.filter((p) => p.available).length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-2xs'
                      : 'bg-white text-black border border-slate-200 hover:bg-orange-50'
                  }`}
                >
                  <span>{cat.icon || '🍔'}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[60vh] lg:max-h-none">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => handleProductClick(p)}
                className="bg-white border border-slate-200 hover:border-orange-500 rounded-xl p-3 flex flex-col justify-between hover:shadow-md transition cursor-pointer group relative overflow-hidden active:scale-[0.99]"
              >
                <div>
                  <div className="relative aspect-4/3 mb-2.5 rounded-lg overflow-hidden bg-slate-100">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {p.code && (
                      <span className="absolute top-1.5 left-1.5 bg-slate-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                        #{p.code}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 text-xs line-clamp-2 mb-1">{p.name}</h3>
                  <p className="text-[10px] text-slate-500 line-clamp-2 mb-2">{p.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="font-extrabold text-xs text-slate-900">
                    R$ {p.price.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center font-bold text-xs transition">
                    +
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Active Cart & Checkout Panel (Visible always on lg+, or when mobileTab === 'cart') */}
        <div className={`w-full lg:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden ${
          mobileTab === 'cart' ? 'flex' : 'hidden lg:flex'
        }`}>
          
          {/* Cart Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-slate-900 text-sm">Comanda Atual</h3>
              <span className="bg-purple-100 text-purple-800 font-bold text-xs px-2 py-0.5 rounded-full">
                {totalCartItemsCount} {totalCartItemsCount === 1 ? 'item' : 'itens'}
              </span>
            </div>
            {pdvCart.length > 0 && (
              <button
                type="button"
                onClick={clearPdvCart}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Limpar
              </button>
            )}
          </div>

          {/* Customer & Notes Input */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/30 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nome do Cliente"
                className="px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-medium focus:ring-1 focus:ring-purple-500 focus:outline-none"
              />
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="WhatsApp (ex: 11999998888)"
                className="px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-medium focus:ring-1 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

        {/* Cart Items List */}
        <div className="flex-1 min-h-[220px] max-h-[380px] overflow-y-auto p-3 space-y-2.5 bg-slate-50/60 border-b border-slate-200/80">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200/80">
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-purple-600" />
              Itens Incluídos no Pedido:
            </span>
            <span className="text-[10px] font-extrabold bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full">
              {totalCartItemsCount} {totalCartItemsCount === 1 ? 'item' : 'itens'}
            </span>
          </div>

          {pdvCart.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-medium">Nenhum item adicionado ao carrinho.</p>
              <p className="text-[11px] text-slate-400 mt-1">Clique nos produtos ao lado para incluir no pedido.</p>
            </div>
          ) : (
            pdvCart.map((item, idx) => {
              const matchedProd = products.find((p) => p.id === item.productId);
              return (
                <div key={item.id} className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-purple-300 transition space-y-2">
                  <div className="flex items-start gap-2.5">
                    {/* Item Thumbnail / Icon */}
                    {matchedProd?.image ? (
                      <img
                        src={matchedProd.image}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 font-extrabold text-sm shrink-0">
                        🍔
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-extrabold text-xs text-slate-900 leading-snug line-clamp-2">
                          <span className="bg-purple-100 text-purple-900 px-1.5 py-0.2 rounded font-black text-[10px] mr-1">
                            {item.quantity}x
                          </span>
                          {item.name}
                        </h4>
                        <span className="font-black text-xs text-slate-900 shrink-0">
                          R$ {(item.unitTotal * item.quantity).toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                        R$ {item.unitTotal.toFixed(2).replace('.', ',')} un.
                      </div>

                      {/* Extras Tags */}
                      {item.selectedExtras && item.selectedExtras.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.selectedExtras.map((e, exIdx) => (
                            <span
                              key={exIdx}
                              className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md"
                            >
                              + {e.optionName} {e.price > 0 ? `(+R$ ${e.price.toFixed(2).replace('.', ',')})` : ''}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Removed Items */}
                      {item.removedItems && item.removedItems.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          <span className="text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                            🚫 Sem: {item.removedItems.join(', ')}
                          </span>
                        </div>
                      )}

                      {/* Observations Note */}
                      {item.observations && (
                        <div className="mt-1.5 p-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[10px] font-semibold text-amber-900 flex items-start gap-1">
                          <span className="shrink-0">📝</span>
                          <span className="italic">{item.observations}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Item Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => removeFromPdvCart(idx)}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remover
                    </button>

                    <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => updatePdvCartQty(idx, item.quantity - 1)}
                        className="w-5 h-5 rounded-md bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold transition cursor-pointer shadow-2xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-black text-slate-900 w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updatePdvCartQty(idx, item.quantity + 1)}
                        className="w-5 h-5 rounded-md bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold transition cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Payment & Action */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
          
          {/* Subtotal & Discount */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600 font-medium">
              <span>Subtotal:</span>
              <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 font-medium">
              <span className="flex items-center gap-1">
                Desconto:
                <input
                  type="number"
                  min="0"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="0,00"
                  className="w-16 px-1.5 py-0.5 bg-white border border-slate-300 rounded-md text-[11px] font-bold text-right"
                />
              </span>
              <span className="text-rose-600 font-bold">- R$ {discount.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex items-center justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-2">
              <span>Total a Pagar:</span>
              <span className="text-purple-700">R$ {total.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
              Forma de Pagamento
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'pix', label: 'PIX', icon: <QrCode className="w-3.5 h-3.5" /> },
                { id: 'cartao_credito', label: 'Crédito', icon: <CreditCard className="w-3.5 h-3.5" /> },
                { id: 'cartao_debito', label: 'Débito', icon: <CreditCard className="w-3.5 h-3.5" /> },
                { id: 'dinheiro', label: 'Dinheiro', icon: <DollarSign className="w-3.5 h-3.5" /> },
                { id: 'pg', label: 'PG (A Receber)', icon: <Clock className="w-3.5 h-3.5" /> },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition border ${
                    paymentMethod === m.id
                      ? m.id === 'pg'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                        : 'bg-purple-600 text-white border-purple-700 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  } ${m.id === 'pg' ? 'col-span-2' : ''}`}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>

            {paymentMethod === 'pg' && (
              <div className="mt-2 p-2.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2 text-amber-900 text-xs">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold">📌 Conta Registrada como PG (A Receber)</p>
                  <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                    O valor ficará pendente no faturamento e só somará como receita positiva após o pagamento ser efetuado e quitado.
                  </p>
                </div>
              </div>
            )}

            {paymentMethod === 'pix' && pdvCart.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPixModal(true)}
                className="w-full mt-2 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>Exibir QR Code Pix (R$ {total.toFixed(2).replace('.', ',')})</span>
              </button>
            )}
          </div>

          {/* Checkout Submit Buttons */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handlePrintOnly}
                disabled={pdvCart.length === 0}
                className={`py-3 px-2 rounded-xl font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5 ${
                  pdvCart.length > 0
                    ? 'bg-slate-800 hover:bg-slate-900 text-white cursor-pointer active:scale-[0.99]'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                }`}
                title="Imprimir conferência do pedido sem finalizar a venda"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>🖨️ SÓ IMPRIMIR</span>
              </button>

              <button
                type="button"
                onClick={handleFinalizeSale}
                disabled={pdvCart.length === 0}
                className={`py-3 px-2 rounded-xl font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5 ${
                  pdvCart.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-[0.99]'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                }`}
                title="Finalizar a venda e registrar o pedido"
              >
                <CheckCircle className="w-4 h-4" />
                <span>FINALIZAR (R$ {total.toFixed(2).replace('.', ',')})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
      </div>
      )}

      {/* Floating Bottom Mobile Cart Bar (Visible on phone when items are in cart and viewing catalog) */}
      {pdvCart.length > 0 && mobileTab === 'catalog' && (
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-30">
          <button
            type="button"
            onClick={() => setMobileTab('cart')}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl shadow-xl flex items-center justify-between font-extrabold text-xs transition active:scale-[0.99] border border-purple-500"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>Ver Comanda ({totalCartItemsCount} {totalCartItemsCount === 1 ? 'item' : 'itens'})</span>
            </div>
            <span className="bg-purple-800 text-white px-2.5 py-1 rounded-lg text-xs font-black">
              R$ {total.toFixed(2).replace('.', ',')} →
            </span>
          </button>
        </div>
      )}

      {/* Item Customizer Modal - Optimized Window */}
      {customizingProduct && (() => {
        const basePrice = Number(customizingProduct.price) || 0;
        const extrasCost = selectedExtras.reduce((sum, e) => sum + (Number(e.price) || 0), 0);
        const unitTotal = basePrice + extrasCost;
        const totalModalPrice = unitTotal * (Number(itemQuantity) || 1);

        const groupsToShow = (customizingProduct.extraGroupIds && customizingProduct.extraGroupIds.length > 0)
          ? customizingProduct.extraGroupIds.map((id) => extraGroups.find((g) => g.id === id)).filter((g): g is NonNullable<typeof g> => Boolean(g))
          : [];

        return (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col my-auto">
              
              {/* Optimized Compact Header with Small Product Thumbnail */}
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center gap-3 relative shrink-0">
                {customizingProduct.image && (
                  <img
                    src={customizingProduct.image}
                    alt={customizingProduct.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-slate-200 shrink-0 shadow-2xs"
                  />
                )}
                <div className="flex-1 min-w-0 pr-6">
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                    {customizingProduct.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                    {customizingProduct.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-extrabold text-purple-700 text-xs sm:text-sm">
                      R$ {basePrice.toFixed(2).replace('.', ',')}
                    </span>
                    {extrasCost > 0 && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        + R$ {extrasCost.toFixed(2).replace('.', ',')} em adicionais
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomizingProduct(null)}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-4 space-y-3.5 overflow-y-auto flex-1 text-xs">
                {/* Product Custom Extras */}
                {customizingProduct.customExtras && customizingProduct.customExtras.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 first:border-t-0 first:pt-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="font-bold text-xs text-slate-900">Adicionais do Produto</h4>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">+R$ Opcional</span>
                    </div>
                    <div className="space-y-1.5">
                      {customizingProduct.customExtras.map((opt) => {
                        const isSelected = selectedExtras.some((e) => e.optionId === opt.id);
                        const optPrice = Number(opt.price) || 0;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              toggleExtraChoice('custom-grp', 'Adicionais', opt.id, opt.name, optPrice)
                            }
                            className={`w-full flex items-center justify-between p-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                              isSelected
                                ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-2xs ring-1 ring-purple-500/30'
                                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center ${isSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300'}`}>
                                {isSelected && <span className="text-[9px] font-black">✓</span>}
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

                {/* Extras groups */}
                {groupsToShow.map((group) => {
                  if (!group) return null;
                  return (
                    <div key={group.id} className="pt-2 border-t border-slate-100 first:border-t-0 first:pt-0">
                      <div className="flex items-center justify-between mb-1.5">
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
                              onClick={() =>
                                toggleExtraChoice(group.id, group.title, opt.id, opt.name, optPrice)
                              }
                              className={`w-full flex items-center justify-between p-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                                isSelected
                                  ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-2xs ring-1 ring-purple-500/30'
                                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span className={`w-3.5 h-3.5 rounded-${group.max === 1 ? 'full' : 'md'} border flex items-center justify-center ${isSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300'}`}>
                                  {isSelected && <span className="text-[9px] font-black">✓</span>}
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
                {customizingProduct.removableItems && customizingProduct.removableItems.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="font-bold text-xs text-rose-900 flex items-center gap-1">
                        <span>🚫 Retirar Ingredientes (Sem...)</span>
                      </h4>
                      <span className="text-[10px] text-slate-500 font-medium">Clique para retirar</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {customizingProduct.removableItems.map((ing) => {
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

                {/* Observations */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Observações do item:</label>
                  <input
                    type="text"
                    value={itemObservation}
                    onChange={(e) => setItemObservation(e.target.value)}
                    placeholder="Ex: sem cebola, ponto bem passado..."
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                {/* Quantity */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="font-bold text-xs text-slate-700">Quantidade:</span>
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setItemQuantity((q) => Math.max(1, q - 1))}
                      className="w-7 h-7 bg-white rounded-lg font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-extrabold text-slate-900 text-xs w-6 text-center">
                      {itemQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setItemQuantity((q) => q + 1)}
                      className="w-7 h-7 bg-white rounded-lg font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setCustomizingProduct(null)}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCustomizedItem}
                  className="flex-1 py-2.5 px-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md transition flex items-center justify-between gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <span>Adicionar ({itemQuantity})</span>
                  <span className="bg-white/20 px-2.5 py-1 rounded-lg text-xs font-black tracking-wide shrink-0">
                    R$ {totalModalPrice.toFixed(2).replace('.', ',')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* PIX MODAL PDV */}
      {showPixModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 border border-slate-200 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowPixModal(false)}
              className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <PixQrCodeDisplay
              pixKey={settings.pixKey}
              merchantName={settings.pixName || settings.name}
              amount={total}
              orderCode={`PDV-${Date.now().toString().slice(-4)}`}
              title="QR Code Pix do Caixa"
            />
            <button
              onClick={() => setShowPixModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl cursor-pointer"
            >
              Fechar QR Code
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
