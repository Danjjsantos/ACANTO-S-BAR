import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AppUser } from '../types';
import { Shield, User, KeyRound, Lock, ArrowRight, CheckCircle2, AlertCircle, Smartphone, UtensilsCrossed } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { users, loginUser, setViewMode, settings } = useApp();
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [pin, setPin] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [loginMode, setLoginMode] = useState<'profiles' | 'email'>('profiles');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleProfileLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setErrorMessage('Selecione um usuário para continuar.');
      return;
    }
    setErrorMessage('');
    const res = loginUser(selectedUser.email, pin);
    if (!res.success) {
      setErrorMessage(res.message || 'PIN incorreto. Tente novamente.');
    }
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setErrorMessage('Informe o e-mail ou nome do usuário.');
      return;
    }
    setErrorMessage('');
    const res = loginUser(emailInput, pinInput);
    if (!res.success) {
      setErrorMessage(res.message || 'Dados inválidos. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header Header Gradient */}
        <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 p-6 text-white text-center relative">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-inner border border-white/30">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">{settings.name || "BAR DO ACANTO"}</h1>
          <p className="text-xs text-orange-100 font-medium mt-1">
            Painel de Gestão e Operações Internas
          </p>
          <div className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/20 text-white text-[10px] font-extrabold uppercase border border-white/20">
            <Lock className="w-3 h-3 text-amber-200" /> Acesso Restrito a Funcionários
          </div>
        </div>

        {/* Tab Selector Mode */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => {
              setLoginMode('profiles');
              setErrorMessage('');
            }}
            className={`flex-1 py-3 text-xs font-bold text-center transition flex items-center justify-center gap-1.5 ${
              loginMode === 'profiles'
                ? 'bg-white text-orange-600 border-b-2 border-orange-500 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" /> Perfis Rápidos (PIN)
          </button>
          <button
            onClick={() => {
              setLoginMode('email');
              setErrorMessage('');
            }}
            className={`flex-1 py-3 text-xs font-bold text-center transition flex items-center justify-center gap-1.5 ${
              loginMode === 'email'
                ? 'bg-white text-orange-600 border-b-2 border-orange-500 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" /> E-mail e Senha
          </button>
        </div>

        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Mode 1: Profile Selector + PIN */}
          {loginMode === 'profiles' ? (
            <form onSubmit={handleProfileLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                  Selecione seu Perfil de Acesso:
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  {users.map((u) => {
                    const isSelected = selectedUser?.id === u.id;
                    const isAdmin = u.role === 'admin';
                    return (
                      <div
                        key={u.id}
                        onClick={() => {
                          setSelectedUser(u);
                          setPin('');
                          setErrorMessage('');
                        }}
                        className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-500/20'
                            : 'bg-white border-slate-200 hover:border-orange-300 hover:bg-orange-50/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-xl shrink-0">
                            {u.avatarEmoji || (isAdmin ? '👑' : '🍽️')}
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-black">{u.name}</p>
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase mt-0.5 ${
                                isAdmin
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-blue-100 text-blue-900 border border-blue-300'
                              }`}
                            >
                              {isAdmin ? '👑 Administrador' : '🍽️ Garçom'}
                            </span>
                          </div>
                        </div>

                        {isSelected && <CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedUser && (
                <div className="pt-2 animate-in fade-in duration-150">
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    PIN de Acesso (4 dígitos) para {selectedUser.name.split(' ')[0]}:
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="••••"
                      autoFocus
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-center font-mono font-extrabold text-base tracking-widest text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedUser}
                className={`w-full py-3 rounded-xl font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 uppercase tracking-wider ${
                  selectedUser
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:opacity-95 text-white cursor-pointer active:scale-[0.99]'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Entrar no Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Mode 2: Traditional Email & Password/PIN */
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  E-mail de Usuário
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="ex: admin@fazopedido.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  PIN ou Senha de Acesso
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Informe seu PIN de 4 dígitos"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:opacity-95 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 uppercase tracking-wider active:scale-[0.99]"
              >
                <span>Acessar Conta</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
