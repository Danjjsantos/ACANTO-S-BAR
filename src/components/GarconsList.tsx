import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Waiter } from '../types';
import { Coffee, Plus, Phone, Trash2, X, AlertTriangle } from 'lucide-react';

export const GarconsList: React.FC = () => {
  const { waiters, addWaiter, deleteWaiter, currentUser } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [waiterToDelete, setWaiterToDelete] = useState<Waiter | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleCreateWaiter = () => {
    if (!name.trim()) return;
    addWaiter({
      name: name.trim(),
      phone: phone.trim() || '5511999990000',
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
            <Coffee className="w-5 h-5 text-purple-600" /> Equipe de Garçons do Salão
          </h2>
          <p className="text-xs text-slate-500">
            Cadastre garçons, monitore o atendimento nas mesas e gerencie a equipe.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition shadow-2xs whitespace-nowrap cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Novo Garçom
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {waiters.map((w) => (
          <div key={w.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 relative group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-extrabold flex items-center justify-center text-sm">
                  {w.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{w.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {w.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                  {w.status}
                </span>
                
                <button
                  onClick={() => setWaiterToDelete(w)}
                  title="Remover Garçom"
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between font-medium">
              <span>Mesas em Atendimento:</span>
              <strong className="text-purple-700 font-bold">{w.activeTables} mesas</strong>
            </div>
          </div>
        ))}
      </div>

      {/* NEW WAITER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Cadastrar Novo Garçom</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Garçom *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Gabriel Santos"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: 5511988887777"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
                onClick={handleCreateWaiter}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Salvar Garçom
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE WAITER CONFIRMATION MODAL */}
      {waiterToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Remover Garçom?</h3>
                <p className="text-xs text-slate-500">
                  Deseja remover <strong>{waiterToDelete.name}</strong> da equipe?
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setWaiterToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteWaiter(waiterToDelete.id);
                  setWaiterToDelete(null);
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
