// PUFF RUSH — Área VIP: Etapa 1 (modo de teste)
// Este módulo não realiza login, pagamento ou cobrança.
// Ele apenas valida o botão e o desbloqueio das fases 3 e 4.

(function () {
  const premiumButton = document.getElementById("premiumPreview");
  const mapButton = document.getElementById("mapBtn");

  if (!premiumButton || typeof window.setPuffPremium !== "function") {
    console.error("Puff Rush VIP: elementos necessários não foram encontrados.");
    return;
  }

  function openVipTest() {
    window.setPuffPremium(true);
    premiumButton.textContent = "ÁREA VIP ATIVA • TESTE";
    premiumButton.setAttribute("aria-label", "Área VIP ativa em modo de teste");

    // Abre o mapa já atualizado, mostrando Navio Afundado e Abismo liberados.
    if (mapButton) mapButton.click();
  }

  premiumButton.textContent = "VER ÁREA VIP • TESTE";
  premiumButton.onclick = openVipTest;

  // Atalho temporário de teste: ?viptest=1 abre diretamente o Navio Afundado.
  const params = new URLSearchParams(location.search);
  if (params.get("viptest") === "1") {
    window.setPuffPremium(true);
    premiumButton.textContent = "ÁREA VIP ATIVA • TESTE";
    setTimeout(() => {
      if (typeof intro === "function") intro(2);
    }, 120);
  }
})();
