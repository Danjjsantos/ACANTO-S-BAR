import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ToastNotification } from '../types';
import { AnimatePresence, motion } from 'motion/react';
import { playAudioSiren } from '../utils/orderAlerts';
import {
  ShoppingBag,
  Store,
  X,
  Volume2,
  VolumeX,
  ChevronRight,
  Receipt,
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  Printer,
} from 'lucide-react';

export const ToastNotificationContainer: React.FC = () => {
  const {
    toasts,
    removeToast,
    setSelectedReceiptOrder,
    setActiveTab,
    soundEnabled,
    setSoundEnabled,
    addToast,
    orders,
  } = useApp();

  return (
    <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-2 sm:px-0">
      
      {/* Sound Toggle Floating Control */}
      <AnimatePresence>
        {toasts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="self-end pointer-events-auto bg-slate-900/90 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg border border-slate-700/80 flex items-center gap-2 mb-0.5"
          >
            <span className="flex items-center gap-1 text-orange-300">
              <Bell className="w-3 h-3 text-orange-400 animate-bounce" />
              Notificações Ativas ({toasts.length})
            </span>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="hover:text-orange-300 transition flex items-center gap-1 pl-1 border-l border-slate-700"
              title={soundEnabled ? 'Silenciar som de alerta' : 'Ativar som de alerta'}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px]">Som ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] text-slate-400">Mute</span>
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List of Toast Cards */}
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastCard
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
            onViewOrder={() => {
              removeToast(toast.id);
              if (toast.order) {
                setSelectedReceiptOrder(toast.order);
              }
              setActiveTab('pedidos');
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface ToastCardProps {
  toast: ToastNotification;
  onClose: () => void;
  onViewOrder: () => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, onClose, onViewOrder }) => {
  const { setSelectedReceiptOrder } = useApp();
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(100);
  const AUTO_CLOSE_MS = 8000;

  useEffect(() => {
    if (!toast.autoClose || isHovered) return;

    const interval = 100;
    const step = (interval / AUTO_CLOSE_MS) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - step));
    }, interval);

    return () => clearInterval(timer);
  }, [toast.autoClose, isHovered]);

  useEffect(() => {
    if (progress <= 0 && toast.autoClose && !isHovered) {
      onClose();
    }
  }, [progress, toast.autoClose, isHovered, onClose]);

  const isPdv = toast.type === 'order_pdv';
  const order = toast.order;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`pointer-events-auto w-full rounded-2xl shadow-xl border overflow-hidden backdrop-blur-md transition-all duration-200 ${
        isPdv
          ? 'bg-slate-900 text-white border-emerald-500/40 ring-1 ring-emerald-500/30'
          : 'bg-slate-900 text-white border-purple-500/40 ring-1 ring-purple-500/30'
      }`}
    >
      {/* Header Bar */}
      <div className="p-3 pb-2 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          {isPdv ? (
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold flex items-center gap-1 uppercase tracking-wider">
              <Store className="w-3 h-3 text-emerald-400" /> PDV Balcão
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-extrabold flex items-center gap-1 uppercase tracking-wider">
              <ShoppingBag className="w-3 h-3 text-purple-400" /> Cardápio Digital
            </span>
          )}

          {order?.code && (
            <span className="font-extrabold text-xs text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
              {order.code}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" /> {toast.createdAt}
          </span>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition"
            title="Fechar Notificação"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-extrabold text-sm text-white leading-snug flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              {toast.title}
            </h4>
            <p className="text-xs text-slate-300 font-medium mt-0.5 leading-relaxed">
              {toast.message}
            </p>
          </div>

          {order && (
            <div className="text-right shrink-0">
              <span className="block text-xs font-black text-emerald-400">
                R$ {order.total.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded inline-block mt-0.5">
                {order.paymentMethod.replace('_', ' ')}
              </span>
            </div>
          )}
        </div>

        {/* Order items snippet if available */}
        {order && order.items.length > 0 && (
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <p className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Itens do Pedido:</p>
            <ul className="space-y-0.5 max-h-16 overflow-y-auto pr-1">
              {order.items.slice(0, 3).map((item, idx) => (
                <li key={idx} className="flex justify-between items-center text-[11px]">
                  <span className="truncate max-w-[200px]">
                    <span className="font-bold text-purple-300">{item.quantity}x</span> {item.name}
                  </span>
                  <span className="text-slate-400 font-semibold">
                    R$ {(item.unitTotal * item.quantity).toFixed(2).replace('.', ',')}
                  </span>
                </li>
              ))}
              {order.items.length > 3 && (
                <li className="text-[10px] text-slate-500 italic">
                  + {order.items.length - 3} outros itens...
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="px-3 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between gap-1.5 flex-wrap">
        <button
          onClick={onClose}
          className="px-2 py-1 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
        >
          Dispensar
        </button>

        <div className="flex items-center gap-1.5">
          {order && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playAudioSiren();
                }}
                className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-extrabold transition flex items-center gap-1 cursor-pointer"
                title="Tocar Sinal Sonoro Novamente"
              >
                <Volume2 className="w-3 h-3 text-amber-400" />
                <span>Som</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedReceiptOrder(order);
                  setTimeout(() => window.print(), 300);
                }}
                className="px-2 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-[11px] font-extrabold transition flex items-center gap-1 shadow-xs cursor-pointer"
                title="Imprimir Via para a Cozinha"
              >
                <Printer className="w-3 h-3 text-amber-200" />
                <span>Cozinha</span>
              </button>
            </>
          )}

          <button
            onClick={onViewOrder}
            className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition flex items-center gap-1 shadow-sm cursor-pointer ${
              isPdv
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Detalhes</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Animated Auto-close Progress Bar */}
      {toast.autoClose && (
        <div className="w-full bg-slate-800 h-1 overflow-hidden">
          <div
            className={`h-full transition-all duration-100 ${
              isPdv ? 'bg-emerald-500' : 'bg-purple-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
};
