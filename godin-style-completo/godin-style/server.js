require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── SEGURANÇA ───────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://sdk.mercadopago.com", "https://www.mercadopago.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://http2.mlstatic.com"],
      connectSrc: ["'self'", "https://api.mercadopago.com"],
      frameSrc: ["https://www.mercadopago.com", "https://sdk.mercadopago.com"],
    },
  },
}));

app.use(cors({
  origin: process.env.BASE_URL || '*',
  methods: ['GET', 'POST'],
}));

// Rate limiting — proteção contra ataques
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' }
});
const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10,
  message: { error: 'Muitas tentativas de checkout.' }
});

app.use(limiter);
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── MERCADO PAGO ─────────────────────────────────────────────
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
  options: { timeout: 5000 }
});
const preference = new Preference(mpClient);
const payment = new Payment(mpClient);

// ─── ROTAS ────────────────────────────────────────────────────

// Página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Criar preferência de pagamento (Checkout Pro)
app.post('/api/criar-preferencia', checkoutLimiter, async (req, res) => {
  try {
    const { items, payer, external_reference } = req.body;

    // Validação básica
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Carrinho inválido.' });
    }

    // Sanitiza itens
    const itensSanitizados = items.map(item => ({
      id: String(item.id).substring(0, 50),
      title: String(item.name).substring(0, 256),
      quantity: Math.max(1, Math.min(99, parseInt(item.qty) || 1)),
      unit_price: parseFloat(item.price),
      currency_id: 'BRL',
    }));

    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;

    const body = {
      items: itensSanitizados,
      payer: payer ? {
        name: String(payer.name || '').substring(0, 256),
        email: String(payer.email || '').substring(0, 256),
        identification: payer.cpf ? {
          type: 'CPF',
          number: String(payer.cpf).replace(/\D/g, '')
        } : undefined
      } : undefined,
      back_urls: {
        success: `${baseUrl}/obrigado?status=aprovado`,
        failure: `${baseUrl}/obrigado?status=falhou`,
        pending: `${baseUrl}/obrigado?status=pendente`,
      },
      auto_return: 'approved',
      external_reference: external_reference || uuidv4(),
      notification_url: `${baseUrl}/api/webhook`,
      statement_descriptor: 'GODIN STYLE',
      payment_methods: {
        installments: 12,
        excluded_payment_types: []
      },
      metadata: {
        loja: 'Godin Style',
        timestamp: new Date().toISOString()
      }
    };

    const result = await preference.create({ body });

    res.json({
      preference_id: result.id,
      init_point: result.init_point,        // produção
      sandbox_init_point: result.sandbox_init_point // testes
    });

  } catch (err) {
    console.error('Erro ao criar preferência:', err);
    res.status(500).json({ error: 'Erro ao processar pagamento. Tente novamente.' });
  }
});

// Webhook — Mercado Pago notifica quando pagamento muda de status
app.post('/api/webhook', express.json(), async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'payment' && data?.id) {
      const pag = await payment.get({ id: data.id });
      const status = pag.status;
      const ref = pag.external_reference;

      console.log(`[WEBHOOK] Pagamento ${data.id} | Status: ${status} | Ref: ${ref}`);

      // Aqui você integra com banco de dados para atualizar o pedido
      // Ex: await atualizarPedido(ref, status);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Erro no webhook:', err);
    res.sendStatus(200); // sempre 200 para o MP não retentar
  }
});

// Página de retorno após pagamento
app.get('/obrigado', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'obrigado.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', loja: 'Godin Style', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── START ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Godin Style rodando em http://localhost:${PORT}`);
  console.log(`📦 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 MP Token: ${process.env.MP_ACCESS_TOKEN ? '✅ Configurado' : '❌ Faltando!'}\n`);
});
