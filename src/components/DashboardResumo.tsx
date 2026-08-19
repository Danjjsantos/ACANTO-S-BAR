import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  ShoppingBag,
  Clock,
  Truck,
  AlertCircle,
  Users,
  DollarSign,
  Coffee,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const DashboardResumo: React.FC = () => {
  const { orders, tables, waiters, drivers, setActiveTab } = useApp();

  // Calculate Metrics
  const todayOrders = orders.filter((o) => o.status !== 'cancelado');
  const paidOrders = todayOrders.filter((o) => o.paymentMethod !== 'pg');
  const pgOrders = todayOrders.filter((o) => o.paymentMethod === 'pg');

  const totalRevenueToday = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const totalPendingPGToday = pgOrders.reduce((sum, o) => sum + o.total, 0);
  const estimatedProfit = totalRevenueToday * 0.42; // ~42% margin
  const activeOrders = todayOrders.filter((o) => o.status === 'confirmado' || o.status === 'pronto_para_retirada');
  const onlineDrivers = drivers.filter((d) => d.status === 'disponivel' || d.status === 'em_rota');
  const activeWaiters = waiters.filter((w) => w.status === 'ativo');
  const occupiedTables = tables.filter((t) => t.status === 'ocupada' || t.status === 'fechando');

  return (
    <div className="space-y-6 pb-12">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pedidos Hoje */}
        <div
          onClick={() => setActiveTab('pedidos')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-purple-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <div className="p-2.5 rounded-xl bg-purple-50">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{todayOrders.length}</p>
          <p className="text-xs text-slate-500 font-medium">PEDIDOS HOJE</p>
        </div>

        {/* Faturamento Hoje */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <div className="p-2.5 rounded-xl bg-emerald-50">
              <DollarSign className="w-5 h-5" />
            </div>
            {totalPendingPGToday > 0 ? (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                📌 R$ {totalPendingPGToday.toFixed(2).replace('.', ',')} A RECEBER
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                +14%
              </span>
            )}
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            R$ {totalRevenueToday.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-xs text-slate-500 font-medium">
            FATURAMENTO REALIZADO <span className="text-[10px] text-slate-400">(Exceto PG)</span>
          </p>
        </div>

        {/* Lucro Estimado */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <div className="p-2.5 rounded-xl bg-amber-50">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              ~42% Margem
            </span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            R$ {estimatedProfit.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-xs text-slate-500 font-medium">LUCRO ESTIMADO</p>
        </div>

        {/* Entregadores / Mesas */}
        <div
          onClick={() => setActiveTab('mesas')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <div className="p-2.5 rounded-xl bg-blue-50">
              <Users className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{occupiedTables.length} / {tables.length}</p>
          <p className="text-xs text-slate-500 font-medium">MESAS OCUPADAS AGORA</p>
        </div>
      </div>

      {/* Warning Callouts / Notifications */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 text-xs font-medium">
        <div className="flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-bold">Atenção para suas vendas:</p>
            <p className="text-amber-800">
              Pagamentos presenciais habilitados. Lembre-se de notificar clientes no WhatsApp!
            </p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('whatsapp')}
          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shrink-0"
        >
          Ver WhatsApp Bot
        </button>
      </div>

      {/* Active Orders Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">PEDIDOS EM ANDAMENTO</h3>
            <p className="text-xs text-slate-500">Pedidos que precisam da atenção da sua cozinha/balcão</p>
          </div>
          <button
            onClick={() => setActiveTab('pedidos')}
            className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            Ver todos ({activeOrders.length}) <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {activeOrders.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">Nenhum pedido em andamento neste momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-purple-300 transition bg-slate-50/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-sm text-slate-900">{ord.code}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      ord.status === 'confirmado'
                        ? 'bg-amber-100 text-amber-800'
                        : ord.status === 'pronto_para_retirada'
                        ? 'bg-purple-100 text-purple-800'
                        : ord.status === 'entregue'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {ord.status === 'pronto_para_retirada' ? 'pronto p/ retirada' : ord.status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-800 mb-1">
                  {ord.customer?.name || `Mesa ${ord.tableNumber}`}
                </p>
                <p className="text-xs text-slate-500 mb-3 truncate">
                  {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                </p>
                <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 text-xs">
                  <span className="font-bold text-slate-900">
                    R$ {ord.total.toFixed(2).replace('.', ',')}
                  </span>
                  <button
                    onClick={() => setActiveTab('pedidos')}
                    className="text-purple-600 hover:text-purple-800 font-semibold text-[11px]"
                  >
                    Gerenciar →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Operational Summary Grid: Waiters, Delivery, 7 Day Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Garçons */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs md:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
              <Coffee className="w-4 h-4 text-purple-600" /> GARÇONS
            </h4>
            <button
              onClick={() => setActiveTab('garcons')}
              className="text-[11px] font-semibold text-purple-600 hover:underline"
            >
              Ver todos →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-3 bg-purple-50 rounded-xl text-center">
              <span className="block text-xl font-extrabold text-purple-900">{waiters.length}</span>
              <span className="text-[10px] font-bold text-purple-700">Total</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-center">
              <span className="block text-xl font-extrabold text-emerald-900">{activeWaiters.length}</span>
              <span className="text-[10px] font-bold text-emerald-700">Online</span>
            </div>
          </div>
          <div className="space-y-1.5">
            {waiters.map((w) => (
              <div key={w.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50">
                <span className="font-medium text-slate-800">{w.name}</span>
                <span className="text-slate-500 font-medium">{w.activeTables} mesas ativas</span>
              </div>
            ))}
          </div>
        </div>

        {/* Vendas (7 dias) Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs md:col-span-2">
          <h4 className="font-bold text-slate-900 text-xs uppercase mb-3 flex items-center justify-between">
            <span>VENDAS (7 DIAS)</span>
            <span className="text-emerald-600 font-bold text-xs">+28% este mês</span>
          </h4>
          <div className="flex items-end justify-between gap-1.5 h-32 pt-4 border-b border-slate-100 pb-2">
            {[
              { day: 'Ter', value: 340, height: '40%' },
              { day: 'Qua', value: 480, height: '55%' },
              { day: 'Qui', value: 620, height: '70%' },
              { day: 'Sex', value: 980, height: '95%' },
              { day: 'Sáb', value: 1120, height: '100%' },
              { day: 'Dom', value: 890, height: '85%' },
              { day: 'Seg', value: 450, height: '50%' },
            ].map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                <span className="text-[9px] text-slate-400 group-hover:text-purple-700 font-bold transition">
                  {bar.value}
                </span>
                <div
                  className="w-full bg-purple-100 group-hover:bg-purple-600 rounded-t-md transition-all duration-300"
                  style={{ height: bar.height }}
                ></div>
                <span className="text-[10px] font-semibold text-slate-500">{bar.day}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-center">
            <span className="text-xs text-slate-500 font-medium">
              Total 7 dias: <strong className="text-slate-900">R$ 4.880,00</strong>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
