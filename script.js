// ===== VESTE AI — Supabase, closet and Gemini =====
const config = window.VESTEAI_CONFIG;
const configurationReady = config
  && config.url
  && config.anonKey
  && !config.url.includes('YOUR-PROJECT')
  && !config.anonKey.includes('YOUR_SUPABASE');

const authRequired = document.getElementById('auth-required');
const closetApp = document.getElementById('closet-app');
const accountForms = document.getElementById('account-forms');
const sessionPanel = document.getElementById('session-panel');
const sessionEmail = document.getElementById('session-email');
const wardrobeForm = document.getElementById('wardrobe-form');
const wardrobeStatus = document.getElementById('wardrobe-status');
const closetItems = document.getElementById('closet-items');
const closetStatus = document.getElementById('closet-status');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

let supabaseClient;
let currentSession;
let currentItems = [];

if (!configurationReady || !window.supabase?.createClient) {
  setStatus(document.getElementById('signup-msg'),
    'Configure a URL e a chave pública do Supabase em supabase-config.js para ativar o piloto.');
  document.querySelectorAll('#account-forms input, #account-forms button, #account-forms select')
    .forEach((element) => { element.disabled = true; });
} else {
  supabaseClient = window.supabase.createClient(config.url, config.anonKey);
  initializeApp();
}

async function initializeApp() {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    setStatus(document.getElementById('login-msg'), error.message);
    return;
  }
  await updateSession(data.session);
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    window.setTimeout(() => updateSession(session), 0);
  });
}

async function updateSession(session) {
  currentSession = session;
  const signedIn = Boolean(session);
  authRequired.classList.toggle('hidden', signedIn);
  closetApp.classList.toggle('hidden', !signedIn);
  accountForms.classList.toggle('hidden', signedIn);
  sessionPanel.classList.toggle('hidden', !signedIn);
  sessionEmail.textContent = signedIn ? `Conectado como ${session.user.email}` : '';
  if (signedIn) {
    await loadCloset();
  } else {
    currentItems = [];
    closetItems.replaceChildren(createMessage('Entre na sua conta para ver as peças.'));
  }
}

document.getElementById('signup-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const button = form.querySelector('button[type="submit"]');
  setBusy(button, true);
  hideStatus(document.getElementById('signup-msg'));
  try {
    const { data: result, error } = await supabaseClient.auth.signUp({
      email: String(data.get('email')).trim(),
      password: String(data.get('senha')),
      options: {
        data: {
          name: String(data.get('nome')).trim(),
          style: String(data.get('estilo'))
        }
      }
    });
    if (error) throw error;
    form.reset();
    setStatus(document.getElementById('signup-msg'), result.session
      ? 'Conta criada. Você já pode enviar fotos para o seu closet.'
      : 'Conta criada. Confira seu e-mail para confirmar o cadastro e depois entre.');
  } catch (error) {
    setStatus(document.getElementById('signup-msg'), `Não foi possível criar a conta: ${error.message}`);
  } finally {
    setBusy(button, false);
  }
});

document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const button = form.querySelector('button[type="submit"]');
  setBusy(button, true);
  hideStatus(document.getElementById('login-msg'));
  try {
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: String(data.get('email')).trim(),
      password: String(data.get('senha'))
    });
    if (error) throw error;
    form.reset();
  } catch (error) {
    setStatus(document.getElementById('login-msg'), `Não foi possível entrar: ${error.message}`);
  } finally {
    setBusy(button, false);
  }
});

document.getElementById('logout-button').addEventListener('click', async (event) => {
  const button = event.currentTarget;
  setBusy(button, true);
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
  } catch (error) {
    setStatus(document.getElementById('account-msg'), `Não foi possível sair: ${error.message}`);
  } finally {
    setBusy(button, false);
  }
});

wardrobeForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!currentSession) return;
  const form = event.currentTarget;
  const name = form.elements.name.value.trim();
  const file = form.elements.photo.files[0];
  const button = form.querySelector('button[type="submit"]');
  if (!file) {
    setStatus(wardrobeStatus, 'Escolha uma imagem antes de enviar.');
    return;
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    setStatus(wardrobeStatus, 'Use uma imagem JPEG, PNG ou WebP.');
    return;
  }
  if (file.size > 4 * 1024 * 1024) {
    setStatus(wardrobeStatus, 'A imagem deve ter no máximo 4 MB.');
    return;
  }

  setBusy(button, true);
  hideStatus(wardrobeStatus);
  const id = crypto.randomUUID();
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type];
  const path = `${currentSession.user.id}/${id}.${extension}`;
  let uploaded = false;
  try {
    const { error: uploadError } = await supabaseClient.storage
      .from('wardrobe')
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;
    uploaded = true;

    const { error: insertError } = await supabaseClient.from('closet_items').insert({
      id,
      name,
      storage_path: path,
      content_type: file.type
    });
    if (insertError) throw insertError;

    form.reset();
    setStatus(wardrobeStatus, 'Foto adicionada ao seu closet.');
    await loadCloset();
  } catch (error) {
    let message = `Não foi possível adicionar a peça: ${error.message}`;
    if (uploaded) {
      const { error: cleanupError } = await supabaseClient.storage.from('wardrobe').remove([path]);
      if (cleanupError) message += ` Também não foi possível limpar o arquivo enviado: ${cleanupError.message}`;
    }
    setStatus(wardrobeStatus, message);
  } finally {
    setBusy(button, false);
  }
});

async function loadCloset() {
  closetItems.replaceChildren(createMessage('Carregando seu closet...'));
  hideStatus(closetStatus);
  const { data, error } = await supabaseClient
    .from('closet_items')
    .select('id, name, storage_path, created_at')
    .order('created_at', { ascending: false });
  if (error) {
    currentItems = [];
    closetItems.replaceChildren(createMessage('Não foi possível carregar as peças.'));
    setStatus(closetStatus, `Erro ao carregar o closet: ${error.message}`);
    return;
  }
  currentItems = data;
  if (!data.length) {
    closetItems.replaceChildren(createMessage('Seu closet está vazio. Envie a foto de uma peça para começar.'));
    return;
  }

  const cards = await Promise.all(data.map(async (item) => {
    const { data: image, error: imageError } = await supabaseClient.storage
      .from('wardrobe')
      .createSignedUrl(item.storage_path, 300);
    if (imageError) {
      return createItemCard(item, null, imageError.message);
    }
    return createItemCard(item, image.signedUrl);
  }));
  closetItems.replaceChildren(...cards);
}

function createItemCard(item, imageUrl, imageError) {
  const card = document.createElement('article');
  card.className = 'closet-item';

  const label = document.createElement('label');
  label.className = 'closet-item-select';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.value = item.id;
  checkbox.setAttribute('aria-label', `Selecionar ${item.name} para análise`);
  const name = document.createElement('span');
  name.textContent = item.name;
  label.append(checkbox, name);

  if (imageUrl) {
    const image = document.createElement('img');
    image.src = imageUrl;
    image.alt = item.name;
    image.loading = 'lazy';
    card.append(image);
  } else {
    const error = createMessage(`Imagem indisponível: ${imageError}`);
    error.className = 'image-error';
    card.append(error);
  }

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'remove-item';
  remove.textContent = 'Remover';
  remove.addEventListener('click', () => removeItem(item, remove));
  card.append(label, remove);
  return card;
}

async function removeItem(item, button) {
  if (!window.confirm(`Remover "${item.name}" do seu closet?`)) return;
  setBusy(button, true);
  hideStatus(closetStatus);
  const { error: storageError } = await supabaseClient.storage
    .from('wardrobe')
    .remove([item.storage_path]);
  if (storageError) {
    setStatus(closetStatus, `Não foi possível remover a foto: ${storageError.message}`);
    setBusy(button, false);
    return;
  }
  const { error: rowError } = await supabaseClient.from('closet_items').delete().eq('id', item.id);
  if (rowError) {
    setStatus(closetStatus, `A foto foi removida, mas o registro da peça não: ${rowError.message}`);
    setBusy(button, false);
    await loadCloset();
    return;
  }
  await loadCloset();
}

chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!currentSession) {
    addMsg('Entre na sua conta para pedir uma sugestão.', 'bot');
    return;
  }
  const message = chatInput.value.trim();
  const itemIds = [...closetItems.querySelectorAll('input[type="checkbox"]:checked')]
    .map((checkbox) => checkbox.value);
  if (!message) return;
  if (!itemIds.length || itemIds.length > 4) {
    addMsg('Selecione de 1 a 4 fotos do seu closet para eu analisar.', 'bot');
    return;
  }

  addMsg(message, 'user');
  chatInput.value = '';
  const submitButton = chatForm.querySelector('button[type="submit"]');
  setBusy(submitButton, true);
  const pending = addMsg('Analisando as peças selecionadas...', 'bot');
  try {
    const { data, error } = await supabaseClient.functions.invoke('recommend-look', {
      body: { message, itemIds }
    });
    if (error) {
      let details = error.message;
      if (error.context instanceof Response) {
        const body = await error.context.json().catch(() => null);
        details = body?.error || details;
      }
      throw new Error(details);
    }
    if (!data?.reply) throw new Error('A IA retornou uma resposta vazia.');
    pending.textContent = data.reply;
  } catch (error) {
    pending.textContent = `Não foi possível gerar a sugestão: ${error.message}`;
  } finally {
    setBusy(submitButton, false);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

function addMsg(text, className) {
  const message = document.createElement('div');
  message.className = `msg ${className}`;
  message.textContent = text;
  chatMessages.append(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return message;
}

function createMessage(text) {
  const message = document.createElement('p');
  message.className = 'empty-state';
  message.textContent = text;
  return message;
}

function setStatus(element, text) {
  element.textContent = text;
  element.classList.remove('hidden');
}

function hideStatus(element) {
  element.textContent = '';
  element.classList.add('hidden');
}

function setBusy(button, busy) {
  button.disabled = busy;
  button.setAttribute('aria-busy', String(busy));
}

// --- Cabeçalho: cor dos links ao rolar a página ---
const header = document.getElementById('header');
function atualizarHeader() {
  header.classList.toggle('scrolled', window.scrollY > 40);
}
window.addEventListener('scroll', atualizarHeader, { passive: true });
atualizarHeader();
