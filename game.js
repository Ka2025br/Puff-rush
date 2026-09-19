const $=q=>document.querySelector(q),C=$("#game"),ctx=C.getContext("2d",{alpha:false});
const screens=["home","map","intro","complete","gameover","premium"];
let W=0,H=0,D=1,last=0,running=false,stage=0,score=0,coins=0,lives=3,distance=0,spawn=0,pickSpawn=0,powerSpawn=0,inv=0,fish,obs=[],items=[],fx=[],bg=0,combo=0,comboT=0;
let best=+(localStorage.pr35best||0),bank=+(localStorage.pr35bank||0),unlocked=Math.min(3,+(localStorage.pr35unlock||0)),stars=JSON.parse(localStorage.pr35stars||"[0,0,0,0]");
const STAGES=[
 {name:"RECIFE TRANQUILO",short:"RECIFE",icon:"🪸",desc:"Domine o movimento entre corais e cardumes.",mission:"Chegue ao final • 3 vidas • colete moedas",goal:32,gap:.26,speed:2.65,colors:["#6ae7f1","#087ca2"],mechanic:"coral"},
 {name:"CAVERNA DE CRISTAIS",short:"CAVERNA",icon:"💎",desc:"A luz diminui e as pedras começam a se mover.",mission:"Atravesse a caverna • obstáculos móveis",goal:38,gap:.235,speed:3.05,colors:["#234c86","#160d43"],mechanic:"cave"},
 {name:"NAVIO AFUNDADO",short:"NAVIO",icon:"⚓",desc:"Entre nos destroços e escape de correntes e mastros.",mission:"Passe pelo casco • correnteza lateral",goal:44,gap:.22,speed:3.4,colors:["#247e92","#062b46"],mechanic:"ship"},
 {name:"GELEIRAS POLARES",short:"GELEIRAS",icon:"🧊",desc:"A fase final: gelo móvel, velocidade e precisão.",mission:"Conquiste as geleiras • encontre o Portal Premium",goal:50,gap:.205,speed:3.75,colors:["#b6f3ff","#347db8"],mechanic:"ice"}
];
function resize(){D=Math.min(devicePixelRatio||1,2);W=C.clientWidth;H=C.clientHeight;C.width=W*D;C.height=H*D;ctx.setTransform(D,0,0,D,0,0)}addEventListener("resize",resize,{passive:true});resize();
const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function screen(id){screens.forEach(s=>$("#"+s).classList.toggle("hidden",s!==id));$("#hud").classList.add("hidden")}
function toast(t){let e=$("#toast");e.textContent=t;e.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove("show"),1000)}
function persist(){localStorage.pr35best=Math.max(best,score);localStorage.pr35bank=bank;localStorage.pr35unlock=unlocked;localStorage.pr35stars=JSON.stringify(stars);best=Math.max(best,score);homeStats()}
function homeStats(){$("#best").textContent=best;$("#bank").textContent=bank;$("#starsBank").textContent=stars.reduce((a,b)=>a+b,0);$("#continueBtn").textContent=unlocked?"CONTINUAR JORNADA":"COMEÇAR JORNADA"}
function mapDraw(){let h="";STAGES.forEach((s,i)=>{let lock=i>unlocked;h+=`<div class="stageCard ${lock?"locked":""}" data-i="${i}"><span class="medal">${"⭐".repeat(stars[i])}</span><div class="ico">${s.icon}${lock?" 🔒":""}</div><b>${i+1}. ${s.name}</b><small>${s.desc}</small></div>`});$("#stageCards").innerHTML=h;document.querySelectorAll(".stageCard").forEach(e=>e.onclick=()=>{let i=+e.dataset.i;if(i<=unlocked)intro(i)})}
function intro(i){stage=i;let s=STAGES[i];$("#introIcon").textContent=s.icon;$("#introTitle").textContent=s.name;$("#introDesc").textContent=s.desc;$("#introMission").textContent="MISSÃO • "+s.mission;screen("intro")}
function resetStage(){let s=STAGES[stage];score=0;coins=0;lives=3;distance=0;spawn=45;pickSpawn=55;powerSpawn=300;inv=0;combo=0;obs=[];items=[];fx=[];fish={x:W*.24,y:H*.45,v:0,r:21};running=true;screens.forEach(q=>$("#"+q).classList.add("hidden"));$("#hud").classList.remove("hidden");sync()}
function sync(){let s=STAGES[stage];$("#stageName").textContent=s.short;$("#score").textContent=score;$("#coins").textContent=coins;$("#lives").textContent=lives;$("#progress").textContent=Math.min(100,Math.floor(distance/s.goal*100))+"%"}
function speed(){return STAGES[stage].speed+Math.min(distance,50)*.008}
function flap(){if(!running)return;fish.v=-6.15;for(let i=0;i<5;i++)fx.push({x:fish.x-18,y:fish.y+rnd(-8,8),vx:rnd(-2.2,-.6),vy:rnd(-.8,.8),life:1})}
function addObs(){let s=STAGES[stage],gap=Math.max(128,H*s.gap),top=rnd(75,Math.max(85,H-gap-145));obs.push({x:W+70,top,gap,w:rnd(58,73),passed:false,t:rnd(0,6),wob:stage?rnd(2,stage*4+3):0})}
function addItem(type="coin"){items.push({type,x:W+35,y:rnd(90,H-105),r:type==="coin"?9:13,t:rnd(0,6)})}
function hit(o){let top=o.top+Math.sin(o.t)*o.wob;return fish.x+fish.r-5>o.x&&fish.x-fish.r+5<o.x+o.w&&(fish.y-fish.r+5<top||fish.y+fish.r-5>top+o.gap)}
function damage(){if(inv>0)return;lives--;inv=100;combo=0;toast(lives?"💥 CUIDADO!":"💥 FIM DA TENTATIVA");sync();if(lives<=0)fail()}
function fail(){running=false;bank+=coins;persist();$("#gameoverText").innerHTML=`Você chegou a <b>${Math.floor(distance/STAGES[stage].goal*100)}%</b> de ${STAGES[stage].name}.<br>Moedas salvas: <b>${coins}</b>.`;screen("gameover")}
function finish(){running=false;let s=STAGES[stage],rating=lives===3&&coins>=8?3:lives>=2?2:1;stars[stage]=Math.max(stars[stage],rating);bank+=coins;if(stage<3)unlocked=Math.max(unlocked,stage+1);persist();$("#completeTitle").textContent=s.name;$("#stars").textContent="★".repeat(rating)+"☆".repeat(3-rating);$("#completeText").innerHTML=`<b>${score} pontos</b> · ${coins} moedas · ${lives} vida${lives!==1?"s":""}<br>${rating===3?"PERFEITO! Você dominou esta fase.":rating===2?"Ótima corrida. Tente 3 estrelas!":"Fase vencida. Há espaço para dominar o percurso."}`;$("#nextStage").textContent=stage===3?"ENCONTRAR O PORTAL":"PRÓXIMA FASE";screen("complete")}
function update(dt){if(!running)return;let s=STAGES[stage];fish.v+=.335*dt;fish.y+=fish.v*dt;if(stage===2)fish.y+=Math.sin(bg*.02)*.22*dt;spawn-=dt;pickSpawn-=dt;powerSpawn-=dt;inv=Math.max(0,inv-dt);comboT-=dt;if(comboT<=0)combo=0;
 if(spawn<=0){addObs();spawn=Math.max(60,100-stage*8)}
 if(pickSpawn<=0){addItem("coin");pickSpawn=rnd(62,105)}
 if(powerSpawn<=0){addItem("shield");powerSpawn=rnd(320,450)}
 let sp=speed()*dt;distance+=sp*.0085; if(distance>=s.goal){finish();return}
 for(const o of obs){o.x-=sp;o.t+=.028*dt;if(!o.passed&&o.x+o.w<fish.x){o.passed=true;score+=2;combo++;comboT=150;if(combo===5){score+=3;combo=0;toast("⚡ COMBO +3")}sync()}if(hit(o))damage()}
 for(const p of items){p.x-=sp*.92;p.t+=.07*dt;if(Math.hypot(p.x-fish.x,p.y-fish.y)<fish.r+p.r){p.dead=true;if(p.type==="coin"){coins++;score++;if(coins%5===0)toast("🪙 SEQUÊNCIA DE MOEDAS!")}else{inv=330;toast("🛡️ ESCUDO ATIVO")}sync()}}
 obs=obs.filter(o=>o.x>-100);items=items.filter(p=>!p.dead&&p.x>-30);for(const p of fx){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=.035*dt}fx=fx.filter(p=>p.life>0);
 if(fish.y-fish.r<0||fish.y+fish.r>H-27){damage();fish.y=clamp(fish.y,fish.r+3,H-51);fish.v=0}
 sync()
}
function background(){let s=STAGES[stage],g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,s.colors[0]);g.addColorStop(1,s.colors[1]);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);bg+=speed()*.32;
 ctx.globalAlpha=.14;ctx.fillStyle="#fff";for(let i=0;i<14;i++){let bx=(i*91+bg*.14)%W,by=H-((i*79+bg*(.35+i%3*.1))%H);ctx.beginPath();ctx.arc(bx,by,2+i%4,0,7);ctx.fill()}ctx.globalAlpha=1;
 if(stage===0){ctx.fillStyle="#16a985";for(let i=0;i<8;i++){let q=(i*90-bg*.5)%W;ctx.fillRect(q,H-66,5,40);ctx.beginPath();ctx.arc(q+3,H-68,11,0,7);ctx.fill()}ctx.fillStyle="#e1c674";ctx.fillRect(0,H-27,W,27)}
 if(stage===1){ctx.globalAlpha=.28;ctx.fillStyle="#8a63ff";for(let i=0;i<7;i++){let q=(i*105-bg*.25)%W;ctx.beginPath();ctx.moveTo(q,H);ctx.lineTo(q+20,H-95-(i%3)*20);ctx.lineTo(q+42,H);ctx.fill()}ctx.globalAlpha=1}
 if(stage===2){ctx.strokeStyle="#09283b";ctx.lineWidth=9;ctx.globalAlpha=.7;for(let i=0;i<5;i++){let q=(i*145-bg*.4)%W;ctx.beginPath();ctx.moveTo(q,0);ctx.lineTo(q-75,190);ctx.stroke()}ctx.fillStyle="#573d27";ctx.fillRect((W-bg*.55)%(W+240)-120,H-75,120,18);ctx.globalAlpha=1}
 if(stage===3){ctx.fillStyle="#e4faff";ctx.fillRect(0,H-28,W,28);ctx.globalAlpha=.32;for(let i=0;i<5;i++){let q=i*140-bg*.2;ctx.beginPath();ctx.moveTo(q,0);ctx.lineTo(q+55,130);ctx.lineTo(q+100,0);ctx.fill()}ctx.globalAlpha=1}
}
function drawObs(o){let top=o.top+Math.sin(o.t)*o.wob,g=ctx.createLinearGradient(o.x,0,o.x+o.w,0);let mid=stage===3?"#8edbed":stage===1?"#7354b7":"#187f8d";g.addColorStop(0,"#07384e");g.addColorStop(.5,mid);g.addColorStop(1,"#052b43");ctx.fillStyle=g;ctx.fillRect(o.x,0,o.w,top);ctx.fillRect(o.x,top+o.gap,o.w,H-top-o.gap-27);ctx.fillStyle=stage===3?"#d8f8ff":"#36b7ad";ctx.fillRect(o.x-4,top-13,o.w+8,13);ctx.fillRect(o.x-4,top+o.gap,o.w+8,13)}
function drawItem(p){ctx.save();ctx.translate(p.x,p.y);let k=1+Math.sin(p.t)*.12;ctx.scale(k,k);ctx.shadowBlur=18;ctx.shadowColor=p.type==="coin"?"#ffe35b":"#92f6ff";ctx.fillStyle=p.type==="coin"?"#ffd43c":"#a7f7ff";ctx.beginPath();ctx.arc(0,0,p.r,0,7);ctx.fill();ctx.fillStyle="#fff8";ctx.beginPath();ctx.arc(-3,-3,p.r*.28,0,7);ctx.fill();ctx.restore()}
function drawFish(){ctx.save();ctx.translate(fish.x,fish.y);ctx.rotate(clamp(fish.v*.05,-.3,.55));ctx.globalAlpha=inv>0&&Math.floor(inv/8)%2?.5:1;ctx.fillStyle="#70d9ec";ctx.beginPath();ctx.moveTo(-17,0);ctx.lineTo(-42,-16);ctx.lineTo(-37,17);ctx.closePath();ctx.fill();ctx.fillStyle="#ffe264";ctx.beginPath();ctx.ellipse(0,0,27,22,0,0,7);ctx.fill();ctx.strokeStyle="#d5ae24";ctx.lineWidth=2;for(let a=0;a<6;a++){let q=a*Math.PI/3;ctx.beginPath();ctx.moveTo(Math.cos(q)*20,Math.sin(q)*16);ctx.lineTo(Math.cos(q)*30,Math.sin(q)*24);ctx.stroke()}ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(10,-7,7,0,7);ctx.fill();ctx.fillStyle="#082b3d";ctx.beginPath();ctx.arc(13,-7,3,0,7);ctx.fill();ctx.strokeStyle="#8d6815";ctx.beginPath();ctx.arc(9,6,7,.1,2.8);ctx.stroke();if(inv>120){ctx.strokeStyle="#b7f7ff";ctx.lineWidth=3;ctx.globalAlpha=.7;ctx.beginPath();ctx.arc(0,0,35,0,7);ctx.stroke()}ctx.restore()}
function render(){background();for(const o of obs)drawObs(o);for(const p of items)drawItem(p);for(const p of fx){ctx.globalAlpha=p.life;ctx.fillStyle="#d8fbff";ctx.beginPath();ctx.arc(p.x,p.y,3,0,7);ctx.fill();ctx.globalAlpha=1}drawFish()}
function loop(t){let dt=Math.min(2,(t-last)/16.667||1);last=t;update(dt);render();requestAnimationFrame(loop)}
$("#continueBtn").onclick=()=>intro(unlocked);$("#mapBtn").onclick=()=>{mapDraw();screen("map")};$("#mapBack").onclick=()=>screen("home");$("#startStage").onclick=resetStage;$("#retry").onclick=resetStage;$("#goMap").onclick=()=>{mapDraw();screen("map")};$("#retryStage").onclick=resetStage;$("#nextStage").onclick=()=>{if(stage===3)screen("premium");else intro(stage+1)};$("#premiumHome").onclick=()=>screen("home");$("#premiumPreview").onclick=()=>toast("👑 PREMIUM CHEGA NA V4");
C.addEventListener("pointerdown",flap,{passive:true});addEventListener("keydown",e=>{if(e.code==="Space"){e.preventDefault();flap()}});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&running){running=false;bank+=coins;persist();$("#gameoverText").innerHTML="Jogo pausado e moedas salvas.<br>Volte quando quiser.";screen("gameover")}});
fish={x:W*.24,y:H*.45,v:0,r:21};homeStats();mapDraw();requestAnimationFrame(loop);