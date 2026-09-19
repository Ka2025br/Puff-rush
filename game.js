const C=document.querySelector('#canvas'),ctx=C.getContext('2d',{alpha:false});
const O=document.querySelector('#overlay'),START=document.querySelector('#start'),HUD=document.querySelector('#hud');
const SCORE=document.querySelector('#score'),BEST=document.querySelector('#best'),LEVEL=document.querySelector('#level');
let W=0,H=0,D=1,last=0,run=false,paused=false,score=0,best=+(localStorage.puffRushBest||0),level=1;
let fish,obs=[],pearls=[],particles=[],bubbles=[],spawn=0,pearlSpawn=0,sea=0,flash=0;

function resize(){D=Math.min(devicePixelRatio||1,2);W=C.clientWidth;H=C.clientHeight;C.width=W*D;C.height=H*D;ctx.setTransform(D,0,0,D,0,0)}
addEventListener('resize',resize,{passive:true});resize();

const rnd=(a,b)=>a+Math.random()*(b-a);
function reset(){
  fish={x:W*.25,y:H*.45,v:0,r:22,shield:0};
  obs=[];pearls=[];particles=[];spawn=0;pearlSpawn=80;sea=0;score=0;level=1;flash=0;run=true;paused=false;
  O.classList.add('hidden');HUD.classList.remove('hidden');updateHud();
}
function updateHud(){SCORE.textContent=score;BEST.textContent='REC '+best;LEVEL.textContent='FASE '+level}
function flap(){
  if(!run)return;
  fish.v=-6.25;
  for(let i=0;i<5;i++)particles.push({x:fish.x-20,y:fish.y+rnd(-8,8),vx:rnd(-2.4,-.6),vy:rnd(-1,1),life:1});
}
function makeObstacle(){
  const gap=Math.max(142,H*(level===1?.235:level===2?.215:.195));
  const margin=80, top=rnd(margin,Math.max(margin+10,H-gap-150));
  obs.push({x:W+75,top,gap,w:66,passed:false});
}
function makePearl(){pearls.push({x:W+40,y:rnd(90,H-100),r:8,t:0})}
function speed(){return 2.75+(level-1)*.55+Math.min(score,30)*.025}
function collide(o){
  const pad=5;
  return fish.x+fish.r-pad>o.x&&fish.x-fish.r+pad<o.x+o.w&&(fish.y-fish.r+pad<o.top||fish.y+fish.r-pad>o.top+o.gap)
}
function end(){
  run=false;best=Math.max(best,score);localStorage.puffRushBest=best;HUD.classList.add('hidden');
  O.innerHTML=`<div class="logo">PUFF <b>RUSH</b></div><div class="fish-mark">🐡</div><h1>MISSÃO ENCERRADA</h1><p>Você fez <b>${score} pontos</b> • Recorde <b>${best}</b><br>${score>=20?'Fase 3 alcançada — alta performance!':score>=8?'Fase 2 liberada — continue acelerando.':'Passe pelos recifes e busque as pérolas.'}</p><button id="again">JOGAR DE NOVO</button><div class="modes"><span>FASE 1 • CORAL</span><span>FASE 2 • CORRENTEZA</span><span>FASE 3 • DEEP RUSH</span></div><small>Toque para voltar ao oceano</small>`;
  O.classList.remove('hidden');document.querySelector('#again').onclick=reset;
}
function background(){
  const colors=level===1?['#68e2f4','#087da7']:level===2?['#3fc4e4','#075b91']:['#168ebd','#052f67'];
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,colors[0]);g.addColorStop(1,colors[1]);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  sea+=.45*speed();
  ctx.globalAlpha=.16;ctx.fillStyle='#fff';
  for(let i=0;i<12;i++){let y=(H-((i*97+sea*.45)%H));ctx.beginPath();ctx.arc((i*83+sea*.12)%W,y,2+(i%4),0,7);ctx.fill()}
  ctx.globalAlpha=1;
  ctx.fillStyle=level===3?'#07314c':'#08728c';ctx.beginPath();ctx.moveTo(0,H-36);
  for(let x=0;x<=W+40;x+=40)ctx.lineTo(x,H-38-Math.sin((x+sea)*.035)*9);
  ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();
  ctx.fillStyle='#dfc776';ctx.fillRect(0,H-25,W,25);
}
function obstacle(o){
  const grad=ctx.createLinearGradient(o.x,0,o.x+o.w,0);grad.addColorStop(0,'#0a526a');grad.addColorStop(.5,'#1b8795');grad.addColorStop(1,'#08475f');ctx.fillStyle=grad;
  ctx.fillRect(o.x,0,o.w,o.top);ctx.fillRect(o.x,o.top+o.gap,o.w,H-o.top-o.gap-25);
  ctx.fillStyle='#39b8b0';ctx.fillRect(o.x-5,o.top-16,o.w+10,16);ctx.fillRect(o.x-5,o.top+o.gap,o.w+10,16);
}
function drawFish(){
  const puff=1+Math.max(0,fish.v)*.012;ctx.save();ctx.translate(fish.x,fish.y);ctx.rotate(Math.max(-.32,Math.min(.55,fish.v*.05)));ctx.scale(puff,puff);
  ctx.fillStyle='#76d8ee';ctx.beginPath();ctx.moveTo(-18,0);ctx.lineTo(-43,-17);ctx.lineTo(-38,18);ctx.closePath();ctx.fill();
  ctx.fillStyle=level===3?'#1574c4':'#ffe36a';ctx.beginPath();ctx.ellipse(0,0,27,22,0,0,7);ctx.fill();
  ctx.strokeStyle=level===3?'#8dd7ff':'#d8b82f';ctx.lineWidth=2;
  for(let a=0;a<6;a++){let ang=a*Math.PI/3;ctx.beginPath();ctx.moveTo(Math.cos(ang)*20,Math.sin(ang)*16);ctx.lineTo(Math.cos(ang)*30,Math.sin(ang)*25);ctx.stroke()}
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(10,-7,7,0,7);ctx.fill();ctx.fillStyle='#092b3c';ctx.beginPath();ctx.arc(13,-7,3,0,7);ctx.fill();
  ctx.strokeStyle='#8a6518';ctx.beginPath();ctx.arc(9,6,7,.1,2.8);ctx.stroke();
  if(fish.shield>0){ctx.strokeStyle='#aaf5ff';ctx.lineWidth=3;ctx.globalAlpha=.5+.25*Math.sin(performance.now()/80);ctx.beginPath();ctx.arc(0,0,34,0,7);ctx.stroke()}
  ctx.restore();
}
function drawPearl(p){p.t+=.08;ctx.save();ctx.shadowBlur=15;ctx.shadowColor='#fff';ctx.fillStyle='#fff8cf';ctx.beginPath();ctx.arc(p.x,p.y,p.r+Math.sin(p.t)*1.5,0,7);ctx.fill();ctx.restore()}
function particle(p){ctx.globalAlpha=p.life;ctx.fillStyle='#d7fbff';ctx.beginPath();ctx.arc(p.x,p.y,3,0,7);ctx.fill();ctx.globalAlpha=1}
function tick(dt){
  if(!run||paused)return;
  fish.v+=.34*dt;fish.y+=fish.v*dt;
  spawn-=dt;pearlSpawn-=dt;
  if(spawn<=0){makeObstacle();spawn=Math.max(72,108-(level-1)*10)}
  if(pearlSpawn<=0){makePearl();pearlSpawn=rnd(150,230)}
  const s=speed()*dt;
  for(const o of obs){o.x-=s;if(!o.passed&&o.x+o.w<fish.x){o.passed=true;score++;let nl=score>=20?3:score>=8?2:1;if(nl!==level){level=nl;flash=18}updateHud()}if(collide(o)){if(fish.shield>0){fish.shield=0;o.x=-200}else end()}}
  for(const p of pearls){p.x-=s*.9;if(Math.hypot(p.x-fish.x,p.y-fish.y)<fish.r+p.r){p.dead=true;score+=2;fish.shield=240;updateHud()}}
  obs=obs.filter(o=>o.x>-90);pearls=pearls.filter(p=>!p.dead&&p.x>-30);
  for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=.035*dt}particles=particles.filter(p=>p.life>0);
  if(fish.shield>0)fish.shield-=dt;
  if(fish.y-fish.r<0||fish.y+fish.r>H-25)end();
}
function render(){
  background();for(const o of obs)obstacle(o);for(const p of pearls)drawPearl(p);for(const p of particles)particle(p);drawFish();
  if(flash>0){ctx.fillStyle=`rgba(255,255,255,${flash/45})`;ctx.fillRect(0,0,W,H);flash--}
}
function loop(now){const dt=Math.min(2,(now-last)/16.667||1);last=now;tick(dt);render();requestAnimationFrame(loop)}
START.onclick=reset;C.addEventListener('pointerdown',flap,{passive:true});
addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();run?flap():reset()}if(e.code==='KeyP'&&run)paused=!paused});
document.addEventListener('visibilitychange',()=>{paused=document.hidden});
fish={x:W*.25,y:H*.45,v:0,r:22,shield:0};BEST.textContent='REC '+best;requestAnimationFrame(loop);
