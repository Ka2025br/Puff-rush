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
    @media(max-width:520px){.vipMissionHud{top:54px;font-size:11px;padding:7px 10px}}
  `;
  document.head.appendChild(style);

  function isVipStage() {
    return stage >= 2;
  }

  function resetMission() {
    obstacleSequence = 0;
    bossMode = false;
    bossTimer = 0;
    bossDefeated = false;
    mission = stage === 2
      ? { keys: 0, rescues: 0 }
      : { crystals: 0, energy: 100 };
    hud.classList.remove("hidden");
    syncMissionHud();
  }

  function syncMissionHud() {
    if (!isVipStage() || !mission) {
      hud.classList.add("hidden");
      return;
    }
    hud.classList.remove("hidden");
    if (stage === 2) {
      const chest = mission.keys >= 3 && mission.rescues >= 2 ? "ABERTO" : "BLOQUEADO";
      hud.innerHTML = `🔑 <strong>${mission.keys}/3</strong> · 🐡 RESGATES <strong>${mission.rescues}/2</strong> · 🧰 BAÚ <strong>${chest}</strong>`;
    } else {
      const boss = bossDefeated ? "VENCIDA" : bossMode ? Math.max(0, Math.ceil(bossTimer / 60)) + "s" : "AGUARDA";
      hud.innerHTML = `💎 LUZ <strong>${mission.crystals}/4</strong> · 🔆 ENERGIA <strong>${Math.ceil(mission.energy)}%</strong> · ⚡ ENGUIA <strong>${boss}</strong>`;
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
      if (mission.keys < 3 && progress > .14 + mission.keys * .20) type = "key";
      else if (mission.rescues < 2 && progress > .34 + mission.rescues * .28) type = "rescue";
    } else if (mission.crystals < 4 && progress > .12 + mission.crystals * .18) {
      type = "crystal";
    }

    original.addItem(type);
    const current = items[items.length - 1];
    if (type !== "coin") {
      current.y = H * .48 + Math.sin(distance * .15) * H * .12;
      current.r = type === "rescue" ? 16 : 13;
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
      if (type === "crystal" && mission.crystals < 4) {
        mission.crystals++;
        mission.energy = Math.min(100, mission.energy + 28);
        score += 4;
        toast("💎 CRISTAL DE LUZ!");
      }
    });
    syncMissionHud();
  }

  update = function (dt) {
    if (!isVipStage() || !running || !mission) {
      original.update(dt);
      return;
    }

    const touched = [];
    for (const p of items) {
      if (!p.dead && ["key", "rescue", "crystal"].includes(p.type) &&
          Math.hypot(p.x - fish.x, p.y - fish.y) < fish.r + p.r) {
        touched.push(p.type);
      }
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
        if (bossTimer <= 0) {
          bossDefeated = true;
          bossMode = false;
          score += 20;
          sfx("win");
          toast("⚡ ENGUIA GUARDIÃ VENCIDA!");
        }
      }
    }

    original.update(dt);
    recordSpecialPickups(touched);
  };

  finish = function () {
    if (stage === 2 && mission) {
      if (mission.keys < 3 || mission.rescues < 2) {
        distance = STAGES[stage].goal - 9;
        if (mission.keys < 3) original.addItem("key");
        else original.addItem("rescue");
        const forced = items[items.length - 1];
        forced.y = H * .5;
        forced.r = forced.type === "rescue" ? 16 : 13;
        toast("🧭 COMPLETE AS TAREFAS DO NAVIO!");
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
          bossTimer = 720;
          toast("⚡ SOBREVIVA À ENGUIA GUARDIÃ!");
        }
        return;
      }
    }

    original.finish();
  };

  background = function () {
    original.background();
    if (!isVipStage()) return;

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
      const glow = Math.max(.08, (mission ? mission.energy : 100) / 100 * .3);
      const radial = ctx.createRadialGradient(fish.x, fish.y, 18, fish.x, fish.y, Math.max(W, H) * .55);
      radial.addColorStop(0, "rgba(90,225,255," + glow + ")");
      radial.addColorStop(1, "rgba(0,0,12,.78)");
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, W, H);

      ctx.globalAlpha = bossMode ? .62 : .22;
      ctx.strokeStyle = "#73f4ff";
      ctx.lineWidth = bossMode ? 14 : 4;
      const ey = H * .5 + Math.sin(bg * .025) * H * .22;
      ctx.beginPath();
      ctx.moveTo(W + 40, ey);
      ctx.bezierCurveTo(W * .75, ey - 80, W * .62, ey + 90, W * .48, ey);
      ctx.stroke();
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
    if (!["key", "rescue", "crystal"].includes(p.type)) {
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
    ctx.restore();
  };

  drawFish = function () {
    original.drawFish();
    if (!isVipStage()) return;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const aura = ctx.createRadialGradient(fish.x, fish.y, 15, fish.x, fish.y, holding ? 54 : 38);
    aura.addColorStop(0, "rgba(88,225,255,.30)");
    aura.addColorStop(1, "rgba(88,225,255,0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(fish.x, fish.y, holding ? 54 : 38, 0, Math.PI * 2);
    ctx.fill();

    if (holding) {
      ctx.strokeStyle = "#ffe36d";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(fish.x, fish.y, 40 + Math.sin(bg * .1) * 3, 0, Math.PI * 2);
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
      toast("⚡ ARRANCADA PRIME!");
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
