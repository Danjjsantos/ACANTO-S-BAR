import React from 'react';
import { useApp, NavigationTab } from '../context/AppContext';
import {
  LayoutDashboard,
  ClipboardList,
  Monitor,
  Calendar,
  Users,
  Coffee,
  Truck,
  Package,
  Tag,
  Boxes,
  PlusCircle,
  QrCode,
  MessageCircle,
  Store,
  HelpCircle,
  X,
  ExternalLink,
  UtensilsCrossed,
  ShieldCheck,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile, onCloseMobile }) => {
  const { activeTab, setActiveTab, setViewMode, orders, currentUser, settings } = useApp();

  const pendingOrdersCount = orders.filter((o) => o.status === 'novo' || o.status === 'preparo').length;

  const handleNavClick = (tab: NavigationTab) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  const navSection = (title: string, items: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: number }[]) => (
    <div className="mb-4">
      <p className="px-2.5 text-[10px] font-extrabold text-orange-950 tracking-wider uppercase mb-1">{title}</p>
      <div className="space-y-0.5">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-2xs'
                  : 'text-black hover:text-orange-950 hover:bg-orange-50/80'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={isActive ? 'text-white' : 'text-orange-600'}>{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`px-1.5 py-0.2 text-[10px] font-bold rounded-md ${
                    isActive ? 'bg-white text-orange-700' : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between py-4 px-3 overflow-y-auto">
      <div>
        {/* Header Branding */}
        <div className="flex items-center justify-between px-2 pb-4 mb-2 border-b border-orange-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 text-white flex items-center justify-center font-extrabold text-base shadow-xs">
              <UtensilsCrossed className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-orange-700 text-sm leading-none uppercase tracking-tight">{settings?.name || "BAR DO ACANTO"}</h2>
              <span className="text-[10px] text-black font-semibold">PDV & Gestão 360°</span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1 text-slate-500 hover:text-black rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MENU PRINCIPAL */}
        {navSection('MENU PRINCIPAL', [
          { id: 'resumo', label: 'Resumo', icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: 'faturamento', label: 'Faturamento & Vendas', icon: <DollarSign className="w-4 h-4" /> },
        ])}

        {/* PEDIDOS */}
        {navSection('PEDIDOS', [
          { id: 'pedidos', label: 'Pedidos Em Andamento', icon: <ClipboardList className="w-4 h-4" />, badge: pendingOrdersCount },
          { id: 'pdv', label: 'PDV (Balcão)', icon: <Monitor className="w-4 h-4" /> },
          { id: 'mesas', label: 'Controle de Mesas', icon: <UtensilsCrossed className="w-4 h-4" /> },
        ])}

        {/* CLIENTES & EQUIPE */}
        {navSection('CLIENTES & EQUIPE', [
          { id: 'usuarios', label: 'Usuários & Senhas', icon: <ShieldCheck className="w-4 h-4" /> },
          { id: 'clientes', label: 'Clientes', icon: <Users className="w-4 h-4" /> },
          { id: 'garcons', label: 'Garçons', icon: <Coffee className="w-4 h-4" /> },
        ])}

        {/* CARDÁPIO */}
        {navSection('CARDÁPIO', [
          { id: 'produtos', label: 'Produtos', icon: <Package className="w-4 h-4" /> },
          { id: 'categorias', label: 'Categorias', icon: <Tag className="w-4 h-4" /> },
        ])}

        {/* WHATSAPP & AUTOMAÇÕES */}
        {navSection('WHATSAPP', [
          { id: 'whatsapp', label: 'Bot & Interação WhatsApp', icon: <MessageCircle className="w-4 h-4" /> },
        ])}

        {/* CONFIGURAÇÕES */}
        {navSection('CONFIGURAÇÕES', [
          { id: 'config', label: 'Dados da Loja', icon: <Store className="w-4 h-4" /> },
        ])}
      </div>

      {/* Footer Banner - Online Menu Preview */}
      <div className="pt-3 border-t border-orange-200">
        <button
          onClick={() => {
            setViewMode('public');
            onCloseMobile();
          }}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-xs hover:opacity-95 transition text-left"
        >
          <div>
            <div className="flex items-center gap-1.5 font-extrabold text-xs">
              <QrCode className="w-4 h-4 text-amber-200" /> Cardápio Online
            </div>
            <p className="text-[10px] text-orange-100 mt-0.5 font-medium">Abrir visão do cliente</p>
          </div>
          <ExternalLink className="w-4 h-4 text-amber-200" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:block w-64 bg-white border-r border-slate-200 shrink-0 min-h-[calc(100vh-57px)] print:hidden">
        {sidebarContent}
      </aside>

      {/* Mobile drawer backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs transition-opacity print:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile drawer content */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-72 bg-white z-50 lg:hidden shadow-2xl transition-transform duration-300 ease-in-out print:hidden ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
