/* ==========================================================
   Shiva Botta — portfolio engine
   ========================================================== */
(function(){
"use strict";
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TOUCH = matchMedia('(hover:none),(pointer:coarse)').matches;
const $  = s=>document.querySelector(s);
const $$ = s=>[...document.querySelectorAll(s)];

$$('.yr').forEach(e=>e.textContent=new Date().getFullYear());

/* ---------------- page transition veil ---------------- */
const veil=document.createElement('div');
veil.id='veil';
document.body.appendChild(veil);
if(!RM){
  veil.classList.add('in');
  requestAnimationFrame(()=>setTimeout(()=>veil.classList.remove('in'),80));
}
$$('a').forEach(a=>{
  const h=a.getAttribute('href')||'';
  if(!h||h.startsWith('#')||h.startsWith('http')||h.startsWith('mailto')||h.startsWith('tel')||a.target==='_blank')return;
  if(!h.endsWith('.html'))return;
  a.addEventListener('click',e=>{
    if(e.metaKey||e.ctrlKey||e.shiftKey||RM)return;
    e.preventDefault();
    veil.classList.add('in');
    setTimeout(()=>location.href=h,720);
  });
});

/* ---------------- cursor + spotlight ---------------- */
const cur=$('.cur'),ring=$('.cur-r'),spot=$('.spot');
if(!TOUCH&&cur){
  let tx=innerWidth/2,ty=innerHeight/2,rx=tx,ry=ty;
  addEventListener('mousemove',e=>{
    tx=e.clientX;ty=e.clientY;
    cur.style.left=tx+'px';cur.style.top=ty+'px';
  },{passive:true});
  (function l(){rx+=(tx-rx)*.16;ry+=(ty-ry)*.16;ring.style.left=rx+'px';ring.style.top=ry+'px';requestAnimationFrame(l);})();
  const HOT='a,button,input,textarea,.opt,.chip,.frag,.hint,[data-i]';
  document.addEventListener('mouseover',e=>{if(e.target.closest(HOT))document.body.classList.add('hot')});
  document.addEventListener('mouseout', e=>{if(e.target.closest(HOT))document.body.classList.remove('hot')});
  if(spot){
    let t=null;
    addEventListener('mousemove',e=>{
      if(t)return;
      t=setTimeout(()=>{spot.style.left=e.clientX+'px';spot.style.top=e.clientY+'px';t=null;},130);
    },{passive:true});
  }
}

/* ---------------- reveals ---------------- */
if(RM){ $$('.rv').forEach(e=>e.classList.add('in')); }
else{
  const io=new IntersectionObserver(en=>{
    en.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target);}});
  },{threshold:.12});
  $$('.rv').forEach(e=>io.observe(e));
}

/* ---------------- scramble decode text ---------------- */
const GLY='ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&@$*0123456789';
function scramble(el){
  const final=el.dataset.txt||el.textContent;
  el.dataset.txt=final;
  if(RM){el.textContent=final;return;}
  const n=final.length;let frame=0;
  const queue=[...final].map((c,i)=>({c,start:Math.floor(i*1.6),end:Math.floor(i*1.6)+12+Math.random()*14}));
  (function run(){
    let out='',done=0;
    queue.forEach(q=>{
      if(frame>=q.end){out+=q.c;done++;}
      else if(frame>=q.start){out+= (q.c===' '?' ':GLY[Math.floor(Math.random()*GLY.length)]);}
      else out+= (q.c===' '?' ':'');
    });
    el.textContent=out;
    if(done<n){frame++;requestAnimationFrame(run);}
    else el.textContent=final;
  })();
}
const ioS=new IntersectionObserver(en=>{
  en.forEach(x=>{if(x.isIntersecting){scramble(x.target);ioS.unobserve(x.target);}});
},{threshold:.5});
$$('[data-scramble]').forEach(e=>ioS.observe(e));

/* ---------------- 3D card tilt ---------------- */
if(!TOUCH&&!RM){
  $$('[data-tilt]').forEach(c=>{
    c.addEventListener('mousemove',e=>{
      const r=c.getBoundingClientRect();
      const px=(e.clientX-r.left)/r.width, py=(e.clientY-r.top)/r.height;
      c.style.setProperty('--mx',px*100+'%');
      c.style.setProperty('--my',py*100+'%');
      c.style.transform=`rotateX(${(py-.5)*-8}deg) rotateY(${(px-.5)*11}deg) translateZ(0)`;
    });
    c.addEventListener('mouseleave',()=>{c.style.transform=''});
  });
}

/* ---------------- nav ---------------- */
const bg=$('.burger'),ul=$('.nav ul');
if(bg){
  bg.addEventListener('click',()=>{bg.classList.toggle('on');ul.classList.toggle('open')});
  $$('.nav ul a').forEach(a=>a.addEventListener('click',()=>{bg.classList.remove('on');ul.classList.remove('open')}));
}

/* ---------------- marquee dup ---------------- */
const tr=$('.mq .tr'); if(tr) tr.innerHTML+=tr.innerHTML;

/* ==========================================================
   FLOATING 3D WIREFRAME SOLID (hand-built, no libraries)
   Tuned for a light background — darker, higher-contrast strokes.
   ========================================================== */
const cvs=$('#solid');
if(cvs&&!RM){
  const ctx=cvs.getContext('2d');
  let W,H,DPR,cx,cy;
  function size(){
    DPR=Math.min(devicePixelRatio||1,2);
    const r=cvs.getBoundingClientRect();
    W=cvs.width=r.width*DPR; H=cvs.height=r.height*DPR;
    cx=W/2; cy=H/2;
  }
  size(); addEventListener('resize',size);

  const t=(1+Math.sqrt(5))/2;
  let V=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]];
  const L=Math.hypot(1,t);
  V=V.map(p=>p.map(v=>v/L));
  const F=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
           [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  const eset=new Set(),E=[];
  F.forEach(f=>{[[f[0],f[1]],[f[1],f[2]],[f[2],f[0]]].forEach(([a,b])=>{
    const k=a<b?a+'-'+b:b+'-'+a;
    if(!eset.has(k)){eset.add(k);E.push([a,b]);}
  })});

  let ax=0,ay=0,tX=0,tY=0,tick=0;
  if(!TOUCH){
    addEventListener('mousemove',e=>{
      tY=(e.clientX/innerWidth-.5)*.9;
      tX=(e.clientY/innerHeight-.5)*.9;
    },{passive:true});
  }
  function rot(p,rx,ry){
    let [x,y,z]=p;
    let c=Math.cos(ry),s=Math.sin(ry);
    [x,z]=[x*c - z*s, x*s + z*c];
    c=Math.cos(rx);s=Math.sin(rx);
    [y,z]=[y*c - z*s, y*s + z*c];
    return [x,y,z];
  }
  function draw(){
    tick+=1;
    ax+=(tX-ax)*.05; ay+=(tY-ay)*.05;
    const rx=ax+Math.sin(tick*.004)*.25;
    const ry=ay+tick*.0045;
    const R=Math.min(W,H)*0.30;
    const bob=Math.sin(tick*.012)*(R*.045);
    const P=V.map(p=>{
      const [x,y,z]=rot(p,rx,ry);
      const persp=1/(2.6-z);
      return {x:cx+x*R*persp*2.2, y:cy+y*R*persp*2.2+bob, z, s:persp};
    });
    ctx.clearRect(0,0,W,H);

    const edges=E.map(([a,b])=>({a:P[a],b:P[b],z:(P[a].z+P[b].z)/2})).sort((m,n)=>m.z-n.z);
    edges.forEach(e=>{
      const d=(e.z+1)/2;
      const g=ctx.createLinearGradient(e.a.x,e.a.y,e.b.x,e.b.y);
      g.addColorStop(0,`rgba(62,75,216,${.28+d*.55})`);
      g.addColorStop(.55,`rgba(15,158,147,${.24+d*.5})`);
      g.addColorStop(1,`rgba(192,138,46,${.22+d*.42})`);
      ctx.strokeStyle=g;
      ctx.lineWidth=(0.6+d*1.5)*DPR;
      ctx.beginPath();ctx.moveTo(e.a.x,e.a.y);ctx.lineTo(e.b.x,e.b.y);ctx.stroke();
    });
    P.forEach(p=>{
      const d=(p.z+1)/2;
      const r=(1.1+d*2.5)*DPR;
      ctx.beginPath();ctx.arc(p.x,p.y,r,0,6.283);
      ctx.fillStyle=`rgba(23,24,28,${.32+d*.55})`;ctx.fill();
      if(d>.72){
        ctx.beginPath();ctx.arc(p.x,p.y,r*3.2,0,6.283);
        ctx.fillStyle=`rgba(15,158,147,${(d-.72)*.22})`;ctx.fill();
      }
    });
    requestAnimationFrame(draw);
  }
  draw();
}

/* ==========================================================
   A small hidden note — fragments [B][U][I][L][D], one per page.
   Type "build" anywhere, or tap the mark 5x, to read it.
   ========================================================== */
const NOTE=[
"You noticed the small marks in the corners. Most people don't.",
"",
"Here's the honest version of why this site exists: I wanted to see",
"whether I could design and build something end to end — the visuals,",
"the motion, the interaction, the copy — without leaning on a template",
"or someone else's framework doing the thinking for me.",
"",
"Everything moving on this page, including this note, is code I wrote",
"and understand line by line. That's the actual pitch: not that I can",
"talk about building things, but that I did, and I can explain any part",
"of it if you ask.",
"",
"If you made it here on purpose, mention the word BUILD when you",
"reach out. I'll know you looked closely — and I like that."
];
const dec=$('.dec');
if(dec){
  const body=$('#decBody');
  function open(){
    dec.classList.add('open');
    const f=$('#t_key'); if(f) f.value='yes';
    if(body.dataset.filled)return;
    body.dataset.filled='1';
    body.innerHTML=NOTE.map(l=>l?('<p style="margin-bottom:1rem">'+l+'</p>'):'').join('');
  }
  const close=()=>dec.classList.remove('open');
  $('.dec .x').addEventListener('click',close);
  dec.addEventListener('click',e=>{if(e.target===dec)close()});
  addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  let buf='';
  addEventListener('keydown',e=>{
    const t=(e.target.tagName||'').toLowerCase();
    if(t==='input'||t==='textarea'||t==='select')return;
    if(e.key.length===1){buf=(buf+e.key.toLowerCase()).slice(-5);if(buf==='build')open();}
  });
  const br=$('.brand');
  if(br){let n=0,tm=null;br.addEventListener('click',e=>{
    n++;clearTimeout(tm);tm=setTimeout(()=>n=0,1500);
    if(n>=5){e.preventDefault();n=0;open();}
  });}
}
})();
