import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AppUser, UserRole } from '../types';
import { Shield, Plus, Phone, Mail, KeyRound, UserCheck, UserX, Trash2, Edit2, X, Check, Coffee, ShieldCheck } from 'lucide-react';

export const UsuariosList: React.FC = () => {
  const { users, currentUser, addUser, updateUser, deleteUser, addToast } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);

  // Form states
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('garcom');
  const [userPin, setUserPin] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userStatus, setUserStatus] = useState<'ativo' | 'inativo'>('ativo');
  const [userEmoji, setUserEmoji] = useState('👨‍🍳');

  const EMOJI_OPTIONS = ['👑', '👨‍🍳', '👩‍🍳', '☕', '🍕', '🍔', '🚀', '🦊', '🦁', '⚡', '🎯', '⭐', '😎', '🍽️', '🌮', '🍩', '🍦', '🍹', '🧑‍💼', '👩‍💼'];

  const openCreateModal = () => {
    setEditingUserId(null);
    setUserName('');
    setUserEmail('');
    setUserRole('garcom');
    setUserPin(Math.floor(1000 + Math.random() * 9000).toString());
    setUserPhone('');
    setUserStatus('ativo');
    setUserEmoji('👨‍🍳');
    setShowModal(true);
  };

  const openEditModal = (u: AppUser) => {
    setEditingUserId(u.id);
    setUserName(u.name);
    setUserEmail(u.email);
    setUserRole(u.role);
    setUserPin(u.pin);
    setUserPhone(u.phone || '');
    setUserStatus(u.status);
    setUserEmoji(u.avatarEmoji || (u.role === 'admin' ? '👑' : '👨‍🍳'));
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim() || !userPin.trim()) {
      addToast({
        title: 'Preencha os campos',
        message: 'Por favor, preencha o nome, e-mail e PIN de acesso.',
        type: 'warning',
      });
      return;
    }

    const selectedEmoji = userEmoji.trim() || (userRole === 'admin' ? '👑' : '👨‍🍳');

    if (editingUserId) {
      updateUser(editingUserId, {
        name: userName.trim(),
        email: userEmail.trim(),
        role: userRole,
        pin: userPin.trim(),
        phone: userPhone.trim(),
        status: userStatus,
        avatarEmoji: selectedEmoji,
      });
    } else {
      addUser({
        name: userName.trim(),
        email: userEmail.trim(),
        role: userRole,
        pin: userPin.trim(),
        phone: userPhone.trim(),
        status: userStatus,
        avatarEmoji: selectedEmoji,
      });
    }

    setShowModal(false);
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-600" /> Gestão de Usuários & Controle de Acesso
            </h2>
            <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 text-[10px] font-extrabold uppercase">
              {users.length} Registrados
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre Administradores e Garçons, configure PINs de acesso e controle permissões do sistema.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="py-2.5 px-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:opacity-95 text-white rounded-xl text-xs font-extrabold shadow-md transition flex items-center gap-1.5 shrink-0 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" /> Novo Usuário (Admin / Garçom)
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => {
          const isUserAdmin = u.role === 'admin';
          const isLogged = currentUser?.id === u.id;

          return (
            <div
              key={u.id}
              className={`bg-white rounded-2xl border p-5 shadow-2xs space-y-4 transition ${
                isLogged
                  ? 'border-orange-400 ring-2 ring-orange-400/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-50 border-2 border-orange-200 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                    {u.avatarEmoji || (isUserAdmin ? '👑' : '🍽️')}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-slate-900 text-sm">{u.name}</h3>
                      {isLogged && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-extrabold">
                          Você
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-400" /> {u.email}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase shrink-0 ${
                    isUserAdmin
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-blue-100 text-blue-900 border border-blue-300'
                  }`}
                >
                  {isUserAdmin ? '👑 Admin' : '🍽️ Garçom'}
                </span>
              </div>

              {/* User Details Box */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span className="flex items-center gap-1 font-medium">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" /> PIN de Acesso:
                  </span>
                  <strong className="font-mono text-sm bg-amber-100 border border-amber-300 px-2 py-0.5 rounded text-amber-900 font-extrabold">
                    {u.pin}
                  </strong>
                </div>

                {u.phone && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> Telefone/WhatsApp:
                    </span>
                    <span className="font-semibold">{u.phone}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-slate-600">
                  <span>Status da Conta:</span>
                  <span
                    className={`font-bold flex items-center gap-1 ${
                      u.status === 'ativo' ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {u.status === 'ativo' ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Ativo
                      </>
                    ) : (
                      <>
                        <UserX className="w-3.5 h-3.5 text-rose-600" /> Inativo
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(u)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Editar
                </button>

                {users.length > 1 && (
                  <button
                    onClick={() => setUserToDelete(u)}
                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer active:scale-95"
                    title="Remover Usuário"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-orange-600" />
                {editingUserId ? 'Editar Usuário' : 'Novo Usuário (Admin / Garçom)'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="ex: João Silva"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">E-mail de Login *</label>
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="ex: joao@fazopedido.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Função / Perfil *</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="garcom">🍽️ Garçom</option>
                    <option value="admin">👑 Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PIN de Acesso (4 dígitos) *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={userPin}
                    onChange={(e) => setUserPin(e.target.value)}
                    placeholder="1234"
                    className="w-full px-3 py-2 bg-amber-50 border border-amber-300 rounded-xl text-xs font-mono font-extrabold text-amber-900 text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Emoji do Avatar *</label>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-full bg-orange-100 border-2 border-orange-400 flex items-center justify-center text-xl shrink-0">
                    {userEmoji || '👑'}
                  </div>
                  <input
                    type="text"
                    maxLength={4}
                    value={userEmoji}
                    onChange={(e) => setUserEmoji(e.target.value)}
                    placeholder="Emoji"
                    className="w-24 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-[11px] text-slate-500">Escolha um emoji abaixo:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl max-h-24 overflow-y-auto">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setUserEmoji(emoji)}
                      className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition border cursor-pointer ${
                        userEmoji === emoji
                          ? 'bg-orange-100 border-orange-500 scale-110 shadow-2xs'
                          : 'bg-white border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  placeholder="ex: 5511999998888"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status da Conta</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUserStatus('ativo')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                      userStatus === 'ativo'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-400 font-extrabold ring-2 ring-emerald-400/20'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-emerald-600" /> Ativo
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserStatus('inativo')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                      userStatus === 'inativo'
                        ? 'bg-rose-50 text-rose-800 border-rose-400 font-extrabold ring-2 ring-rose-400/20'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    <UserX className="w-4 h-4 text-rose-600" /> Inativo
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:opacity-95 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-[0.98]"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingUserId ? 'Salvar Alterações' : 'Cadastrar Usuário'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Confirmar Exclusão</h3>
                <p className="text-xs text-slate-500">Esta ação não poderá ser desfeita.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
              Deseja realmente remover o usuário <strong className="text-slate-900">{userToDelete.name}</strong> ({userToDelete.email})?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteUser(userToDelete.id);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1 active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
