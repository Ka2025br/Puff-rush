// vip.js — MÓDULO VIP (separado do núcleo V3.75/V3.81, como o README pede)
// Depende de: window.PUFF_RANKING (mesma config do ranking-config.js) e da
// função window.setPuffPremium exposta no fim do game.js (ver README-VIP.md).
//
// Fluxo: login por link mágico (sem senha) -> checkout Mercado Pago (PIX/cartão)
// -> webhook do servidor confirma pagamento -> libera fases + chat da comunidade.

(function () {
  const CFG = window.PUFF_RANKING || {};
  let supa = null;
  let currentUser = null;
  let vipUnlocked = false;
  let chatChannel = null;
  let sdkLoading = null;

  // ---------- injeta estilo (mesma paleta do jogo: ciano + dourado) ----------
  const style = document.createElement("style");
  style.textContent = `
    .vip-box{margin-top:16px;padding:16px;border-radius:16px;background:#002c4b88;border:1px solid #a9f1ff44;text-align:left}
    .vip-box input{width:100%;border:1px solid #9cefff88;border-radius:999px;padding:13px 18px;background:#002d4dcc;color:#fff;font-size:15px;outline:none;margin:6px 0}
    .vip-box input::placeholder{color:#b9eafa88}
    .vip-small{font-size:11px;opacity:.75;margin:6px 0}
    .vip-price{font-size:26px;font-weight:1000;color:#ffe36d;margin:4px 0}
    .vip-status{font-size:12px;font-weight:900;padding:6px 12px;border-radius:999px;display:inline-block;margin-bottom:8px}
    .vip-status.on{background:#c9ffcf;color:#0a4d1a}
    .vip-status.off{background:#ffe6b0;color:#5c3d00}
    .vip-chat{margin-top:14px;border-radius:16px;background:#00223bcc;border:1px solid #8deaff55;overflow:hidden}
    .vip-chat-msgs{max-height:200px;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:6px}
    .vip-msg{font-size:12px;line-height:1.4}
    .vip-msg b{color:#ffe36d;margin-right:6px}
    .vip-chat-row{display:flex;gap:6px;padding:8px;border-top:1px solid #8deaff33}
    .vip-chat-row input{flex:1;margin:0;padding:9px 14px;font-size:13px}
    .vip-chat-row button{width:auto;margin:0;padding:9px 16px;font-size:12px;box-shadow:none}
  `;
  document.head.appendChild(style);

  // ---------- carrega o SDK do Supabase só quando o jogador entra na Área VIP ----------
  function loadSupabaseSdk() {
    if (sdkLoading) return sdkLoading;
    sdkLoading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
      s.onload = () => resolve(window.supabase);
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return sdkLoading;
  }

  async function getClient() {
    if (supa) return supa;
    const sdk = await loadSupabaseSdk();
    supa = sdk.createClient(CFG.url, CFG.anonKey, {
      auth: { detectSessionInUrl: true, persistSession: true },
    });
    return supa;
  }

  // ---------- monta a área VIP dentro da tela #premium já existente ----------
  function ensureContainer() {
    let box = document.getElementById("vipBox");
    if (!box) {
      box = document.createElement("div");
      box.id = "vipBox";
      box.className = "vip-box";
      document.getElementById("premium").insertBefore(box, document.getElementById("premiumHome"));
    }
    return box;
  }

  function renderLogin(box) {
    box.innerHTML = `
      <div class="vip-status off">FAÇA LOGIN PRA CONTINUAR</div>
      <p class="vip-small">Enviamos um link de acesso pro seu e-mail. Sem senha, sem cadastro chato.</p>
      <input id="vipEmail" type="email" placeholder="seu@email.com" autocomplete="email">
      <button id="vipSendLink">RECEBER LINK DE ACESSO</button>
      <p class="vip-small" id="vipLoginMsg"></p>
    `;
    box.querySelector("#vipSendLink").onclick = async () => {
      const email = box.querySelector("#vipEmail").value.trim();
      const msg = box.querySelector("#vipLoginMsg");
      if (!email.includes("@")) { msg.textContent = "digite um e-mail válido."; return; }
      msg.textContent = "enviando...";
      const client = await getClient();
      const { error } = await client.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin + window.location.pathname },
      });
      msg.textContent = error ? "erro ao enviar. tente de novo." : "✅ link enviado! confira seu e-mail.";
    };
  }

  function renderPaywall(box) {
    box.innerHTML = `
      <div class="vip-status off">LOGADO • AINDA SEM PUFF PRIME</div>
      <p class="vip-price">R$ 9,95 <span style="font-size:14px;font-weight:700">/ 30 dias</span></p>
      <p class="vip-small">Desbloqueia Navio Afundado + Abismo, selo dourado no ranking e o chat da comunidade Prime.</p>
      <button id="vipCheckout">ASSINAR COM PIX / CARTÃO</button>
      <button id="vipRefresh" class="ghost">JÁ PAGUEI, VERIFICAR AGORA</button>
      <p class="vip-small" id="vipPayMsg"></p>
    `;
    box.querySelector("#vipCheckout").onclick = async () => {
      const msg = box.querySelector("#vipPayMsg");
      msg.textContent = "abrindo checkout...";
      const client = await getClient();
      const { data: sess } = await client.auth.getSession();
      const resp = await fetch("/api/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: sess.session.access_token }),
      });
      const data = await resp.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        msg.textContent = "erro ao abrir pagamento. tente de novo.";
      }
    };
    box.querySelector("#vipRefresh").onclick = () => checkSubscription(true);
  }

  function renderUnlocked(box) {
    box.innerHTML = `<div class="vip-status on">🐡 PUFF PRIME ATIVO</div><p class="vip-small">Bem-vindo à Área VIP. As fases finais já estão liberadas no mapa.</p>`;
    box.appendChild(buildChat());
  }

  // ---------- chat da comunidade (só renderiza se VIP ativo — RLS também protege no servidor) ----------
  function buildChat() {
    const wrap = document.createElement("div");
    wrap.className = "vip-chat";
    wrap.innerHTML = `
      <div class="vip-chat-msgs" id="vipChatMsgs"></div>
      <div class="vip-chat-row">
        <input id="vipChatInput" maxlength="200" placeholder="Falar com a comunidade Prime...">
        <button id="vipChatSend">Enviar</button>
      </div>
    `;
    loadChatHistory(wrap);
    subscribeChat(wrap);
    wrap.querySelector("#vipChatSend").onclick = () => sendChat(wrap);
    wrap.querySelector("#vipChatInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendChat(wrap);
    });
    return wrap;
  }

  function appendChatMsg(wrap, row) {
    const list = wrap.querySelector("#vipChatMsgs");
    const el = document.createElement("div");
    el.className = "vip-msg";
    const b = document.createElement("b");
    b.textContent = row.nickname;
    const span = document.createElement("span");
    span.textContent = row.message; // textContent evita qualquer injeção de HTML
    el.appendChild(b);
    el.appendChild(span);
    list.appendChild(el);
    list.scrollTop = list.scrollHeight;
  }

  async function loadChatHistory(wrap) {
    const client = await getClient();
    const { data } = await client
      .from("chat_messages")
      .select("nickname,message,created_at")
      .order("created_at", { ascending: true })
      .limit(50);
    (data || []).forEach((row) => appendChatMsg(wrap, row));
  }

  async function subscribeChat(wrap) {
    const client = await getClient();
    if (chatChannel) client.removeChannel(chatChannel);
    chatChannel = client
      .channel("vip-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => appendChatMsg(wrap, payload.new)
      )
      .subscribe();
  }

  async function sendChat(wrap) {
    const input = wrap.querySelector("#vipChatInput");
    const text = input.value.trim();
    if (!text) return;
    const nickname = (localStorage.pr381nick || "Jogador").slice(0, 15);
    const client = await getClient();
    const { error } = await client
      .from("chat_messages")
      .insert({ user_id: currentUser.id, nickname, message: text });
    if (!error) input.value = "";
  }

  // ---------- checagem de assinatura ----------
  async function checkSubscription(forceRender) {
    const box = ensureContainer();
    const client = await getClient();
    const { data: sess } = await client.auth.getSession();
    currentUser = sess.session ? sess.session.user : null;

    if (!currentUser) {
      renderLogin(box);
      vipUnlocked = false;
      if (window.setPuffPremium) window.setPuffPremium(false);
      return;
    }

    const { data: sub } = await client
      .from("subscribers")
      .select("is_active,expires_at")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    const active = !!(sub && sub.is_active && (!sub.expires_at || new Date(sub.expires_at) > new Date()));

    if (active !== vipUnlocked || forceRender) {
      vipUnlocked = active;
      if (window.setPuffPremium) window.setPuffPremium(active);
      active ? renderUnlocked(box) : renderPaywall(box);
    }
  }

  // ---------- entra em cena assim que o jogador abre a tela ÁREA VIP ----------
  const premiumBtn = document.getElementById("premiumPreview");
  if (premiumBtn) {
    premiumBtn.textContent = "VER ÁREA VIP";
    premiumBtn.onclick = () => checkSubscription(true);
  }

  // se o jogador já chegou aqui de volta do pagamento (?vip=sucesso) ou de um
  // link mágico de e-mail, verifica a sessão automaticamente ao carregar.
  if (location.search.includes("vip=") || location.hash.includes("access_token")) {
    checkSubscription(true);
  }
})();
