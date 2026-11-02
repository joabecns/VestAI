// ===== VESTE AI — script.js =====

// --- 1. Pílulas do Guarda-Roupa ---
const chatInput = document.getElementById('chat-input');
const pills = document.querySelectorAll('.pill');

pills.forEach(pill => {
  pill.addEventListener('click', () => {
    pill.classList.toggle('active');
    updateInput();
  });
});

function updateInput() {
  const pecas = [...document.querySelectorAll('.pill:not(.occasion).active')].map(p => p.dataset.text);
  const ocasioes = [...document.querySelectorAll('.pill.occasion.active')].map(p => p.dataset.text);
  let texto = '';
  if (pecas.length) texto += `Tenho: ${pecas.join(', ')}. `;
  if (ocasioes.length) texto += `Ocasião: ${ocasioes.join(', ')}.`;
  chatInput.value = texto.trim();
}

// --- 2. Assistente Bia (baseada em regras fixas) ---
// Mesma entrada = mesma resposta. Não há chamada a IA externa.
const chatForm = document.getElementById('chat-form');
const chatMessages = document.getElementById('chat-messages');

const PECAS = ['Calça Jeans', 'Camisa Branca', 'Vestido Preto', 'Blazer', 'Tênis Casual', 'Salto'];
const OCASIOES = ['Festa/Balada', 'Entrevista/Trabalho', 'Casamento', 'Encontro Casual'];

// Palavras-chave (texto normalizado: minúsculas e sem acento)
const PALAVRAS_PECA = {
  'Calça Jeans': /\b(jeans|calca)\b/,
  'Camisa Branca': /\bcamisa\b/,
  'Vestido Preto': /\bvestido\b/,
  'Blazer': /\bblazer\b/,
  'Tênis Casual': /\btenis\b/,
  'Salto': /\b(salto|sapato|scarpin)\b/
};

const PALAVRAS_OCASIAO = {
  'Festa/Balada': /\b(festa|balada)\b/,
  'Entrevista/Trabalho': /\b(entrevista|trabalho|reuniao|escritorio)\b/,
  'Casamento': /\bcasamento\b/,
  'Encontro Casual': /\b(encontro|date|cafe)\b/
};

// Regras de look por ocasião. A primeira combinação cujas peças estão todas
// presentes é usada; se nenhuma bater, o look é montado com as peças informadas.
const REGRAS = {
  'Festa/Balada': {
    calcadosPadrao: ['Salto', 'Tênis Casual'],
    calcadoSemPeca: 'Sapato de salto ou tênis de couro limpo, para um visual arrumado.',
    dicaPadrao: 'Escolha uma peça de cor vibrante para ser o destaque da noite.',
    combinacoes: [
      { pecas: ['Vestido Preto'], principal: 'Vestido Preto', calcados: ['Salto', 'Tênis Casual'],
        dica: 'Acessórios marcantes, como brincos grandes ou uma bolsa de mão, dão o toque de festa.' },
      { pecas: ['Camisa Branca', 'Calça Jeans'], principal: 'Camisa Branca + Calça Jeans', calcados: ['Salto', 'Tênis Casual'],
        dica: 'Desabotoe o colarinho e use um cinto marcante para destacar a cintura.' },
      { pecas: ['Blazer', 'Calça Jeans'], principal: 'Blazer + Calça Jeans', calcados: ['Tênis Casual', 'Salto'],
        dica: 'Deixe o blazer aberto e dobre as mangas para um visual mais solto.' }
    ]
  },
  'Entrevista/Trabalho': {
    calcadosPadrao: ['Salto'],
    calcadoSemPeca: 'Sapato fechado em cor neutra (preto, nude ou marrom).',
    dicaPadrao: 'Priorize peças limpas, bem passadas e em cores neutras.',
    combinacoes: [
      { pecas: ['Blazer', 'Camisa Branca', 'Calça Jeans'], principal: 'Blazer + Camisa Branca + Calça Jeans escura', calcados: ['Salto'],
        dica: 'Passe bem as peças e prefira uma calça jeans escura e sem desgastes.' },
      { pecas: ['Blazer', 'Vestido Preto'], principal: 'Vestido Preto + Blazer', calcados: ['Salto'],
        dica: 'Um blazer estruturado sobre o vestido preto transmite seriedade sem perder a elegância.' },
      { pecas: ['Camisa Branca', 'Calça Jeans'], principal: 'Camisa Branca + Calça Jeans escura', calcados: ['Salto'],
        dica: 'Evite tênis e jeans desbotado; passe a camisa e mantenha o visual sóbrio.' },
      { pecas: ['Blazer', 'Calça Jeans'], principal: 'Blazer + Calça Jeans escura', calcados: ['Salto'],
        dica: 'Se o ambiente for formal, troque o jeans por uma calça de alfaiataria.' }
    ]
  },
  'Casamento': {
    calcadosPadrao: ['Salto'],
    calcadoSemPeca: 'Sapato social ou scarpin em tom neutro ou metálico.',
    dicaPadrao: 'Evite o branco, reservado à noiva, e prefira cores sofisticadas.',
    combinacoes: [
      { pecas: ['Vestido Preto'], principal: 'Vestido Preto', calcados: ['Salto'],
        dica: 'Para cerimônia de dia, acrescente um acessório dourado ou uma bolsa clara.' },
      { pecas: ['Blazer', 'Camisa Branca'], principal: 'Blazer + Camisa Branca', calcados: ['Salto'],
        dica: 'Confira o dress code do evento e prefira joias discretas.' }
    ]
  },
  'Encontro Casual': {
    calcadosPadrao: ['Tênis Casual', 'Salto'],
    calcadoSemPeca: 'Tênis limpo ou sapatilha, para um visual confortável.',
    dicaPadrao: 'Escolha uma peça de cor única para dar personalidade ao look.',
    combinacoes: [
      { pecas: ['Camisa Branca', 'Calça Jeans'], principal: 'Camisa Branca + Calça Jeans', calcados: ['Tênis Casual', 'Salto'],
        dica: 'Dobre as mangas e use um relógio ou acessório simples para dar charme.' },
      { pecas: ['Vestido Preto'], principal: 'Vestido Preto', calcados: ['Salto', 'Tênis Casual'],
        dica: 'Uma jaqueta jeans por cima deixa o vestido mais casual.' },
      { pecas: ['Blazer', 'Calça Jeans'], principal: 'Blazer + Calça Jeans', calcados: ['Tênis Casual'],
        dica: 'Deixe o blazer aberto e use uma camiseta de cor sólida por baixo.' }
    ]
  }
};

const RESPOSTA_PACOTES = `Nossos pacotes digitais:
• Look Express: R$ 14,90 — 5 combinações completas para um evento único.
• Closet Inteligente Pro: R$ 29,90/mês — guarda-roupa ilimitado, sugestões diárias por clima e consultoria 24h.
• Guia Armário Cápsula: R$ 49,90 — e-book interativo com 30 looks usando 12 peças básicas.

Para montar um look agora, diga suas peças e a ocasião.`;

function normalizar(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function montarLook(ocasiao, pecas) {
  const regra = REGRAS[ocasiao];
  const combo = regra.combinacoes.find(c => c.pecas.every(p => pecas.includes(p)));

  const principal = combo ? combo.principal : pecas.join(' + ');
  const preferidos = combo ? combo.calcados : regra.calcadosPadrao;
  const calcadoDaCasa = preferidos.find(c => pecas.includes(c));
  const calcado = calcadoDaCasa
    ? `Use seu ${calcadoDaCasa.toLowerCase()}.`
    : regra.calcadoSemPeca;
  const dica = combo ? combo.dica : regra.dicaPadrao;

  return `1. Combinação Principal: ${principal}.\n2. Calçado e Acessórios: ${calcado}\n3. Dica de Ouro: ${dica}`;
}

function responderBia(texto) {
  const t = normalizar(texto);
  const pecas = PECAS.filter(p => PALAVRAS_PECA[p].test(t));
  const ocasioes = OCASIOES.filter(o => PALAVRAS_OCASIAO[o].test(t));

  // 1. Pedido de look: peças e/ou ocasião informadas
  if (pecas.length || ocasioes.length) {
    if (!ocasioes.length) {
      return `Para qual ocasião você quer o look? Escolha uma: ${OCASIOES.join(', ')}.`;
    }
    if (!pecas.length) {
      return `Quais peças você tem em casa? Escolha uma ou mais: ${PECAS.join(', ')}.`;
    }
    const ocasiao = ocasioes[0];
    let resposta = montarLook(ocasiao, pecas);
    if (ocasioes.length > 1) {
      resposta += `\n\n(Considerei apenas a ocasião "${ocasiao}". Para as outras, envie uma nova mensagem.)`;
    }
    return resposta;
  }

  // 2. Perguntas sobre pacotes e preços
  if (/\b(preco|precos|quanto|valor|valores|pacote|pacotes|plano|planos|assinar|assinatura|comprar|guia|express|closet)\b/.test(t)) {
    return RESPOSTA_PACOTES;
  }

  // 3. Saudação
  if (/\b(oi|ola|bom dia|boa tarde|boa noite)\b/.test(t)) {
    return 'Olá! Sou a Bia, sua Personal Stylist. Selecione suas peças e a ocasião acima, ou escreva as duas informações aqui.';
  }

  // 4. Assunto de moda sem peças ou ocasião claras
  if (/\b(roupa|roupas|look|looks|combinar|combinacao|estilo|vestir|moda|pecas|armario|closet|guarda)\b/.test(t)) {
    return 'Posso montar um look para você! Me diga quais peças você tem e a ocasião. Exemplo: "Tenho blazer e calça jeans, vou a uma entrevista".';
  }

  // 5. Qualquer outro assunto
  return 'Desculpe, meu foco é exclusivamente moda e estilo. Posso ajudar a montar um look ou apresentar nossos pacotes.';
}

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const texto = chatInput.value.trim();
  if (!texto) return;

  addMsg(texto, 'user');
  chatInput.value = '';
  // Desativa pílulas ativas após enviar
  pills.forEach(p => p.classList.remove('active'));

  addMsg(responderBia(texto), 'bot');
});

function addMsg(text, cls) {
  const div = document.createElement('div');
  div.className = `msg ${cls}`;
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

// --- 3. Formulário de Cadastro ---
const signupForm = document.getElementById('signup-form');
const signupMsg = document.getElementById('signup-msg');

signupForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const dados = new FormData(signupForm);
  const nome = dados.get('nome');
  const estilo = dados.get('estilo');

  signupMsg.textContent = `🎉 Perfeito, ${nome}! Seu perfil "${estilo}" foi salvo. Em breve você receberá seu look VIP gratuito por e-mail!`;
  signupMsg.classList.remove('hidden');
  signupForm.reset();
  setTimeout(() => signupMsg.classList.add('hidden'), 8000);
});

// --- 4. Cabeçalho: cor dos links ao rolar a página ---
const header = document.getElementById('header');

function atualizarHeader() {
  header.classList.toggle('scrolled', window.scrollY > 40);
}

window.addEventListener('scroll', atualizarHeader, { passive: true });
atualizarHeader();
