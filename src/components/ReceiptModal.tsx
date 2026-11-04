import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Order } from '../types';
import { Printer, MessageCircle, X, CheckCircle, Receipt, Zap, Copy } from 'lucide-react';
import { generateOrderSummaryText, openWhatsAppLink } from '../utils/whatsappHelper';

export const ReceiptModal: React.FC = () => {
  const {
    selectedReceiptOrder,
    setSelectedReceiptOrder,
    addToast,
    settings,
  } = useApp();
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(
    settings.thermalPaperWidth || '80mm'
  );

  if (!selectedReceiptOrder) return null;

  const ord = selectedReceiptOrder;

  const handleQuickThermalPrint = () => {
    window.print();
  };

  const handleSendWhatsAppOrder = () => {
    const text = generateOrderSummaryText(ord, settings);
    const targetPhone = ord.customer?.phone || settings.phone || '';
    openWhatsAppLink(targetPhone, text);
    addToast({
      title: 'Abrindo WhatsApp',
      message: `Enviando comprovante do pedido ${ord.code}...`,
      type: 'info',
    });
  };

  const handleCopyFormattedMessage = () => {
    const text = generateOrderSummaryText(ord, settings);
    navigator.clipboard.writeText(text);
    addToast({
      title: 'Mensagem Formatada Copiada!',
      message: 'Resumo completo do pedido copiado para colar no WhatsApp.',
      type: 'success',
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs print:p-0 print:bg-transparent print:static print:inset-auto print:block">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col print:shadow-none print:border-none print:max-w-none print:rounded-none print:w-auto">
        
        {/* Header - Hidden on Print */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-orange-600" /> Comprovante de Venda
            </h3>
            <span className="font-mono text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded">
              {ord.code}
            </span>
          </div>

          <button
            onClick={() => setSelectedReceiptOrder(null)}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper Size Quick Selector & Registered Printer - Hidden on Print */}
        <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700 print:hidden">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Printer className="w-3.5 h-3.5 text-orange-600" />
            <span className="text-slate-800 font-extrabold truncate max-w-[150px]">
              {settings.printerName || 'Impressora Local'}:
            </span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setPaperWidth('58mm')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                paperWidth === '58mm'
                  ? 'bg-orange-500 text-white shadow-2xs font-extrabold'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              58mm
            </button>
            <button
              onClick={() => setPaperWidth('80mm')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                paperWidth === '80mm'
                  ? 'bg-orange-500 text-white shadow-2xs font-extrabold'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              80mm
            </button>
          </div>
        </div>

        {/* Printable Thermal Slip Ticket */}
        <div className="p-4 bg-slate-200 flex items-center justify-center max-h-[60vh] overflow-y-auto print:p-0 print:bg-transparent print:max-h-none print:overflow-visible print:block">
          <div
            className={`printable-thermal-slip paper-${paperWidth} font-mono bg-white p-4 shadow-md border border-black text-black transition-all duration-200 print:border-none print:p-2 ${
              paperWidth === '58mm' ? 'w-[260px] text-[10px]' : 'w-[340px] text-xs'
            }`}
          >
            <div className="text-center space-y-1 text-black">
              <h2 className="font-extrabold text-sm text-black uppercase tracking-wide">
                {settings.name}
              </h2>
              {settings.cnpj && <p className="text-[10px] text-black">CNPJ: {settings.cnpj}</p>}
              <p className="text-[10px] text-black">{settings.address}</p>
              <p className="text-[10px] text-black">Tel/WhatsApp: {settings.phone}</p>
              <div className="border-b border-dashed border-black my-2"></div>
              <p className="font-extrabold text-black text-xs uppercase">
                *** CUPOM DE PEDIDO #{ord.code} ***
              </p>
              <p className="text-[10px] font-extrabold text-black uppercase tracking-wider">
                [ VIA ÚNICA ]
              </p>
              <p className="text-[10px] text-black">
                Data: {ord.createdAt ? (isNaN(Date.parse(ord.createdAt)) ? ord.createdAt : new Date(ord.createdAt).toLocaleString('pt-BR')) : new Date().toLocaleString('pt-BR')}
              </p>
            </div>

            <div className="space-y-0.5 mt-2 text-[11px] text-black">
              <p className="font-bold text-black">
                Cliente: {ord.customer?.name || 'Cliente Balcão'}
              </p>
              {ord.customer?.phone && <p className="text-black">Tel: {ord.customer.phone}</p>}
              {ord.tableNumber && <p className="font-bold text-black">MESA: #{ord.tableNumber}</p>}
              {ord.customer?.address && <p className="text-black">Endereço: {ord.customer.address}</p>}
              <p className="uppercase font-bold text-black">Tipo: {ord.type}</p>
            </div>

            <div className="border-b border-dashed border-black my-2"></div>

            {/* Items */}
            <div className="space-y-1 text-black">
              <p className="font-bold text-black uppercase text-[11px]">ITENS DO PEDIDO:</p>
              {(ord.items || []).map((it) => (
                <div key={it.id} className="flex justify-between items-start text-[11px] text-black">
                  <div className="flex-1 pr-1 text-black">
                    <span className="font-bold text-black">
                      {it.quantity}x {it.name}
                    </span>
                    {(it.selectedExtras || []).length > 0 && (
                      <p className="text-[9px] text-black pl-2">
                        + {it.selectedExtras.map((e) => e.optionName).join(', ')}
                      </p>
                    )}
                    {it.observations && (
                      <p className="text-[9px] text-black italic pl-2">
                        Obs: {it.observations}
                      </p>
                    )}
                  </div>
                  <span className="font-bold whitespace-nowrap text-black">
                    R$ {((it.unitTotal || 0) * (it.quantity || 1)).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-b border-dashed border-black my-2"></div>

            <div className="space-y-0.5 text-right font-bold text-[11px] text-black">
              <p className="text-black">Subtotal: R$ {(ord.subtotal || 0).toFixed(2).replace('.', ',')}</p>
              {(ord.discount || 0) > 0 && <p className="text-black">Desconto: -R$ {ord.discount.toFixed(2).replace('.', ',')}</p>}
              {(ord.deliveryFee || 0) > 0 && <p className="text-black">Taxa Entrega: R$ {ord.deliveryFee.toFixed(2).replace('.', ',')}</p>}
              <p className="text-sm font-black text-black border-t border-black pt-1 mt-1">
                TOTAL: R$ {(ord.total || 0).toFixed(2).replace('.', ',')}
              </p>
              <p className="text-[10px] text-black font-bold uppercase mt-1">
                FORMA PAGTO: {(ord.paymentMethod || 'dinheiro').replace('_', ' ').toUpperCase()} ({(ord.paymentStatus || 'pago').toUpperCase()})
              </p>
            </div>

            <div className="border-b border-dashed border-black my-2"></div>

            <p className="text-center text-[10px] font-bold text-black uppercase">
              Obrigado pela preferência!
              <br />
              Volte Sempre!
            </p>
          </div>
        </div>

        {/* Modal Actions - Hidden on Print */}
        <div className="p-4 bg-slate-50 flex flex-col gap-2 print:hidden">
          <button
            onClick={handleQuickThermalPrint}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-amber-200 text-amber-200 animate-pulse" />
            <span>⚡ Impressão Rápida ({paperWidth})</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSendWhatsAppOrder}
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer shadow-2xs"
              title="Abrir conversa no WhatsApp com o resumo completo"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar WhatsApp</span>
            </button>

            <button
              onClick={handleCopyFormattedMessage}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer shadow-2xs"
              title="Copiar texto formatado do recibo para área de transferência"
            >
              <Copy className="w-4 h-4 text-slate-300" />
              <span>Copiar Texto</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
