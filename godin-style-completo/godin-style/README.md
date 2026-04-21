# 🛍️ Godin Style — Loja Online com Mercado Pago

Site completo de moda com integração real de pagamentos via Mercado Pago.

---

## 📁 Estrutura do Projeto

```
godin-style/
├── server.js              ← Servidor Node.js principal
├── package.json           ← Dependências
├── .env.example           ← Modelo de configuração (renomeie para .env)
├── .env                   ← Suas credenciais (NÃO envie ao GitHub!)
└── public/
    ├── index.html         ← Loja completa (frontend)
    └── obrigado.html      ← Página pós-pagamento
```

---

## 🚀 Passo a Passo para Colocar no Ar

### 1. Instale o Node.js
Baixe em: https://nodejs.org (versão LTS recomendada)

### 2. Configure suas credenciais do Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Vá em **"Suas aplicações"** → crie ou selecione uma
3. Clique em **"Credenciais de produção"**
4. Copie o **Access Token** (começa com `APP_USR-...`)

Renomeie `.env.example` para `.env` e preencha:

```env
MP_ACCESS_TOKEN=APP_USR-SEU-TOKEN-AQUI
BASE_URL=https://seu-dominio.com
PORT=3000
```

### 3. Instale as dependências e rode localmente

```bash
cd godin-style
npm install
npm start
```

Acesse: http://localhost:3000

---

## ☁️ Hospedagem Gratuita no Render.com (Recomendado)

1. Acesse **render.com** e crie uma conta gratuita
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu GitHub (suba a pasta do projeto)
4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Em **"Environment Variables"** adicione:
   - `MP_ACCESS_TOKEN` = seu token do Mercado Pago
   - `BASE_URL` = a URL que o Render vai te dar (ex: https://godin-style.onrender.com)
   - `NODE_ENV` = production
6. Clique em **"Create Web Service"**
7. Pronto! Seu site estará no ar em ~2 minutos ✅

---

## 🌐 Hospedar no VPS (DigitalOcean, Hostinger, etc.)

```bash
# Instalar Node.js no servidor
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Subir os arquivos via FTP ou git clone
cd /var/www/godin-style
npm install

# Rodar permanente com PM2
npm install -g pm2
pm2 start server.js --name "godin-style"
pm2 save
pm2 startup
```

---

## 💳 Testando Pagamentos (Sandbox)

Para testar sem dinheiro real:
1. Use o token de **TESTE** do Mercado Pago (começa com `TEST-`)
2. Use os cartões de teste: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/your-integrations/test/cards

---

## 🔐 Segurança Implementada

- ✅ Helmet.js (headers de segurança HTTP)
- ✅ Rate limiting (100 req/15min geral, 10 req/min no checkout)
- ✅ CORS configurado
- ✅ SSL via Mercado Pago (pagamento em ambiente seguro)
- ✅ Validação e sanitização de dados no backend
- ✅ Variáveis sensíveis em .env (nunca no código)

---

## 📦 Adicionar Produtos Reais

Edite o array `PRODUCTS` no `public/index.html`:

```javascript
{
  id: 13,
  name: "Nome do Produto",
  brand: "Marca",
  cat: "Masculino", // Masculino | Feminino | Calcados | Acessorios
  price: 199.90,
  oldPrice: 299.90, // null se não tiver
  badge: "Novo",    // "Novo" | "Sale" | null
  img: "👕",        // emoji ou URL de imagem
  rating: 4.8,
  reviews: 45,
  isNew: true
}
```

---

## 📞 Suporte

Dúvidas sobre a integração: https://www.mercadopago.com.br/developers/pt/support
