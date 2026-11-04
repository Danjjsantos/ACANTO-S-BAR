import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Table, Product, CartItem, PaymentMethod } from '../types';
import { PixQrCodeDisplay } from './PixQrCodeDisplay';
import {
  UtensilsCrossed,
  Plus,
  Users,
  Clock,
  Calculator,
  X,
  CheckCircle,
  ShoppingBag,
  Coffee,
  Trash2,
  Printer,
  DollarSign,
  CreditCard,
  Banknote,
  QrCode as PixIcon,
  Pencil,
} from 'lucide-react';

export const MesasComandas: React.FC = () => {
  const {
    tables,
    addTable,
    deleteTable,
    updateTableStatus,
    updateTable,
    comandas,
    createComanda,
    addItemToComanda,
    closeComanda,
    products,
    waiters,
    settings,
    currentUser,
    addToast,
  } = useApp();

  // Selected Table Modal
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // Edit Table Modal State
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [editTableName, setEditTableName] = useState('');
  const [editTableCapacity, setEditTableCapacity] = useState<number>(4);
  const [editTableWaiter, setEditTableWaiter] = useState('');
  const [editTableCustomer, setEditTableCustomer] = useState('');
  const [editTableStatus, setEditTableStatus] = useState<'livre' | 'ocupada' | 'fechando' | 'reservada'>('livre');

  // Split bill state
  const [splitPeopleCount, setSplitPeopleCount] = useState<number>(2);

  // New Table Modal State (Admin & Garçom)
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState<number>(4);
  const [newTableWaiter, setNewTableWaiter] = useState('');
  const [newTableCustomer, setNewTableCustomer] = useState('');
  const [newTableStatus, setNewTableStatus] = useState<'livre' | 'ocupada'>('livre');

  // Search product inside table modal
  const [addItemSearch, setAddItemSearch] = useState('');
  const [showAddItemModal, setShowAddItemModal] = useState(false);

  // Close Bill Modal State
  const [showCloseBillModal, setShowCloseBillModal] = useState(false);
  const [closingTable, setClosingTable] = useState<Table | null>(null);
  const [closePaymentMethod, setClosePaymentMethod] = useState<PaymentMethod>('pix');
  const [closeIncludeServiceFee, setCloseIncludeServiceFee] = useState(false);

  // Table Delete confirmation
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null);

  // Print Bill Modal
  const [showPrintBillModal, setShowPrintBillModal] = useState(false);
  const [printingTable, setPrintingTable] = useState<Table | null>(null);
  const [includeServiceFee, setIncludeServiceFee] = useState(true);
  const [billPaperWidth, setBillPaperWidth] = useState<'58mm' | '80mm'>(
    settings.thermalPaperWidth || '80mm'
  );

  // Helper to find open comanda for table
  const getComandaForTable = (tableId: number) => {
    return comandas.find((c) => c.tableNumber === tableId && c.status === 'aberta');
  };

  // Add product to active selected table
  const handleAddProductToActive = (product: Product) => {
    if (!selectedTable) return;

    const item: CartItem = {
      id: `ci-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      selectedExtras: [],
      unitTotal: product.price,
    };

    let comanda = getComandaForTable(selectedTable.id);
    if (!comanda) {
      comanda = createComanda(selectedTable.customerName || `Cliente ${selectedTable.name}`, '', selectedTable.id);
    }
    addItemToComanda(comanda.id, item);
    updateTableStatus(selectedTable.id, 'ocupada');

    setShowAddItemModal(false);
  };

  // Open New Table Modal handler
  const handleCreateNewTable = () => {
    try {
      const custName = newTableCustomer.trim();
      const status = custName ? 'ocupada' : newTableStatus;

      addTable({
        name: newTableName.trim() || `Mesa ${(tables.length + 1).toString().padStart(2, '0')}`,
        capacity: newTableCapacity || 4,
        waiterName: newTableWaiter || (currentUser?.role === 'garcom' ? currentUser.name : undefined),
        customerName: custName || undefined,
        status: status,
      });
    } catch (err) {
      console.error('Erro ao criar mesa:', err);
    } finally {
      setShowAddTableModal(false);
      setNewTableName('');
      setNewTableCapacity(4);
      setNewTableWaiter('');
      setNewTableCustomer('');
      setNewTableStatus('livre');
    }
  };

  // Open Edit Table Modal
  const handleOpenEditTable = (tbl: Table, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingTable(tbl);
    setEditTableName(tbl.name);
    setEditTableCapacity(tbl.capacity || 4);
    setEditTableWaiter(tbl.waiterName || '');
    setEditTableCustomer(tbl.customerName || '');
    setEditTableStatus(tbl.status);
  };

  // Save Edit Table
  const handleSaveEditTable = () => {
    if (!editingTable) return;

    updateTable(editingTable.id, {
      name: editTableName,
      capacity: editTableCapacity,
      waiterName: editTableWaiter,
      customerName: editTableCustomer,
      status: editTableStatus,
    });

    // If selectedTable is open in modal, keep it updated
    if (selectedTable && selectedTable.id === editingTable.id) {
      setSelectedTable({
        ...selectedTable,
        name: editTableName.trim() || selectedTable.name,
        capacity: editTableCapacity,
        waiterName: editTableWaiter.trim() || undefined,
        customerName: editTableCustomer.trim() || undefined,
        status: editTableStatus,
      });
    }

    setEditingTable(null);
  };

  // Open Close Bill Modal
  const handleOpenCloseBill = (tbl: Table, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const comanda = getComandaForTable(tbl.id);
    if (!comanda || comanda.items.length === 0) {
      addToast({
        title: 'Mesa Sem Consumo',
        message: 'Não há consumo registrado nesta mesa para fechar a conta.',
        type: 'info',
      });
      return;
    }
    setClosingTable(tbl);
    setShowCloseBillModal(true);
  };

  // Confirm Close Bill handler
  const handleConfirmCloseBill = () => {
    if (!closingTable) return;
    const comanda = getComandaForTable(closingTable.id);
    if (!comanda) return;

    try {
      const subtotal = comanda.total || 0;
      const serviceFee = closeIncludeServiceFee ? subtotal * 0.10 : 0;

      closeComanda(comanda.id, closePaymentMethod, serviceFee);

      addToast({
        title: `Conta Fechada — ${closingTable.name}`,
        message: `Mesa finalizada com sucesso. Pagamento via ${closePaymentMethod.replace('_', ' ').toUpperCase()}.`,
        type: 'success',
        skipSound: true,
      });
    } catch (err) {
      console.error('Erro ao fechar conta:', err);
    } finally {
      setShowCloseBillModal(false);
      setClosingTable(null);
      setSelectedTable(null);
    }
  };

  // Open Print Bill Modal
  const handleOpenPrintBill = (tbl: Table, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPrintingTable(tbl);
    setBillPaperWidth(settings.thermalPaperWidth || '80mm');
    setShowPrintBillModal(true);
    if (settings.autoPrintTableBills !== false) {
      updateTableStatus(tbl.id, 'fechando');
      setTimeout(() => {
        try {
          window.print();
        } catch (err) {
          console.error('Erro na impressão automática da mesa:', err);
        }
      }, 350);
    }
  };

  // Trigger Print Receipt
  const triggerPrintBill = () => {
    if (printingTable) {
      updateTableStatus(printingTable.id, 'fechando');
      addToast({
        title: 'Imprimindo Conta',
        message: `Comprovante da ${printingTable.name} enviado para impressão.`,
        type: 'info',
      });
      window.print();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-purple-600" /> Controle de Mesas do Salão
          </h2>
          <p className="text-xs text-slate-500">
            Gerencie o salão, abra mesas para atendimento, lance itens, imprima e feche a conta solicitando a forma de pagamento.
          </p>
        </div>

        {/* Abrir Nova Mesa button for Admin & Garçom */}
        <button
          onClick={() => {
            setNewTableName(`Mesa ${(tables.length + 1).toString().padStart(2, '0')}`);
            if (currentUser?.role === 'garcom') {
              setNewTableWaiter(currentUser.name);
            }
            setShowAddTableModal(true);
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition shadow-md whitespace-nowrap cursor-pointer shrink-0"
        >
          <Plus className="w-4.5 h-4.5" /> Abrir Nova Mesa
        </button>
      </div>

      {/* MESAS GRID VIEW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {tables.map((tbl) => {
          const openComanda = getComandaForTable(tbl.id);
          const totalSpent = openComanda ? openComanda.total : 0;
          const hasItems = openComanda && openComanda.items.length > 0;

          const statusColors = {
            livre: 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:border-emerald-400',
            ocupada: 'bg-rose-50 border-rose-200 text-rose-800 hover:border-rose-400',
            fechando: 'bg-amber-50 border-amber-200 text-amber-800 hover:border-amber-400',
            reservada: 'bg-blue-50 border-blue-200 text-blue-800 hover:border-blue-400',
          };

          const statusBadges = {
            livre: 'bg-emerald-500 text-white',
            ocupada: 'bg-rose-500 text-white',
            fechando: 'bg-amber-500 text-white',
            reservada: 'bg-blue-500 text-white',
          };

          return (
            <div
              key={tbl.id}
              onClick={() => setSelectedTable(tbl)}
              className={`rounded-2xl border p-4 flex flex-col justify-between transition cursor-pointer shadow-2xs relative overflow-hidden group ${
                statusColors[tbl.status]
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-extrabold text-base text-slate-900 truncate pr-1">{tbl.name}</h3>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                        statusBadges[tbl.status]
                      }`}
                    >
                      {tbl.status}
                    </span>
                    <button
                      onClick={(e) => handleOpenEditTable(tbl, e)}
                      title="Editar identificação ou cliente"
                      className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-100 rounded-lg transition cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {/* Delete mesa button (available anytime for admin) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTableToDelete(tbl);
                      }}
                      title="Excluir mesa"
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-xs font-medium text-slate-600 mb-4">
                  <p className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" /> Cap. {tbl.capacity} pessoas
                  </p>
                  {tbl.openedAt && (
                    <p className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Aberta às {tbl.openedAt}
                    </p>
                  )}
                  {tbl.waiterName && (
                    <p className="flex items-center gap-1.5 text-slate-500">
                      <Coffee className="w-3.5 h-3.5 text-slate-400" /> Garçom: {tbl.waiterName}
                    </p>
                  )}
                  {tbl.customerName ? (
                    <p className="flex items-center gap-1.5 text-slate-700 font-bold truncate">
                      <Users className="w-3.5 h-3.5 text-purple-600" /> {tbl.customerName}
                    </p>
                  ) : (
                    <button
                      onClick={(e) => handleOpenEditTable(tbl, e)}
                      className="text-[11px] text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 hover:underline"
                    >
                      + Adicionar Cliente
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Consumo:</span>
                  <span className="font-extrabold text-sm text-slate-900">
                    R$ {totalSpent.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                {hasItems ? (
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      onClick={(e) => handleOpenPrintBill(tbl, e)}
                      className="py-1.5 px-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-extrabold flex items-center justify-center gap-1 transition shadow-2xs cursor-pointer"
                      title="Imprimir Pré-Conta"
                    >
                      <Printer className="w-3 h-3" /> Conta
                    </button>
                    <button
                      onClick={(e) => handleOpenCloseBill(tbl, e)}
                      className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-extrabold flex items-center justify-center gap-1 transition shadow-2xs cursor-pointer"
                      title="Fechar Conta e Receber"
                    >
                      <DollarSign className="w-3 h-3" /> Fechar
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end pt-1">
                    <span className="text-purple-700 group-hover:translate-x-1 transition font-bold text-xs">
                      Abrir →
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* TABLE DETAIL MODAL */}
      {selectedTable && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  {selectedTable.name}
                  {selectedTable.customerName && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                      👤 {selectedTable.customerName}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500">
                  Capacidade {selectedTable.capacity} pessoas • Status:{' '}
                  <strong className="uppercase">{selectedTable.status}</strong>
                  {selectedTable.waiterName && ` • Garçom: ${selectedTable.waiterName}`}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleOpenEditTable(selectedTable)}
                  className="px-2.5 py-1.5 rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition cursor-pointer flex items-center gap-1 text-xs font-extrabold"
                  title="Editar identificação da mesa ou cliente"
                >
                  <Pencil className="w-3.5 h-3.5 text-purple-600" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => setSelectedTable(null)}
                  className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              
              {/* Quick Actions Bar */}
              {(() => {
                const openComanda = getComandaForTable(selectedTable.id);
                const hasItems = openComanda && openComanda.items.length > 0;

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => setShowAddItemModal(true)}
                      className="p-2.5 bg-purple-600 text-white rounded-xl font-bold text-xs hover:bg-purple-700 transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Lançar Item
                    </button>

                    <button
                      onClick={() => handleOpenEditTable(selectedTable)}
                      className="p-2.5 bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Pencil className="w-4 h-4 text-purple-600" /> Editar Mesa
                    </button>

                    {hasItems && (
                      <>
                        <button
                          onClick={() => handleOpenPrintBill(selectedTable)}
                          className="p-2.5 bg-amber-500 text-white rounded-xl font-bold text-xs hover:bg-amber-600 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Printer className="w-4 h-4" /> Imprimir
                        </button>

                        <button
                          onClick={() => handleOpenCloseBill(selectedTable)}
                          className="p-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs col-span-2 sm:col-span-1"
                        >
                          <DollarSign className="w-4 h-4" /> Fechar Conta
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => {
                        setTableToDelete(selectedTable);
                        setSelectedTable(null);
                      }}
                      className="p-2.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer col-span-2 sm:col-span-2"
                    >
                      <Trash2 className="w-4 h-4" /> Excluir Mesa
                    </button>
                  </div>
                );
              })()}

              {/* Items consumed on this table */}
              {(() => {
                const openComanda = getComandaForTable(selectedTable.id);
                if (!openComanda || openComanda.items.length === 0) {
                  return (
                    <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                      <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs font-medium">Nenhum consumo registrado nesta mesa.</p>
                      <button
                        onClick={() => setShowAddItemModal(true)}
                        className="mt-3 px-3 py-1.5 bg-purple-100 text-purple-700 font-bold text-xs rounded-lg hover:bg-purple-200 transition cursor-pointer"
                      >
                        + Lançar primeiro item
                      </button>
                    </div>
                  );
                }

                const totalBill = openComanda.total;
                const perPersonValue = totalBill / Math.max(1, splitPeopleCount);

                return (
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-slate-800 uppercase">Consumo Lançado:</h4>
                        <button
                          onClick={() => handleOpenPrintBill(selectedTable)}
                          className="text-[11px] font-extrabold text-amber-700 flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" /> Imprimir Pré-Conta
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {openComanda.items.map((it) => (
                          <div
                            key={it.id}
                            className="flex items-center justify-between text-xs p-2 bg-white rounded-xl border border-slate-100"
                          >
                            <span className="font-medium text-slate-800">
                              {it.quantity}x {it.name}
                            </span>
                            <span className="font-extrabold text-slate-900">
                              R$ {(it.unitTotal * it.quantity).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-extrabold text-sm text-slate-900">
                        <span>Total da Mesa:</span>
                        <span className="text-purple-700">R$ {totalBill.toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>

                    {/* Split Bill Calculator */}
                    <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                          <Calculator className="w-4 h-4 text-purple-600" /> Dividir a Conta entre Amigos
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSplitPeopleCount((c) => Math.max(1, c - 1))}
                            className="w-6 h-6 rounded-md bg-white border font-bold text-slate-700 text-xs cursor-pointer hover:bg-slate-100"
                          >
                            -
                          </button>
                          <span className="font-extrabold text-xs text-purple-900 w-6 text-center">
                            {splitPeopleCount}
                          </span>
                          <button
                            onClick={() => setSplitPeopleCount((c) => c + 1)}
                            className="w-6 h-6 rounded-md bg-white border font-bold text-slate-700 text-xs cursor-pointer hover:bg-slate-100"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-purple-800 text-right">
                        Valor por pessoa ({splitPeopleCount}x): <strong>R$ {perPersonValue.toFixed(2).replace('.', ',')}</strong>
                      </p>
                    </div>

                    {/* Main Action to Close Bill */}
                    <button
                      onClick={() => handleOpenCloseBill(selectedTable)}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <DollarSign className="w-4.5 h-4.5" /> FECHAR CONTA DA MESA
                    </button>
                  </div>
                );
              })()}

            </div>
          </div>
        </div>
      )}

      {/* FECHAR CONTA MODAL (SOLICITA FORMA DE PAGAMENTO) */}
      {showCloseBillModal && closingTable && (
        <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-200" />
                <div>
                  <h3 className="font-extrabold text-sm">Fechar Conta - {closingTable.name}</h3>
                  <p className="text-[11px] text-emerald-100 font-medium">Selecione a forma de pagamento do cliente</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCloseBillModal(false);
                  setClosingTable(null);
                }}
                className="p-1 rounded-full hover:bg-emerald-800 text-emerald-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {(() => {
                const comanda = getComandaForTable(closingTable.id);
                if (!comanda) return null;

                const subtotal = comanda.total;
                const serviceFee = closeIncludeServiceFee ? subtotal * 0.10 : 0;
                const grandTotal = subtotal + serviceFee;

                return (
                  <>
                    {/* Consumed Items Summary */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-200 pb-1">
                        <span>Resumo do Consumo</span>
                        <span>{comanda.items.length} {comanda.items.length === 1 ? 'item' : 'itens'}</span>
                      </div>
                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {comanda.items.map((it) => (
                          <div key={it.id} className="flex justify-between text-xs text-slate-700">
                            <span>{it.quantity}x {it.name}</span>
                            <span className="font-semibold">R$ {(it.unitTotal * it.quantity).toFixed(2).replace('.', ',')}</span>
                          </div>
                        ))}
                      </div>

                      {/* Service fee check */}
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-700 flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={closeIncludeServiceFee}
                            onChange={(e) => setCloseIncludeServiceFee(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                          />
                          Taxa de Serviço 10% (+ R$ { (subtotal * 0.10).toFixed(2).replace('.', ',') })
                        </label>
                      </div>

                      {/* Total Box */}
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-base font-extrabold text-slate-900">
                        <span>TOTAL A PAGAR:</span>
                        <span className="text-emerald-700 text-lg">R$ {grandTotal.toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>

                    {/* Mandatory Payment Method Selector */}
                    <div className="space-y-2">
                      <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                        Forma de Pagamento Recebida *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'pix', label: '⚡ Pix', desc: 'Transferência instantânea' },
                          { id: 'cartao_credito', label: '💳 Cartão Crédito', desc: 'Maquininha balcão' },
                          { id: 'cartao_debito', label: '💳 Cartão Débito', desc: 'Maquininha balcão' },
                          { id: 'dinheiro', label: '💵 Dinheiro', desc: 'Pagamento em espécie' },
                          { id: 'pg', label: '📌 PG (A Receber)', desc: 'Pendência a ser quitada' },
                        ].map((pm) => (
                          <button
                            key={pm.id}
                            type="button"
                            onClick={() => setClosePaymentMethod(pm.id as PaymentMethod)}
                            className={`p-3 rounded-xl text-left border transition cursor-pointer flex flex-col ${
                              closePaymentMethod === pm.id
                                ? pm.id === 'pg'
                                  ? 'bg-amber-50 border-amber-600 text-amber-950 ring-2 ring-amber-500/20'
                                  : 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/20'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            } ${pm.id === 'pg' ? 'col-span-2' : ''}`}
                          >
                            <span className="font-extrabold text-xs">{pm.label}</span>
                            <span className="text-[10px] text-slate-500 font-medium">{pm.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Notice for PG payment method */}
                    {closePaymentMethod === 'pg' && (
                      <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-medium space-y-1">
                        <p className="font-extrabold text-amber-950">📌 Conta Registrada como PG (A Receber)</p>
                        <p className="text-[11px] leading-relaxed text-amber-800">
                          Esta conta será salva como pendente (PG) e seu valor não entrará no faturamento positivo do dia até que seja dada a baixa/quitação.
                        </p>
                      </div>
                    )}

                    {/* Dynamic Pix QR Code Box */}
                    {closePaymentMethod === 'pix' && (
                      <div className="animate-in fade-in zoom-in-95 duration-150">
                        <PixQrCodeDisplay
                          pixKey={settings.pixKey}
                          merchantName={settings.pixName || settings.name}
                          amount={grandTotal}
                          orderCode={`MESA-${closingTable.id}`}
                          title={`QR Code Pix - ${closingTable.name}`}
                        />
                      </div>
                    )}

                    {/* Confirm Button */}
                    <button
                      onClick={handleConfirmCloseBill}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition mt-2"
                    >
                      <CheckCircle className="w-5 h-5" /> CONFIRMAR PAGAMENTO E FECHAR CONTA (R$ {grandTotal.toFixed(2).replace('.', ',')})
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ABRIR NOVA MESA MODAL (ADMIN & GARÇOM) */}
      {showAddTableModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                  🍽️
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Abrir Nova Mesa</h3>
                  <p className="text-[11px] text-slate-500">Adicione mesas conforme a demanda do salão</p>
                </div>
              </div>
              <button onClick={() => setShowAddTableModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Identificação / Número da Mesa *</label>
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="Ex: Mesa 05 ou Varanda 01"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Capacidade de Pessoas</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Garçom Responsável</label>
                <select
                  value={newTableWaiter}
                  onChange={(e) => setNewTableWaiter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                >
                  <option value="">Nenhum garçom atribuído</option>
                  {waiters.map((w) => (
                    <option key={w.id} value={w.name}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Cliente (opcional)</label>
                <input
                  type="text"
                  value={newTableCustomer}
                  onChange={(e) => setNewTableCustomer(e.target.value)}
                  placeholder="Ex: Família Santos"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status Inicial da Mesa</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTableStatus('livre')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      newTableStatus === 'livre'
                        ? 'bg-emerald-500 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    🟢 Livre
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTableStatus('ocupada')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      newTableStatus === 'ocupada'
                        ? 'bg-rose-500 text-white border-rose-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    🔴 Ocupada (Em Atendimento)
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddTableModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateNewTable}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Abrir Mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPRIMIR CONTA / COMPROVANTE MODAL */}
      {showPrintBillModal && printingTable && (
        <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs print:p-0 print:bg-transparent print:static print:inset-auto print:block">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95 duration-150 print:shadow-none print:border-none print:max-w-none print:rounded-none print:w-auto">
            
            {/* Modal Actions Header - Hidden on Print */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm">Impressão de Conta da Mesa</h3>
              </div>
              <button
                onClick={() => setShowPrintBillModal(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-300 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Paper Size Quick Selector - Hidden on Print */}
            <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700 print:hidden">
              <span className="text-[11px] font-bold text-slate-700">
                🖨️ Papel Térmico:
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setBillPaperWidth('58mm')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    billPaperWidth === '58mm'
                      ? 'bg-amber-500 text-white shadow-2xs font-extrabold'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  58mm (Pequeno)
                </button>
                <button
                  type="button"
                  onClick={() => setBillPaperWidth('80mm')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    billPaperWidth === '80mm'
                      ? 'bg-amber-500 text-white shadow-2xs font-extrabold'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  80mm (Padrão)
                </button>
              </div>
            </div>

            {/* Printable Bill Preview Area */}
            <div className="p-6 bg-slate-50 font-mono text-xs space-y-4 max-h-[65vh] overflow-y-auto print:p-0 print:bg-transparent print:max-h-none print:overflow-visible print:block">
              {/* Receipt Content Box */}
              <div
                id="printable-bill"
                className={`printable-thermal-slip paper-${billPaperWidth} font-mono bg-white p-4 shadow-none border border-black text-black space-y-3 rounded-none transition-all duration-200 print:border-none print:p-2 mx-auto ${
                  billPaperWidth === '58mm' ? 'w-[260px] text-[10px]' : 'w-[340px] text-xs'
                }`}
              >
                <div className="text-center pb-2 border-b border-dashed border-black space-y-0.5 text-black">
                  <h2 className="font-extrabold text-sm uppercase text-black">{settings.name}</h2>
                  {settings.cnpj && <p className="text-[11px] text-black">CNPJ: {settings.cnpj}</p>}
                  <p className="text-[11px] text-black">{settings.address}</p>
                  <p className="text-[11px] text-black">Tel: {settings.phone}</p>
                  <div className="border-b border-dashed border-black my-1"></div>
                  <p className="font-extrabold text-black text-xs uppercase">
                    *** FECHAMENTO DE CONTA ***
                  </p>
                  <p className="text-[10px] font-extrabold text-black uppercase tracking-wider">
                    [ VIA ÚNICA ]
                  </p>
                  <p className="text-[10px] text-black mt-1">
                    Data: {new Date().toLocaleDateString('pt-BR')} • Hora: {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="text-xs space-y-0.5 py-1 border-b border-dashed border-black font-bold text-black">
                  <p className="text-black uppercase font-black">{printingTable.name.toUpperCase()}</p>
                  {printingTable.waiterName && <p className="text-black font-normal">Garçom: {printingTable.waiterName}</p>}
                  {printingTable.customerName && <p className="text-black font-normal">Cliente: {printingTable.customerName}</p>}
                </div>

                {/* Consumed Items */}
                {(() => {
                  const comanda = getComandaForTable(printingTable.id);
                  if (!comanda || comanda.items.length === 0) {
                    return <p className="text-center py-4 text-black italic font-sans text-xs">Nenhum item lançado para impressão.</p>;
                  }

                  const subtotal = comanda.total;
                  const serviceFee = includeServiceFee ? subtotal * 0.10 : 0;
                  const grandTotal = subtotal + serviceFee;

                  return (
                    <>
                      <div className="space-y-1 py-1 text-black">
                        <div className="flex justify-between font-bold text-[11px] border-b border-black pb-1 text-black uppercase">
                          <span>Qtd / Item</span>
                          <span>Total</span>
                        </div>
                        {comanda.items.map((it) => (
                          <div key={it.id} className="flex justify-between text-[11px] pt-1 text-black">
                            <span>{it.quantity}x {it.name}</span>
                            <span className="font-bold">R$ {(it.unitTotal * it.quantity).toFixed(2).replace('.', ',')}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-dashed border-black space-y-1 font-bold text-xs text-black">
                        <div className="flex justify-between text-black">
                          <span>Subtotal:</span>
                          <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                        </div>
                        {includeServiceFee && (
                          <div className="flex justify-between text-black text-[11px]">
                            <span>Taxa de Serviço (10%):</span>
                            <span>R$ {serviceFee.toFixed(2).replace('.', ',')}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm text-black font-extrabold pt-1 border-t border-black">
                          <span>TOTAL DA CONTA:</span>
                          <span className="text-black">R$ {grandTotal.toFixed(2).replace('.', ',')}</span>
                        </div>
                      </div>

                      <div className="text-center text-[10px] text-black pt-3 border-t border-dashed border-black font-sans font-bold">
                        <p>Obrigado pela preferência e volte sempre!</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Service Fee Toggle - Hidden on Print */}
              <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-sans font-bold text-amber-900 print:hidden">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeServiceFee}
                    onChange={(e) => setIncludeServiceFee(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                  />
                  Incluir 10% da Taxa de Serviço
                </label>
              </div>
            </div>

            {/* Footer buttons - Hidden on Print */}
            <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-2 print:hidden">
              <button
                onClick={() => setShowPrintBillModal(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Fechar
              </button>
              <button
                onClick={triggerPrintBill}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Imprimir Agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD ITEM TO TABLE MODAL */}
      {showAddItemModal && selectedTable && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Lançar Produto - {selectedTable.name}</h3>
              <button
                onClick={() => setShowAddItemModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              value={addItemSearch}
              onChange={(e) => setAddItemSearch(e.target.value)}
              placeholder="Buscar produto pelo nome..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <div className="max-h-60 overflow-y-auto space-y-1.5">
              {products
                .filter((p) => p.name.toLowerCase().includes(addItemSearch.toLowerCase()))
                .map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleAddProductToActive(p)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50 transition cursor-pointer text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900">{p.name}</h4>
                      <span className="text-[10px] text-slate-500">R$ {p.price.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <span className="text-purple-600 font-bold">+ Lançar</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* EDIT TABLE MODAL */}
      {editingTable && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Editar Mesa / Comanda</h3>
                  <p className="text-[11px] text-slate-500">Altere a identificação ou o nome do cliente</p>
                </div>
              </div>
              <button
                onClick={() => setEditingTable(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Identificação / Nome da Mesa *</label>
                <input
                  type="text"
                  value={editTableName}
                  onChange={(e) => setEditTableName(e.target.value)}
                  placeholder="Ex: Mesa 05, Varanda 02 ou Comanda VIP"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Cliente</label>
                <input
                  type="text"
                  value={editTableCustomer}
                  onChange={(e) => setEditTableCustomer(e.target.value)}
                  placeholder="Ex: João da Silva ou Família Santos"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Garçom Responsável</label>
                <select
                  value={editTableWaiter}
                  onChange={(e) => setEditTableWaiter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="">Nenhum garçom atribuído</option>
                  {waiters.map((w) => (
                    <option key={w.id} value={w.name}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Capacidade de Pessoas</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={editTableCapacity}
                  onChange={(e) => setEditTableCapacity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status da Mesa</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditTableStatus('livre')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      editTableStatus === 'livre'
                        ? 'bg-emerald-500 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    🟢 Livre
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTableStatus('ocupada')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      editTableStatus === 'ocupada'
                        ? 'bg-rose-500 text-white border-rose-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    🔴 Ocupada
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTableStatus('fechando')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      editTableStatus === 'fechando'
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    🟡 Fechando
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTableStatus('reservada')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      editTableStatus === 'reservada'
                        ? 'bg-blue-500 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    🔵 Reservada
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  if (editingTable) {
                    setTableToDelete(editingTable);
                    setEditingTable(null);
                  }
                }}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir Mesa
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTable(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditTable}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-2xs"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE TABLE MODAL */}
      {tableToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 font-bold">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Remover {tableToDelete.name}?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  A mesa será excluída permanentemente do mapa do salão.
                  {getComandaForTable(tableToDelete.id)?.items.length ? ' A comanda aberta associada também será encerrada.' : ''}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setTableToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (tableToDelete) {
                    deleteTable(tableToDelete.id);
                    if (selectedTable?.id === tableToDelete.id) {
                      setSelectedTable(null);
                    }
                    setTableToDelete(null);
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

