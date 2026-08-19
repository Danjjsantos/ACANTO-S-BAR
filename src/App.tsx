import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardResumo } from './components/DashboardResumo';
import { FaturamentoView } from './components/FaturamentoView';
import { PDVBalcao } from './components/PDVBalcao';
import { MesasComandas } from './components/MesasComandas';
import { PedidosList } from './components/PedidosList';
import { ClientesList } from './components/ClientesList';
import { CardapioManager } from './components/CardapioManager';
import { CardapioDigitalPublico } from './components/CardapioDigitalPublico';
import { WhatsAppSimulator } from './components/WhatsAppSimulator';
import { StoreSettingsModal } from './components/StoreSettingsModal';
import { ReceiptModal } from './components/ReceiptModal';
import { GarconsList } from './components/GarconsList';
import { UsuariosList } from './components/UsuariosList';
import { LoginScreen } from './components/LoginScreen';
import { ToastNotificationContainer } from './components/ToastNotificationContainer';

const MainAppContent: React.FC = () => {
  const { activeTab, viewMode, currentUser } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If viewing public online cardápio view
  if (viewMode === 'public') {
    return (
      <div className="min-h-screen bg-slate-100 font-sans text-slate-800 antialiased flex flex-col">
        <CardapioDigitalPublico />
      </div>
    );
  }

  // If not logged in, render Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 font-sans antialiased relative">
        <ToastNotificationContainer />
        <LoginScreen />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased relative">
      {/* Visual Toast Notifications */}
      <ToastNotificationContainer />

      {/* Top Header */}
      <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

      {/* Main Layout Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar isOpenMobile={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

        {/* Main Workspace Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          {activeTab === 'resumo' && <DashboardResumo />}
          {activeTab === 'faturamento' && <FaturamentoView />}
          {activeTab === 'pedidos' && <PedidosList />}
          {activeTab === 'pdv' && <PDVBalcao />}
          {(activeTab === 'mesas' || activeTab === 'comandas') && <MesasComandas />}
          {activeTab === 'clientes' && <ClientesList />}
          {activeTab === 'garcons' && <GarconsList />}
          {activeTab === 'usuarios' && <UsuariosList />}
          {(activeTab === 'produtos' || activeTab === 'categorias') && <CardapioManager />}
          {activeTab === 'whatsapp' && <WhatsAppSimulator />}
          {activeTab === 'config' && <StoreSettingsModal />}
        </main>
      </div>

      {/* Global Receipt Printable Modal */}
      <ReceiptModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
