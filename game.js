/* لعبة «رمية حب» — العريس والعروس يتبادلان الورد والحلوى لملء قلب الحب */
(function(){
  'use strict';
  const GOAL = 6;                 // عدد الرميات الناجحة لملء القلب
  const G = 900;                  // الجاذبية (وحدة عالم/ث²)
  const VMAX = 1150;              // أقصى سرعة رمي
  const NAMES = {m:'العريس', d:'العروس'};

  let ov, cv, ctx, dpr, W, H, scale, WW, WH, GY;
  let mode = 'ai', human = 'm', turn = 'm', st = 'menu';
  let score = {m:0, d:0}, love = 0, wind = 0;
  let proj = null, aim = null, particles = [], floats = [], poses = {m:'idle', d:'idle'}, poseT = {m:0, d:0};
  let tWorld = 0, last = 0, raf = 0, turnTimer = 0, aiThrows = 0;
  let actx;

  /* ---------- البناء ---------- */
  function build(){
    const css = document.createElement('style');
    css.textContent = `
    #game{position:fixed;inset:0;z-index:50;background:#efe6f4;font-family:"IBM Plex Sans Arabic",system-ui,sans-serif;
      color:#3b2c4a;touch-action:none;-webkit-user-select:none;user-select:none;opacity:0;transition:opacity .35s}
    #game.on{opacity:1}
    #game > canvas{position:absolute;top:0;left:0;width:100vw;height:100vh;height:100dvh;display:block}
    .g-hud{position:absolute;top:calc(10px + env(safe-area-inset-top));left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none;padding:0 60px}
    .g-top{display:flex;align-items:center;gap:10px;width:min(100%,520px)}
    .g-sc{font-size:15px;font-weight:500;background:#ffffffd0;border-radius:999px;padding:4px 12px;white-space:nowrap;box-shadow:0 4px 12px #8c6aa822}
    .g-sc b{color:#8c6aa8;font-size:17px}
    .g-love{flex:1;height:16px;border-radius:999px;background:#ffffffd0;position:relative;overflow:hidden;box-shadow:inset 0 1px 3px #8c6aa833}
    .g-love i{position:absolute;inset:0;right:auto;width:0;background:linear-gradient(90deg,#c3aad6,#e889b0);border-radius:999px;transition:width .6s cubic-bezier(.2,.8,.2,1)}
    .g-love span{position:absolute;left:50%;top:50%;transform:translate(-50%,-52%);font-size:13px}
    .g-wind{display:flex;align-items:center;gap:8px;font-size:14px;background:#ffffffc8;border-radius:999px;padding:3px 12px}
    .g-wind .bar{width:90px;height:8px;border-radius:9px;background:#eadff1;position:relative;overflow:hidden}
    .g-wind .bar em{position:absolute;top:0;bottom:0;left:50%;background:#8c6aa8;border-radius:9px}
    .g-msg{font-size:15px;color:#5b4470;background:#ffffffb8;border-radius:999px;padding:3px 14px;min-height:26px}
    .g-close{position:absolute;top:calc(10px + env(safe-area-inset-top));left:12px;width:42px;height:42px;border-radius:50%;border:1px solid #dccbe7;
      background:#fff;color:#8c6aa8;font-size:18px;cursor:pointer;z-index:3}
    .g-panel{position:absolute;inset:0;display:flex;overflow-y:auto;padding:12px;background:#efe6f4cc;backdrop-filter:blur(3px);z-index:2}
    .g-card{margin:auto;background:#fff;border-radius:24px;padding:26px 22px;width:min(92vw,380px);text-align:center;box-shadow:0 20px 50px #5b3f7333}
    .g-card h3{font-family:"Reem Kufi",sans-serif;color:#8c6aa8;font-size:28px;margin-bottom:6px}
    .g-card p{font-size:15px;line-height:1.8;color:#6d5a80;margin-bottom:16px}
    .g-card button{display:block;width:100%;font:inherit;font-size:16px;border:0;border-radius:999px;padding:12px;margin-top:10px;cursor:pointer;
      background:#8c6aa8;color:#fff;box-shadow:0 8px 18px #8c6aa855}
    .g-card button.ghost{background:#fff;color:#8c6aa8;border:1.5px solid #dccbe7;box-shadow:none}
    .g-hidden{display:none!important}
    .g-remind{background:#f8f3fa;border:1px solid #eadff1;border-radius:18px;padding:12px;margin:2px 0 6px}
    .g-rt{font-family:"Reem Kufi",sans-serif;color:#8c6aa8;font-size:18px;margin-bottom:6px}
    .g-ri{display:flex;flex-wrap:wrap;justify-content:center;gap:6px}
    .g-ri span{background:#fff;border-radius:999px;padding:4px 10px;font-size:13.5px;color:#3b2c4a;white-space:nowrap}
    .g-rd{font-size:13.5px;color:#6d5a80;margin-top:8px}
    .g-rb{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px}
    .g-card .g-rb button,.g-rb a{margin-top:6px;padding:9px 6px;font-size:14px;white-space:nowrap}
    .g-rb a{display:block;font:inherit;font-size:14px;border-radius:999px;text-decoration:none;background:#fff;color:#8c6aa8;border:1.5px solid #dccbe7;padding:9px 6px;margin-top:6px}
    .g-card button[data-p]{display:flex;align-items:center;justify-content:center;gap:10px}
    .g-av{width:40px;height:40px;border-radius:50%;background:#f3ecf7;flex:0 0 40px;margin:-6px 0;box-shadow:0 0 0 2px #ffffff88}
    @media (max-height:520px){
      .g-card{padding:14px 18px;width:min(92vw,440px)}
      .g-card h3{font-size:22px;margin-bottom:2px}
      .g-card p{font-size:13.5px;line-height:1.6;margin-bottom:6px}
      .g-card button{padding:9px;margin-top:7px;font-size:15px}
      .g-hud{gap:3px}.g-msg{font-size:13px}
    }`;
    document.head.appendChild(css);

    ov = document.createElement('div'); ov.id = 'game';
    ov.innerHTML = `
      <canvas></canvas>
      <div class="g-hud">
        <div class="g-top">
          <div class="g-sc">العريس <b id="g-sm">0</b></div>
          <div class="g-love"><i id="g-love"></i><span>💜</span></div>
          <div class="g-sc"><b id="g-sd">0</b> العروس</div>
        </div>
        <div class="g-wind"><span id="g-wa">←</span> الرياح <span class="bar"><em id="g-wb"></em></span></div>
        <div class="g-msg" id="g-msg"></div>
      </div>
      <button class="g-close" aria-label="إغلاق اللعبة">✕</button>
      <div class="g-panel" id="g-menu"><div class="g-card">
        <h3>رمية حب 💐</h3>
        <p>تبادلوا الورد والحلوى بين العروسين!<br>اضغط مطوّلًا لتعبئة مؤشر القوة، ثم أفلت في اللحظة المناسبة، وانتبه للرياح.<br>كل رمية يلتقطها الطرف الآخر تملأ قلب الحب 💜</p>
        <button data-p="m"><canvas class="g-av" data-w="m"></canvas>العب كالعريس</button>
        <button data-p="d"><canvas class="g-av" data-w="d"></canvas>العب كالعروس</button>
        <button class="ghost" data-p="2">لاعبان على نفس الجهاز</button>
      </div></div>
      <div class="g-panel g-hidden" id="g-win"><div class="g-card">
        <h3>اكتمل قلب الحب 💜</h3>
        <p id="g-wt"></p>
        <div class="g-remind">
          <div class="g-rt">لا تنسوا موعدنا 💜</div>
          <div class="g-ri"><span>📅 السبت 2026.11.28</span><span>🕐 الاستقبال 1:00</span><span>📍 الصالة الدمشقية</span></div>
          <div class="g-rd" id="g-rd"></div>
          <div class="g-rb"><button class="ghost" id="g-cal">أضف للتقويم</button><a class="ghost" id="g-map" href="https://maps.app.goo.gl/CLwcyqBLpvZDxUjZ7" target="_blank" rel="noopener">الاتجاهات للصالة</a></div>
        </div>
        <button id="g-again">العب مرة أخرى</button>
        <button class="ghost" id="g-back">رجوع للدعوة</button>
      </div></div>`;
    document.body.appendChild(ov);
    cv = ov.querySelector('canvas'); ctx = cv.getContext('2d');

    ov.querySelector('.g-close').onclick = close;
    ov.querySelector('#g-back').onclick = close;
    ov.querySelector('#g-cal').onclick = () => { const c = document.getElementById('cal'); if(c) c.click(); };
    ov.querySelector('#g-again').onclick = () => { ov.querySelector('#g-win').classList.add('g-hidden'); ov.querySelector('#g-menu').classList.remove('g-hidden'); st='menu'; };
    ov.querySelectorAll('#g-menu button').forEach(b => b.onclick = () => start(b.dataset.p));
    ov.querySelectorAll('.g-av').forEach(avatar);
    cv.addEventListener('pointerdown', down); addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
    addEventListener('resize', resize);
  }

  function resize(){
    if(!cv) return;
    dpr = devicePixelRatio || 1; W = innerWidth; H = innerHeight;
    cv.width = W*dpr; cv.height = H*dpr;
    WW = W > H ? 1000 : 660; scale = W/WW; WH = H/scale; GY = WH - 70;
  }

  /* ---------- مواقع ---------- */
  const X = who => who === 'm' ? WW - 95 : 95;          // العريس يمينًا والعروس يسارًا كما في الكرت
  const dir = who => who === 'm' ? -1 : 1;
  const hand = who => ({x: X(who) + dir(who)*24, y: GY - 118});
  const box = who => ({x: X(who) - 34, y: GY - 162, w: 68, h: 162});
  function cake(){ const c = WW/2; return [
    {x:c-72, y:GY-56, w:144, h:56}, {x:c-52, y:GY-104, w:104, h:48}, {x:c-34, y:GY-146, w:68, h:42}]; }

  /* ---------- الأصوات ---------- */
  function snd(type){
    try{
      actx = actx || new (window.AudioContext||window.webkitAudioContext)(); actx.resume();
      const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain(); o.connect(g).connect(actx.destination);
      if(type==='throw'){ o.type='sine'; o.frequency.setValueAtTime(500,t); o.frequency.exponentialRampToValueAtTime(900,t+.18); g.gain.setValueAtTime(.05,t); g.gain.exponentialRampToValueAtTime(.0001,t+.22); o.start(t); o.stop(t+.25); }
      if(type==='catch'){ [659,880,1175].forEach((f,i)=>{ const oo=actx.createOscillator(), gg=actx.createGain(); oo.type='triangle'; oo.frequency.value=f; oo.connect(gg).connect(actx.destination);
          gg.gain.setValueAtTime(0,t+i*.09); gg.gain.linearRampToValueAtTime(.07,t+i*.09+.01); gg.gain.exponentialRampToValueAtTime(.0001,t+i*.09+.4); oo.start(t+i*.09); oo.stop(t+i*.09+.45); }); o.disconnect(); }
      if(type==='miss'){ o.type='sine'; o.frequency.setValueAtTime(300,t); o.frequency.exponentialRampToValueAtTime(160,t+.25); g.gain.setValueAtTime(.04,t); g.gain.exponentialRampToValueAtTime(.0001,t+.3); o.start(t); o.stop(t+.32); }
    }catch(e){}
  }

  /* ---------- سير اللعبة ---------- */
  function start(p){
    mode = p === '2' ? '2p' : 'ai'; human = p === 'd' ? 'd' : 'm';
    score = {m:0, d:0}; love = 0; aiThrows = 0; particles = []; floats = []; proj = null;
    ov.querySelector('#g-menu').classList.add('g-hidden');
    updHud(); turn = mode==='ai' ? human : 'm'; newTurn(true);
  }
  function isHuman(who){ return mode==='2p' || who===human; }
  function newTurn(first){
    if(!first) turn = turn==='m' ? 'd' : 'm';
    wind = Math.round((Math.random()*2-1)*10)/10; updWind();
    proj = null; aim = null;
    if(isHuman(turn)){ st='aim'; msg(`${turn==='m'?'دورك أيها العريس':'دورك أيتها العروس'}! اضغط مطوّلًا ثم أفلت 🌹`); }
    else { st='ai'; msg(turn==='m' ? 'العريس يستعد للرمي...' : 'العروس تستعد للرمي...'); turnTimer = 1.1; }
  }
  function msg(t){ ov.querySelector('#g-msg').textContent = t; }
  function updHud(){
    ov.querySelector('#g-sm').textContent = score.m; ov.querySelector('#g-sd').textContent = score.d;
    ov.querySelector('#g-love').style.width = (love/GOAL*100)+'%';
  }
  function updWind(){
    const b = ov.querySelector('#g-wb'), a = ov.querySelector('#g-wa'), w = Math.abs(wind)*50;
    b.style.width = w+'%'; b.style.left = wind < 0 ? (50-w)+'%' : '50%';
    a.textContent = wind === 0 ? '•' : (wind < 0 ? '←' : '→');
  }

  function throwIt(who, vx, vy){
    const h = hand(who), kinds = ['rose','candy','heart','rose'];
    proj = {x:h.x, y:h.y, vx, vy, r:14, rot:0, kind:kinds[Math.random()*kinds.length|0], from:who, done:false, bounced:0, life:0};
    poses[who] = 'throw'; poseT[who] = .35; st = 'fly'; snd('throw');
  }

  /* محاكاة لإيجاد رمية الكمبيوتر */
  function simulate(x, y, vx, vy, tx){
    for(let i=0;i<400;i++){ const dt=1/60; vx += wind*150*dt; vy += G*dt; x += vx*dt; y += vy*dt;
      if(y >= GY-80 && (vx>0 ? x>=tx : x<=tx)) return x;
      if(y > GY) return x; }
    return x;
  }
  function aiThrow(){
    const who = turn, tgt = who==='m'?'d':'m', h = hand(who), tx = X(tgt);
    const ang = ANGLE; let lo = 200, hi = VMAX, v = 700;
    for(let i=0;i<22;i++){ v = (lo+hi)/2; const land = simulate(h.x,h.y, dir(who)*v*Math.cos(ang), -v*Math.sin(ang), tx);
      const over = dir(who) > 0 ? land > tx : land < tx; if(over) hi = v; else lo = v; }
    const skill = Math.min(.85, .3 + aiThrows*.08);                // يتحسن مع الوقت
    const err = (1-skill) * (Math.random()<.5?-1:1) * (.08 + Math.random()*.16);
    v *= 1 + err; aiThrows++;
    throwIt(who, dir(who)*v*Math.cos(ang), -v*Math.sin(ang));
  }

  /* ---------- التحكم باللمس ---------- */
  const ANGLE = 52 * Math.PI/180;                              // زاوية رمي ثابتة
  const CHARGE = .85;                                          // ثوانٍ لامتلاء المؤشر
  function aimPower(){ const ph = (aim.t / CHARGE) % 2; return .18 + .82 * (ph < 1 ? ph : 2 - ph); }
  function down(e){ if(st!=='aim' || aim) return; aim = {t:0, id:e.pointerId}; try{cv.setPointerCapture(e.pointerId);}catch(_){} }
  function move(){}
  function up(e){ if(!aim || e.pointerId!==aim.id) return; const v = aimPower()*VMAX; aim = null;
    throwIt(turn, dir(turn)*v*Math.cos(ANGLE), -v*Math.sin(ANGLE)); }

  /* ---------- التحديث ---------- */
  function step(dt){
    tWorld += dt; if(aim) aim.t += dt;
    for(const k of ['m','d']) if(poseT[k] > 0){ poseT[k] -= dt; if(poseT[k] <= 0 && st!=='win') poses[k] = 'idle'; }
    if(st==='ai'){ turnTimer -= dt; if(turnTimer <= 0) aiThrow(); }
    if(st==='fly' && proj){
      const sub = 3, h = dt/sub;
      for(let s=0;s<sub && !proj.done;s++){
        proj.vx += wind*150*h; proj.vy += G*h; proj.x += proj.vx*h; proj.y += proj.vy*h; proj.rot += proj.vx*h*.02; proj.life += h;
        const tgt = proj.from==='m' ? 'd' : 'm', b = box(tgt);
        if(proj.x > b.x && proj.x < b.x+b.w && proj.y > b.y && proj.y < b.y+b.h){ caught(tgt); break; }
        for(const c of cake()){
          if(proj.x+proj.r > c.x && proj.x-proj.r < c.x+c.w && proj.y+proj.r > c.y && proj.y-proj.r < c.y+c.h){
            const fromTop = proj.y < c.y + 8 && proj.vy > 0;
            if(fromTop){ proj.y = c.y - proj.r; proj.vy *= -.35; proj.vx *= .6; } else { proj.vx *= -.35; proj.x += proj.vx*h*2; }
            if(!proj.bounced){ puff(proj.x, proj.y, 8); } proj.bounced++;
          }
        }
        if(proj.y > GY - proj.r){ proj.y = GY - proj.r; proj.vy *= -.3; proj.vx *= .5; proj.bounced++;
          if(Math.abs(proj.vy) < 60 || proj.bounced > 3) missed(); }
        if(proj.x < -80 || proj.x > WW+80 || proj.life > 8) missed();
      }
    }
    for(let i=particles.length-1;i>=0;i--){ const p = particles[i]; p.t += dt; p.vy += (p.g||300)*dt; p.x += p.vx*dt; p.y += p.vy*dt; p.a += p.va*dt; if(p.t > p.life) particles.splice(i,1); }
    for(let i=floats.length-1;i>=0;i--){ const f = floats[i]; f.t += dt; f.y -= 40*dt; if(f.t > 1.4) floats.splice(i,1); }
    if(st==='win' && Math.random() < .3) confetti(Math.random()*WW, -10, 3);
  }
  function caught(tgt){
    proj.done = true; const from = proj.from; score[from]++; love++;
    poses[tgt] = 'catch'; poseT[tgt] = 1.1; snd('catch');
    floats.push({x:X(tgt), y:GY-190, t:0, txt:'+💜'});
    hearts(X(tgt), GY-140, 14);
    updHud(); proj = null;
    msg(from==='m' ? 'العروس التقطتها! 💐' : 'العريس التقطها! 💐');
    if(love >= GOAL) return setTimeout(win, 700);
    st = 'wait'; setTimeout(()=>newTurn(false), 1100);
  }
  function missed(){
    if(!proj || proj.done) return; proj.done = true; puff(proj.x, proj.y, 10); snd('miss');
    const p = proj; setTimeout(()=>{ if(proj===p) proj = null; }, 500);
    msg(['أوه! قريبة جدًا 😄','الرياح غلبتك! جرّب مرة أخرى','محاولة جميلة 🌸'][Math.random()*3|0]);
    st = 'wait'; setTimeout(()=>newTurn(false), 1200);
  }
  function win(){
    st = 'win'; poses.m = poses.d = 'win'; hearts(WW/2, GY-200, 40); confetti(WW/2, GY-260, 120); snd('catch');
    msg('مبروك للعروسين 💜');
    const t = mode==='ai' ? (score[human] >= score[human==='m'?'d':'m'] ? 'أحسنت! ' : 'رمية رائعة! ') : '';
    ov.querySelector('#g-wt').innerHTML = `${t}تبادلتم ${GOAL} رميات حب 🌹<br>العريس ${score.m} — العروس ${score.d}<br><b style="color:#8c6aa8">بارك الله لهما وبارك عليهما وجمع بينهما في خير</b>`;
    const days = Math.ceil((new Date(2026,10,28) - new Date()) / 864e5);
    ov.querySelector('#g-rd').textContent = days > 1 ? `باقٍ ${days} يومًا على الفرح` : days === 1 ? 'الفرح غدًا بإذن الله 🎉' : days === 0 ? 'الفرح اليوم! 🎊' : '';
    setTimeout(()=>ov.querySelector('#g-win').classList.remove('g-hidden'), 1800);
  }
  function puff(x,y,n){ for(let i=0;i<n;i++) particles.push({x,y,vx:(Math.random()-.5)*160,vy:-Math.random()*160,t:0,life:.8,a:Math.random()*6,va:4,kind:'petal',c:['#f2b5c8','#e7a0bd','#d9c2e8'][i%3],s:4+Math.random()*4}); }
  function hearts(x,y,n){ for(let i=0;i<n;i++) particles.push({x,y,vx:(Math.random()-.5)*260,vy:-120-Math.random()*240,g:120,t:0,life:1.6,a:0,va:0,kind:'heart',c:['#e889b0','#c3aad6','#ff9ec4','#ffffff'][i%4],s:7+Math.random()*7}); }
  function confetti(x,y,n){ for(let i=0;i<n;i++) particles.push({x,y,vx:(Math.random()-.5)*420,vy:-Math.random()*380,g:380,t:0,life:2.6,a:Math.random()*6,va:(Math.random()-.5)*10,kind:'conf',c:['#8c6aa8','#b597cc','#f2b5c8','#f7d58a','#9fd3c7'][i%5],s:5+Math.random()*4}); }

  /* ---------- الرسم ---------- */
  function heartPath(c,s){ c.beginPath(); c.moveTo(0,s*.35); c.bezierCurveTo(-s*1.1,-s*.35,-s*.45,-s*1.05,0,-s*.4); c.bezierCurveTo(s*.45,-s*1.05,s*1.1,-s*.35,0,s*.35); c.closePath(); }
  function bg(){
    const g = ctx.createLinearGradient(0,0,0,GY); g.addColorStop(0,'#f8f1fc'); g.addColorStop(1,'#e8daf1');
    ctx.fillStyle = g; ctx.fillRect(0,0,WW,WH);
    // أضواء معلّقة
    ctx.strokeStyle = '#cdb7dc'; ctx.lineWidth = 1.5; ctx.beginPath();
    const ly = Math.min(WH*.22, 160); ctx.moveTo(0,ly-30); ctx.quadraticCurveTo(WW/2, ly+30, WW, ly-30); ctx.stroke();
    for(let i=1;i<14;i++){ const t=i/14, x=t*WW, y=(1-t)*(1-t)*(ly-30)+2*(1-t)*t*(ly+30)+t*t*(ly-30);
      const on = .55+.45*Math.sin(tWorld*2+i); ctx.fillStyle = ['#f7d58a','#f2b5c8','#c3aad6','#9fd3c7'][i%4]; ctx.globalAlpha = on;
      ctx.beginPath(); ctx.arc(x,y+7,5,0,7); ctx.fill(); ctx.globalAlpha = 1; }
    // تلال
    ctx.fillStyle = '#ddcde8'; ctx.beginPath(); ctx.ellipse(WW*.2, GY+10, WW*.45, 120, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#d3c0e1'; ctx.beginPath(); ctx.ellipse(WW*.8, GY+10, WW*.42, 95, 0, Math.PI, 0); ctx.fill();
    // أرض
    ctx.fillStyle = '#c9b2da'; ctx.fillRect(0,GY,WW,WH-GY);
    ctx.fillStyle = '#bea4d1'; ctx.fillRect(0,GY,WW,6);
    for(let i=0;i<WW;i+=46){ ctx.fillStyle = ['#ffffff','#f2b5c8','#f7d58a'][(i/46|0)%3]; ctx.beginPath(); ctx.arc(i+(i*7%23), GY+22+(i*13%30), 3, 0, 7); ctx.fill(); }
  }
  function drawCake(){
    const tiers = cake();
    tiers.forEach((t,i)=>{
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#e1d3ea'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(t.x,t.y,t.w,t.h,8) : ctx.rect(t.x,t.y,t.w,t.h); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#d9c2e8'; ctx.beginPath(); ctx.moveTo(t.x, t.y+6);
      for(let x=0;x<t.w-1;x+=t.w/8){ ctx.quadraticCurveTo(t.x+x+t.w/16, t.y+18, t.x+x+t.w/8, t.y+6); }
      ctx.lineTo(t.x+t.w, t.y); ctx.lineTo(t.x, t.y); ctx.fill();
      for(let x=t.x+12;x<t.x+t.w-6;x+=18){ ctx.fillStyle = i%2 ? '#f2b5c8' : '#c3aad6'; ctx.beginPath(); ctx.arc(x, t.y+t.h-10, 3.5, 0, 7); ctx.fill(); }
    });
    const top = tiers[2]; ctx.save(); ctx.translate(top.x+top.w/2, top.y-16); ctx.fillStyle = '#e889b0'; heartPath(ctx, 14); ctx.fill(); ctx.restore();
  }
  function skin(){ return '#f2c9a4'; }
  function face(x,y,happy){
    ctx.fillStyle = '#2d2433'; ctx.beginPath(); ctx.arc(x-5,y,2.3,0,7); ctx.arc(x+5,y,2.3,0,7); ctx.fill();
    ctx.strokeStyle = '#7a3e4e'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(x, y+5, happy?6:4.5, .15*Math.PI, .85*Math.PI); ctx.stroke();
    ctx.fillStyle = '#f29fb3'; ctx.globalAlpha = .55; ctx.beginPath(); ctx.arc(x-10,y+5,3.5,0,7); ctx.arc(x+10,y+5,3.5,0,7); ctx.fill(); ctx.globalAlpha = 1;
  }
  function arm(sx,sy,ang,len,col,w){
    const ex = sx+Math.cos(ang)*len, ey = sy+Math.sin(ang)*len;
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.stroke();
    ctx.fillStyle = skin(); ctx.beginPath(); ctx.arc(ex,ey,5.5,0,7); ctx.fill(); return {x:ex,y:ey};
  }
  function pose(who){
    const p = poses[who], t = tWorld;
    if(p==='throw') return {front:-1.9, back:1.9, jump:0};
    if(p==='catch') return {front:-1.2, back:-1.95, jump:Math.abs(Math.sin(t*10))*10};
    if(p==='win') return {front:-1.3, back:-1.85, jump:Math.abs(Math.sin(t*6))*16};
    if(st==='aim' && turn===who && aim) return {front:-2.6, back:1.7, jump:0};
    return {front:1.15+Math.sin(t*2)*.05, back:1.95, jump:0};
  }
  function shadow(x){ ctx.fillStyle = '#8c6aa833'; ctx.beginPath(); ctx.ellipse(x, GY+2, 34, 7, 0, 0, 7); ctx.fill(); }
  function groom(){
    const x = X('m'), f = dir('m'), ps = pose('m'); shadow(x);
    ctx.save(); ctx.translate(x, GY - ps.jump); ctx.scale(f,1);   // الرسم الأساسي يتجه يمينًا
    ctx.fillStyle = '#2a2d45'; ctx.fillRect(-15,-54,13,52); ctx.fillRect(2,-54,13,52);
    ctx.fillStyle = '#16161f'; ctx.beginPath(); ctx.ellipse(-6,-3,10,5,0,0,7); ctx.ellipse(11,-3,10,5,0,0,7); ctx.fill();
    arm(-18,-104,ps.back, 40, '#2f3557', 12);
    ctx.fillStyle = '#2f3557'; ctx.beginPath(); ctx.moveTo(-25,-50); ctx.lineTo(25,-50); ctx.lineTo(21,-110); ctx.quadraticCurveTo(0,-118,-21,-110); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(-9,-111); ctx.lineTo(9,-111); ctx.lineTo(0,-82); ctx.fill();
    ctx.fillStyle = '#8c6aa8'; ctx.beginPath(); ctx.moveTo(-3,-108); ctx.lineTo(3,-108); ctx.lineTo(4,-90); ctx.lineTo(0,-84); ctx.lineTo(-4,-90); ctx.fill();
    ctx.fillStyle = '#f2b5c8'; ctx.beginPath(); ctx.arc(14,-100,4,0,7); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0,-63,1.8,0,7); ctx.arc(0,-74,1.8,0,7); ctx.fill();
    ctx.fillStyle = skin(); ctx.fillRect(-6,-122,12,12);
    ctx.beginPath(); ctx.arc(0,-138,22,0,7); ctx.fill();
    ctx.beginPath(); ctx.arc(-19,-136,5,0,7); ctx.fill();
    ctx.fillStyle = '#3a2a22'; ctx.beginPath(); ctx.arc(0,-141,23,Math.PI*1.02,Math.PI*1.98); ctx.quadraticCurveTo(14,-150,-2,-150); ctx.quadraticCurveTo(-18,-150,-22,-138); ctx.fill();
    face(6,-137,poses.m!=='idle');
    arm(18,-104,ps.front,42,'#2f3557',12);
    ctx.restore();
  }
  function bride(){
    const x = X('d'), f = dir('d'), ps = pose('d'); shadow(x);
    ctx.save(); ctx.translate(x, GY - ps.jump); ctx.scale(f,1);
    // طرحة طويلة خلفية
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.moveTo(-14,-150); ctx.quadraticCurveTo(-44,-100,-40,-30); ctx.lineTo(-18,-40); ctx.quadraticCurveTo(-22,-100,-4,-150); ctx.fill();
    arm(-15,-106,ps.back, 38, '#ffffff', 11);
    // فستان طويل محتشم
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#e3d6ec'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-15,-118); ctx.lineTo(15,-118); ctx.lineTo(17,-90); ctx.quadraticCurveTo(30,-40,38,-2); ctx.quadraticCurveTo(0,6,-38,-2); ctx.quadraticCurveTo(-30,-40,-17,-90); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c3aad6'; ctx.fillRect(-17,-94,34,7);
    ctx.fillStyle = '#efe4f5'; for(let i=-24;i<=24;i+=12){ ctx.beginPath(); ctx.arc(i,-14,2.5,0,7); ctx.fill(); }
    // حجاب يغطي الشعر والرقبة
    ctx.fillStyle = '#fbf7fd'; ctx.strokeStyle = '#ddcde8'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-27,-132); ctx.quadraticCurveTo(-30,-112,-20,-106); ctx.lineTo(20,-106); ctx.quadraticCurveTo(30,-112,27,-132); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0,-138,27,28,0,0,7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = skin(); ctx.beginPath(); ctx.ellipse(4,-135,15.5,18,0,0,7); ctx.fill();
    ctx.fillStyle = '#c3aad6'; [[-14,-160],[-6,-165],[3,-166]].forEach(([a,b])=>{ ctx.beginPath(); ctx.arc(a,b,3.2,0,7); ctx.fill(); });
    face(5,-136,poses.d!=='idle');
    const h = arm(15,-106,ps.front,40,'#ffffff',11);
    // باقة ورد
    if(poses.d!=='throw'){ ['#f2b5c8','#e889b0','#c3aad6','#ffffff'].forEach((c,i)=>{ ctx.fillStyle = c; ctx.beginPath(); ctx.arc(h.x+(i%2?5:-4), h.y-4-(i>1?6:0), 5, 0, 7); ctx.fill(); }); }
    ctx.restore();
  }
  function drawProj(p){
    ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
    if(p.kind==='rose'){
      ctx.strokeStyle = '#5c9a62'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0,4); ctx.lineTo(0,22); ctx.stroke();
      ctx.fillStyle = '#6fb174'; ctx.beginPath(); ctx.ellipse(5,14,6,3,.6,0,7); ctx.fill();
      for(let i=0;i<6;i++){ ctx.fillStyle = i%2 ? '#e0567a' : '#ec7c9a'; ctx.beginPath(); ctx.arc(Math.cos(i)*6, Math.sin(i)*6-2, 7, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#b8325a'; ctx.beginPath(); ctx.arc(0,-2,4,0,7); ctx.fill();
    } else if(p.kind==='candy'){
      ctx.fillStyle = '#f7d58a'; ctx.beginPath(); ctx.moveTo(-10,0); ctx.lineTo(-20,-8); ctx.lineTo(-20,8); ctx.fill(); ctx.beginPath(); ctx.moveTo(10,0); ctx.lineTo(20,-8); ctx.lineTo(20,8); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(0,0,12,10,0,0,7); ctx.fill();
      ctx.strokeStyle = '#c3aad6'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-6,-8); ctx.lineTo(-2,8); ctx.moveTo(2,-9); ctx.lineTo(6,8); ctx.stroke();
    } else { ctx.fillStyle = '#ff7aa8'; heartPath(ctx, 15); ctx.fill(); ctx.fillStyle = '#ffffff88'; ctx.beginPath(); ctx.arc(-5,-6,3,0,7); ctx.fill(); }
    ctx.restore();
  }
  function drawAim(){
    if(st!=='aim') return;
    const h = hand(turn), d = dir(turn), cx0 = X(turn) - d*62, top = GY - 170, hgt = 120;
    const p = aim ? aimPower() : 0;
    // سهم الاتجاه الثابت
    ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(d > 0 ? -ANGLE : Math.PI + ANGLE);
    ctx.globalAlpha = .55 + .25*Math.sin(tWorld*5); ctx.strokeStyle = '#8c6aa8'; ctx.lineWidth = 3; ctx.setLineDash([6,7]);
    ctx.beginPath(); ctx.moveTo(20,0); ctx.lineTo(70,0); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#8c6aa8'; ctx.beginPath(); ctx.moveTo(80,0); ctx.lineTo(68,-7); ctx.lineTo(68,7); ctx.fill(); ctx.restore(); ctx.globalAlpha = 1;
    // عمود القوة
    ctx.fillStyle = '#ffffffd9'; ctx.strokeStyle = '#dccbe7'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(cx0-11, top, 22, hgt, 11) : ctx.rect(cx0-11, top, 22, hgt); ctx.fill(); ctx.stroke();
    const fh = (hgt-6) * p, g = ctx.createLinearGradient(0, top+hgt, 0, top);
    g.addColorStop(0,'#c3aad6'); g.addColorStop(.6,'#8c6aa8'); g.addColorStop(1,'#e889b0');
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(cx0-8, top+hgt-3-fh, 16, fh, 8) : ctx.rect(cx0-8, top+hgt-3-fh, 16, fh); ctx.fill();
    ctx.fillStyle = '#8c6aa8'; ctx.textAlign = 'center'; ctx.font = '500 13px "IBM Plex Sans Arabic", sans-serif';
    ctx.fillText('القوة', cx0, top - 8);
    if(!aim){ ctx.globalAlpha = .6 + .4*Math.sin(tWorld*4); ctx.font = '22px sans-serif'; ctx.fillText('👆', cx0, top + hgt + 30); ctx.globalAlpha = 1; }
  }
  function drawFx(){
    for(const p of particles){ const k = 1 - p.t/p.life; ctx.save(); ctx.globalAlpha = Math.max(0,k); ctx.translate(p.x,p.y); ctx.rotate(p.a); ctx.fillStyle = p.c;
      if(p.kind==='heart'){ heartPath(ctx,p.s); ctx.fill(); } else if(p.kind==='conf'){ ctx.fillRect(-p.s/2,-p.s/4,p.s,p.s/2); } else { ctx.beginPath(); ctx.ellipse(0,0,p.s,p.s*.55,0,0,7); ctx.fill(); }
      ctx.restore(); }
    ctx.textAlign = 'center'; ctx.font = '600 26px "IBM Plex Sans Arabic", sans-serif';
    for(const f of floats){ ctx.globalAlpha = Math.max(0,1-f.t/1.4); ctx.fillText(f.txt, f.x, f.y); } ctx.globalAlpha = 1;
    if(proj && proj.y < 0){ ctx.fillStyle = '#8c6aa8'; ctx.beginPath(); ctx.moveTo(proj.x,8); ctx.lineTo(proj.x-7,20); ctx.lineTo(proj.x+7,20); ctx.fill(); }
  }
  function draw(){
    ctx.setTransform(dpr*scale,0,0,dpr*scale,0,0);
    bg(); drawCake(); bride(); groom(); drawAim(); if(proj) drawProj(proj); drawFx();
  }
  function loop(ts){
    const dt = Math.min(.033, (ts - last)/1000 || 0); last = ts;
    step(dt); draw(); raf = requestAnimationFrame(loop);
  }

  /* صورة مصغّرة للشخصية (الرأس والكتفان) */
  function avatar(c){
    const who = c.dataset.w, r = devicePixelRatio || 1, S = 40;
    c.width = S*r; c.height = S*r;
    const keep = {ctx, GY, WW}; ctx = c.getContext('2d'); WW = 190; GY = 200;
    const k = S/92; ctx.setTransform(r*k,0,0,r*k,0,0); ctx.translate(-(95-46), -(GY-178));
    who === 'm' ? groom() : bride();
    ({ctx, GY, WW} = keep);
  }

  /* ---------- فتح وإغلاق ---------- */
  function open(){
    if(!ov) build();
    resize(); ov.style.display = 'block'; requestAnimationFrame(()=>ov.classList.add('on'));
    ov.querySelector('#g-menu').classList.remove('g-hidden'); ov.querySelector('#g-win').classList.add('g-hidden');
    st = 'menu'; poses = {m:'idle', d:'idle'}; particles = []; proj = null; updHud(); updWind(); msg('');
    cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(loop);
    document.documentElement.style.overflow = 'hidden';
  }
  function close(){
    ov.classList.remove('on'); cancelAnimationFrame(raf); st = 'menu';
    setTimeout(()=>{ ov.style.display = 'none'; }, 350);
    document.documentElement.style.overflow = '';
  }
  window.WeddingGame = {open, close, _debug:{start, get s(){return {st,turn,score,love,proj,wind};}, throwIt, aiThrow, win, set turn(v){turn=v;}}};
})();
