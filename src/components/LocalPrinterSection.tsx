import React, { useState } from 'react';
import { StoreSettings } from '../types';
import {
  Printer,
  Zap,
  HelpCircle,
  Scissors,
  Volume2,
  Wifi,
  Usb,
  Bluetooth,
  Monitor,
  CheckCircle2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
} from 'lucide-react';

interface LocalPrinterSectionProps {
  form: StoreSettings;
  setForm: React.Dispatch<React.SetStateAction<StoreSettings>>;
}

const POPULAR_PRINTER_MODELS = [
  'POS-80 (Térmica 80mm - Padrão)',
  'Elgin i9 / i7',
  'Bematech MP-4200 TH',
  'Epson TM-T20X / TM-T88',
  'Daruma DR800',
  'Control iD Print iD Touch',
  'POS-58 Mini USB / Bluetooth',
  'Jetway JP-800',
  'Sweda SI-300',
  'Impressora Comum (A4 / Laser)',
  'Outra / Genérica ESC-POS',
];

const POPULAR_LOCATIONS = [
  'Balcão de Atendimento / Caixa',
  'Cozinha / Área de Preparo',
  'Bar / Bebidas',
  'Expedição / Entrega',
  'Salão de Atendimento',
];

export const LocalPrinterSection: React.FC<LocalPrinterSectionProps> = ({ form, setForm }) => {
  const [showKioskGuide, setShowKioskGuide] = useState(false);
  const [copiedKioskCmd, setCopiedKioskCmd] = useState(false);
  const [testPrinting, setTestPrinting] = useState(false);

  const printerName = form.printerName || 'Impressora Balcão / Caixa';
  const printerModel = form.printerModel || 'POS-80 (Térmica 80mm - Padrão)';
  const printerLocation = form.printerLocation || 'Balcão de Atendimento';
  const printerInterface = form.printerInterface || 'padrao_sistema';
  const paperWidth = form.thermalPaperWidth || '80mm';

  const autoOnline = form.autoPrintOnlineOrders !== false;
  const autoPdv = form.autoPrintPdvOrders !== false;
  const autoTables = form.autoPrintTableBills !== false;
  const cutPaper = form.printerCutPaper !== false;
  const beepAlert = form.printerBeepAlert !== false;

  const handleCopyKioskCmd = () => {
    const cmd = `chrome.exe --kiosk --kiosk-printing "http://localhost:3000"`;
    navigator.clipboard.writeText(cmd);
    setCopiedKioskCmd(true);
    setTimeout(() => setCopiedKioskCmd(false), 2500);
  };

  // Trigger Local Test Coupon Print
  const handleTestPrint = () => {
    setTestPrinting(true);

    const testContainer = document.createElement('div');
    testContainer.id = 'thermal-print-portal';
    testContainer.className = 'printable-thermal-slip paper-80mm font-mono text-black';
    testContainer.style.backgroundColor = '#ffffff';
    testContainer.style.color = '#000000';

    const widthMm = paperWidth === '58mm' ? '58mm' : '80mm';
    const widthStyle = paperWidth === '58mm' ? 'max-width: 200px;' : 'max-width: 300px;';

    testContainer.innerHTML = `
      <div style="width: 100%; ${widthStyle} margin: 0 auto; font-family: monospace; font-size: 11px; line-height: 1.3; color: #000000; background: #ffffff;">
        <div style="text-align: center; border-bottom: 1px dashed #000000; padding-bottom: 6px; margin-bottom: 6px;">
          <h2 style="font-size: 14px; font-weight: 900; margin: 0; color: #000000;">${(form.name || 'BAR DO ACANTO').toUpperCase()}</h2>
          <p style="font-size: 9px; margin: 2px 0 0 0; color: #000000;">${form.address || 'São Paulo - SP'}</p>
          <p style="font-size: 9px; margin: 2px 0 0 0; color: #000000;">CNPJ: ${form.cnpj || '12.345.678/0001-90'}</p>
        </div>

        <div style="text-align: center; border-bottom: 1px dashed #000000; padding-bottom: 6px; margin-bottom: 6px;">
          <p style="font-size: 12px; font-weight: 900; margin: 0; color: #000000;">TESTE DE IMPRESSORA LOCAL</p>
          <p style="font-size: 9px; margin: 2px 0 0 0; color: #000000;">DISPOSITIVO REGISTRADO COM SUCESSO</p>
        </div>

        <div style="margin-bottom: 6px; font-size: 10px; color: #000000;">
          <p style="margin: 2px 0;"><strong>DISPOSITIVO:</strong> ${printerName}</p>
          <p style="margin: 2px 0;"><strong>MODELO:</strong> ${printerModel}</p>
          <p style="margin: 2px 0;"><strong>LOCAL:</strong> ${printerLocation}</p>
          <p style="margin: 2px 0;"><strong>CONEXÃO:</strong> ${printerInterface.toUpperCase()}</p>
          <p style="margin: 2px 0;"><strong>LARGURA BOBINA:</strong> ${widthMm}</p>
          <p style="margin: 2px 0;"><strong>DATA/HORA:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        </div>

        <div style="border-top: 1px dashed #000000; border-bottom: 1px dashed #000000; padding: 6px 0; margin-bottom: 6px; color: #000000;">
          <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 10px;">
            <span>RECURSO CONFIGURADO</span>
            <span>STATUS</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 9px; margin-top: 3px;">
            <span>Auto-Impressão Cardápio:</span>
            <span>${autoOnline ? '[ATIVO]' : '[INATIVO]'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 9px; margin-top: 2px;">
            <span>Auto-Impressão PDV/Caixa:</span>
            <span>${autoPdv ? '[ATIVO]' : '[INATIVO]'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 9px; margin-top: 2px;">
            <span>Auto-Impressão Mesas:</span>
            <span>${autoTables ? '[ATIVO]' : '[INATIVO]'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 9px; margin-top: 2px;">
            <span>Corte Automático (Guilhotina):</span>
            <span>${cutPaper ? '[SIM]' : '[NAO]'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 9px; margin-top: 2px;">
            <span>Sinal Sonoro (Bip Impressora):</span>
            <span>${beepAlert ? '[SIM]' : '[NAO]'}</span>
          </div>
        </div>

        <div style="text-align: center; font-size: 9px; margin-top: 8px; border-top: 1px dashed #000000; padding-top: 6px; color: #000000;">
          <p style="margin: 0; font-weight: 800;">*** VIA ÚNICA - 100% PRETO ***</p>
          <p style="margin: 2px 0 0 0;">Configuração de hardware salva com sucesso no sistema.</p>
          <br/>
          <p style="margin: 4px 0 0 0; font-size: 8px;">--------------------------------</p>
          <p style="margin: 2px 0 0 0; font-size: 8px;">[CORTE DO PAPEL AQUI]</p>
        </div>
      </div>
    `;

    document.body.appendChild(testContainer);

    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.error('Erro ao imprimir teste:', err);
      } finally {
        if (testContainer.parentNode) {
          testContainer.parentNode.removeChild(testContainer);
        }
        setTestPrinting(false);
      }
    }, 350);
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-orange-200 p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-orange-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-900">
                Cadastro da Impressora Local & Automação de Impressão
              </h3>
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ativo
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Cadastre sua impressora térmica local para imprimir cupons e pedidos automaticamente no caixa ou na cozinha.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTestPrint}
          disabled={testPrinting}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Printer className="w-4 h-4 text-amber-400" />
          <span>{testPrinting ? 'Enviando...' : 'Testar Impressão Local'}</span>
        </button>
      </div>

      {/* Grid of Registration Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Printer Name */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Monitor className="w-3.5 h-3.5 text-orange-600" />
            Nome da Impressora Local:
          </label>
          <input
            type="text"
            value={form.printerName || ''}
            onChange={(e) => setForm({ ...form, printerName: e.target.value })}
            placeholder="Ex: Impressora Balcão Caixa / Elgin"
            className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:border-orange-500 focus:outline-hidden transition"
          />
          <span className="text-[10px] text-slate-500">Identificação para os operadores e relatórios.</span>
        </div>

        {/* Printer Model Selection */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Printer className="w-3.5 h-3.5 text-orange-600" />
            Marca / Modelo Térmico:
          </label>
          <select
            value={form.printerModel || 'POS-80 (Térmica 80mm - Padrão)'}
            onChange={(e) => setForm({ ...form, printerModel: e.target.value })}
            className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:border-orange-500 focus:outline-hidden transition"
          >
            {POPULAR_PRINTER_MODELS.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-slate-500">Suporta protocolo ESC/POS padrão de mercado.</span>
        </div>

        {/* Printer Location / Sector */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-orange-600" />
            Setor / Localização:
          </label>
          <select
            value={form.printerLocation || 'Balcão de Atendimento'}
            onChange={(e) => setForm({ ...form, printerLocation: e.target.value })}
            className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:border-orange-500 focus:outline-hidden transition"
          >
            {POPULAR_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-slate-500">Onde a impressora física está posicionada.</span>
        </div>

        {/* Connection Type */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Usb className="w-3.5 h-3.5 text-orange-600" />
            Interface / Conexão:
          </label>
          <select
            value={form.printerInterface || 'padrao_sistema'}
            onChange={(e) =>
              setForm({
                ...form,
                printerInterface: e.target.value as 'padrao_sistema' | 'usb' | 'rede' | 'bluetooth',
              })
            }
            className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:border-orange-500 focus:outline-hidden transition"
          >
            <option value="padrao_sistema">Padrão do Sistema (Recomendado)</option>
            <option value="usb">Cabo USB Direto</option>
            <option value="rede">Rede Local Ethernet / Wi-Fi (IP)</option>
            <option value="bluetooth">Bluetooth Portátil</option>
          </select>
          <span className="text-[10px] text-slate-500">Tipo de comunicação com o computador/tablet.</span>
        </div>

        {/* Network IP Address (if connection is network) */}
        {form.printerInterface === 'rede' && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-orange-600" />
              Endereço IP da Impressora:
            </label>
            <input
              type="text"
              value={form.printerIpAddress || ''}
              onChange={(e) => setForm({ ...form, printerIpAddress: e.target.value })}
              placeholder="Ex: 192.168.1.200"
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:border-orange-500 focus:outline-hidden transition"
            />
            <span className="text-[10px] text-slate-500">IP fixo configurado na placa de rede da impressora.</span>
          </div>
        )}

        {/* Paper Width Selection */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-orange-600" />
            Largura da Bobina Térmica:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setForm({ ...form, thermalPaperWidth: '58mm' })}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 border cursor-pointer ${
                (form.thermalPaperWidth || '80mm') === '58mm'
                  ? 'bg-orange-500 text-white border-orange-600 shadow-2xs font-extrabold'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-orange-100/50'
              }`}
            >
              <span>58mm</span>
              <span className={`text-[10px] ${ (form.thermalPaperWidth || '80mm') === '58mm' ? 'text-orange-100' : 'text-slate-400' }`}>Estreita / Mini</span>
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, thermalPaperWidth: '80mm' })}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 border cursor-pointer ${
                (form.thermalPaperWidth || '80mm') === '80mm'
                  ? 'bg-orange-500 text-white border-orange-600 shadow-2xs font-extrabold'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-orange-100/50'
              }`}
            >
              <span>80mm</span>
              <span className={`text-[10px] ${ (form.thermalPaperWidth || '80mm') === '80mm' ? 'text-orange-100' : 'text-slate-400' }`}>Padrão Comercial</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hardware Features Checkboxes */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={cutPaper}
            onChange={(e) => setForm({ ...form, printerCutPaper: e.target.checked })}
            className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300"
          />
          <div>
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-slate-600" /> Acionar Guilhotina (Corte Automático)
            </span>
            <p className="text-[10px] text-slate-500">Corta o papel ao término da impressão do cupom.</p>
          </div>
        </label>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={beepAlert}
            onChange={(e) => setForm({ ...form, printerBeepAlert: e.target.checked })}
            className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300"
          />
          <div>
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-slate-600" /> Bip Sonoro na Impressora
            </span>
            <p className="text-[10px] text-slate-500">Emite sinal sonoro na impressora ao receber novo ticket.</p>
          </div>
        </label>
      </div>

      {/* AUTOMATION TRIGGERS */}
      <div className="p-4 bg-orange-50/70 rounded-2xl border border-orange-200 space-y-3">
        <div className="flex items-center gap-2 text-xs font-extrabold text-orange-950 uppercase tracking-wide">
          <Sparkles className="w-4 h-4 text-orange-600" />
          Regras de Impressão Automática (Gatilhos):
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Rule 1: Online Orders */}
          <div
            onClick={() => setForm({ ...form, autoPrintOnlineOrders: !autoOnline })}
            className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
              autoOnline
                ? 'bg-white border-orange-400 shadow-2xs'
                : 'bg-white/60 border-slate-200 opacity-60 hover:opacity-100'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-extrabold text-slate-900">Cardápio Digital / Delivery</span>
              <input
                type="checkbox"
                checked={autoOnline}
                onChange={() => {}} // handled by parent div
                className="w-4 h-4 rounded text-orange-600 mt-0.5"
              />
            </div>
            <p className="text-[10px] text-slate-600 mt-2">
              Imprime a comanda de produção imediatamente quando novos pedidos chegam do cardápio online.
            </p>
            <span className={`text-[10px] font-black mt-2 inline-block ${autoOnline ? 'text-emerald-700' : 'text-slate-400'}`}>
              {autoOnline ? '⚡ IMPRESSÃO AUTOMÁTICA ATIVA' : '⏸️ DESATIVADO'}
            </span>
          </div>

          {/* Rule 2: PDV Balcão */}
          <div
            onClick={() => setForm({ ...form, autoPrintPdvOrders: !autoPdv })}
            className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
              autoPdv
                ? 'bg-white border-orange-400 shadow-2xs'
                : 'bg-white/60 border-slate-200 opacity-60 hover:opacity-100'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-extrabold text-slate-900">Vendas no PDV / Caixa</span>
              <input
                type="checkbox"
                checked={autoPdv}
                onChange={() => {}} // handled by parent div
                className="w-4 h-4 rounded text-orange-600 mt-0.5"
              />
            </div>
            <p className="text-[10px] text-slate-600 mt-2">
              Imprime o cupom de venda/comprovante na hora em que o operador clica em Finalizar Venda.
            </p>
            <span className={`text-[10px] font-black mt-2 inline-block ${autoPdv ? 'text-emerald-700' : 'text-slate-400'}`}>
              {autoPdv ? '⚡ IMPRESSÃO AUTOMÁTICA ATIVA' : '⏸️ DESATIVADO'}
            </span>
          </div>

          {/* Rule 3: Mesas e Comandas */}
          <div
            onClick={() => setForm({ ...form, autoPrintTableBills: !autoTables })}
            className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
              autoTables
                ? 'bg-white border-orange-400 shadow-2xs'
                : 'bg-white/60 border-slate-200 opacity-60 hover:opacity-100'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-extrabold text-slate-900">Contas de Mesas / Salão</span>
              <input
                type="checkbox"
                checked={autoTables}
                onChange={() => {}} // handled by parent div
                className="w-4 h-4 rounded text-orange-600 mt-0.5"
              />
            </div>
            <p className="text-[10px] text-slate-600 mt-2">
              Imprime o comprovante de pré-conta da mesa de forma instantânea para levar ao cliente.
            </p>
            <span className={`text-[10px] font-black mt-2 inline-block ${autoTables ? 'text-emerald-700' : 'text-slate-400'}`}>
              {autoTables ? '⚡ IMPRESSÃO AUTOMÁTICA ATIVA' : '⏸️ DESATIVADO'}
            </span>
          </div>
        </div>
      </div>

      {/* Kiosk Mode / Silent Printing Instructions */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowKioskGuide(!showKioskGuide)}
          className="w-full p-3 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer"
        >
          <span className="flex items-center gap-2 text-slate-800">
            <HelpCircle className="w-4 h-4 text-orange-600" />
            Como ativar a Impressão 100% Silenciosa (Zero Cliques / Sem Janela do Navegador)?
          </span>
          {showKioskGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showKioskGuide && (
          <div className="p-4 bg-white space-y-3 text-xs text-slate-600 border-t border-slate-200">
            <p>
              Por padrão de segurança, navegadores como Google Chrome e Microsoft Edge mostram a janela de diálogo para escolher a impressora. Para <strong>imprimir direto e silenciosamente na impressora cadastrada</strong>:
            </p>

            <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-[11px]">
              <div className="flex items-center justify-between text-slate-700 font-bold">
                <span>Parâmetro Kiosk Printing para Chrome / Edge:</span>
                <button
                  type="button"
                  onClick={handleCopyKioskCmd}
                  className="px-2 py-1 bg-white hover:bg-slate-100 rounded border border-slate-200 text-xs font-sans font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedKioskCmd ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKioskCmd ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <code className="block bg-slate-900 text-amber-300 p-2 rounded text-[11px] overflow-x-auto">
                --kiosk-printing
              </code>
            </div>

            <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-700">
              <li>
                No Windows, defina a sua impressora térmica cadastrada (ex: <strong>{printerName}</strong>) como a <strong>Impressora Padrão do Windows</strong>.
              </li>
              <li>
                Clique com o botão direito no atalho do <strong>Google Chrome</strong> na área de trabalho e escolha <strong>Propriedades</strong>.
              </li>
              <li>
                No campo <strong>Destino</strong>, adicione ao final: <code className="bg-slate-100 px-1 py-0.5 rounded font-bold text-slate-900">--kiosk-printing</code>
              </li>
              <li>
                Pronto! A partir daí, qualquer impressão automática sairá direto no papel sem abrir nenhuma janela na tela.
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};
