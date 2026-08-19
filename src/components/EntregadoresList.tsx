import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DeliveryDriver } from '../types';
import { Truck, Plus, Phone, Trash2, X, AlertTriangle } from 'lucide-react';

export const EntregadoresList: React.FC = () => {
  const { drivers, addDriver, deleteDriver } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<DeliveryDriver | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleCreateDriver = () => {
    if (!name.trim()) return;
    addDriver({
      name: name.trim(),
      phone: phone.trim() || '5511988880000',
    });
    setName('');
    setPhone('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" /> Entregadores & Motoboys
          </h2>
          <p className="text-xs text-slate-500">
            Cadastre entregadores, acompanhe rotas e gerencie entregas do delivery.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition shadow-2xs whitespace-nowrap cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Novo Entregador
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drivers.map((d) => (
          <div key={d.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 relative group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-sm">
                  {d.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{d.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {d.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    d.status === 'em_rota' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {d.status === 'em_rota' ? 'Em Rota' : 'Disponível'}
                </span>

                <button
                  onClick={() => setDriverToDelete(d)}
                  title="Remover Entregador"
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between font-medium">
              <span>Entregas Concluídas Hoje:</span>
              <strong className="text-blue-700 font-bold">{d.completedToday} entregas</strong>
            </div>
          </div>
        ))}
      </div>

      {/* NEW DRIVER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Cadastrar Novo Entregador</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Entregador *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Roberto Motoboy"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: 5511977776666"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateDriver}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Salvar Entregador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE DRIVER CONFIRMATION MODAL */}
      {driverToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Remover Entregador?</h3>
                <p className="text-xs text-slate-500">
                  Deseja remover <strong>{driverToDelete.name}</strong> da equipe?
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDriverToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteDriver(driverToDelete.id);
                  setDriverToDelete(null);
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
