// ===== VESTE AI — script.js =====

// ============================================================
// 1. CLOSET — Carrossel Horizontal de Roupas
// ============================================================

const STORAGE_KEY = 'vesteai_closet';

// Peças padrão pré-carregadas (editorial de moda)
const PECAS_EXEMPLO = [
  {
    nome: 'Calça Jeans',
    categoria: 'Parte de Baixo',
    img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80'
  },
  {
    nome: 'Camisa Branca',
    categoria: 'Parte de Cima',
    img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80'
  },
  {
    nome: 'Blazer Preto',
    categoria: 'Terceira Peça',
    img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80'
  },
  {
    nome: 'Tênis Casual',
    categoria: 'Calçado',
    img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80'
  },
  {
    nome: 'Vestido Minimalista',
    categoria: 'Peça Única',
    img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80'
  },
  {
    nome: 'Sobretudo Bege',
    categoria: 'Terceira Peça',
    img: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=600&q=80'
  }
];

const carousel = document.getElementById('closet-carousel');
const btnPrev = document.querySelector('.carousel-prev');
const btnNext = document.querySelector('.carousel-next');
const btnAddRoupa = document.getElementById('btn-add-roupa');
const inputAddRoupa = document.getElementById('input-add-roupa');

// --- Dados do closet ---
let closetItems = carregarCloset();

function carregarCloset() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Se houver dados legados sem categoria, reseta para os exemplos atuais
        const temDadoAntigo = parsed.some(p => p.img && (p.img.includes('data:image/svg') || !p.categoria));
        if (temDadoAntigo) {
          localStorage.removeItem(STORAGE_KEY);
          return PECAS_EXEMPLO.map(p => ({ ...p }));
        }
        return parsed;
      }
    }
  } catch (e) { /* ignora erros de parsing */ }
  return PECAS_EXEMPLO.map(p => ({ ...p }));
}

function salvarCloset() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(closetItems));
  } catch (e) {
    console.warn('Não foi possível salvar no localStorage:', e);
  }
}

// Utilitário para normalizar texto (sem acentos e minúsculo)
function normalizar(texto) {
  return texto ? texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';
}

// --- Renderizar carrossel editorial ---
function renderCarrossel() {
  carousel.innerHTML = '';

  if (closetItems.length === 0) {
    carousel.innerHTML = '<p class="closet-empty">Seu closet está vazio. Adicione peças clicando no botão abaixo!</p>';
    return;
  }

  closetItems.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'roupa-card';
    card.dataset.index = index;
    if (item.selected) card.classList.add('selected');

    const categoria = item.categoria || '';

    card.innerHTML = `
      <img class="roupa-card-bg" src="${item.img}" alt="${item.nome}" loading="lazy">
      <div class="roupa-card-overlay">
        <span class="selo-selecionado">✓ Selecionado</span>
        <button class="btn-remove-roupa" title="Remover peça">&times;</button>
        <div class="roupa-card-label">
          ${categoria ? `<span class="roupa-card-cat">${categoria}</span>` : ''}
          <span class="roupa-card-nome">${item.nome}</span>
        </div>
      </div>
    `;

    // Clique no card → seleciona/deseleciona
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-remove-roupa')) return;
      item.selected = !item.selected;
      card.classList.toggle('selected', item.selected);
      salvarCloset();
    });

    // Botão remover
    card.querySelector('.btn-remove-roupa').addEventListener('click', (e) => {
      e.stopPropagation();
      closetItems.splice(index, 1);
      salvarCloset();
      renderCarrossel();
    });

    carousel.appendChild(card);
  });
}

// --- Navegação do carrossel ---
btnPrev.addEventListener('click', () => {
  carousel.scrollBy({ left: -280, behavior: 'smooth' });
  pausarAutoScroll();
});

btnNext.addEventListener('click', () => {
  carousel.scrollBy({ left: 280, behavior: 'smooth' });
  pausarAutoScroll();
});

// --- Auto-scroll contínuo do carrossel com retorno suave ---
let autoScrollInterval = null;
let autoScrollPaused = false;
let isResetting = false;

function iniciarAutoScroll() {
  if (autoScrollInterval) return;
  autoScrollInterval = setInterval(() => {
    if (autoScrollPaused || isResetting) return;

    const maxScroll = carousel.scrollWidth - carousel.clientWidth;
    if (maxScroll <= 0) return;

    // Detecta o fim da arara com margem de segurança de 4px
    if (carousel.scrollLeft >= maxScroll - 4) {
      isResetting = true;
      setTimeout(() => {
        carousel.scrollTo({ left: 0, behavior: 'smooth' });
        setTimeout(() => {
          isResetting = false;
        }, 1200);
      }, 1000);
      return;
    }

    carousel.scrollLeft += 1;
  }, 35);
}

function pausarAutoScroll() {
  autoScrollPaused = true;
  clearTimeout(window._autoScrollResumeTimer);
  window._autoScrollResumeTimer = setTimeout(() => {
    autoScrollPaused = false;
  }, 4000);
}

// Pausa o auto-scroll durante interação com mouse ou toque
carousel.addEventListener('mouseenter', () => { autoScrollPaused = true; });
carousel.addEventListener('mouseleave', () => {
  clearTimeout(window._autoScrollResumeTimer);
  window._autoScrollResumeTimer = setTimeout(() => {
    if (!isResetting) autoScrollPaused = false;
  }, 1500);
});
carousel.addEventListener('touchstart', () => { pausarAutoScroll(); }, { passive: true });
carousel.addEventListener('touchend', () => { pausarAutoScroll(); }, { passive: true });

// Inicia o auto-scroll suavemente
setTimeout(iniciarAutoScroll, 1500);

// --- Adicionar roupas (câmera / galeria) ---
btnAddRoupa.addEventListener('click', () => {
  inputAddRoupa.click();
});

inputAddRoupa.addEventListener('change', (e) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  Array.from(files).forEach(file => {
    comprimirImagem(file, (base64) => {
      const nome = prompt('Nome da peça (ex: Vestido Preto):', file.name.replace(/\.[^.]+$/, '')) || 'Peça Nova';
      const categoria = prompt('Categoria (ex: Parte de Cima, Calçado, Terceira Peça):', '') || '';
      closetItems.push({ nome, categoria, img: base64, selected: false });
      salvarCloset();
      renderCarrossel();
    });
  });

  inputAddRoupa.value = '';
});

// --- Compressão de imagem via <canvas> (max 300px) ---
function comprimirImagem(file, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 300;
      let w = img.width;
      let h = img.height;

      if (w > h) {
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
      } else {
        if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
      }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const base64 = canvas.toDataURL('image/jpeg', 0.7);
      callback(base64);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Inicializar carrossel
renderCarrossel();

// ============================================================
// 2. WIDGET FLUTUANTE — CHAT DA BIA
// ============================================================

const biaFab = document.getElementById('bia-fab');
const biaChatWindow = document.getElementById('bia-chat-window');
const biaChatClose = document.getElementById('bia-chat-close');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

// Toggle abrir/fechar chat flutuante
biaFab.addEventListener('click', () => {
  biaChatWindow.classList.toggle('hidden');
  if (!biaChatWindow.classList.contains('hidden')) {
    chatInput.focus();
  }
});

biaChatClose.addEventListener('click', () => {
  biaChatWindow.classList.add('hidden');
});

// ============================================================
// 3. ASSISTENTE BIA — INTEGRAÇÃO GEMINI & GUARDA-ROUPA VIRTUAL
// ============================================================

const GEMINI_API_KEY = 'SUA_API_KEY';

// Histórico de conversa mantido durante a sessão
let chatHistory = [];

// Obter peças selecionadas no carrossel
function getPecasSelecionadas() {
  return closetItems.filter(item => item.selected);
}

// Formatar o inventário do guarda-roupa virtual para o Gemini
function gerarContextoGuardaRoupa() {
  if (!closetItems || closetItems.length === 0) {
    return 'O usuário ainda não possui peças cadastradas no guarda-roupa virtual.';
  }

  const linhas = closetItems.map((item, idx) => {
    const sel = item.selected ? ' ★ [SELECIONADA NO CARROSSEL PELO USUÁRIO]' : '';
    const cat = item.categoria ? ` [Categoria: ${item.categoria}]` : '';
    return `${idx + 1}. "${item.nome}"${cat}${sel}`;
  });

  const selecionadas = getPecasSelecionadas();
  let avisoDestaque = '';
  if (selecionadas.length > 0) {
    avisoDestaque = `\n\nATENÇÃO ESPECIAL: O usuário marcou com destaque no carrossel as seguintes peças: ${selecionadas.map(p => `"${p.nome}"`).join(', ')}. Use-as prioritariamente no look!`;
  }

  return `PEÇAS DO GUARDA-ROUPA VIRTUAL DO USUÁRIO:\n${linhas.join('\n')}${avisoDestaque}`;
}

// Prompt de Sistema da Stylist Bia
function gerarSystemPrompt() {
  const inventario = gerarContextoGuardaRoupa();

  return `Você é a Bia, Personal Stylist inteligente, elegante, calorosa e moderna do Veste AI.
Seu objetivo é criar combinações de looks incríveis, harmoniosas e práticas sob medida para a ocasião ou dúvida do usuário.

${inventario}

DIRETRIZES DA CONSULTORIA DE ESTILO:
1. OLHE SEMPRE O GUARDA-ROUPA VIRTUAL: Ao recomendar ou montar um look, você DEVE buscar e combinar prioritariamente as peças que constam no guarda-roupa virtual listado acima.
2. Se o usuário marcou alguma peça com destaque (selecionada no carrossel), use-a obrigatoriamente como ponto central da combinação.
3. Se faltar algum calçado ou acessório complementar essencial que não esteja cadastrado no armário, sugira de forma amigável com o que ele pode complementar.
4. Estruture sua resposta com clareza editorial:
   ✦ Look Recomendado (cite expressamente os nomes exatos das peças do guarda-roupa utilizadas)
   ✦ Calçados & Complementos
   ✦ Dica de Ouro da Bia (truque de styling, paleta de cores ou ocasião)
5. OBRIGATÓRIO NO FINAL: Inclua no final da sua resposta uma linha técnica discreta indicando as peças do guarda-roupa que você usou no look, exatamente neste formato:
   [PEÇAS_LOOK: Nome da Peça 1, Nome da Peça 2]
   (Os nomes devem ser exatamente idênticos aos cadastrados no guarda-roupa. Se nenhuma peça do closet foi usada, retorne [PEÇAS_LOOK: nenhuma]).
6. Mantenha um tom profissional, amigável, autêntico e apaixonado por moda.`;
}

// Chamada à API do Google Gemini com histórico conversacional
async function consultarGemini(mensagemUsuario) {
  const systemPrompt = gerarSystemPrompt();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  // Monta o payload incluindo histórico recente para conversas contínuas
  const contents = [
    ...chatHistory,
    {
      role: 'user',
      parts: [{ text: `${systemPrompt}\n\nPedido do usuário: ${mensagemUsuario}` }]
    }
  ];

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }

    const data = await response.json();
    const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!texto) {
      throw new Error('Conteúdo vazio');
    }

    // Salva o histórico de turnos
    chatHistory.push({ role: 'user', parts: [{ text: mensagemUsuario }] });
    chatHistory.push({ role: 'model', parts: [{ text: texto }] });
    if (chatHistory.length > 6) chatHistory = chatHistory.slice(-6);

    return texto;
  } catch (err) {
    console.warn('API Gemini indisponível. Acionando motor dinâmico de contingência:', err);
    return responderBiaFallback(mensagemUsuario);
  }
}

// Extrai quais peças do guarda-roupa virtual foram sugeridas no look
function extrairPecasUsadas(textoResposta) {
  const pecasEncontradas = [];

  // 1. Tenta extrair a tag técnica [PEÇAS_LOOK: ...]
  const matchTag = textoResposta.match(/\[PE[ÇC]AS_LOOK:\s*([^\]]+)\]/i);
  if (matchTag && matchTag[1]) {
    const nomes = matchTag[1].split(',').map(s => normalizar(s.trim()));
    closetItems.forEach(item => {
      const nomeNorm = normalizar(item.nome);
      if (nomes.some(n => n === nomeNorm || nomeNorm.includes(n) || n.includes(nomeNorm))) {
        if (!pecasEncontradas.includes(item)) pecasEncontradas.push(item);
      }
    });
  }

  // 2. Busca por menção direta no texto
  const textoNorm = normalizar(textoResposta);
  closetItems.forEach(item => {
    const nomeNorm = normalizar(item.nome);
    if (textoNorm.includes(nomeNorm) && !pecasEncontradas.includes(item)) {
      pecasEncontradas.push(item);
    }
  });

  // 3. Se nenhuma foi encontrada mas o usuário tinha itens selecionados, inclui os selecionados
  if (pecasEncontradas.length === 0) {
    return getPecasSelecionadas();
  }

  return pecasEncontradas;
}

// Formatar markdown básico (negrito e itálico)
function formatarMarkdown(txt) {
  return txt
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

// ============================================================
// MOTOR DE CONTINGÊNCIA (FALLBACK LOCAL DINÂMICO)
// ============================================================

const RESPOSTA_PACOTES = `Nossos pacotes digitais:
• Look Express: R$ 14,90 — 5 combinações completas para um evento único.
• Closet Inteligente Pro: R$ 29,90/mês — guarda-roupa ilimitado, sugestões diárias por clima e consultoria 24h.
• Guia Armário Cápsula: R$ 49,90 — e-book interativo com 30 looks usando 12 peças básicas.

Para montar um look agora, me diga para qual ocasião você vai!`;

function responderBiaFallback(texto) {
  const t = normalizar(texto);

  if (/\b(preco|precos|quanto|valor|valores|pacote|pacotes|plano|planos|assinar|assinatura|comprar|guia|express)\b/.test(t)) {
    return RESPOSTA_PACOTES;
  }

  if (/\b(oi|ola|bom dia|boa tarde|boa noite)\b/.test(t)) {
    return `Olá! Sou a Bia, sua Personal Stylist ✨\nTenho acesso ao seu guarda-roupa virtual com ${closetItems.length} peças disponíveis. Me diga para qual evento você vai que monto sua combinação!`;
  }

  // Utiliza as peças selecionadas pelo usuário ou as peças disponíveis no closet
  const selecionadas = getPecasSelecionadas();
  const pecasUsar = selecionadas.length > 0 ? selecionadas : closetItems.slice(0, 3);
  const nomesPecas = pecasUsar.map(p => p.nome);

  if (nomesPecas.length > 0) {
    return `✦ Look Recomendado: Recomendo combinar ${nomesPecas.join(' + ')}.\n✦ Calçados & Complementos: Use um calçado em tom neutro para manter a sofisticação.\n✦ Toque de Estilo: Dobre as mangas e adicione acessórios delicados para dar charme.\n\n[PEÇAS_LOOK: ${nomesPecas.join(', ')}]`;
  }

  return 'Olá! Posso criar uma combinação sob medida para você com as roupas do seu guarda-roupa virtual. Para onde você vai hoje?';
}

// --- Envio de mensagens com IA Gemini ---
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const texto = chatInput.value.trim();
  if (!texto) return;

  // Mensagem do usuário
  addMsg(texto, 'user');
  chatInput.value = '';
  chatInput.disabled = true;

  // Indicador animado de digitação
  const typingDiv = document.createElement('div');
  typingDiv.className = 'msg bot typing-msg';
  typingDiv.innerHTML = '<span class="typing-dots">✦ Bia está analisando seu guarda-roupa...</span>';
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const respostaBruta = await consultarGemini(texto);
    typingDiv.remove();

    // Extrai as peças sugeridas do closet
    const pecasUsadas = extrairPecasUsadas(respostaBruta);

    // Remove a tag técnica do balão de texto
    const textoLimpo = respostaBruta.replace(/\[PE[ÇC]AS_LOOK:[^\]]*\]/gi, '').trim();

    const msgDiv = addMsg(textoLimpo, 'bot', true);

    // Se houver peças identificadas, renderiza as miniaturas
    if (pecasUsadas.length > 0) {
      const thumbsContainer = document.createElement('div');
      thumbsContainer.className = 'msg-pecas-container';
      thumbsContainer.innerHTML = '<span class="msg-pecas-title">Peças do seu guarda-roupa:</span>';

      const thumbsGrid = document.createElement('div');
      thumbsGrid.className = 'msg-pecas-thumbs';

      pecasUsadas.forEach(item => {
        const card = document.createElement('div');
        card.className = 'msg-peca-card';
        card.innerHTML = `
          <img src="${item.img}" alt="${item.nome}" title="${item.nome}">
          <span>${item.nome}</span>
        `;
        thumbsGrid.appendChild(card);
      });

      thumbsContainer.appendChild(thumbsGrid);
      msgDiv.appendChild(thumbsContainer);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  } catch (err) {
    console.error('Erro no fluxo do chat:', err);
    typingDiv.remove();
    addMsg('Desculpe, tive um contratempo momentâneo. Me diga para qual evento você vai que monto seu look com o seu guarda-roupa!', 'bot');
  } finally {
    chatInput.disabled = false;
    chatInput.focus();
  }
});

function addMsg(text, cls, isMarkdown = false) {
  const div = document.createElement('div');
  div.className = `msg ${cls}`;
  if (isMarkdown) {
    div.innerHTML = formatarMarkdown(text);
  } else {
    div.textContent = text;
  }
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

// ============================================================
// 4. FORMULÁRIO DE CADASTRO
// ============================================================

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

// ============================================================
// 5. CABEÇALHO & MENU MOBILE
// ============================================================

const header = document.getElementById('header');
const menuToggle = document.getElementById('menu-toggle');
const navMenu = document.getElementById('nav-menu');

function atualizarHeader() {
  header.classList.toggle('scrolled', window.scrollY > 30);
}

window.addEventListener('scroll', atualizarHeader, { passive: true });
atualizarHeader();

// Menu mobile toggle
if (menuToggle && navMenu) {
  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = navMenu.classList.toggle('open');
    menuToggle.classList.toggle('active', isOpen);
    menuToggle.setAttribute('aria-expanded', isOpen);
  });

  // Fechar menu mobile ao clicar em um link
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      menuToggle.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Fechar menu mobile ao clicar fora
  document.addEventListener('click', (e) => {
    if (!header.contains(e.target)) {
      navMenu.classList.remove('open');
      menuToggle.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
}
