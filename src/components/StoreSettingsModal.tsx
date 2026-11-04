import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Store, Save, QrCode as PixIcon, Phone, MapPin, Clock, DollarSign, Image as ImageIcon, Database, Download, Upload, ShieldCheck, RefreshCw, CheckCircle2, ChevronRight, ChevronDown, ChevronUp, ListChecks, MessageCircle, Bot, Sparkles, Globe, Link as LinkIcon, Copy, ExternalLink, Check, Plus, Trash2 } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { PixQrCodeDisplay } from './PixQrCodeDisplay';
import { SupabaseCardSection } from './SupabaseCardSection';
import { LocalPrinterSection } from './LocalPrinterSection';
import { getPublicCardapioUrl, getAdminStoreUrl, openWhatsAppLink } from '../utils/whatsappHelper';
import { DEFAULT_WEEKLY_SCHEDULE, TIMEZONE_OPTIONS, getStoreCurrentTime, formatDayScheduleText } from '../utils/operatingHoursHelper';

export const StoreSettingsModal: React.FC = () => {
  const {
    settings,
    updateSettings,
    lastAutoBackup,
    exportDatabaseJSON,
    importDatabaseJSON,
    performManualBackup,
    setActiveTab,
    setViewMode,
  } = useApp();

  const [form, setForm] = useState(settings);

  useEffect(() => {
    setForm(settings);
  }, [settings]);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedCustomerLink, setCopiedCustomerLink] = useState(false);
  const [copiedAdminLink, setCopiedAdminLink] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const customerUrl = getPublicCardapioUrl(form);
  const adminUrl = getAdminStoreUrl(form);

  const handleCopyCustomerLink = () => {
    navigator.clipboard.writeText(customerUrl);
    setCopiedCustomerLink(true);
    setTimeout(() => setCopiedCustomerLink(false), 2500);
  };

  const handleCopyAdminLink = () => {
    navigator.clipboard.writeText(adminUrl);
    setCopiedAdminLink(true);
    setTimeout(() => setCopiedAdminLink(false), 2500);
  };

  // Interactive Checklist State in Settings
  const [showChecklist, setShowChecklist] = useState(true);
  const [checklist, setChecklist] = useState([
    { id: '1', title: 'Personalizar perfil da loja', done: true, tab: 'config' as const },
    { id: '2', title: 'Cadastrar produtos e categorias', done: true, tab: 'produtos' as const },
    { id: '3', title: 'Configurar horário de atendimento', done: true, tab: 'config' as const },
    { id: '4', title: 'Conectar pagamento (Pix / Cartão)', done: true, tab: 'config' as const },
    { id: '5', title: 'Publicar minha loja e testar Cardápio Digital', done: true, tab: 'cardapio_publico' as const },
    { id: '6', title: 'Configurar taxa de entrega', done: true, tab: 'config' as const },
    { id: '7', title: 'Configurar canal WhatsApp', done: true, tab: 'whatsapp' as const },
    { id: '8', title: 'Cadastrar mesas e QR Code', done: true, tab: 'mesas' as const },
  ]);

  const completedChecklistCount = checklist.filter((item) => item.done).length;
  const progressPercentage = Math.round((completedChecklistCount / checklist.length) * 100);

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        if (window.confirm('Deseja restaurar o banco de dados a partir deste arquivo JSON? Os dados atuais serão substituídos pelos dados do backup.')) {
          importDatabaseJSON(content);
        }
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <h2 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
          <Store className="w-5 h-5 text-purple-600" /> Configurações e Dados da Loja
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Defina o nome do seu estabelecimento, chave Pix, número do WhatsApp, taxa de entrega e horário.
        </p>
      </div>

      {/* Checklist de Configuração Inicial / Pronto para Vender */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-100 rounded-xl border border-orange-200">
              <ListChecks className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight uppercase">
                  Checklist de Configuração (Pronto para Vender)
                </h3>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 font-bold">
                {completedChecklistCount} de {checklist.length} passos concluídos ({progressPercentage}%)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowChecklist(!showChecklist)}
            className="text-xs font-bold text-orange-700 hover:text-orange-800 flex items-center gap-1"
          >
            {showChecklist ? (
              <>
                Ocultar checklist <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Mostrar checklist <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 mb-3 overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>

        {/* List of Checklist Steps */}
        {showChecklist && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            {checklist.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition border border-slate-100 group"
              >
                <div
                  className="flex items-center gap-2.5 cursor-pointer flex-1"
                  onClick={() => toggleChecklistItem(item.id)}
                >
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                      item.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'
                    }`}
                  >
                    {item.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-xs font-medium ${item.done ? 'text-slate-700' : 'text-slate-500'}`}>
                    {item.title}
                  </span>
                </div>
                {item.tab !== 'config' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (item.tab === 'cardapio_publico') {
                        setViewMode('public');
                      } else {
                        setActiveTab(item.tab);
                      }
                    }}
                    className="text-slate-400 group-hover:text-purple-600 p-1 hover:bg-purple-50 rounded-lg transition"
                    title="Acessar atalho"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
        
        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold text-xs">
            ✅ Configurações salvas com sucesso!
          </div>
        )}

        {/* Custom Domain & Online Menu Link Card */}
        <div className="p-4 bg-gradient-to-br from-slate-900 to-purple-950 text-white rounded-2xl shadow-md space-y-4 border border-purple-800/40">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-500/20 rounded-xl border border-purple-400/30 text-purple-300">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <span>Link do Cardápio Online & Domínio Customizado</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Ativo
                  </span>
                </h3>
                <p className="text-[11px] text-purple-200 font-medium">
                  Endereço exclusivo para seus clientes acessarem o cardápio no celular ou computador.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1 flex items-center gap-1">
                <span>Identificador / Slug (ex: acantosbar)</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs text-slate-400 font-mono select-none">https://</span>
                <input
                  type="text"
                  value={form.menuSlug || 'acantosbar'}
                  onChange={(e) => {
                    const slugClean = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                    setForm({ ...form, menuSlug: slugClean });
                  }}
                  className="w-full pl-16 pr-28 py-2 bg-slate-800/90 border border-purple-500/40 rounded-xl text-xs font-mono text-emerald-300 focus:outline-none focus:border-purple-400 font-bold"
                  placeholder="acantosbar"
                />
                <span className="absolute right-3 text-xs text-slate-400 font-mono select-none">.fazopedido.com</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Subdomínio padrão de acesso dos seus clientes</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-200 mb-1">
                Domínio Próprio Customizado (Opcional)
              </label>
              <input
                type="text"
                value={form.customDomain || ''}
                onChange={(e) => setForm({ ...form, customDomain: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800/90 border border-purple-500/40 rounded-xl text-xs font-mono text-amber-300 focus:outline-none focus:border-purple-400 font-bold"
                placeholder="ex: acantosbar.com.br"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Caso possua um domínio registrado (ex: www.acantosbar.com.br)</span>
            </div>
          </div>

          {/* 1. Customer Cardápio Link */}
          <div className="p-3 bg-purple-950/80 rounded-xl border border-purple-500/30 flex flex-col lg:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-hidden w-full lg:w-auto">
              <LinkIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] uppercase text-purple-200 font-extrabold block">📱 1. Link do Cardápio para Clientes (Público):</span>
                <span className="text-xs font-mono font-extrabold text-emerald-300 tracking-wide select-all">
                  {customerUrl}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0">
              <button
                type="button"
                onClick={handleCopyCustomerLink}
                className="flex-1 sm:flex-initial px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                {copiedCustomerLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCustomerLink ? 'Copiado!' : 'Copiar Link'}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('public')}
                className="flex-1 sm:flex-initial px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Testar Cardápio</span>
              </button>

              <button
                type="button"
                onClick={() => window.open(customerUrl, '_blank')}
                className="flex-1 sm:flex-initial px-2.5 py-1.5 bg-purple-900 hover:bg-purple-800 text-purple-200 border border-purple-400/40 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                title="Abrir em Nova Aba"
              >
                <span>Abrir Aba</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 2. Admin Panel Link */}
          <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-700 flex flex-col lg:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-hidden w-full lg:w-auto">
              <LinkIcon className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] uppercase text-slate-300 font-extrabold block">🏪 2. Link do Painel / Gestão da Loja (Admin):</span>
                <span className="text-xs font-mono font-extrabold text-amber-300 tracking-wide select-all">
                  {adminUrl}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0">
              <button
                type="button"
                onClick={handleCopyAdminLink}
                className="flex-1 sm:flex-initial px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer border border-slate-600"
              >
                {copiedAdminLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAdminLink ? 'Copiado!' : 'Copiar Link'}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('admin')}
                className="flex-1 sm:flex-initial px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Testar Painel</span>
              </button>

              <button
                type="button"
                onClick={() => window.open(adminUrl, '_blank')}
                className="flex-1 sm:flex-initial px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                title="Abrir em Nova Aba"
              >
                <span>Abrir Aba</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 p-3 bg-purple-50/80 rounded-2xl border border-purple-200">
            <label className="block text-xs font-extrabold text-purple-900 mb-1 flex items-center gap-1">
              <span>Nome do Estabelecimento / Cardápio *</span>
              <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.2 rounded font-bold">Aparece no topo e WhatsApp</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => {
                const newName = e.target.value;
                const updatedForm = {
                  ...form,
                  name: newName,
                  pixName: (!form.pixName || form.pixName === form.name) ? newName : form.pixName,
                };
                setForm(updatedForm);
                updateSettings(updatedForm);
              }}
              className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-sm font-extrabold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              placeholder="Ex: BAR DO ACANTO"
            />
            <span className="text-[10px] text-purple-700 mt-1 block font-medium">
              Altere aqui o nome principal exibido no cardápio digital, WhatsApp e cabeçalho da loja.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Slogan / Descrição Curta</label>
            <input
              type="text"
              value={form.slogan}
              onChange={(e) => setForm({ ...form, slogan: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">Número do WhatsApp (com DDD) *</label>
              {form.phone && (
                <button
                  type="button"
                  onClick={() => openWhatsAppLink(form.phone, `Olá! Teste de integração do WhatsApp com o restaurante ${form.name || ''}.`)}
                  className="text-[10px] text-emerald-700 hover:text-emerald-800 font-extrabold underline flex items-center gap-1 cursor-pointer"
                  title="Clique para testar o envio de mensagem para este número no WhatsApp"
                >
                  <MessageCircle className="w-3 h-3" /> Testar WhatsApp
                </button>
              )}
            </div>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value, whatsappPhone: e.target.value })}
              placeholder="Ex: (11) 99999-8888"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Taxa Padrão de Entrega (R$)</label>
            <input
              type="number"
              step="0.50"
              value={form.deliveryFeeDefault}
              onChange={(e) => setForm({ ...form, deliveryFeeDefault: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">CNPJ / CPF do Estabelecimento</label>
            <input
              type="text"
              value={form.cnpj}
              onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              placeholder="00.000.000/0001-00"
            />
          </div>
        </div>

        {/* HORÁRIO DE FUNCIONAMENTO (EXACT MODEL FROM REFERENCE SCREENSHOT) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-slate-900 text-base">Horário de Funcionamento</h3>
          </div>

          {/* Fuso Horário da Loja */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Fuso horário da loja</label>
            <select
              value={form.storeTimezone || 'America/Sao_Paulo'}
              onChange={(e) => setForm({ ...form, storeTimezone: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
              <span>Vale pra toda a conta: horário de funcionamento, numeração diária dos pedidos, cupons e promoções.</span>
              <span className="font-bold text-slate-700 shrink-0 ml-2">
                Agora na loja: <span className="text-amber-600 font-mono font-extrabold">{getStoreCurrentTime(form.storeTimezone || 'America/Sao_Paulo').timeStr}</span>
              </span>
            </div>
          </div>

          {/* Weekly Schedule Days List */}
          <div className="space-y-3">
            {(form.weeklySchedule && form.weeklySchedule.length > 0 ? form.weeklySchedule : DEFAULT_WEEKLY_SCHEDULE).map((daySchedule, dayIdx) => {
              const scheduleList = form.weeklySchedule && form.weeklySchedule.length > 0 ? form.weeklySchedule : DEFAULT_WEEKLY_SCHEDULE;

              const toggleDay = () => {
                const updated = scheduleList.map((d, i) => (i === dayIdx ? { ...d, active: !d.active } : d));
                setForm({ ...form, weeklySchedule: updated });
              };

              const updateSlot = (slotIdx: number, field: 'open' | 'close', val: string) => {
                const updated = scheduleList.map((d, i) => {
                  if (i !== dayIdx) return d;
                  const newSlots = d.slots.map((s, si) => (si === slotIdx ? { ...s, [field]: val } : s));
                  return { ...d, slots: newSlots };
                });
                setForm({ ...form, weeklySchedule: updated });
              };

              const addSlot = () => {
                const updated = scheduleList.map((d, i) => {
                  if (i !== dayIdx) return d;
                  return { ...d, slots: [...d.slots, { open: '18:00', close: '23:00' }] };
                });
                setForm({ ...form, weeklySchedule: updated });
              };

              const removeSlot = (slotIdx: number) => {
                const updated = scheduleList.map((d, i) => {
                  if (i !== dayIdx) return d;
                  return { ...d, slots: d.slots.filter((_, si) => si !== slotIdx) };
                });
                setForm({ ...form, weeklySchedule: updated });
              };

              const timeOptions = Array.from({ length: 48 }, (_, i) => {
                const h = String(Math.floor(i / 2)).padStart(2, '0');
                const m = i % 2 === 0 ? '00' : '30';
                return `${h}:${m}`;
              });

              return (
                <div
                  key={daySchedule.dayId}
                  className={`p-4 rounded-2xl border transition ${
                    daySchedule.active
                      ? 'bg-white border-slate-200 shadow-2xs'
                      : 'bg-slate-50/60 border-slate-200/60 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Day Toggle Switch */}
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={daySchedule.active}
                          onChange={toggleDay}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                      <span className={`text-sm font-extrabold ${daySchedule.active ? 'text-slate-900' : 'text-slate-500'}`}>
                        {daySchedule.dayName}
                      </span>
                    </div>

                    {daySchedule.active && (
                      <button
                        type="button"
                        onClick={addSlot}
                        className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar Horário
                      </button>
                    )}
                  </div>

                  {/* Time Slots */}
                  {daySchedule.active && (
                    <div className="mt-3 space-y-2 pl-14">
                      {daySchedule.slots.map((slot, slotIdx) => (
                        <div key={slotIdx} className="flex items-center gap-2">
                          <select
                            value={slot.open}
                            onChange={(e) => updateSlot(slotIdx, 'open', e.target.value)}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          >
                            {timeOptions.map((t) => (
                              <option key={`open-${t}`} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>

                          <span className="text-xs font-bold text-slate-500">às</span>

                          <select
                            value={slot.close}
                            onChange={(e) => updateSlot(slotIdx, 'close', e.target.value)}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          >
                            {timeOptions.map((t) => (
                              <option key={`close-${t}`} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>

                          {daySchedule.slots.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSlot(slotIdx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-rose-50 ml-1"
                              title="Remover horário"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom General Toggles */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            {/* 1. Loja Ativa */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">Loja ativa</h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Desative para parar de receber pedidos temporariamente
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                <input
                  type="checkbox"
                  checked={form.isStoreActive ?? form.isOpen ?? true}
                  onChange={(e) => setForm({ ...form, isStoreActive: e.target.checked, isOpen: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>

            {/* 2. Receber pedidos com a loja fechada */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">Receber pedidos com a loja fechada</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-lg">
                  Fora do horário, o cliente ainda envia o pedido e vê o aviso de que será feito quando a loja abrir. Desative para bloquear pedidos fora do horário.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                <input
                  type="checkbox"
                  checked={form.allowOrdersWhenClosed ?? true}
                  onChange={(e) => setForm({ ...form, allowOrdersWhenClosed: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Endereço Completo</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
          />
        </div>

        {/* WhatsApp Chatbot & Automações */}
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-emerald-950 flex items-center gap-2">
                  <span>Chatbot & Automação WhatsApp</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${form.enableWhatsAppBot ? 'bg-emerald-200 text-emerald-900 border border-emerald-300' : 'bg-slate-200 text-slate-700'}`}>
                    {form.enableWhatsAppBot ? '🟢 Chatbot Ativo' : '🔴 Desativado'}
                  </span>
                </h3>
                <p className="text-[11px] text-emerald-800 font-medium">
                  Atendimento automático de clientes e envio de notificações de status no WhatsApp.
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer select-none self-start sm:self-auto">
              <input
                type="checkbox"
                checked={form.enableWhatsAppBot ?? true}
                onChange={(e) => setForm({ ...form, enableWhatsAppBot: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-2.5 text-xs font-extrabold text-emerald-950">
                {form.enableWhatsAppBot ? 'Habilitado' : 'Desabilitado'}
              </span>
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-emerald-200">
              <div>
                <span className="text-xs font-extrabold text-slate-800 block">Enviar confirmação automática no WhatsApp</span>
                <span className="text-[11px] text-slate-500 font-medium block">Geraリンクs e avisos do WhatsApp ao mudar o status dos pedidos</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.autoSendWhatsApp ?? true}
                  onChange={(e) => setForm({ ...form, autoSendWhatsApp: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:translate-x-full peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-emerald-950 mb-1">👋 Mensagem de Boas-Vindas</label>
                <textarea
                  rows={2}
                  value={form.welcomeWhatsAppMsg || ''}
                  onChange={(e) => setForm({ ...form, welcomeWhatsAppMsg: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-medium text-slate-800"
                  placeholder="Mensagem ao responder opção 1 ou saudações..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-950 mb-1">✅ Mensagem de Pedido Confirmado</label>
                <textarea
                  rows={2}
                  value={form.orderConfirmedMsg || ''}
                  onChange={(e) => setForm({ ...form, orderConfirmedMsg: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-medium text-slate-800"
                  placeholder="Mensagem ao confirmar o pedido..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-950 mb-1">🛵 Mensagem de Pedido Saiu pra Entrega</label>
                <textarea
                  rows={2}
                  value={form.orderDispatchedMsg || ''}
                  onChange={(e) => setForm({ ...form, orderDispatchedMsg: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-medium text-slate-800"
                  placeholder="Mensagem quando o motoboy sai..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-950 mb-1">🛍️ Mensagem de Pedido Pronto no Balcão</label>
                <textarea
                  rows={2}
                  value={form.orderReadyMsg || ''}
                  onChange={(e) => setForm({ ...form, orderReadyMsg: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-medium text-slate-800"
                  placeholder="Mensagem quando o pedido pode ser retirado..."
                />
              </div>
            </div>

            <div className="text-[10px] text-emerald-800 font-semibold bg-emerald-100/60 p-2 rounded-lg border border-emerald-200/80 flex items-center justify-between">
              <span>💡 Tags de substituição disponíveis: <code className="bg-white px-1 font-bold rounded">text-[10px] [NOME]</code>, <code className="bg-white px-1 font-bold rounded">[CODIGO]</code>, <code className="bg-white px-1 font-bold rounded">[VALOR]</code>, <code className="bg-white px-1 font-bold rounded">[LOJA]</code>, <code className="bg-white px-1 font-bold rounded">[MOTOBOY]</code>, <code className="bg-white px-1 font-bold rounded">[PIX]</code></span>
              <button
                type="button"
                onClick={() => setActiveTab('whatsapp')}
                className="text-emerald-900 font-extrabold hover:underline flex items-center gap-1"
              >
                Testar no Simulador <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Dedicated Pix Key & Dynamic QR Code Section */}
        <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-purple-200/80 pb-2">
            <PixIcon className="w-5 h-5 text-purple-700" />
            <div>
              <h3 className="font-extrabold text-sm text-purple-950">Chave Pix & QR Code Dinâmico</h3>
              <p className="text-[11px] text-purple-800 font-medium">
                Cadastre os dados Pix para gerar automaticamente o QR Code com o valor total no Fechamento de Contas e no Cardápio Digital.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <label className="block text-xs font-extrabold text-purple-900 mb-1">Chave Pix *</label>
              <input
                type="text"
                value={form.pixKey}
                onChange={(e) => setForm({ ...form, pixKey: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-xs font-bold text-purple-950 focus:ring-2 focus:ring-purple-500"
                placeholder="CPF, CNPJ, Celular, E-mail ou Chave Aleatória"
              />
              <span className="text-[10px] text-purple-700 mt-1 block">Ex: 12.345.678/0001-90 ou financeiro@loja.com</span>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-purple-900 mb-1">Nome do Recebedor (Titular)</label>
              <input
                type="text"
                value={form.pixName || ''}
                onChange={(e) => setForm({ ...form, pixName: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-xs font-bold text-purple-950"
                placeholder="Ex: Restaurante Silva"
              />
              <span className="text-[10px] text-purple-700 mt-1 block">Nome impresso na conta do recebedor</span>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-purple-900 mb-1">Cidade do Recebedor</label>
              <input
                type="text"
                value={form.pixCity || ''}
                onChange={(e) => setForm({ ...form, pixCity: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-xs font-bold text-purple-950"
                placeholder="Ex: SAO PAULO"
              />
              <span className="text-[10px] text-purple-700 mt-1 block">Sem acentos (Padrão Banco Central)</span>
            </div>
          </div>

          {/* Live QR Code Preview */}
          <div className="pt-2">
            <label className="block text-xs font-extrabold text-purple-950 mb-2">
              Pré-visualização do QR Code Pix Dinâmico (Teste Exemplo R$ 50,00):
            </label>
            <div className="max-w-xs mx-auto">
              <PixQrCodeDisplay
                pixKey={form.pixKey}
                merchantName={form.pixName || form.name}
                amount={50.00}
                orderCode="TESTE-PIX"
                title="Demonstração do QR Code Pix"
              />
            </div>
          </div>
        </div>

        <div>
          <ImageUploader
            value={form.logoUrl}
            onChange={(url) => setForm({ ...form, logoUrl: url })}
            label="Logo / Marca do Estabelecimento (Dispositivo)"
            helperText="Selecione a imagem da logo do seu restaurante no seu celular ou computador."
          />
        </div>

        {/* Local Printer Registration & Print Automation */}
        <LocalPrinterSection form={form} setForm={setForm} />

        {/* Supabase Integration Card Section */}
        <SupabaseCardSection />

        {/* Database Backup & Maintenance Section */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-4 shadow-md border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-600/30 rounded-xl border border-purple-500/30">
                <Database className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <span>Backup & Segurança do Banco de Dados</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    <ShieldCheck className="w-3 h-3" /> Backup Periódico Ativo
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Rotina automática a cada 3 minutos salva todos os pedidos, clientes e produtos.
                </p>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-400 font-mono">
              <span className="block font-bold text-slate-300">Último Backup Automático:</span>
              <span>
                {lastAutoBackup
                  ? new Date(lastAutoBackup).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })
                  : 'Registrado em tempo real'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Export JSON Button */}
            <button
              type="button"
              onClick={exportDatabaseJSON}
              className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              title="Baixar cópia de segurança em formato JSON"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Banco (JSON)</span>
            </button>

            {/* Instant Snapshot Backup Button */}
            <button
              type="button"
              onClick={performManualBackup}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
              title="Forçar salvamento imediato do backup local"
            >
              <RefreshCw className="w-4 h-4 text-purple-400" />
              <span>Fazer Backup Agora</span>
            </button>

            {/* Import / Restore JSON Button */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
                title="Restaurar dados a partir de um arquivo .json"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Restaurar de JSON</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" /> Salvar Alterações
          </button>
        </div>
      </form>

    </div>
  );
};
