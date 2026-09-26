// PUFF RUSH — Expansão VIP
// Camada independente: as fases FREE continuam usando integralmente o motor original.

(function () {
  const original = {
    resetStage,
    sync,
    addObs,
    addItem,
    update,
    finish,
    background,
    drawObs,
    drawItem,
    drawFish
  };

  let mission = null;
  let obstacleSequence = 0;
  let bossMode = false;
  let bossTimer = 0;
  let bossDefeated = false;
  let lastTap = 0;
  let holding = false;
  let holdTimer = null;
  let lastZone = -1;
  let eventCooldown = 0;
  let specialSpawn = 0;
  let vipTravelX = 0;
  let vipTravelVX = 0;
  let vipCameraX = 0;

  // Artes VIP são carregadas separadamente para não pesar na jornada gratuita.
  const vipWorlds = {
    2: Object.assign(new Image(), { src: "Imagem do ChatGPT 25 de set. de 2026, 20_51_15.png" }),
    3: Object.assign(new Image(), { src: "c7d725ee-cbf2-4325-a572-5ab441418067.png" })
  };
  const puffPrimeArt = Object.assign(new Image(), { src: "Imagem do ChatGPT 25 de set. de 2026, 20_51_40.png" });

  const hud = document.createElement("div");
  hud.id = "vipMissionHud";
  hud.className = "vipMissionHud hidden";
  document.getElementById("hud").appendChild(hud);

  const style = document.createElement("style");
  style.textContent = `
    .vipMissionHud{position:absolute;left:50%;top:58px;transform:translateX(-50%);z-index:8;
      min-width:min(92vw,420px);padding:8px 13px;border:1px solid #ffe36d88;border-radius:999px;
      color:#fff9cf;background:#001a30d9;box-shadow:0 8px 26px #0007;text-align:center;
      font:900 12px/1.2 system-ui;letter-spacing:.35px;backdrop-filter:blur(7px)}
    .vipMissionHud.hidden{display:none}
    .vipMissionHud strong{color:#ffe36d}
    .vipChapter{position:absolute;z-index:10;left:50%;top:18%;transform:translate(-50%,-12px) scale(.96);
      width:min(88vw,390px);padding:15px 18px;border-radius:18px;text-align:center;pointer-events:none;
      opacity:0;background:linear-gradient(135deg,#00172fed,#073e64ed);border:1px solid #ffe36d88;
      box-shadow:0 18px 55px #000b;transition:.28s;color:#fff}
    .vipChapter.show{opacity:1;transform:translate(-50%,0) scale(1)}
    .vipChapter small{display:block;color:#ffe36d;font:900 9px system-ui;letter-spacing:2px}
    .vipChapter b{display:block;margin:4px 0;font:1000 20px system-ui}
    .vipChapter span{font:700 11px/1.35 system-ui;color:#c9f5ff}
    @media(max-width:520px){.vipMissionHud{top:54px;font-size:11px;padding:7px 10px}}
  `;
  document.head.appendChild(style);

  const chapter = document.createElement("div");
  chapter.className = "vipChapter";
  document.getElementById("app").appendChild(chapter);

  const SHIP_ZONES = [
    ["CONVÉS PARTIDO", "Entre pelos destroços e encontre a primeira chave."],
    ["CASA DE MÁQUINAS", "Feche as válvulas antes que o ar acabe."],
    ["PORÃO INUNDADO", "Resgate os filhotes presos entre redes e minas."],
    ["CABINE DO CAPITÃO", "Use as três chaves e abra o cofre perdido."]
  ];
  const ABYSS_ZONES = [
    ["ZONA SEM LUZ", "Os cristais são sua única fonte de energia."],
    ["JARDIM ELÉTRICO", "Desvie das águas-vivas e carregue o Puff Prime."],
    ["FENDA VIVA", "A sombra está seguindo você. Não pare."],
    ["NINHO DA GUARDIÃ", "Colete cargas e use a arrancada contra a Enguia."]
  ];

  function showChapter(title, text) {
    chapter.innerHTML = `<small>ÁREA VIP • CAPÍTULO</small><b>${title}</b><span>${text}</span>`;
    chapter.classList.add("show");
    clearTimeout(showChapter.t);
    showChapter.t = setTimeout(() => chapter.classList.remove("show"), 2100);
  }

  function isVipStage() {
    return stage >= 2;
  }

  function resetMission() {
    obstacleSequence = 0;
    bossMode = false;
    bossTimer = 0;
    bossDefeated = false;
    lastZone = -1;
    eventCooldown = 0;
    specialSpawn = 90;
    vipTravelX = Math.max(0, W * .10);
    vipTravelVX = 0;
    vipCameraX = 0;
    mission = stage === 2
      ? { keys: 0, rescues: 0, valves: 0, air: 100, chest: false }
      : { crystals: 0, energy: 100, charges: 0, bossHp: 3 };
    hud.classList.remove("hidden");
    syncMissionHud();
    setTimeout(() => updateZone(true), 120);
  }

  function updateZone(force) {
    if (!mission || !isVipStage()) return;
    const zone = Math.min(3, Math.floor((distance / STAGES[stage].goal) * 4));
    if (force || zone !== lastZone) {
      lastZone = zone;
      const data = (stage === 2 ? SHIP_ZONES : ABYSS_ZONES)[zone];
      showChapter(data[0], data[1]);
      sfx("unlock");
    }
  }

  function syncMissionHud() {
    if (!isVipStage() || !mission) {
      hud.classList.add("hidden");
      return;
    }
    hud.classList.remove("hidden");
    if (stage === 2) {
      const chest = mission.chest ? "ABERTO" : "TRANCADO";
      hud.innerHTML = `🫧 <strong>${Math.ceil(mission.air)}%</strong> · 🔧 <strong>${mission.valves}/2</strong> · 🔑 <strong>${mission.keys}/3</strong> · 🐡 <strong>${mission.rescues}/2</strong> · 🧰 <strong>${chest}</strong>`;
    } else {
      const boss = bossDefeated ? "VENCIDA" : bossMode ? `${mission.bossHp} VIDAS` : "À ESPREITA";
      hud.innerHTML = `💎 <strong>${mission.crystals}/4</strong> · 🔆 <strong>${Math.ceil(mission.energy)}%</strong> · ⚡ CARGA <strong>${mission.charges}</strong> · 🐍 <strong>${boss}</strong>`;
    }
  }

  resetStage = function () {
    original.resetStage();
    if (isVipStage()) resetMission();
    else {
      mission = null;
      hud.classList.add("hidden");
    }
  };

  sync = function () {
    original.sync();
    syncMissionHud();
  };

  addObs = function () {
    original.addObs();
    if (!isVipStage()) return;
    const current = obs[obs.length - 1];
    const shipTypes = ["chain", "door", "mine", "net"];
    const abyssTypes = ["jelly", "rock", "vent", "shadow"];
    current.vipType = (stage === 2 ? shipTypes : abyssTypes)[obstacleSequence++ % 4];
    current.w = current.vipType === "door" ? 82 : current.vipType === "net" ? 68 : 62;
    current.wob = current.vipType === "jelly" ? 12 : current.vipType === "chain" ? 7 : current.wob;
  };

  addItem = function (requestedType) {
    if (!isVipStage() || requestedType !== "coin" || !mission) {
      original.addItem(requestedType);
      return;
    }

    const progress = distance / STAGES[stage].goal;
    let type = "coin";

    if (stage === 2) {
      if (mission.valves < 2 && progress > .22 + mission.valves * .20) type = "valve";
      else if (mission.keys < 3 && progress > .10 + mission.keys * .21) type = "key";
      else if (mission.rescues < 2 && progress > .34 + mission.rescues * .28) type = "rescue";
    } else if (mission.crystals < 4 && progress > .12 + mission.crystals * .18) {
      type = "crystal";
    } else if (bossMode && mission.charges < 2) {
      type = "spark";
    }

    original.addItem(type);
    const current = items[items.length - 1];
    if (type !== "coin") {
      current.y = H * .48 + Math.sin(distance * .15) * H * .12;
      current.r = type === "rescue" ? 16 : type === "valve" ? 17 : 13;
    }
  };

  function recordSpecialPickups(touched) {
    if (!mission) return;
    touched.forEach((type) => {
      if (type === "key" && mission.keys < 3) {
        mission.keys++;
        toast("🔑 CHAVE DOURADA ENCONTRADA!");
      }
      if (type === "rescue" && mission.rescues < 2) {
        mission.rescues++;
        score += 5;
        toast("🐡 FILHOTE RESGATADO!");
      }
      if (type === "valve" && mission.valves < 2) {
        mission.valves++;
        mission.air = Math.min(100, mission.air + 38);
        score += 6;
        toast("🔧 VÁLVULA FECHADA — INUNDAÇÃO CONTIDA!");
      }
      if (type === "crystal" && mission.crystals < 4) {
        mission.crystals++;
        mission.energy = Math.min(100, mission.energy + 28);
        score += 4;
        toast("💎 CRISTAL DE LUZ!");
      }
      if (type === "spark" && mission.charges < 3) {
        mission.charges++;
        mission.energy = Math.min(100, mission.energy + 18);
        toast("⚡ CARGA PRIME — TOQUE DUPLO PARA ATACAR!");
      }
    });
    syncMissionHud();
  }

  update = function (dt) {
    if (!isVipStage() || !running || !mission) {
      original.update(dt);
      return;
    }

    updateZone(false);

    // VIP camera/travel: Puff Prime visibly advances through the world instead of
    // feeling fixed while every obstacle comes toward him. FREE stages are untouched.
    const vipProgress = Math.min(1, distance / STAGES[stage].goal);
    const cruiseX = W * (.25 + vipProgress * .16);
    const surge = Math.min(W * .055, Math.max(0, -fish.v) * 2.4);
    const targetX = clamp(cruiseX + surge, W * .23, W * .47);
    vipTravelVX += (targetX - fish.x) * .018 * dt;
    vipTravelVX *= Math.pow(.86, dt);
    fish.x += vipTravelVX * dt;
    fish.x = clamp(fish.x, W * .22, W * .49);
    vipCameraX += speed() * dt * (stage === 3 ? .48 : .40);

    eventCooldown = Math.max(0, eventCooldown - dt);
    specialSpawn -= dt;
    const touched = [];
    for (const p of items) {
      if (!p.dead && ["key", "rescue", "crystal", "valve", "spark"].includes(p.type) &&
          Math.hypot(p.x - fish.x, p.y - fish.y) < fish.r + p.r) {
        touched.push(p.type);
      }
    }

    if (stage === 2) {
      const progress = distance / STAGES[stage].goal;
      const drain = progress > .25 && progress < .78 ? (mission.valves < 2 ? .026 : .008) : .004;
      mission.air = Math.max(0, mission.air - drain * dt);
      if (mission.air <= 0 && inv <= 0) {
        mission.air = 32;
        damage();
        toast("🫧 SEM AR — ENCONTRE UMA VÁLVULA!");
      }
      if (progress > .52 && progress < .76) fish.y += Math.sin(bg * .055) * .34 * dt;
    }

    if (stage === 3) {
      mission.energy = Math.max(0, mission.energy - .0105 * dt);
      if (mission.energy <= 0 && inv <= 0) {
        mission.energy = 34;
        damage();
        toast("🌑 A ESCURIDÃO DRENOU UMA VIDA!");
      }

      if (bossMode && !bossDefeated) {
        bossTimer -= dt;
        if (specialSpawn <= 0) {
          original.addItem("spark");
          const charge = items[items.length - 1];
          charge.y = H * (.25 + Math.random() * .5);
          specialSpawn = 150;
        }
        if (bossTimer <= 0 && !bossDefeated) {
          bossTimer = 300;
          damage();
          toast("🐍 A GUARDIÃ ATACOU — USE CARGAS PRIME!");
        }
      }
    }

    original.update(dt);
    recordSpecialPickups(touched);
  };

  finish = function () {
    if (stage === 2 && mission) {
      if (mission.keys < 3 || mission.rescues < 2 || mission.valves < 2) {
        distance = STAGES[stage].goal - 9;
        if (mission.valves < 2) original.addItem("valve");
        else if (mission.keys < 3) original.addItem("key");
        else original.addItem("rescue");
        const forced = items[items.length - 1];
        forced.y = H * .5;
        forced.r = forced.type === "rescue" ? 16 : 13;
        toast("🧭 O COFRE EXIGE TODAS AS MISSÕES!");
        return;
      }
      if (!mission.chest) {
        mission.chest = true;
        score += 30;
        coins += 10;
        sfx("win");
        showChapter("COFRE DO CAPITÃO ABERTO", "+10 moedas VIP e o mapa secreto do Abismo foram encontrados.");
        distance = STAGES[stage].goal - 4;
        return;
      }
    }

    if (stage === 3 && mission) {
      if (mission.crystals < 4) {
        distance = STAGES[stage].goal - 9;
        original.addItem("crystal");
        items[items.length - 1].y = H * .5;
        toast("💎 ENCONTRE TODOS OS CRISTAIS!");
        return;
      }
      if (!bossDefeated) {
        distance = STAGES[stage].goal - 8;
        if (!bossMode) {
          bossMode = true;
          bossTimer = 330;
          specialSpawn = 20;
          showChapter("ENGUIA GUARDIÃ", "Colete uma carga elétrica e dê toque duplo para atacar. São três golpes.");
        }
        return;
      }
    }

    original.finish();
  };

  function drawWorldImage(image) {
    if (!image || !image.complete || !image.naturalWidth) return false;
    // Overscan + camera pan: the illustration becomes a traversable world,
    // rather than a static poster behind moving obstacles.
    const scale = Math.max((W * 1.38) / image.naturalWidth, (H * 1.08) / image.naturalHeight);
    const dw = image.naturalWidth * scale;
    const dh = image.naturalHeight * scale;
    const maxPanX = Math.max(0, dw - W);
    const maxPanY = Math.max(0, dh - H);
    const progress = Math.min(1, distance / STAGES[stage].goal);
    const panX = -maxPanX * (.08 + progress * .84);
    const breatheX = Math.sin(bg * .0025) * 7;
    const breatheY = Math.sin(bg * .0017) * Math.min(10, maxPanY * .12);
    ctx.drawImage(image, panX + breatheX, -maxPanY * .5 + breatheY, dw, dh);
    return true;
  }

  background = function () {
    if (!isVipStage()) {
      original.background();
      return;
    }

    bg += speed() * .32;
    if (!drawWorldImage(vipWorlds[stage])) {
      const fallback = ctx.createLinearGradient(0, 0, 0, H);
      fallback.addColorStop(0, STAGES[stage].colors[0]);
      fallback.addColorStop(1, STAGES[stage].colors[1]);
      ctx.fillStyle = fallback;
      ctx.fillRect(0, 0, W, H);
    }

    // Vignette preserva leitura do personagem, obstáculos e HUD.
    const vignette = ctx.createRadialGradient(W * .38, H * .48, 30, W * .45, H * .5, Math.max(W, H) * .72);
    vignette.addColorStop(0, "rgba(0,18,38,.02)");
    vignette.addColorStop(1, stage === 2 ? "rgba(0,13,28,.55)" : "rgba(0,0,18,.68)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    ctx.globalAlpha = .24;
    ctx.fillStyle = "#d7fbff";
    for (let i = 0; i < 16; i++) {
      const bx = (i * 83 + bg * (.08 + i % 3 * .02)) % W;
      const by = H - ((i * 71 + bg * (.18 + i % 4 * .03)) % H);
      ctx.beginPath(); ctx.arc(bx, by, 1.5 + i % 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.save();
    if (stage === 2) {
      // Costelas do navio, vigias e destroços em paralaxe.
      ctx.globalAlpha = .34;
      ctx.strokeStyle = "#c78e51";
      ctx.lineWidth = 7;
      for (let i = 0; i < 6; i++) {
        const x = ((i * 150 - bg * .38) % (W + 160)) - 70;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.quadraticCurveTo(x + 45, H * .45, x + 10, H);
        ctx.stroke();
      }
      ctx.fillStyle = "#85e9ff";
      for (let i = 0; i < 4; i++) {
        const x = ((i * 220 - bg * .2) % (W + 180)) - 80;
        ctx.beginPath();
        ctx.arc(x, H * .23, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#07334c";
        ctx.beginPath();
        ctx.arc(x, H * .23, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#85e9ff";
      }
    } else {
      // Névoa viva, feixes bioluminescentes e presença da Enguia.
      const glow = Math.max(.035, (mission ? mission.energy : 100) / 100 * .34);
      const radial = ctx.createRadialGradient(fish.x, fish.y, 18, fish.x, fish.y, Math.max(W, H) * .55);
      radial.addColorStop(0, "rgba(90,225,255," + glow + ")");
      radial.addColorStop(1, "rgba(0,0,12,.78)");
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, W, H);

      ctx.globalAlpha = bossMode ? .82 : .22;
      ctx.strokeStyle = "#73f4ff";
      ctx.lineWidth = bossMode ? 14 : 4;
      const ey = H * .5 + Math.sin(bg * .025) * H * .22;
      ctx.beginPath();
      ctx.moveTo(W + 40, ey);
      ctx.bezierCurveTo(W * .75, ey - 80, W * .62, ey + 90, W * .48, ey);
      ctx.stroke();
      if (bossMode && mission) {
        ctx.fillStyle = "#ffdf64";
        for (let i = 0; i < mission.bossHp; i++) {
          ctx.beginPath(); ctx.arc(W - 28 - i * 19, 105, 6, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    ctx.restore();
  };

  function drawSegmentedHazard(o, top, color, accent, mode) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = accent;
    ctx.lineWidth = mode === "chain" ? 5 : 3;

    if (mode === "chain") {
      for (let y = 6; y < top; y += 17) {
        ctx.beginPath();
        ctx.ellipse(o.x + o.w / 2, y, 8, 5, y % 34 ? .5 : -.5, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let y = top + o.gap; y < H - 27; y += 17) {
        ctx.beginPath();
        ctx.ellipse(o.x + o.w / 2, y, 8, 5, y % 34 ? .5 : -.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (mode === "net") {
      ctx.globalAlpha = .72;
      for (let y = 0; y < top; y += 13) {
        ctx.beginPath(); ctx.moveTo(o.x, y); ctx.lineTo(o.x + o.w, y + 12); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(o.x + o.w, y); ctx.lineTo(o.x, y + 12); ctx.stroke();
      }
      for (let y = top + o.gap; y < H - 27; y += 13) {
        ctx.beginPath(); ctx.moveTo(o.x, y); ctx.lineTo(o.x + o.w, y + 12); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(o.x + o.w, y); ctx.lineTo(o.x, y + 12); ctx.stroke();
      }
    } else {
      ctx.fillRect(o.x, 0, o.w, top);
      ctx.fillRect(o.x, top + o.gap, o.w, H - top - o.gap - 27);
      ctx.strokeRect(o.x + 4, 3, o.w - 8, Math.max(0, top - 7));
      ctx.strokeRect(o.x + 4, top + o.gap + 4, o.w - 8, Math.max(0, H - top - o.gap - 35));
    }
    ctx.restore();
  }

  drawObs = function (o) {
    if (!isVipStage() || !o.vipType) {
      original.drawObs(o);
      return;
    }

    const top = o.top + Math.sin(o.t) * o.wob;

    if (o.vipType === "chain") drawSegmentedHazard(o, top, "#5e4d40", "#d0b58e", "chain");
    if (o.vipType === "door") drawSegmentedHazard(o, top, "#70452c", "#e2a45e", "door");
    if (o.vipType === "net") drawSegmentedHazard(o, top, "#1f6670", "#8cf4ec", "net");

    if (o.vipType === "mine") {
      drawSegmentedHazard(o, top, "#193f4c", "#50b9bd", "door");
      ctx.save();
      ctx.translate(o.x + o.w / 2, top - 18);
      ctx.fillStyle = "#242b37"; ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#ffb347"; ctx.lineWidth = 3;
      for (let a = 0; a < 8; a++) { ctx.beginPath(); ctx.moveTo(Math.cos(a) * 12, Math.sin(a) * 12); ctx.lineTo(Math.cos(a) * 22, Math.sin(a) * 22); ctx.stroke(); }
      ctx.restore();
    }

    if (o.vipType === "jelly") {
      drawSegmentedHazard(o, top, "#142552", "#7c8dff", "chain");
      ctx.save(); ctx.globalAlpha = .85; ctx.fillStyle = "#8c75ff";
      ctx.beginPath(); ctx.arc(o.x + o.w / 2, top - 19, 18, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = "#8ff8ff"; ctx.lineWidth = 2;
      for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(o.x + o.w / 2 + k * 6, top - 19); ctx.quadraticCurveTo(o.x + o.w / 2 + k * 8, top + 3, o.x + o.w / 2 + k * 4, top + 18); ctx.stroke(); }
      ctx.restore();
    }

    if (o.vipType === "rock") drawSegmentedHazard(o, top, "#18233b", "#526685", "door");
    if (o.vipType === "vent") drawSegmentedHazard(o, top, "#24364a", "#ff865e", "net");
    if (o.vipType === "shadow") drawSegmentedHazard(o, top, "#080d24", "#5362b9", "chain");
  };

  drawItem = function (p) {
    if (!["key", "rescue", "crystal", "valve", "spark"].includes(p.type)) {
      original.drawItem(p);
      return;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    const pulse = 1 + Math.sin(p.t) * .12;
    ctx.scale(pulse, pulse);
    ctx.shadowBlur = 22;
    ctx.shadowColor = p.type === "key" ? "#ffe36d" : p.type === "crystal" ? "#81f8ff" : "#65dfff";

    if (p.type === "key") {
      ctx.strokeStyle = "#ffe36d"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(-5, 0, 7, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(19, 0); ctx.lineTo(19, 7); ctx.moveTo(12, 0); ctx.lineTo(12, 6); ctx.stroke();
    }

    if (p.type === "crystal") {
      ctx.fillStyle = "#81f8ff";
      ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(12, -4); ctx.lineTo(7, 15); ctx.lineTo(-8, 14); ctx.lineTo(-13, -4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.globalAlpha = .55;
      ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(5, -3); ctx.lineTo(1, 7); ctx.closePath(); ctx.fill();
    }

    if (p.type === "rescue") {
      ctx.fillStyle = "#ffd94d"; ctx.beginPath(); ctx.ellipse(0, 0, 17, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#64d9ef"; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-25, -9); ctx.lineTo(-23, 10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(7, -4, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#09253b"; ctx.beginPath(); ctx.arc(8, -4, 2, 0, Math.PI * 2); ctx.fill();
    }
    if (p.type === "valve") {
      ctx.strokeStyle = "#ffb15a"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.stroke();
      for (let a = 0; a < 6; a++) { ctx.beginPath(); ctx.moveTo(Math.cos(a) * 10, Math.sin(a) * 10); ctx.lineTo(Math.cos(a) * 19, Math.sin(a) * 19); ctx.stroke(); }
    }
    if (p.type === "spark") {
      ctx.fillStyle = "#fff36a"; ctx.beginPath();
      ctx.moveTo(3,-18);ctx.lineTo(-10,2);ctx.lineTo(-2,2);ctx.lineTo(-7,18);ctx.lineTo(12,-5);ctx.lineTo(3,-5);ctx.closePath();ctx.fill();
    }
    ctx.restore();
  };

  drawFish = function () {
    if (!isVipStage()) {
      original.drawFish();
      return;
    }

    ctx.save();
    ctx.translate(fish.x, fish.y);
    ctx.rotate(clamp(fish.v * .035, -.22, .34));
    ctx.globalAlpha = inv > 0 && Math.floor(inv / 8) % 2 ? .55 : 1;
    if (puffPrimeArt.complete && puffPrimeArt.naturalWidth) {
      const targetW = holding ? 82 : 70;
      const targetH = targetW * (puffPrimeArt.naturalHeight / puffPrimeArt.naturalWidth);
      ctx.drawImage(puffPrimeArt, -targetW * .52, -targetH * .5, targetW, targetH);
    } else {
      ctx.restore();
      original.drawFish();
      ctx.save();
    }
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const aura = ctx.createRadialGradient(fish.x, fish.y, 12, fish.x, fish.y, holding ? 58 : 43);
    aura.addColorStop(0, "rgba(88,225,255,.38)");
    aura.addColorStop(.58, "rgba(255,221,90,.10)");
    aura.addColorStop(1, "rgba(88,225,255,0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(fish.x, fish.y, holding ? 58 : 43, 0, Math.PI * 2);
    ctx.fill();

    if (holding) {
      ctx.strokeStyle = "#ffe36d";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(fish.x, fish.y, 43 + Math.sin(bg * .1) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  };

  C.addEventListener("pointerdown", () => {
    if (!isVipStage() || !running) return;
    const now = performance.now();
    if (now - lastTap < 290) {
      fish.v = -9.2;
      inv = Math.max(inv, 45);
      sfx("unlock");
      if (stage === 3 && bossMode && mission && mission.charges > 0 && !bossDefeated) {
        mission.charges--;
        mission.bossHp--;
        bossTimer = 330;
        score += 12;
        toast(`⚡ GOLPE PRIME! GUARDIÃ ${Math.max(0, mission.bossHp)}/3`);
        if (mission.bossHp <= 0) {
          bossDefeated = true;
          bossMode = false;
          score += 35;
          sfx("win");
          showChapter("GUARDIÃ VENCIDA", "O Abismo reconheceu o domínio do Puff Prime.");
        }
        syncMissionHud();
      } else toast("⚡ ARRANCADA PRIME!");
    }
    lastTap = now;
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => {
      if (!running || !isVipStage()) return;
      holding = true;
      inv = Math.max(inv, 170);
      toast("🛡️ PUFF PRIME INFLADO!");
    }, 380);
  }, { passive: true });

  function releaseHold() {
    clearTimeout(holdTimer);
    holding = false;
  }
  C.addEventListener("pointerup", releaseHold, { passive: true });
  C.addEventListener("pointercancel", releaseHold, { passive: true });

  const originalScreen = screen;
  screen = function (id) {
    originalScreen(id);
    if (id !== "intro" && id !== "complete" && id !== "gameover") {
      if (id !== "map") hud.classList.add("hidden");
    }
  };
})();
