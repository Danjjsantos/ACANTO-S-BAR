import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MessageCircle, Send, Bot, CheckCheck, Smartphone, Sparkles, UtensilsCrossed, Power, Save, Check } from 'lucide-react';
import { formatWhatsAppTemplate, getPublicCardapioUrl } from '../utils/whatsappHelper';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
}

export const WhatsAppSimulator: React.FC = () => {
  const { settings, updateSettings, orders } = useApp();

  const isBotEnabled = settings.enableWhatsAppBot ?? true;

  // Local state for template editing in the right panel
  const [templates, setTemplates] = useState({
    welcomeWhatsAppMsg: settings.welcomeWhatsAppMsg || '👋 Olá, [NOME]! Obrigado por escolher a [LOJA]. Recebemos seu pedido [CODIGO] no valor de R$ [VALOR]! Já estamos preparando tudo com muito carinho.',
    orderConfirmedMsg: settings.orderConfirmedMsg || '✅ Ótimas notícias, [NOME]! Seu pedido [CODIGO] foi confirmado e já está na cozinha em fase de preparo.',
    orderDispatchedMsg: settings.orderDispatchedMsg || '🛵 Oba, [NOME]! Seu pedido [CODIGO] acabou de sair para entrega com o nosso motoboy [MOTOBOY]! Previsão de chegada: 15-25 min.',
    orderReadyMsg: settings.orderReadyMsg || '🛍️ Olá, [NOME]! Seu pedido [CODIGO] está pronto para retirada no nosso balcão! Pode vir buscar.',
    pixRequestMsg: settings.pixRequestMsg || '⚡ Para realizar o pagamento do pedido [CODIGO] no valor de R$ [VALOR], utilize nossa chave Pix: [PIX] (Titular: [LOJA]).',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: `👋 *Olá! Bem-vindo ao WhatsApp da ${settings.name}!*\n\nComo posso te ajudar hoje?\n\n1️⃣ *Ver Cardápio Online*\n2️⃣ *Consultar Status do Meu Pedido*\n3️⃣ *Chave Pix para Pagamento*\n4️⃣ *Falar com um Atendente*`,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputMsg, setInputMsg] = useState('');

  const toggleBot = () => {
    const nextState = !isBotEnabled;
    updateSettings({ enableWhatsAppBot: nextState });
  };

  const handleSaveTemplates = () => {
    updateSettings({
      ...templates,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMsg;
    if (!text.trim()) return;

    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      time: now,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputMsg('');

    // Simulate Bot response after 600ms
    setTimeout(() => {
      let botResponse = '';
      const clean = text.trim();

      if (!isBotEnabled) {
        botResponse = `🔴 *[SISTEMA DESATIVADO]* O Chatbot do WhatsApp está pausado no painel do restaurante. Ligue o interruptor do Bot no topo da tela para reativar o atendimento automático!`;
      } else if (clean === '1' || clean.toLowerCase().includes('cardápio') || clean.toLowerCase().includes('cardapio')) {
        const menuUrl = getPublicCardapioUrl(settings);

        botResponse = `🍔 *Cardápio Digital da ${settings.name}:*\n${menuUrl}\n\nAbra o link acima para escolher seus itens e nos enviar o pedido pronto!`;
      } else if (clean === '2' || clean.toLowerCase().includes('status') || clean.toLowerCase().includes('pedido')) {
        const lastOrder = orders[0];
        if (lastOrder) {
          const formattedStatus =
            lastOrder.status === 'pendente'
              ? '🟡 PENDENTE'
              : lastOrder.status === 'preparando'
              ? '👨‍🍳 EM PREPARO'
              : lastOrder.status === 'pronto'
              ? '✅ PRONTO PARA RETIRADA'
              : lastOrder.status === 'entrega'
              ? '🛵 SAIU PARA ENTREGA'
              : '🎉 ENTREGUE';

          botResponse = `🧾 *Status do seu Pedido ${lastOrder.code}:*\nStatus: *${formattedStatus}*\nTotal: R$ ${lastOrder.total.toFixed(2).replace('.', ',')}\n\nPrevisão: 20-30 minutos. Qualquer dúvida nos chame!`;
        } else {
          botResponse = `Não encontramos nenhum pedido ativo vinculado ao seu número no momento. Deseja ver nosso cardápio? Digite 1.`;
        }
      } else if (clean === '3' || clean.toLowerCase().includes('pix') || clean.toLowerCase().includes('pagamento')) {
        const sampleOrder = orders[0] || { code: '#1001', total: 45.0, customer: { name: 'Cliente' } };
        botResponse = formatWhatsAppTemplate(
          templates.pixRequestMsg,
          sampleOrder,
          settings
        );
      } else if (clean === '4' || clean.toLowerCase().includes('atendente') || clean.toLowerCase().includes('humano')) {
        botResponse = `👩‍🍳 Um de nossos atendentes foi notificado e responderá sua mensagem em breve! Agradecemos a preferência.`;
      } else {
        const sampleOrder = orders[0] || { code: '#1001', total: 45.0, customer: { name: 'Cliente' } };
        const welcomeFormatted = formatWhatsAppTemplate(
          templates.welcomeWhatsAppMsg,
          sampleOrder,
          settings
        );
        botResponse = `${welcomeFormatted}\n\n*Opções de atendimento:*\n1️⃣ Ver Cardápio\n2️⃣ Ver Status do Pedido\n3️⃣ Chave Pix\n4️⃣ Falar com Atendente`;
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: botResponse,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => [...prev, botMsg]);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header & Bot Master Control */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${isBotEnabled ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-200 text-slate-500'}`}>
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-slate-900 text-lg">
                Automação & Chatbot WhatsApp
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${isBotEnabled ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'}`}>
                {isBotEnabled ? '🟢 BOT ATIVO' : '🔴 BOT DESATIVADO'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulador interativo das respostas e automações do WhatsApp para seus clientes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 w-full sm:w-auto justify-between sm:justify-start">
          <div className="text-right sm:text-left">
            <span className="text-xs font-extrabold text-slate-800 block">Status do Atendimento Automático:</span>
            <span className="text-[11px] text-slate-500 font-medium">{isBotEnabled ? 'Respondendo clientes 24/7' : 'Atendimento automático pausado'}</span>
          </div>

          <button
            onClick={toggleBot}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 shadow-xs cursor-pointer ${
              isBotEnabled
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{isBotEnabled ? 'Desativar Bot' : 'Ativar Chatbot Agora'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Simulated Phone Interface */}
        <div className="lg:col-span-7 bg-slate-900 rounded-3xl border-4 border-slate-800 p-3 shadow-2xl overflow-hidden flex flex-col h-[560px]">
          
          {/* Phone Top Header */}
          <div className="bg-slate-800 p-3 rounded-2xl flex items-center justify-between text-white mb-2 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-white font-extrabold flex items-center justify-center text-sm shadow-inner">
                <UtensilsCrossed className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xs leading-none">{settings.name}</h3>
                <span className="text-[10px] text-emerald-400 font-medium">bot oficial de atendimento online</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
              <span className={`w-2 h-2 rounded-full ${isBotEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
              {isBotEnabled ? 'Bot Online' : 'Pausado'}
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 bg-[#0b141a] rounded-2xl p-4 overflow-y-auto space-y-3 scrollbar-none">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm relative ${
                    msg.sender === 'user'
                      ? 'bg-[#005c4b] text-slate-100 rounded-tr-none'
                      : 'bg-[#202c33] text-slate-100 rounded-tl-none border border-slate-700/50'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <span className="text-[9px] text-slate-400 float-right mt-1.5 ml-2 flex items-center gap-1">
                    {msg.time} {msg.sender === 'user' && <CheckCheck className="w-3 h-3 text-emerald-400" />}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Option Pills */}
          <div className="py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Atalhos:</span>
            <button
              onClick={() => handleSendMessage('1')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-[11px] rounded-lg transition shrink-0 border border-slate-700"
            >
              1️⃣ Cardápio
            </button>
            <button
              onClick={() => handleSendMessage('2')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-[11px] rounded-lg transition shrink-0 border border-slate-700"
            >
              2️⃣ Status Pedido
            </button>
            <button
              onClick={() => handleSendMessage('3')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-purple-400 font-bold text-[11px] rounded-lg transition shrink-0 border border-slate-700"
            >
              3️⃣ Chave Pix
            </button>
            <button
              onClick={() => handleSendMessage('4')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-[11px] rounded-lg transition shrink-0 border border-slate-700"
            >
              4️⃣ Atendente
            </button>
          </div>

          {/* Chat Input */}
          <div className="pt-2 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Digite como se fosse um cliente testando..."
              className="flex-1 px-3 py-2 bg-[#2a3942] text-white rounded-xl text-xs placeholder-slate-400 focus:outline-none border border-slate-700"
            />
            <button
              onClick={() => handleSendMessage()}
              className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Templates Editor & Quick Placeholders */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" /> Modelos de Mensagem do Bot
            </h3>
            <button
              onClick={handleSaveTemplates}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{savedSuccess ? 'Salvo!' : 'Salvar Modelos'}</span>
            </button>
          </div>

          {savedSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" /> Modelos do WhatsApp atualizados com sucesso!
            </div>
          )}

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                👋 Boas-Vindas & Boas Respostas
              </label>
              <textarea
                rows={3}
                value={templates.welcomeWhatsAppMsg}
                onChange={(e) => setTemplates({ ...templates, welcomeWhatsAppMsg: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                ✅ Pedido Confirmado na Cozinha
              </label>
              <textarea
                rows={2}
                value={templates.orderConfirmedMsg}
                onChange={(e) => setTemplates({ ...templates, orderConfirmedMsg: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                🛵 Saiu para Entrega (Motoboy)
              </label>
              <textarea
                rows={2}
                value={templates.orderDispatchedMsg}
                onChange={(e) => setTemplates({ ...templates, orderDispatchedMsg: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                ⚡ Solicitação de Chave Pix
              </label>
              <textarea
                rows={2}
                value={templates.pixRequestMsg}
                onChange={(e) => setTemplates({ ...templates, pixRequestMsg: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-1 text-[11px] text-purple-900">
              <span className="font-extrabold block">💡 Dica de Tags de Substituição:</span>
              <p className="text-purple-800 leading-relaxed">
                Você pode usar as tags <code className="bg-white px-1 font-bold rounded text-purple-950">[NOME]</code>, <code className="bg-white px-1 font-bold rounded text-purple-950">[CODIGO]</code>, <code className="bg-white px-1 font-bold rounded text-purple-950">[VALOR]</code>, <code className="bg-white px-1 font-bold rounded text-purple-950">[LOJA]</code>, <code className="bg-white px-1 font-bold rounded text-purple-950">[MOTOBOY]</code> e <code className="bg-white px-1 font-bold rounded text-purple-950">[PIX]</code> nos modelos. Elas serão trocadas automaticamente pelos dados do cliente!
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
