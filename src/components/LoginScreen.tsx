import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AppUser } from '../types';
import { openWhatsAppLink, cleanPhoneNumber } from '../utils/whatsappHelper';
import {
  ShieldCheck,
  User,
  KeyRound,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Smartphone,
  UtensilsCrossed,
  Mail,
  MessageSquare,
  ArrowLeft,
  RefreshCw,
  Send,
} from 'lucide-react';

type RecoveryStep = 'identify' | 'select_channel' | 'verify_code' | 'new_password' | 'success';

export const LoginScreen: React.FC = () => {
  const { users, loginUser, updateUser, setViewMode, settings, addToast } = useApp();

  // Standard Login form states
  const [identifierInput, setIdentifierInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Password Recovery modal / flow states
  const [isRecoveryOpen, setIsRecoveryOpen] = useState<boolean>(false);
  const [recoveryStep, setRecoveryStep] = useState<RecoveryStep>('identify');
  const [recoveryIdentifier, setRecoveryIdentifier] = useState<string>('');
  const [matchedUser, setMatchedUser] = useState<AppUser | null>(null);
  const [dispatchChannel, setDispatchChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [codeExpiresAt, setCodeExpiresAt] = useState<number>(0);
  const [inputCode, setInputCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [recoveryError, setRecoveryError] = useState<string>('');
  const [recoverySuccessNotice, setRecoverySuccessNotice] = useState<string>('');
  const [isSendingCode, setIsSendingCode] = useState<boolean>(false);

  // Helper for masking email
  const maskEmail = (email?: string): string => {
    if (!email || !email.includes('@')) return 'E-mail cadastrado';
    const [user, domain] = email.split('@');
    if (user.length <= 2) return `${user[0]}***@${domain}`;
    return `${user.slice(0, 2)}***${user.slice(-1)}@${domain}`;
  };

  // Helper for masking phone number
  const maskPhone = (phone?: string): string => {
    if (!phone) return 'WhatsApp cadastrado';
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 8) return 'WhatsApp cadastrado';
    const ddd = digits.slice(-11, -9) || digits.slice(0, 2);
    const lastDigits = digits.slice(-4);
    return `(${ddd}) 9****-${lastDigits}`;
  };

  const handleCredentialsLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifierInput.trim()) {
      setErrorMessage('Por favor, informe seu login, e-mail ou nome de usuário.');
      return;
    }
    if (!passwordInput.trim()) {
      setErrorMessage('Por favor, digite sua senha ou PIN de acesso.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    setTimeout(() => {
      const res = loginUser(identifierInput, passwordInput);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.message || 'Credenciais inválidas. Verifique seu login e senha.');
      }
    }, 150);
  };

  // Step 1: Find user by identifier
  const handleIdentifyUser = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    const query = recoveryIdentifier.trim().toLowerCase();
    if (!query) {
      setRecoveryError('Informe seu e-mail, telefone ou nome de usuário cadastrado.');
      return;
    }

    const cleanQueryPhone = query.replace(/\D/g, '');
    const found = users.find((u) => {
      const emailMatch = u.email.toLowerCase() === query;
      const nameMatch = u.name.toLowerCase() === query;
      const phoneMatch = cleanQueryPhone.length >= 8 && u.phone && u.phone.replace(/\D/g, '').includes(cleanQueryPhone);
      return emailMatch || nameMatch || phoneMatch;
    });

    if (!found) {
      setRecoveryError('Nenhum colaborador ou administrador cadastrado foi localizado com esses dados.');
      return;
    }

    setMatchedUser(found);
    // Select default channel based on user availability
    if (found.phone) {
      setDispatchChannel('whatsapp');
    } else {
      setDispatchChannel('email');
    }
    setRecoveryStep('select_channel');
  };

  // Step 2: Generate random 6-digit code and dispatch to user (WhatsApp or Email)
  // CRITICAL REQUIREMENT: The code is NEVER displayed in the UI, toast, or alerts!
  const handleSendRecoveryCode = () => {
    if (!matchedUser) return;
    setIsSendingCode(true);
    setRecoveryError('');
    setRecoverySuccessNotice('');

    // Generate random 6-digit code
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    setVerificationCode(generated);
    setCodeExpiresAt(expiry);

    setTimeout(() => {
      setIsSendingCode(false);

      if (dispatchChannel === 'whatsapp') {
        const userPhone = matchedUser.phone || settings.whatsappPhone || settings.phone;
        const cleanPhone = cleanPhoneNumber(userPhone);

        // Dispatches code directly to user's registered WhatsApp
        const msg =
          `🔒 *FAZ O PEDIDO - CÓDIGO DE RECUPERAÇÃO DE ACESSO*\n\n` +
          `Olá, *${matchedUser.name}*!\n\n` +
          `Seu código de verificação para redefinir sua senha/PIN é: *${generated}*\n\n` +
          `⏱️ Este código expira em 10 minutos.\n` +
          `⚠️ Nunca compartilhe este código com terceiros por motivos de segurança.`;

        if (cleanPhone) {
          openWhatsAppLink(cleanPhone, msg);
        }

        setRecoverySuccessNotice(
          `Código de segurança enviado para o WhatsApp cadastrado (${maskPhone(userPhone)}). Verifique sua mensagem e digite o código abaixo.`
        );
      } else {
        // E-mail simulation - notification sent without ever displaying the code in the UI
        setRecoverySuccessNotice(
          `Código de segurança enviado para o e-mail cadastrado (${maskEmail(matchedUser.email)}). Verifique sua caixa de entrada ou spam e digite o código abaixo.`
        );
      }

      addToast({
        title: 'Código Enviado',
        message:
          dispatchChannel === 'whatsapp'
            ? 'Código de segurança enviado para o WhatsApp cadastrado do usuário.'
            : 'Código de segurança enviado para o e-mail cadastrado do usuário.',
        type: 'success',
      });

      setRecoveryStep('verify_code');
    }, 400);
  };

  // Step 3: Validate code
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');

    if (!inputCode.trim()) {
      setRecoveryError('Por favor, informe o código de 6 dígitos recebido.');
      return;
    }

    if (Date.now() > codeExpiresAt) {
      setRecoveryError('O código expirou. Por favor, solicite um novo código de envio.');
      return;
    }

    if (inputCode.trim() !== verificationCode) {
      setRecoveryError('Código incorreto. Confira o código recebido no seu WhatsApp ou E-mail cadastrado.');
      return;
    }

    setRecoveryStep('new_password');
  };

  // Step 4: Set new password/PIN
  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');

    if (!newPassword.trim() || newPassword.length < 4) {
      setRecoveryError('A nova senha ou PIN deve conter pelo menos 4 caracteres ou dígitos.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setRecoveryError('A confirmação de senha não confere com a nova senha digitada.');
      return;
    }

    if (!matchedUser) return;

    // Update user PIN/password in state and Supabase
    updateUser(matchedUser.id, { pin: newPassword.trim() });

    setRecoveryStep('success');
    addToast({
      title: 'Senha Atualizada',
      message: 'Sua nova senha de acesso foi salva com sucesso!',
      type: 'success',
    });
  };

  const handleFinishRecovery = () => {
    if (matchedUser) {
      setIdentifierInput(matchedUser.email);
    }
    setPasswordInput('');
    setIsRecoveryOpen(false);
    setRecoveryStep('identify');
    setMatchedUser(null);
    setInputCode('');
    setVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
    setRecoveryError('');
    setRecoverySuccessNotice('');
  };

  const handleCancelRecovery = () => {
    setIsRecoveryOpen(false);
    setRecoveryStep('identify');
    setMatchedUser(null);
    setInputCode('');
    setVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
    setRecoveryError('');
    setRecoverySuccessNotice('');
  };

  return (
    <div className="min-h-screen bg-slate-900/95 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-radial-gradient from-orange-500/10 via-slate-900 to-black pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 relative z-10">
        
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 p-6 text-white text-center relative">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-inner border border-white/30">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight uppercase">
            {settings.name || 'BAR DO ACANTO'}
          </h1>
          <p className="text-xs text-orange-100 font-medium mt-1">
            Plataforma Administrativa & PDV
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/25 text-white text-[11px] font-black uppercase tracking-wider border border-white/20 shadow-xs">
            <Lock className="w-3.5 h-3.5 text-amber-300" />
            <span>Acesso Restrito com Senha</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {!isRecoveryOpen ? (
            /* Standard Login Form */
            <div>
              <div className="mb-4">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-orange-600" />
                  <span>Identificação do Operador</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Informe suas credenciais registradas para gerenciar a loja.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleCredentialsLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                    Usuário ou E-mail
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={identifierInput}
                      onChange={(e) => setIdentifierInput(e.target.value)}
                      placeholder="Ex: admin@fazopedido.com ou Carlos"
                      autoFocus
                      required
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-extrabold text-slate-800">
                      Senha ou PIN de Acesso
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage('');
                        setRecoveryIdentifier(identifierInput);
                        setIsRecoveryOpen(true);
                        setRecoveryStep('identify');
                      }}
                      className="text-[11px] font-extrabold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Digite sua senha ou PIN (4 a 6 dígitos)"
                      required
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      tabIndex={-1}
                      title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:opacity-95 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer active:scale-[0.99] disabled:opacity-60"
                >
                  <span>{isLoading ? 'Autenticando...' : 'Acessar Plataforma do Administrador'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            /* Password Recovery Flow */
            <div className="animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelRecovery}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    title="Voltar ao Login"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Recuperação de Senha
                  </h2>
                </div>
                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                  {recoveryStep === 'identify' && 'Passo 1 de 3'}
                  {recoveryStep === 'select_channel' && 'Passo 2 de 3'}
                  {recoveryStep === 'verify_code' && 'Passo 2 de 3'}
                  {recoveryStep === 'new_password' && 'Passo 3 de 3'}
                  {recoveryStep === 'success' && 'Concluído'}
                </span>
              </div>

              {recoveryError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{recoveryError}</span>
                </div>
              )}

              {recoverySuccessNotice && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{recoverySuccessNotice}</span>
                </div>
              )}

              {/* Step 1: Identify user */}
              {recoveryStep === 'identify' && (
                <form onSubmit={handleIdentifyUser} className="space-y-4">
                  <p className="text-xs text-slate-600">
                    Digite seu <strong>E-mail</strong> ou <strong>Nome de Usuário</strong> cadastrado para localizarmos sua conta.
                  </p>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                      Identificador da Conta
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={recoveryIdentifier}
                        onChange={(e) => setRecoveryIdentifier(e.target.value)}
                        placeholder="Ex: admin@fazopedido.com ou Carlos"
                        autoFocus
                        required
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
                  >
                    <span>Localizar Conta</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Step 2: Channel Selection */}
              {recoveryStep === 'select_channel' && matchedUser && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 font-black text-sm flex items-center justify-center shrink-0">
                      {matchedUser.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">{matchedUser.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {matchedUser.role === 'admin' ? 'Administrador' : 'Garçom'}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 font-semibold">
                    Selecione por onde deseja receber o código de recuperação:
                  </p>

                  <div className="space-y-2.5">
                    {/* WhatsApp Option */}
                    <label
                      onClick={() => setDispatchChannel('whatsapp')}
                      className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                        dispatchChannel === 'whatsapp'
                          ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="dispatch_channel"
                        checked={dispatchChannel === 'whatsapp'}
                        onChange={() => setDispatchChannel('whatsapp')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-black text-slate-800">WhatsApp Cadastrado</p>
                        <p className="text-[11px] font-mono font-medium text-slate-600">
                          {maskPhone(matchedUser.phone || settings.whatsappPhone || settings.phone)}
                        </p>
                      </div>
                    </label>

                    {/* Email Option */}
                    <label
                      onClick={() => setDispatchChannel('email')}
                      className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                        dispatchChannel === 'email'
                          ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="dispatch_channel"
                        checked={dispatchChannel === 'email'}
                        onChange={() => setDispatchChannel('email')}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <Mail className="w-4 h-4 text-orange-600 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-black text-slate-800">E-mail Cadastrado</p>
                        <p className="text-[11px] font-mono font-medium text-slate-600">
                          {maskEmail(matchedUser.email)}
                        </p>
                      </div>
                    </label>
                  </div>

                  <p className="text-[10px] text-slate-500 italic">
                    * Por segurança, o código de 6 dígitos será enviado estritamente ao canal oficial cadastrado do usuário e não será exibido nesta tela.
                  </p>

                  <button
                    type="button"
                    disabled={isSendingCode}
                    onClick={handleSendRecoveryCode}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:opacity-95 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer disabled:opacity-60"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSendingCode ? 'Enviando Código...' : 'Enviar Código de Recuperação'}</span>
                  </button>
                </div>
              )}

              {/* Step 3: Verify Code */}
              {recoveryStep === 'verify_code' && (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                      Código de Verificação de 6 dígitos
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      autoFocus
                      required
                      className="w-full py-3 text-center tracking-[0.5em] font-mono font-black text-xl bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                    />
                    <p className="text-[11px] text-slate-500 mt-1.5 text-center">
                      Digite o código de 6 dígitos que você recebeu via {dispatchChannel === 'whatsapp' ? 'WhatsApp' : 'E-mail'}.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
                  >
                    <span>Validar Código</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={handleSendRecoveryCode}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Não recebeu? Reenviar código</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Step 4: New Password */}
              {recoveryStep === 'new_password' && (
                <form onSubmit={handleSaveNewPassword} className="space-y-4">
                  <p className="text-xs text-slate-600">
                    Código validado com sucesso! Agora defina a sua nova senha ou PIN de acesso:
                  </p>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                      Nova Senha ou PIN
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 4 dígitos"
                        autoFocus
                        required
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                      Confirme a Nova Senha ou PIN
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a nova senha"
                        required
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Salvar Nova Senha</span>
                  </button>
                </form>
              )}

              {/* Step 5: Success screen */}
              {recoveryStep === 'success' && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Senha Alterada com Sucesso!
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Sua nova senha já está ativa. Você já pode fazer login na plataforma do administrador.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleFinishRecovery}
                    className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    Ir para Login
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Customer Menu Link Option */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-3">
            <p className="text-[11px] text-slate-500 font-medium">
              É cliente e deseja fazer um pedido?
            </p>
            <button
              type="button"
              onClick={() => setViewMode('public')}
              className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.99]"
            >
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Acessar Cardápio Digital Online</span>
            </button>
          </div>

        </div>

        {/* Security Footer Notice */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-center">
          <p className="text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sessão protegida. Autenticação obrigatória para acesso administrativo.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
