import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { generatePixPayload } from '../utils/pixPayload';
import { Copy, Check, QrCode as PixIcon, ShieldCheck } from 'lucide-react';

interface PixQrCodeDisplayProps {
  pixKey: string;
  merchantName?: string;
  amount?: number;
  orderCode?: string;
  title?: string;
  showTitle?: boolean;
}

export const PixQrCodeDisplay: React.FC<PixQrCodeDisplayProps> = ({
  pixKey,
  merchantName = 'Restaurante',
  amount,
  orderCode,
  title = 'Pagamento via Pix',
  showTitle = true,
}) => {
  const [copied, setCopied] = useState(false);

  if (!pixKey) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-2">
        <PixIcon className="w-8 h-8 text-amber-600 mx-auto" />
        <h4 className="font-extrabold text-amber-900 text-xs">Chave Pix não cadastrada</h4>
        <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
          Para gerar o QR Code dinâmico com valor, cadastre a Chave Pix da sua loja em <strong>Configurações do Estabelecimento</strong>.
        </p>
      </div>
    );
  }

  const pixPayload = generatePixPayload({
    pixKey,
    merchantName,
    merchantCity: 'BRASIL',
    amount,
    txId: orderCode || 'PEDIDO',
  });

  const handleCopy = () => {
    const textToCopy = pixPayload || pixKey;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm space-y-3 text-center">
      {showTitle && (
        <div className="flex items-center justify-center gap-1.5 text-purple-900 font-extrabold text-xs">
          <PixIcon className="w-4 h-4 text-purple-600" />
          <span>{title}</span>
        </div>
      )}

      {/* Dynamic QR Code */}
      <div className="p-3 bg-white border-2 border-purple-200 rounded-2xl inline-block shadow-inner mx-auto relative group">
        <QRCodeSVG
          value={pixPayload || pixKey}
          size={160}
          bgColor="#FFFFFF"
          fgColor="#0F172A"
          level="M"
          includeMargin={false}
        />
        <div className="mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-600" /> QR Code Dinâmico Oficial
        </div>
      </div>

      {amount !== undefined && amount > 0 && (
        <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-200/80">
          <span className="text-[10px] text-purple-700 uppercase font-bold block">Valor Total do Pagamento:</span>
          <span className="text-lg font-black text-purple-950">
            R$ {amount.toFixed(2).replace('.', ',')}
          </span>
        </div>
      )}

      {/* Pix Key & Copia e Cola */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-200 font-mono text-slate-700 truncate gap-2">
          <span className="truncate font-semibold">{pixKey}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-sans font-bold text-[10px] transition flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" /> Copiado!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> Copiar Pix
              </>
            )}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 font-medium">
          Abra o app do seu banco, escolha Pix &gt; Ler QR Code ou Pix Copia e Cola.
        </p>
      </div>
    </div>
  );
};
