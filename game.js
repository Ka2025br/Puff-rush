const $=s=>document.querySelector(s), C=$("#game"),x=C.getContext("2d",{alpha:false});
const menu=$("#menu"),worlds=$("#worlds"),result=$("#result"),hud=$("#hud"),toast=$("#toast");
const S=$("#score"),CO=$("#coins"),LI=$("#lives"),WL=$("#worldLabel"),BEST=$("#best"),BANK=$("#bank");
let W,H,D,last=0,running=false,score=0,coins=0,lives=3,world=0,spawn=0,coinSpawn=0,powerSpawn=0,fish,rocks=[],pickups=[],fx=[],bg=0,inv=0,combo=0,comboT=0;
let best=+(localStorage.pr3best||0),bank=+(localStorage.pr3bank||0),unlocked=Math.max(0,+(localStorage.pr3world||0));
const maps=[
 {n:"RECIFE TRANQUILO",e:"🪸",a:"#61e5ef",b:"#087ba2",need:0,desc:"Aprenda o ritmo e colete moedas."},
 {n:"CAVERNA SOMBRIA",e:"💎",a:"#184a82",b:"#160d45",need:8,desc:"Cristais, sombras e passagens estreitas."},
 {n:"NAVIO AFUNDADO",e:"⚓",a:"#176e88",b:"#072d49",need:18,desc:"Destroços e obstáculos em movimento."},
 {n:"OCEANO PROFUNDO",e:"🪼",a:"#123f77",b:"#061633",need:30,desc:"Escuridão, águas-vivas e alta pressão."},
 {n:"MUNDO TROPICAL",e:"🏝️",a:"#65dff0",b:"#0879a0",need:45,desc:"Correntes rápidas e recompensas."},
 {n:"GELEIRAS POLARES",e:"🧊",a:"#a9edff",b:"#347fc0",need:65,desc:"Gelo, vento e reflexos rápidos."},
 {n:"CIDADE SUBMARINA",e:"👑",premium:true,desc:"Portal Premium — próxima evolução."},
 {n:"VULCÃO OCEÂNICO",e:"🌋",premium:true,desc:"Premium — calor e lava submarina."},
 {n:"ABISSAL",e:"🐋",premium:true,desc:"Premium — segredos das profundezas."},
 {n:"GALÁXIA AQUÁTICA",e:"🌌",premium:true,desc:"Premium — a jornada além do oceano."}
];
function resize(){D=Math.min(devicePixelRatio||1,2);W=C.clientWidth;H=C.clientHeight;C.width=W*D;C.height=H*D;x.setTransform(D,0,0,D,0,0)}addEventListener("resize",resize,{passive:true});resize();
const rnd=(a,b)=>a+Math.random()*(b-a), clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function showToast(t){toast.textContent=t;toast.classList.add("show");clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove("show"),1200)}
function drawWorlds(){let h="";maps.forEach((m,i)=>{let lock=m.premium||i>unlocked;h+=`<div class="world ${lock?"locked":""} ${m.premium?"premium":""}"><div class="emoji">${m.e} ${m.premium?"🔒":lock?"🔒":"✓"}</div><b>${i+1}. ${m.n}</b><small>${m.desc}</small></div>`});$("#worldGrid").innerHTML=h}
function save(){best=Math.max(best,score);bank+=coins;localStorage.pr3best=best;localStorage.pr3bank=bank;localStorage.pr3world=unlocked;BEST.textContent=best;BANK.textContent=bank}
function reset(){score=coins=combo=0;lives=3;world=0;rocks=[];pickups=[];fx=[];spawn=45;coinSpawn=60;powerSpawn=430;inv=0;fish={x:W*.24,y:H*.44,v:0,r:21};running=true;menu.classList.add("hidden");worlds.classList.add("hidden");result.classList.add("hidden");hud.classList.remove("hidden");sync()}
function sync(){S.textContent=score;CO.textContent=coins;LI.textContent=lives;WL.textContent=maps[world].n}
function speed(){return 2.8+world*.25+Math.min(score,55)*.018}
function flap(){if(!running)return;fish.v=-6.15;for(let i=0;i<5;i++)fx.push({x:fish.x-18,y:fish.y+rnd(-8,8),vx:rnd(-2.2,-.5),vy:rnd(-.7,.7),life:1})}
function obstacle(){let gap=Math.max(132,H*(.245-world*.008)),top=rnd(75,Math.max(85,H-gap-145));rocks.push({x:W+70,top,gap,w:rnd(58,72),pass:false,wob:world>=2?rnd(0,6):0,t:rnd(0,6)})}
function pickup(type="coin"){pickups.push({type,x:W+30,y:rnd(90,H-105),r:type==="coin"?9:13,t:rnd(0,6)})}
function hit(o){let top=o.top+Math.sin(o.t)*o.wob;return fish.x+fish.r-5>o.x&&fish.x-fish.r+5<o.x+o.w&&(fish.y-fish.r+5<top||fish.y+fish.r-5>top+o.gap)}
function damage(){if(inv>0)return; lives--;inv=105;combo=0;showToast(lives?"💥 CUIDADO!":"MISSÃO ENCERRADA"); if(lives<=0)end()}
function end(){running=false;save();hud.classList.add("hidden");$("#resultTitle").textContent=score>=65?"PORTAL PREMIUM ENCONTRADO!":"FIM DA MISSÃO";$("#resultText").innerHTML=`Pontuação <b>${score}</b> · Moedas <b>${coins}</b><br>Recorde <b>${best}</b><br><br>${score>=65?"Você chegou às Geleiras Polares. A próxima jornada começa no <b>PUFF PREMIUM</b>.":"Continue evoluindo para desbloquear novos mundos."}`;result.classList.remove("hidden")}
function progress(){let nw=score>=65?5:score>=45?4:score>=30?3:score>=18?2:score>=8?1:0;if(nw!==world){world=nw;unlocked=Math.max(unlocked,world);localStorage.pr3world=unlocked;sync();showToast(`${maps[world].e} ${maps[world].n}`)}}
function update(dt){if(!running)return;fish.v+=.335*dt;fish.y+=fish.v*dt;spawn-=dt;coinSpawn-=dt;powerSpawn-=dt;inv=Math.max(0,inv-dt);comboT-=dt;if(comboT<=0)combo=0;
 if(spawn<=0){obstacle();spawn=Math.max(64,105-world*5)}
 if(coinSpawn<=0){pickup("coin");coinSpawn=rnd(70,120)}
 if(powerSpawn<=0){pickup("shield");powerSpawn=rnd(380,520)}
 let sp=speed()*dt;
 for(const o of rocks){o.x-=sp;o.t+=.025*dt;if(!o.pass&&o.x+o.w<fish.x){o.pass=true;score++;combo++;comboT=150;if(combo>=5){score++;combo=0;showToast("⚡ COMBO +1")}progress();sync()}if(hit(o))damage()}
 for(const p of pickups){p.x-=sp*.92;p.t+=.06*dt;if(Math.hypot(p.x-fish.x,p.y-fish.y)<fish.r+p.r){p.dead=true;if(p.type==="coin"){coins++;score++;showToast(coins%10===0?"🪙 10 MOEDAS!":"🪙 +1")}else{inv=360;showToast("🛡️ ESCUDO!")}progress();sync()}}
 rocks=rocks.filter(o=>o.x>-100);pickups=pickups.filter(p=>!p.dead&&p.x>-30);
 for(const p of fx){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=.035*dt}fx=fx.filter(p=>p.life>0);
 if(fish.y-fish.r<0||fish.y+fish.r>H-26)damage(),fish.y=clamp(fish.y,fish.r+2,H-50),fish.v=0;
}
function background(){let m=maps[world],g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,m.a);g.addColorStop(1,m.b);x.fillStyle=g;x.fillRect(0,0,W,H);bg+=speed()*.3;
 x.globalAlpha=.14;x.fillStyle="#fff";for(let i=0;i<15;i++){let bx=(i*91+bg*.15)%W,by=H-((i*83+bg*(.35+i%3*.1))%H);x.beginPath();x.arc(bx,by,2+i%4,0,7);x.fill()}x.globalAlpha=1;
 if(world===1){x.fillStyle="#6f55e744";for(let i=0;i<8;i++){x.beginPath();x.moveTo(i*90-bg%90,H);x.lineTo(i*90+25-bg%90,H-80-rnd(0,20));x.lineTo(i*90+45-bg%90,H);x.fill()}}
 if(world===2){x.strokeStyle="#09283c";x.lineWidth=8;x.globalAlpha=.65;for(let i=0;i<4;i++){x.beginPath();x.moveTo(W-i*150-bg%150,0);x.lineTo(W-i*150-80-bg%150,170);x.stroke()}x.globalAlpha=1}
 if(world===3){x.globalAlpha=.25;x.fillStyle="#8feaff";for(let i=0;i<5;i++){x.beginPath();x.arc((i*133-bg*.3)%W,120+i*100,18,0,Math.PI);x.fill()}x.globalAlpha=1}
 if(world===4){x.fillStyle="#e9c976";x.fillRect(0,H-26,W,26);x.fillStyle="#16a07a";for(let i=0;i<7;i++){let q=(i*100-bg*.5)%W;x.fillRect(q,H-65,5,40)}}
 if(world===5){x.fillStyle="#d9f7ff";x.fillRect(0,H-28,W,28);x.globalAlpha=.35;x.fillStyle="#fff";for(let i=0;i<5;i++){x.beginPath();x.moveTo(i*130,0);x.lineTo(i*130+55,120);x.lineTo(i*130+90,0);x.fill()}x.globalAlpha=1}
}
function drawRock(o){let top=o.top+Math.sin(o.t)*o.wob,g=x.createLinearGradient(o.x,0,o.x+o.w,0);g.addColorStop(0,"#073b53");g.addColorStop(.5,world===5?"#8eddf0":"#167d8d");g.addColorStop(1,"#052f48");x.fillStyle=g;x.fillRect(o.x,0,o.w,top);x.fillRect(o.x,top+o.gap,o.w,H-top-o.gap-25);x.fillStyle=world===5?"#d6f8ff":"#32b5ac";x.fillRect(o.x-4,top-13,o.w+8,13);x.fillRect(o.x-4,top+o.gap,o.w+8,13)}
function drawPickup(p){x.save();x.translate(p.x,p.y);let pulse=1+Math.sin(p.t)*.12;x.scale(pulse,pulse);x.shadowBlur=18;x.shadowColor=p.type==="coin"?"#ffe55e":"#8ef5ff";x.fillStyle=p.type==="coin"?"#ffd63d":"#9af5ff";x.beginPath();x.arc(0,0,p.r,0,7);x.fill();x.fillStyle="#fff8";x.beginPath();x.arc(-3,-3,p.r*.28,0,7);x.fill();if(p.type==="shield"){x.strokeStyle="#087da2";x.lineWidth=3;x.beginPath();x.arc(0,0,p.r-4,0,7);x.stroke()}x.restore()}
function drawFish(){x.save();x.translate(fish.x,fish.y);x.rotate(clamp(fish.v*.05,-.3,.55));let puff=1+Math.max(0,fish.v)*.012;x.scale(puff,puff);x.globalAlpha=inv>0&&Math.floor(inv/8)%2?0.45:1;
 x.fillStyle="#6fd9ed";x.beginPath();x.moveTo(-17,0);x.lineTo(-42,-16);x.lineTo(-37,17);x.closePath();x.fill();x.fillStyle="#ffe264";x.beginPath();x.ellipse(0,0,27,22,0,0,7);x.fill();x.strokeStyle="#d6ae24";x.lineWidth=2;for(let a=0;a<6;a++){let q=a*Math.PI/3;x.beginPath();x.moveTo(Math.cos(q)*20,Math.sin(q)*16);x.lineTo(Math.cos(q)*30,Math.sin(q)*24);x.stroke()}x.fillStyle="#fff";x.beginPath();x.arc(10,-7,7,0,7);x.fill();x.fillStyle="#082b3d";x.beginPath();x.arc(13,-7,3,0,7);x.fill();x.strokeStyle="#8d6815";x.beginPath();x.arc(9,6,7,.1,2.8);x.stroke();
 if(inv>120){x.strokeStyle="#b7f7ff";x.lineWidth=3;x.globalAlpha=.65;x.beginPath();x.arc(0,0,35,0,7);x.stroke()}x.restore()}
function render(){background();for(const o of rocks)drawRock(o);for(const p of pickups)drawPickup(p);for(const p of fx){x.globalAlpha=p.life;x.fillStyle="#d8fbff";x.beginPath();x.arc(p.x,p.y,3,0,7);x.fill();x.globalAlpha=1}drawFish()}
function loop(t){let dt=Math.min(2,(t-last)/16.667||1);last=t;update(dt);render();requestAnimationFrame(loop)}
$("#play").onclick=reset;$("#again").onclick=reset;$("#worldsBtn").onclick=()=>{menu.classList.add("hidden");worlds.classList.remove("hidden");drawWorlds()};$("#back").onclick=()=>{worlds.classList.add("hidden");menu.classList.remove("hidden")};$("#resultWorlds").onclick=()=>{result.classList.add("hidden");worlds.classList.remove("hidden");drawWorlds()};
C.addEventListener("pointerdown",flap,{passive:true});addEventListener("keydown",e=>{if(e.code==="Space"){e.preventDefault();running?flap():reset()}});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&running){running=false;save();hud.classList.add("hidden");result.classList.remove("hidden");$("#resultTitle").textContent="JOGO PAUSADO";$("#resultText").innerHTML="Sua jornada foi salva.<br>Toque em <b>Jogar novamente</b> para continuar."}});
fish={x:W*.24,y:H*.44,v:0,r:21};BEST.textContent=best;BANK.textContent=bank;drawWorlds();requestAnimationFrame(loop);