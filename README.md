# BAR DO ACANTO - PDV & Cardápio Digital

Sistema completo de gestão de vendas, PDV balcão, controle de mesas e comandas, cardápio digital público em tempo real e integração com mensagens do WhatsApp.

## 🚀 Pré-requisitos

- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn** / **pnpm**
- Chave de API do **Google Gemini AI** (opcional, para recursos de inteligência artificial)

---

## 🛠️ Passo a Passo de Instalação e Execução Local

### 1. Clonar o repositório
```bash
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
cd SEU_REPOSITORIO
```

### 2. Instalar as dependências
```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto copiando o exemplo:

```bash
cp .env.example .env.local
```

Abra o arquivo `.env.local` e insira sua chave da API do Gemini:
```env
GEMINI_API_KEY="SuaChaveAPIAqui"
APP_URL="http://localhost:3000"
```

### 4. Executar o Aplicativo em Modo de Desenvolvimento
```bash
npm run dev
```

Acesse no navegador: **http://localhost:3000**

---

## 📤 Como Enviar para o GitHub

1. Inicialize o repositório Git (caso ainda não esteja inicializado):
```bash
git init
```

2. Adicione todos os arquivos ao controle de versão:
```bash
git add .
```

3. Faça o commit das alterações:
```bash
git commit -m "feat: versão inicial do sistema PDV & Cardápio Digital BAR DO ACANTO"
```

4. Vincule ao seu repositório do GitHub e envie os arquivos:
```bash
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

*(Nota: O arquivo `.gitignore` já está configurado para não subir pastas como `node_modules`, `dist` e arquivos de credenciais como `.env.local`)*
