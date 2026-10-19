/* ==========================================================
   Visit logger — sends one record per page view to a Google
   Sheet (through a Google Apps Script web app).
   Paste your Apps Script URL into ENDPOINT below.
   ========================================================== */
(function(){
  "use strict";

  var ENDPOINT = "https://script.google.com/macros/s/AKfycbzQcdZBb9woxRoI7li5pNA1hAk6WEy1ecKygtGGQ33p5HZGfwUTRezdHI98uj4_BBn7/exec";
  if(!ENDPOINT || ENDPOINT.indexOf("PASTE_")===0) return;       // not configured yet

  // don't log local previews
  if(location.protocol==="file:" || /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;

  // owner exclusion: visit  yoursite.com/?me=1  once per browser to stop logging your own visits
  // (visit ?me=0 to turn logging back on for that browser)
  try{
    var q=new URLSearchParams(location.search);
    if(q.get("me")==="1") localStorage.setItem("sb_owner","1");
    if(q.get("me")==="0") localStorage.removeItem("sb_owner");
    if(localStorage.getItem("sb_owner")==="1") return;
  }catch(e){}

  // respect browsers that send Do Not Track
  if(navigator.doNotTrack==="1") return;

  function device(){
    var u=navigator.userAgent;
    if(/iPad|Tablet|PlayBook|Silk/i.test(u)||(navigator.maxTouchPoints>1&&/Macintosh/.test(u))) return "Tablet";
    if(/Mobi|Android|iPhone/i.test(u)) return "Mobile";
    return "Desktop";
  }
  function browserOS(){
    var u=navigator.userAgent, os="Unknown OS", b="Unknown browser";
    if(/Windows NT/.test(u)) os="Windows"; else if(/Android/.test(u)) os="Android";
    else if(/iPhone|iPad|iPod/.test(u)) os="iOS"; else if(/Mac OS X/.test(u)) os="macOS";
    else if(/Linux/.test(u)) os="Linux";
    if(/Edg\//.test(u)) b="Edge"; else if(/OPR\//.test(u)) b="Opera"; else if(/Chrome\//.test(u)) b="Chrome";
    else if(/Safari\//.test(u)) b="Safari"; else if(/Firefox\//.test(u)) b="Firefox";
    return b+" on "+os;
  }

  // one id per browser session, so you can see which pages one visitor opened
  var sid="n/a";
  try{
    sid=sessionStorage.getItem("sb_sid");
    if(!sid){ sid=Math.random().toString(36).slice(2,10); sessionStorage.setItem("sb_sid",sid); }
  }catch(e){}

  function fetchJSON(url){
    var ctl=new AbortController();
    var timer=setTimeout(function(){ ctl.abort(); },4000);
    return fetch(url,{signal:ctl.signal}).then(function(r){
      clearTimeout(timer);
      if(!r.ok) throw new Error("bad status");
      return r.json();
    });
  }

  // location lookup: cached for the session so it only runs once per visitor,
  // with a second provider as a fallback if the first is blocked or rate-limited
  function getGeo(){
    try{
      var cached=sessionStorage.getItem("sb_geo");
      if(cached) return Promise.resolve(JSON.parse(cached));
    }catch(e){}
    function save(g){ try{ sessionStorage.setItem("sb_geo",JSON.stringify(g)); }catch(e){} return g; }

    return fetchJSON("https://ipapi.co/json/")
      .then(function(g){
        if(!g||!g.ip) throw new Error("no ip");
        return save({ip:g.ip,city:g.city||"",region:g.region||"",country:g.country_name||""});
      })
      .catch(function(){
        return fetchJSON("https://ipwho.is/").then(function(g){
          if(!g||!g.ip||g.success===false) throw new Error("no ip");
          return save({ip:g.ip,city:g.city||"",region:g.region||"",country:g.country||""});
        });
      })
      .catch(function(){ return {ip:"",city:"",region:"",country:""}; });   // log the visit anyway
  }

  function referrerLabel(){
    var r=document.referrer;
    if(!r) return "direct / none";
    try{ if(new URL(r).host===location.host) return "internal navigation"; }catch(e){}
    return r;
  }

  getGeo().then(function(g){
    var data={
      sid:sid,
      page:location.pathname||"/",
      referrer:referrerLabel(),
      device:device(),
      browser:browserOS(),
      screen:screen.width+"x"+screen.height,
      tz:(Intl.DateTimeFormat().resolvedOptions().timeZone)||"",
      lang:navigator.language||"",
      ip:g.ip, city:g.city, region:g.region, country:g.country
    };
    fetch(ENDPOINT,{
      method:"POST",
      mode:"no-cors",
      keepalive:true,
      headers:{"Content-Type":"text/plain;charset=utf-8"},
      body:JSON.stringify(data)
    }).catch(function(){});
  });
})();
