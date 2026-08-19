import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  ExternalLink,
  UploadCloud,
  Check,
  Zap,
  Key,
  Globe,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  isSupabaseConfigured,
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_ANON_KEY,
} from '../lib/supabase';
import { testSupabaseConnection, exportAllDataToSupabase } from '../services/supabaseService';

export const SupabaseCardSection: React.FC = () => {
  const {
    settings,
    categories,
    products,
    tables,
    comandas,
    customers,
    orders,
    users,
    addToast,
  } = useApp();

  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  const [exporting, setExporting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  useEffect(() => {
    const cfg = getSupabaseConfig();
    setUrl(cfg.url || DEFAULT_SUPABASE_URL);
    setAnonKey(cfg.anonKey || DEFAULT_SUPABASE_ANON_KEY);
  }, []);

  const handleSaveConfig = () => {
    saveSupabaseConfig(url, anonKey);
    setIsEditing(false);
    addToast({
      title: 'Configurações Salvas',
      message: 'Credenciais do Supabase foram atualizadas com sucesso.',
      type: 'success',
    });
    handleTestConnection();
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
      if (res.success) {
        addToast({
          title: 'Supabase Conectado',
          message: res.message,
          type: 'success',
        });
      } else {
        addToast({
          title: 'Aviso de Conexão',
          message: res.message,
          type: 'warning',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Falha ao conectar com o Supabase',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleExportAll = async () => {
    setExporting(true);
    try {
      const res = await exportAllDataToSupabase({
        settings,
        categories,
        products,
        tables,
        comandas,
        customers,
        orders,
        users,
      });

      if (res.success) {
        addToast({
          title: 'Sincronização Concluída',
          message: `${res.count} registros enviados para o banco de dados do Supabase!`,
          type: 'success',
        });
      } else {
        addToast({
          title: 'Erro na Sincronização',
          message: res.error || 'Não foi possível exportar os dados.',
          type: 'warning',
        });
      }
    } catch (e: any) {
      addToast({
        title: 'Erro de Exportação',
        message: e?.message || 'Falha inesperada.',
        type: 'warning',
      });
    } finally {
      setExporting(false);
    }
  };

  const sqlSchemaText = `-- BAR DO ACANTO PDV & CARDÁPIO DIGITAL - SUPABASE SCHEMA
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    category_id TEXT,
    image TEXT,
    available BOOLEAN DEFAULT TRUE,
    code TEXT,
    extra_group_ids JSONB DEFAULT '[]'::jsonb,
    custom_extras JSONB DEFAULT '[]'::jsonb,
    removable_items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address JSONB,
    total_spent NUMERIC(10,2) DEFAULT 0.00,
    total_orders INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    customer JSONB,
    table_number INTEGER,
    comanda_number TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10,2) DEFAULT 0.00,
    delivery_fee NUMERIC(10,2) DEFAULT 0.00,
    total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pago',
    notes TEXT,
    waiter_name TEXT,
    delivery_driver_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tables (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    capacity INTEGER DEFAULT 4,
    status TEXT NOT NULL DEFAULT 'livre',
    current_order_ids JSONB DEFAULT '[]'::jsonb,
    opened_at TEXT,
    waiter_name TEXT,
    customer_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comandas (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    table_number INTEGER,
    status TEXT NOT NULL DEFAULT 'aberta',
    items JSONB DEFAULT '[]'::jsonb,
    total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.waiters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'ativo',
    active_tables INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.drivers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'disponivel',
    completed_today INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    data JSONB,
    name TEXT,
    slogan TEXT,
    phone TEXT,
    whatsapp_phone TEXT,
    address TEXT,
    cnpj TEXT,
    pix_key TEXT,
    pix_name TEXT,
    pix_city TEXT,
    delivery_fee_default NUMERIC(10,2) DEFAULT 0.00,
    is_open BOOLEAN DEFAULT TRUE,
    is_store_active BOOLEAN DEFAULT TRUE,
    allow_orders_when_closed BOOLEAN DEFAULT FALSE,
    store_timezone TEXT DEFAULT 'America/Sao_Paulo',
    weekly_schedule JSONB,
    operating_hours TEXT,
    logo_url TEXT,
    auto_send_whatsapp BOOLEAN DEFAULT TRUE,
    enable_whatsapp_bot BOOLEAN DEFAULT FALSE,
    welcome_whatsapp_msg TEXT,
    order_confirmed_msg TEXT,
    order_dispatched_msg TEXT,
    order_ready_msg TEXT,
    pix_request_msg TEXT,
    thermal_paper_width TEXT DEFAULT '80mm',
    menu_slug TEXT,
    custom_domain TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'garcom',
    pin TEXT NOT NULL DEFAULT '1234',
    status TEXT NOT NULL DEFAULT 'ativo',
    phone TEXT,
    avatar_emoji TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Full Access Categories" ON public.categories;
    CREATE POLICY "Public Full Access Categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access Products" ON public.products;
    CREATE POLICY "Public Full Access Products" ON public.products FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access Customers" ON public.customers;
    CREATE POLICY "Public Full Access Customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access Orders" ON public.orders;
    CREATE POLICY "Public Full Access Orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access Tables" ON public.tables;
    CREATE POLICY "Public Full Access Tables" ON public.tables FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access Comandas" ON public.comandas;
    CREATE POLICY "Public Full Access Comandas" ON public.comandas FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access Waiters" ON public.waiters;
    CREATE POLICY "Public Full Access Waiters" ON public.waiters FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access Drivers" ON public.drivers;
    CREATE POLICY "Public Full Access Drivers" ON public.drivers FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access StoreSettings" ON public.store_settings;
    CREATE POLICY "Public Full Access StoreSettings" ON public.store_settings FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Full Access AppUsers" ON public.app_users;
    CREATE POLICY "Public Full Access AppUsers" ON public.app_users FOR ALL USING (true) WITH CHECK (true);
END $$;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchemaText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
    addToast({
      title: 'SQL Copiado!',
      message: 'Script de tabelas copiado para a área de transferência.',
      type: 'success',
    });
  };

  const isConfigured = isSupabaseConfigured();

  return (
    <div className="p-4 bg-emerald-950/40 text-white rounded-2xl space-y-4 shadow-md border border-emerald-800/60">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-600/30 rounded-xl border border-emerald-500/40">
            <Database className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <span>Integração com Supabase (PostgreSQL)</span>
              {isConfigured ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  <Zap className="w-3 h-3 text-emerald-400" /> Configurado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                  <AlertCircle className="w-3 h-3 text-amber-400" /> Pendente
                </span>
              )}
            </h3>
            <p className="text-[11px] text-emerald-200/80 font-medium">
              Sincronização na nuvem em tempo real de produtos, mesas, comandas, clientes e pedidos.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Testando...' : 'Testar Conexão'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportAll}
            disabled={exporting}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <UploadCloud className={`w-3.5 h-3.5 ${exporting ? 'animate-bounce' : ''}`} />
            <span>{exporting ? 'Enviando Dados...' : 'Sincronizar Tudo'}</span>
          </button>
        </div>
      </div>

      {/* Test feedback */}
      {testResult && (
        <div
          className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 border ${
            testResult.success
              ? 'bg-emerald-900/40 border-emerald-500/40 text-emerald-200'
              : 'bg-amber-900/40 border-amber-500/40 text-amber-200'
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span className="flex-1">{testResult.message}</span>
        </div>
      )}

      {/* Connection credentials */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-emerald-200 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>SUPABASE_URL</span>
          </label>
          {isEditing ? (
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://seu-projeto.supabase.co"
              className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-emerald-400"
            />
          ) : (
            <div className="px-3 py-2 bg-slate-900/80 border border-emerald-900 rounded-xl text-xs text-emerald-300 font-mono truncate">
              {url || 'Não configurado'}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-emerald-200 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-emerald-400" />
            <span>SUPABASE_ANON_KEY (Public Publishable Key)</span>
          </label>
          {isEditing ? (
            <input
              type="text"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="sb_publishable_..."
              className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-emerald-400"
            />
          ) : (
            <div className="px-3 py-2 bg-slate-900/80 border border-emerald-900 rounded-xl text-xs text-emerald-300 font-mono truncate">
              {anonKey ? `${anonKey.slice(0, 16)}••••••••••••••••` : 'Não configurada'}
            </div>
          )}
        </div>
      </div>

      {/* Edit Toggle and SQL schema guide button */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-900/60 text-xs">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>Salvar Credenciais</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const cfg = getSupabaseConfig();
                  setUrl(cfg.url || DEFAULT_SUPABASE_URL);
                  setAnonKey(cfg.anonKey || DEFAULT_SUPABASE_ANON_KEY);
                  setIsEditing(false);
                }}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition cursor-pointer"
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-800/80 rounded-lg font-medium transition cursor-pointer"
            >
              Alterar Credenciais
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopySql}
            className="px-2.5 py-1 bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/60 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer text-[11px]"
            title="Copiar Script SQL para colar no SQL Editor do Supabase"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'Copiado!' : 'Copiar SQL das Tabelas'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSqlGuide(!showSqlGuide)}
            className="px-2 py-1 text-emerald-300 hover:text-emerald-100 flex items-center gap-1 cursor-pointer text-[11px] font-medium"
          >
            <span>{showSqlGuide ? 'Ocultar Guia' : 'Como Criar Tabelas'}</span>
            {showSqlGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* SQL Execution Guide Accordion */}
      {showSqlGuide && (
        <div className="p-3 bg-slate-950/80 border border-emerald-800/50 rounded-xl space-y-2 text-xs text-slate-300">
          <h4 className="font-bold text-white flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            <span>Passo a Passo para criar as tabelas no Supabase:</span>
          </h4>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
            <li>Acesse o painel do seu projeto no Supabase (<strong>supabase.com/dashboard</strong>).</li>
            <li>No menu lateral esquerdo, clique em <strong>SQL Editor</strong>.</li>
            <li>Clique em <strong>New Query</strong> (+).</li>
            <li>Clique no botão acima <strong>"Copiar SQL das Tabelas"</strong> e cole no editor.</li>
            <li>Clique no botão verde <strong>"Run"</strong> para executar e criar a estrutura completa.</li>
          </ol>
        </div>
      )}
    </div>
  );
};
