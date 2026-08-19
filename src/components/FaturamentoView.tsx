import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Order, PaymentMethod } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  DollarSign,
  Calendar,
  Filter,
  CreditCard,
  User,
  Package,
  Printer,
  FileText,
  Download,
  RotateCcw,
  TrendingUp,
  ShoppingBag,
  Receipt,
  Search,
  ChevronDown,
  ArrowUpRight,
  Sparkles,
  PieChart as PieIcon,
  Clock,
  X,
  CheckCircle2,
} from 'lucide-react';

export const FaturamentoView: React.FC = () => {
  const { orders, customers, products, setSelectedReceiptOrder, updateOrderPaymentMethod, settings } = useApp();

  // Filter States
  const [periodPreset, setPeriodPreset] = useState<
    'hoje' | 'ontem' | '7dias' | '30dias' | 'este_mes' | 'mes_anterior' | 'custom' | 'todos'
  >('30dias');

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('todos'); // e.g. "2026-07"

  const [paymentFilter, setPaymentFilter] = useState<string>('todos'); // 'todos' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'pg'
  const [customerFilter, setCustomerFilter] = useState<string>('todos'); // customer ID or name or 'todos'
  const [productFilter, setProductFilter] = useState<string>('todos'); // product ID or 'todos'
  const [typeFilter, setTypeFilter] = useState<string>('todos'); // 'todos' | 'delivery' | 'pdv' | 'mesa'

  const [searchQuery, setSearchQuery] = useState<string>('');

  // Settle PG modal state
  const [orderToSettlePG, setOrderToSettlePG] = useState<Order | null>(null);
  const [settleMethod, setSettleMethod] = useState<PaymentMethod>('pix');

  // Reset all filters helper
  const handleResetFilters = () => {
    setPeriodPreset('todos');
    setStartDate('');
    setEndDate('');
    setSelectedMonth('todos');
    setPaymentFilter('todos');
    setCustomerFilter('todos');
    setProductFilter('todos');
    setTypeFilter('todos');
    setSearchQuery('');
  };

  // Helper to handle Quick Period Selection
  const handlePeriodPresetChange = (
    preset: 'hoje' | 'ontem' | '7dias' | '30dias' | 'este_mes' | 'mes_anterior' | 'custom' | 'todos'
  ) => {
    setPeriodPreset(preset);
    setSelectedMonth('todos');

    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'hoje') {
      const todayStr = formatDate(today);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'ontem') {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yestStr = formatDate(yesterday);
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (preset === '7dias') {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      setStartDate(formatDate(start));
      setEndDate(formatDate(today));
    } else if (preset === '30dias') {
      const start = new Date(today);
      start.setDate(today.getDate() - 29);
      setStartDate(formatDate(start));
      setEndDate(formatDate(today));
    } else if (preset === 'este_mes') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setStartDate(formatDate(start));
      setEndDate(formatDate(end));
    } else if (preset === 'mes_anterior') {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      setStartDate(formatDate(start));
      setEndDate(formatDate(end));
    } else if (preset === 'todos') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Helper to handle month selector dropdown
  const handleMonthChange = (monthVal: string) => {
    setSelectedMonth(monthVal);
    if (monthVal === 'todos') {
      setPeriodPreset('todos');
      setStartDate('');
      setEndDate('');
      return;
    }
    setPeriodPreset('custom');
    const [year, month] = monthVal.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  };

  // Available unique Months options built from orders history
  const monthOptions = useMemo(() => {
    const monthsSet = new Set<string>();
    orders.forEach((o) => {
      if (o.createdAt) {
        const d = new Date(o.createdAt);
        if (!isNaN(d.getTime())) {
          const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          monthsSet.add(mStr);
        }
      }
    });

    // Ensure current month is included
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    monthsSet.add(currentMonthStr);

    return Array.from(monthsSet).sort().reverse();
  }, [orders]);

  // Main Filter Logic for Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // Exclude canceled orders from revenue/faturamento
      if (ord.status === 'cancelado') return false;

      // 1. Date Filter
      if (startDate) {
        const orderDateStr = ord.createdAt?.split('T')[0] || '';
        if (orderDateStr < startDate) return false;
      }
      if (endDate) {
        const orderDateStr = ord.createdAt?.split('T')[0] || '';
        if (orderDateStr > endDate) return false;
      }

      // 2. Payment Method Filter
      if (paymentFilter !== 'todos') {
        if ((ord.paymentMethod || 'pix') !== paymentFilter) return false;
      }

      // 3. Customer Filter
      if (customerFilter !== 'todos') {
        const custName = ord.customer?.name?.toLowerCase() || '';
        const custPhone = ord.customer?.phone || '';
        const targetCust = customerFilter.toLowerCase();

        const matchesCust = custName.includes(targetCust) || custPhone.includes(targetCust);
        if (!matchesCust) return false;
      }

      // 4. Product Filter
      if (productFilter !== 'todos') {
        const hasProduct = ord.items?.some(
          (item) => item.productId === productFilter || item.name.toLowerCase().includes(productFilter.toLowerCase())
        );
        if (!hasProduct) return false;
      }

      // 5. Order Type Filter (Delivery, PDV, Mesa)
      if (typeFilter !== 'todos') {
        if (ord.type !== typeFilter) return false;
      }

      // 6. General Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const codeMatch = (ord.code || '').toLowerCase().includes(q);
        const nameMatch = (ord.customer?.name || '').toLowerCase().includes(q);
        const phoneMatch = (ord.customer?.phone || '').includes(q);
        const itemMatch = ord.items?.some((i) => i.name.toLowerCase().includes(q));

        if (!codeMatch && !nameMatch && !phoneMatch && !itemMatch) return false;
      }

      return true;
    });
  }, [orders, startDate, endDate, paymentFilter, customerFilter, productFilter, typeFilter, searchQuery]);

  // Financial Calculations
  const stats = useMemo(() => {
    const paidOrders = filteredOrders.filter((o) => o.paymentMethod !== 'pg');
    const pgOrders = filteredOrders.filter((o) => o.paymentMethod === 'pg');

    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalPendingPG = pgOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    const totalOrdersCount = filteredOrders.length;
    const paidOrdersCount = paidOrders.length;
    const averageTicket = paidOrdersCount > 0 ? totalRevenue / paidOrdersCount : 0;

    const totalDiscounts = filteredOrders.reduce((sum, o) => sum + (o.discount || 0), 0);
    const totalDeliveryFees = filteredOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);

    // Payment Methods Breakdown
    const byPayment: Record<PaymentMethod, { total: number; count: number }> = {
      pix: { total: 0, count: 0 },
      cartao_credito: { total: 0, count: 0 },
      cartao_debito: { total: 0, count: 0 },
      dinheiro: { total: 0, count: 0 },
      pg: { total: 0, count: 0 },
    };

    filteredOrders.forEach((o) => {
      const pm = (o.paymentMethod || 'pix') as PaymentMethod;
      if (byPayment[pm]) {
        byPayment[pm].total += o.total || 0;
        byPayment[pm].count += 1;
      } else {
        byPayment.pix.total += o.total || 0;
        byPayment.pix.count += 1;
      }
    });

    // Top Sold Products Breakdown in current filter
    const productSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    filteredOrders.forEach((o) => {
      o.items?.forEach((item) => {
        const key = item.productId || item.name;
        if (!productSalesMap[key]) {
          productSalesMap[key] = {
            name: item.name,
            qty: 0,
            revenue: 0,
          };
        }
        productSalesMap[key].qty += item.quantity;
        productSalesMap[key].revenue += (item.unitTotal || item.price || 0) * item.quantity;
      });
    });

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalRevenue,
      totalPendingPG,
      totalOrdersCount,
      paidOrdersCount,
      averageTicket,
      totalDiscounts,
      totalDeliveryFees,
      byPayment,
      topProducts,
    };
  }, [filteredOrders]);

  // Print Summary Report Handler
  const handlePrintReport = () => {
    const originalTitle = document.title;
    const dateStr = new Date().toISOString().split('T')[0];
    document.title = `Relatorio_Faturamento_${dateStr}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  // Direct PDF Export Handler using jsPDF
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const nowStr = new Date().toLocaleString('pt-BR');
      const dateFileStr = new Date().toISOString().split('T')[0];

      // Header Branding
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(settings.name || 'Faz o Pedido OS', 14, 18);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105); // slate-600
      let yPos = 23;
      if (settings.cnpj) {
        doc.text(`CNPJ: ${settings.cnpj}`, 14, yPos);
        yPos += 5;
      }
      doc.text(`Relatório de Faturamento & Vendas`, 14, yPos);
      doc.text(`Data de Emissão: ${nowStr}`, 14, yPos + 5);

      // Filter summary box
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.roundedRect(14, yPos + 10, 182, 22, 2, 2, 'FD');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(109, 40, 217); // purple-700
      doc.text('FILTROS APLICADOS AO RELATÓRIO', 18, yPos + 16);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(`Período: ${activePeriodSummary}`, 18, yPos + 22);
      doc.text(`Pagamento: ${paymentFilter === 'todos' ? 'Todas as Formas' : paymentFilter.replace('_', ' ').toUpperCase()}`, 18, yPos + 27);

      doc.text(`Tipo de Pedido: ${typeFilter === 'todos' ? 'Todos os Tipos' : typeFilter.toUpperCase()}`, 110, yPos + 22);
      doc.text(`Específico: ${customerFilter !== 'todos' ? `Cliente ${customerFilter}` : productFilter !== 'todos' ? `Prod. ${productFilter}` : 'Nenhum'}`, 110, yPos + 27);

      // Financial Metrics Summary Box
      const metricsY = yPos + 36;
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(14, metricsY, 182, 22, 2, 2, 'F');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);

      doc.text(`Faturamento: R$ ${stats.totalRevenue.toFixed(2).replace('.', ',')}`, 18, metricsY + 8);
      doc.text(`Pedidos Totais: ${stats.totalOrdersCount}`, 18, metricsY + 16);

      doc.text(`Ticket Médio: R$ ${stats.averageTicket.toFixed(2).replace('.', ',')}`, 80, metricsY + 8);
      doc.text(`Taxas Entrega: R$ ${stats.totalDeliveryFees.toFixed(2).replace('.', ',')}`, 80, metricsY + 16);

      doc.text(`Descontos: R$ ${stats.totalDiscounts.toFixed(2).replace('.', ',')}`, 140, metricsY + 8);
      doc.text(`PIX: R$ ${stats.byPayment.pix.total.toFixed(2).replace('.', ',')}`, 140, metricsY + 16);

      // Orders Table
      const tableRows = filteredOrders.map((ord) => {
        const dateFormatted = ord.createdAt
          ? new Date(ord.createdAt).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '-';

        return [
          ord.code || `#${ord.id}`,
          dateFormatted,
          ord.customer?.name || 'Cliente Balcão',
          ord.type === 'delivery' ? 'Delivery' : ord.type === 'pdv' ? 'PDV' : ord.type === 'mesa' ? `Mesa ${ord.tableNumber || ''}` : 'Retirada',
          (ord.paymentMethod || 'pix').replace('_', ' ').toUpperCase(),
          `R$ ${(ord.total || 0).toFixed(2).replace('.', ',')}`,
        ];
      });

      autoTable(doc, {
        startY: metricsY + 26,
        head: [['Código', 'Data/Hora', 'Cliente', 'Tipo', 'Pagamento', 'Total']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [109, 40, 217], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
        styles: { fontSize: 8.5, cellPadding: 2.5, overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 22, fontStyle: 'bold' },
          1: { cellWidth: 32 },
          2: { cellWidth: 50 },
          3: { cellWidth: 24 },
          4: { cellWidth: 30 },
          5: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
        },
      });

      doc.save(`Relatorio_Faturamento_${dateFileStr}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    }
  };

  // Format Month Display (e.g. 2026-07 -> Julho / 2026)
  const formatMonthLabel = (mStr: string) => {
    if (mStr === 'todos') return 'Todos os Meses';
    const [year, month] = mStr.split('-');
    const monthsPt = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    const monthIndex = parseInt(month, 10) - 1;
    return `${monthsPt[monthIndex] || month} / ${year}`;
  };

  // Active Period Text Helper for Print Report Header
  const activePeriodSummary = useMemo(() => {
    if (startDate && endDate) {
      const [sy, sm, sd] = startDate.split('-');
      const [ey, em, ed] = endDate.split('-');
      return `${sd}/${sm}/${sy} até ${ed}/${em}/${ey}`;
    }
    if (startDate) {
      const [sy, sm, sd] = startDate.split('-');
      return `A partir de ${sd}/${sm}/${sy}`;
    }
    if (selectedMonth !== 'todos') {
      return formatMonthLabel(selectedMonth);
    }
    const presetLabels: Record<string, string> = {
      hoje: 'Hoje',
      ontem: 'Ontem',
      '7dias': 'Últimos 7 dias',
      '30dias': 'Últimos 30 dias',
      este_mes: 'Este Mês',
      mes_anterior: 'Mês Anterior',
      todos: 'Todo o Histórico',
    };
    return presetLabels[periodPreset] || 'Período Selecionado';
  }, [startDate, endDate, selectedMonth, periodPreset]);

  return (
    <div className="space-y-6 pb-12 print:pb-0 print:space-y-4">
      
      {/* EXCLUSIVE PRINT HEADER (Only visible during print) */}
      <div className="hidden print:block mb-4 pb-3 border-b-2 border-slate-900 text-black">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-black uppercase tracking-wide">{settings.name}</h1>
            {settings.cnpj && <p className="text-xs font-semibold">CNPJ: {settings.cnpj}</p>}
            <p className="text-xs">{settings.address} • Tel: {settings.phone}</p>
          </div>
          <div className="text-right">
            <h2 className="text-sm font-black uppercase tracking-wider text-purple-900">
              Relatório de Faturamento & Vendas
            </h2>
            <p className="text-[11px] font-medium text-slate-700">
              Emissão: {new Date().toLocaleString('pt-BR')}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-300 grid grid-cols-4 gap-2 text-xs">
          <div>
            <span className="font-bold text-slate-500 uppercase block text-[9px]">Período:</span>
            <span className="font-extrabold text-black">{activePeriodSummary}</span>
          </div>
          <div>
            <span className="font-bold text-slate-500 uppercase block text-[9px]">Forma de Pagamento:</span>
            <span className="font-extrabold text-black">
              {paymentFilter === 'todos' ? 'Todas as Formas' : paymentFilter.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div>
            <span className="font-bold text-slate-500 uppercase block text-[9px]">Tipo de Pedido:</span>
            <span className="font-extrabold text-black">
              {typeFilter === 'todos' ? 'Todos os Tipos' : typeFilter.toUpperCase()}
            </span>
          </div>
          <div>
            <span className="font-bold text-slate-500 uppercase block text-[9px]">Filtros Específicos:</span>
            <span className="font-extrabold text-black">
              {customerFilter !== 'todos' ? `Cliente: ${customerFilter}` : productFilter !== 'todos' ? `Produto: ${productFilter}` : 'Nenhum'}
            </span>
          </div>
        </div>
      </div>

      {/* HEADER SECTION (Screen view) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="font-extrabold text-slate-900 text-xl flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600 bg-emerald-100 p-1 rounded-xl" />
            Relatório de Faturamento & Vendas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Filtre faturamento por períodos, clientes, produtos e meios de pagamento com análise financeira detalhada.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto print:hidden">
          <button
            onClick={handlePrintReport}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition shadow-2xs cursor-pointer"
            title="Imprimir relatório filtrado em papel ou impressora"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Relatório</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition shadow-2xs cursor-pointer"
            title="Baixar arquivo PDF com o relatório filtrado"
          >
            <Download className="w-4 h-4" />
            <span>Exportar em PDF</span>
          </button>
        </div>
      </div>

      {/* FILTER CONTROL PANEL */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs space-y-2.5 print:hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-purple-600" /> Filtros Avançados
          </h3>
          <button
            onClick={handleResetFilters}
            className="text-xs text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Limpar Filtros
          </button>
        </div>

        {/* Quick Period Presets */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
            {[
              { id: '30dias', label: 'Últimos 30 dias' },
              { id: 'hoje', label: 'Hoje' },
              { id: 'ontem', label: 'Ontem' },
              { id: '7dias', label: 'Últimos 7 dias' },
              { id: 'este_mes', label: 'Este Mês' },
              { id: 'mes_anterior', label: 'Mês Anterior' },
              { id: 'todos', label: 'Todo o Histórico' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handlePeriodPresetChange(p.id as any)}
                className={`px-2.5 py-1 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
                  periodPreset === p.id
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Range & Selectors Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 pt-1 border-t border-slate-100">
          
          {/* Specific Month Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-0.5 flex items-center gap-1 truncate">
              <Calendar className="w-3 h-3 text-purple-600" /> Mês
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer"
            >
              <option value="todos">Todos Meses</option>
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {formatMonthLabel(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Date Start */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Início</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPeriodPreset('custom');
              }}
              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Date End */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Fim</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPeriodPreset('custom');
              }}
              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-0.5 flex items-center gap-1 truncate">
              <CreditCard className="w-3 h-3 text-emerald-600" /> Pagamento
            </label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer"
            >
              <option value="todos">Todas Formas</option>
              <option value="pg">📌 PG (A Receber)</option>
              <option value="pix">⚡ PIX</option>
              <option value="cartao_credito">💳 C. Crédito</option>
              <option value="cartao_debito">💳 C. Débito</option>
              <option value="dinheiro">💵 Dinheiro</option>
            </select>
          </div>

          {/* Customer Filter Dropdown */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-0.5 flex items-center gap-1 truncate">
              <User className="w-3 h-3 text-blue-600" /> Cliente
            </label>
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer"
            >
              <option value="todos">Todos Clientes</option>
              {customers.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product Filter Dropdown */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-0.5 flex items-center gap-1 truncate">
              <Package className="w-3 h-3 text-amber-600" /> Produto
            </label>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer"
            >
              <option value="todos">Todos Produtos</option>
              {products.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Order Type Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-0.5 truncate">Tipo Pedido</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer"
            >
              <option value="todos">Todos Tipos</option>
              <option value="delivery">🛵 Delivery</option>
              <option value="pdv">🏪 PDV</option>
              <option value="mesa">🍽️ Mesa</option>
            </select>
          </div>

          {/* Search Query Input */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-0.5 truncate">Busca</label>
            <div className="relative">
              <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Código, item..."
                className="w-full pl-7 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

        </div>

      </div>

      {/* KPI METRICS SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
        
        {/* Total Faturado Realizado */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-md relative overflow-hidden print:bg-white print:text-black print:border print:border-slate-300 print:shadow-none print:p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider print:text-slate-600">Faturamento Realizado</span>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-extrabold text-white print:bg-slate-100 print:text-slate-900 print:border print:border-slate-300">
              R$
            </div>
          </div>
          <div className="mt-3 print:mt-1">
            <span className="text-2xl sm:text-3xl font-black print:text-xl print:text-black">
              R$ {stats.totalRevenue.toFixed(2).replace('.', ',')}
            </span>
          </div>
          <p className="text-[11px] text-emerald-100 mt-2 flex items-center gap-1 font-medium print:text-slate-600 print:mt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200 print:text-emerald-700" /> {stats.paidOrdersCount} pedidos quitados
          </p>
        </div>

        {/* Contas PG A Receber */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-md relative overflow-hidden print:bg-white print:text-black print:border print:border-slate-300 print:shadow-none print:p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-100 uppercase tracking-wider print:text-slate-600">📌 Contas PG (A Receber)</span>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-extrabold text-white print:bg-slate-100 print:text-slate-900 print:border print:border-slate-300">
              <Clock className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3 print:mt-1">
            <span className="text-2xl sm:text-3xl font-black print:text-xl print:text-black">
              R$ {stats.totalPendingPG.toFixed(2).replace('.', ',')}
            </span>
          </div>
          <p className="text-[11px] text-amber-100 mt-2 flex items-center gap-1 font-medium print:text-slate-600 print:mt-1">
            <Clock className="w-3.5 h-3.5 text-amber-200 print:text-amber-700" /> {stats.byPayment.pg.count} contas aguardando quitação
          </p>
        </div>

        {/* Taxas & Descontos */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2 print:border-slate-300 print:shadow-none print:p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider print:text-slate-600">Entregas & Descontos</span>
            <TrendingUp className="w-5 h-5 text-blue-600 print:hidden" />
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-base font-black text-emerald-700 print:text-black">
                + R$ {stats.totalDeliveryFees.toFixed(2).replace('.', ',')}
              </span>
              <p className="text-[11px] text-slate-500 font-bold">taxas de entrega</p>
            </div>
            <div className="text-right border-l border-slate-100 pl-3 print:border-slate-300">
              <span className="text-base font-black text-rose-600 print:text-black">
                - R$ {stats.totalDiscounts.toFixed(2).replace('.', ',')}
              </span>
              <p className="text-[11px] text-slate-500 font-bold">descontos dados</p>
            </div>
          </div>
        </div>

        {/* Formas de Pagamento Destaque */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2 print:border-slate-300 print:shadow-none print:p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider print:text-slate-600">Meios de Pagamento</span>
            <PieIcon className="w-5 h-5 text-amber-600 print:hidden" />
          </div>
          <div className="pt-0.5 space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-700">PIX:</span>
              <strong className="text-slate-900 font-black">
                R$ {stats.byPayment.pix.total.toFixed(2).replace('.', ',')}
              </strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-700">Cartão Crédito / Débito:</span>
              <strong className="text-slate-900 font-black">
                R$ {(stats.byPayment.cartao_credito.total + stats.byPayment.cartao_debito.total).toFixed(2).replace('.', ',')}
              </strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-700">Dinheiro:</span>
              <strong className="text-slate-900 font-black">
                R$ {stats.byPayment.dinheiro.total.toFixed(2).replace('.', ',')}
              </strong>
            </div>
            <div className="flex justify-between items-center text-amber-900 font-bold border-t border-slate-100 pt-1">
              <span>📌 PG (A Receber):</span>
              <strong className="font-black text-amber-900">
                R$ {stats.byPayment.pg.total.toFixed(2).replace('.', ',')}
              </strong>
            </div>
          </div>
        </div>

      </div>

      {/* TOP PRODUCTS IN FILTERED SELECTION */}
      {stats.topProducts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 print:border-slate-300 print:shadow-none print:p-3">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 print:hidden" /> Produtos Mais Vendidos no Período Selecionado
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 print:grid-cols-5 print:gap-2">
            {stats.topProducts.map((p, idx) => {
              const pct = stats.totalRevenue > 0 ? (p.revenue / stats.totalRevenue) * 100 : 0;
              return (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 relative print:bg-white print:border-slate-300 print:p-2">
                  <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md print:bg-slate-200 print:text-black">
                    #{idx + 1} Campeão
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-xs line-clamp-1 print:line-clamp-none">{p.name}</h4>
                  <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                    <span>{p.qty} un.</span>
                    <strong className="text-slate-900 font-bold">R$ {p.revenue.toFixed(2).replace('.', ',')}</strong>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden print:hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DETAILED TRANSACTIONS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden print:border-slate-300 print:shadow-none print:rounded-none">
        
        <div className="p-4 border-b border-slate-100 flex items-center justify-between print:p-2 print:border-slate-300">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 print:text-sm">
              <Receipt className="w-5 h-5 text-purple-600 print:hidden" /> Lista de Pedidos & Faturamento ({filteredOrders.length})
            </h3>
            <p className="text-xs text-slate-500 print:hidden">
              Registros detalhados correspondentes aos filtros aplicados.
            </p>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <DollarSign className="w-12 h-12 mx-auto text-slate-300" />
            <p className="font-bold text-slate-700 text-sm">Nenhum pedido encontrado com os filtros selecionados.</p>
            <p className="text-xs text-slate-400">Tente ajustar o período de datas ou limpar os filtros de cliente e produto.</p>
            <button
              onClick={handleResetFilters}
              className="mt-2 px-4 py-2 bg-purple-600 text-white font-extrabold text-xs rounded-xl shadow-2xs cursor-pointer inline-flex items-center gap-1.5 print:hidden"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider print:bg-slate-100 print:text-black">
                  <th className="p-2.5 sm:p-3 print:p-2">Código</th>
                  <th className="p-2.5 sm:p-3 print:p-2">Data & Hora</th>
                  <th className="p-2.5 sm:p-3 print:p-2">Cliente</th>
                  <th className="p-2.5 sm:p-3 print:p-2">Tipo</th>
                  <th className="p-2.5 sm:p-3 print:p-2">Forma Pagamento</th>
                  <th className="p-2.5 sm:p-3 print:p-2 text-right">Valor Total</th>
                  <th className="p-2.5 sm:p-3 text-center print:hidden">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium print:divide-slate-300">
                {filteredOrders.map((ord) => {
                  const dateFormatted = ord.createdAt
                    ? new Date(ord.createdAt).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-';

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                      
                      {/* Code */}
                      <td className="p-2.5 sm:p-3 print:p-2 font-black text-slate-900 whitespace-nowrap">{ord.code || `#${ord.id}`}</td>

                      {/* Date */}
                      <td className="p-2.5 sm:p-3 print:p-2 text-slate-600 print:text-black font-medium whitespace-nowrap">{dateFormatted}</td>

                      {/* Customer */}
                      <td className="p-2.5 sm:p-3 print:p-2">
                        <div className="font-bold text-slate-900">{ord.customer?.name || 'Cliente Balcão'}</div>
                        {ord.customer?.phone && <div className="text-[10px] text-slate-500 print:text-slate-700">{ord.customer.phone}</div>}
                      </td>

                      {/* Type Badge */}
                      <td className="p-2.5 sm:p-3 print:p-2 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200 print:border-slate-300 print:bg-white">
                          {ord.type === 'delivery'
                            ? 'Delivery'
                            : ord.type === 'pdv'
                            ? 'PDV'
                            : ord.type === 'mesa'
                            ? `Mesa ${ord.tableNumber || ''}`
                            : 'Retirada'}
                        </span>
                      </td>

                      {/* Payment Method */}
                      <td className="p-2.5 sm:p-3 print:p-2 whitespace-nowrap">
                        {ord.paymentMethod === 'pg' ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-100 text-amber-950 border border-amber-300">
                            📌 PG (A Receber)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 print:bg-slate-200 print:text-black">
                            {(ord.paymentMethod || 'pix').replace('_', ' ')}
                          </span>
                        )}
                      </td>

                      {/* Total */}
                      <td className="p-2.5 sm:p-3 print:p-2 text-right font-black text-purple-700 print:text-black text-sm whitespace-nowrap">
                        R$ {(ord.total || 0).toFixed(2).replace('.', ',')}
                      </td>

                      {/* Action: Print Receipt / View / Quitar PG */}
                      <td className="p-2.5 sm:p-3 text-center print:hidden flex items-center justify-center gap-1.5 whitespace-nowrap">
                        {ord.paymentMethod === 'pg' && (
                          <button
                            onClick={() => {
                              setOrderToSettlePG(ord);
                              setSettleMethod('pix');
                            }}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-md transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Dar Baixa / Quitar Pagamento PG"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Quitar PG
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedReceiptOrder(ord)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] rounded-md transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Ver Comprovante Térmico"
                        >
                          <Printer className="w-3 h-3" /> Cupom
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* SETTLE PG PAYMENT MODAL */}
      {orderToSettlePG && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black">
                  📌
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Quitar Pagamento PG ({orderToSettlePG.code})</h3>
                  <p className="text-xs text-slate-500 font-medium">Baixar conta a receber de {orderToSettlePG.customer?.name || 'Cliente'}</p>
                </div>
              </div>
              <button
                onClick={() => setOrderToSettlePG(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase block">Valor a Liquidar</span>
                <span className="text-xl font-black text-amber-950">
                  R$ {(orderToSettlePG.total || 0).toFixed(2).replace('.', ',')}
                </span>
              </div>
              <span className="text-xs font-bold bg-amber-200/80 text-amber-950 px-2.5 py-1 rounded-lg">
                Pendente PG
              </span>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                Selecione a Forma de Pagamento Efetuada *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'pix', label: '⚡ Pix', desc: 'Transferência instantânea' },
                  { id: 'cartao_credito', label: '💳 Cartão Crédito', desc: 'Maquininha balcão' },
                  { id: 'cartao_debito', label: '💳 Cartão Débito', desc: 'Maquininha balcão' },
                  { id: 'dinheiro', label: '💵 Dinheiro', desc: 'Pagamento em espécie' },
                ].map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setSettleMethod(pm.id as PaymentMethod)}
                    className={`p-3 rounded-xl text-left border transition cursor-pointer flex flex-col ${
                      settleMethod === pm.id
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-extrabold text-xs">{pm.label}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{pm.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              💡 <strong>Ao confirmar:</strong> O status mudará para quitado e o valor de <strong>R$ {(orderToSettlePG.total || 0).toFixed(2).replace('.', ',')}</strong> passará a somar ao faturamento positivo do estabelecimento.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setOrderToSettlePG(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  updateOrderPaymentMethod(orderToSettlePG.id, settleMethod);
                  setOrderToSettlePG(null);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Confirmar Pagamento & Somar Faturamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXCLUSIVE PRINT FOOTER (Only visible during print) */}
      <div className="hidden print:block mt-8 pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500">
        <p>Relatório Financeiro de Faturamento & Vendas • {settings.name} • Faz o Pedido OS</p>
      </div>

    </div>
  );
};
