import React from 'react';
import { useApp } from '../context/AppContext';
import { playAudioSiren } from '../utils/orderAlerts';
import { Smartphone, CheckCircle, AlertTriangle, ChevronRight, Menu, LogOut, UtensilsCrossed, ShoppingBag, Monitor, Coffee, Package, Volume2 } from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { settings, updateSettings, viewMode, setViewMode, activeTab, setActiveTab, orders, currentUser, logoutUser } = useApp();

  const pendingCount = orders.filter((o) => o.status === 'novo' || o.status === 'preparo' || o.status === 'confirmado').length;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 px-3 sm:px-5 py-2 shadow-2xs print:hidden">
      <div className="flex items-center justify-between gap-2 lg:gap-4 max-w-7xl mx-auto">
        
        {/* Left: Mobile Menu Toggle & Brand Title */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition cursor-pointer"
            title="Abrir Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 flex items-center justify-center text-white font-extrabold text-sm shadow-2xs">
              <UtensilsCrossed className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-extrabold text-black text-sm leading-tight flex items-center gap-1.5">
                {settings.name}
              </h1>
              <p className="text-[10px] text-slate-700 font-medium flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Painel Principal
              </p>
            </div>
          </div>
        </div>

        {/* Center: Status, Quick Actions & Shortcuts (Centered & Perfectly Aligned) */}
        <div className="hidden md:flex items-center justify-center gap-1.5 lg:gap-2 flex-1 mx-2">
          {/* Store status toggle */}
          <button
            onClick={() => updateSettings({ isOpen: !settings.isOpen })}
            className={`h-8 px-2.5 lg:px-3 rounded-lg text-xs font-extrabold flex items-center gap-1.5 border transition cursor-pointer shrink-0 ${
              settings.isOpen
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
            }`}
          >
            {settings.isOpen ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">LOJA ABERTA</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span className="truncate">LOJA FECHADA</span>
              </>
            )}
          </button>

          {/* PDV Shortcut */}
          <button
            onClick={() => setActiveTab('pdv')}
            className={`h-8 px-2.5 lg:px-3 rounded-lg text-xs font-extrabold flex items-center gap-1.5 border transition cursor-pointer shrink-0 ${
              activeTab === 'pdv'
                ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                : 'bg-blue-50 text-blue-900 border-blue-200/90 hover:bg-blue-100'
            }`}
            title="Ir para PDV Balcão"
          >
            <Monitor className={`w-3.5 h-3.5 ${activeTab === 'pdv' ? 'text-white' : 'text-blue-600'} shrink-0`} />
            <span>PDV</span>
          </button>

          {/* MESAS Shortcut */}
          <button
            onClick={() => setActiveTab('mesas')}
            className={`h-8 px-2.5 lg:px-3 rounded-lg text-xs font-extrabold flex items-center gap-1.5 border transition cursor-pointer shrink-0 ${
              activeTab === 'mesas'
                ? 'bg-purple-600 text-white border-purple-700 shadow-2xs'
                : 'bg-purple-50 text-purple-900 border-purple-200/90 hover:bg-purple-100'
            }`}
            title="Ir para Controle de Mesas"
          >
            <Coffee className={`w-3.5 h-3.5 ${activeTab === 'mesas' ? 'text-white' : 'text-purple-600'} shrink-0`} />
            <span>MESAS</span>
          </button>

          {/* PRODUTOS Shortcut */}
          <button
            onClick={() => setActiveTab('produtos')}
            className={`h-8 px-2.5 lg:px-3 rounded-lg text-xs font-extrabold flex items-center gap-1.5 border transition cursor-pointer shrink-0 ${
              activeTab === 'produtos'
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                : 'bg-indigo-50 text-indigo-900 border-indigo-200/90 hover:bg-indigo-100'
            }`}
            title="Ir para Gestão de Produtos"
          >
            <Package className={`w-3.5 h-3.5 ${activeTab === 'produtos' ? 'text-white' : 'text-indigo-600'} shrink-0`} />
            <span>PRODUTOS</span>
          </button>

          {/* Novos Pedidos Icon Button */}
          <button
            onClick={() => setActiveTab('pedidos')}
            className={`h-8 px-2.5 lg:px-3 rounded-lg text-xs font-extrabold flex items-center gap-1.5 border transition cursor-pointer relative shrink-0 ${
              activeTab === 'pedidos'
                ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                : 'bg-amber-50 text-amber-900 border-amber-200/90 hover:bg-amber-100'
            }`}
            title="Clique para ir para os Pedidos"
          >
            <div className="relative flex items-center justify-center">
              <ShoppingBag className={`w-3.5 h-3.5 ${activeTab === 'pedidos' ? 'text-white' : 'text-amber-600'}`} />
              {pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[9px] font-extrabold px-1 py-0.2 rounded-full min-w-[15px] leading-none text-center animate-pulse">
                  {pendingCount}
                </span>
              )}
            </div>
            <span className="truncate">PEDIDOS</span>
            {pendingCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeTab === 'pedidos' ? 'bg-white/25 text-white' : 'bg-amber-200 text-amber-900'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Right: Switch View Mode & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Cardápio Digital Link Button */}
          <button
            onClick={() => {
              if (viewMode === 'admin') {
                setViewMode('public');
              } else {
                setViewMode('admin');
              }
            }}
            className={`h-8 px-3 rounded-lg text-xs font-extrabold flex items-center gap-1.5 border transition cursor-pointer shrink-0 ${
              viewMode === 'public'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white border-orange-700 shadow-2xs'
                : 'bg-orange-50 text-orange-900 border-orange-200 hover:bg-orange-100'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-orange-600 group-hover:text-orange-700 shrink-0" />
            <span className="hidden sm:inline">
              {viewMode === 'public' ? 'PAINEL GESTOR' : 'CARDÁPIO'}
            </span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          </button>

          {/* Audio Test Button */}
          <button
            onClick={() => {
              playAudioSiren();
            }}
            className="h-8 px-2.5 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition text-xs font-extrabold flex items-center gap-1 cursor-pointer shrink-0"
            title="Testar Notificação Sonora de Alerta"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden xl:inline text-[11px]">Testar Som</span>
          </button>

          {/* Quick WhatsApp Bot Direct link */}
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`h-8 px-3 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'whatsapp' ? 'ring-2 ring-emerald-500' : ''
            }`}
            title="WhatsApp Interativo"
          >
            <span>💬</span>
            <span className="hidden sm:inline">WHATSAPP</span>
            {pendingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>

          {/* Logged-in User Profile Badge */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
              <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 px-2 py-1 rounded-lg transition border border-slate-200">
                <div className="w-6 h-6 rounded-full bg-orange-100 border border-orange-300 flex items-center justify-center text-xs shrink-0">
                  {currentUser.avatarEmoji || (currentUser.role === 'admin' ? '👑' : '🍽️')}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-[11px] font-extrabold text-black leading-none truncate max-w-[100px]">
                    {currentUser.name.split(' ')[0]}
                  </p>
                  <span className="text-[9px] font-bold text-amber-900 uppercase leading-none block mt-0.5">
                    {currentUser.role === 'admin' ? '👑 Admin' : '🍽️ Garçom'}
                  </span>
                </div>
              </div>

              <button
                onClick={logoutUser}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-200"
                title="Sair / Trocar de Conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};


