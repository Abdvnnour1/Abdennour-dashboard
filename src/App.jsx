import { useState, useEffect, useRef } from "react";

const C = {
  bg:"#080808", s1:"#0f0f0f", s2:"#131313", s3:"#181818",
  border:"#1e1e1e", b2:"#282828",
  accent:"#c8f542", accentDim:"rgba(200,245,66,0.07)",
  text:"#e8e3dc", dim:"#777", muted:"#444", ghost:"#252525",
  red:"#ff4444", amber:"#ffaa00", blue:"#4a9eff", green:"#4aff91",
};

const todayStr = () => new Date().toISOString().split("T")[0];
const fmtTime  = () => new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
const fmtDate  = () => new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}).toUpperCase();

const getPhase = () => {
  const h = new Date().getHours();
  if (h >= 5  && h < 9)  return "🌅 Morning — Build the foundation";
  if (h >= 9  && h < 13) return "☀️ Late morning — Stay locked in";
  if (h >= 13 && h < 17) return "⚡ Midday — Keep moving";
  if (h >= 17 && h < 20) return "🌆 Afternoon — Finish strong";
  if (h >= 20 && h < 22) return "🌙 Evening — Wind down right";
  return "🌑 Night — Rest is part of training";
};

const awakeLeft = () => {
  const now = new Date(), end = new Date();
  end.setHours(22,0,0,0);
  const ms = Math.max(0, end - now);
  return `${Math.floor(ms/3600000)}h ${Math.floor((ms%3600000)/60000)}m left today`;
};

const dayProg = () => {
  const now = new Date(), s = new Date(), e = new Date();
  s.setHours(7,0,0,0); e.setHours(22,0,0,0);
  return Math.min(100, Math.max(0, Math.round((now-s)/(e-s)*100)));
};

const pct = arr => arr.length ? Math.round(arr.filter(Boolean).length/arr.length*100) : 0;

const emptyLog = () => ({
  date: todayStr(),
  morning: { woke7am:false, noPhone:false, eggs:false, d3k2:false, creatine:false, ashwagandha:false, skincare:false, gesture:false, outfit:false },
  sleep:   { hours:"", quality:"", bedtime:"22:00" },
  workout: { done:false, type:"", duration:"", lifts:"", notes:"" },
  study:   { classes:false, activeRecall:false, python:false, pythonNotes:"", reviewed:false },
  art:     { gesture:false, poses:"", block:false, notes:"", style:"" },
  evening: { mgZinc:false, phoneDown:false, sleepTime:"", reflection:"" },
  finance: { expenses:[] },
  goals:   [],
  wins:"", struggles:"", tomorrow:"",
  ig: { followers:"" },
  ended: false,
});

const HRow = ({label, sub, checked, onToggle}) => (
  <div onClick={onToggle} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 16px",cursor:"pointer",borderBottom:`1px solid ${C.border}`,background:checked?C.accentDim:"transparent",transition:"background 0.15s"}}>
    <div style={{width:20,height:20,borderRadius:3,border:`1.5px solid ${checked?C.accent:C.b2}`,background:checked?C.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all 0.15s"}}>
      {checked&&<span style={{color:"#000",fontSize:11,fontWeight:900,lineHeight:1}}>✓</span>}
    </div>
    <div>
      <div style={{fontSize:13,color:checked?C.text:C.muted,textDecoration:checked?"line-through":"none",transition:"all 0.15s"}}>{label}</div>
      {sub&&<div style={{fontSize:10,color:"#2c2c2c",fontFamily:"monospace",marginTop:1}}>{sub}</div>}
    </div>
  </div>
);

const Inp = ({label, value, onChange, placeholder, type="text", multi}) => (
  <div style={{padding:"11px 16px",borderBottom:`1px solid ${C.border}`}}>
    {label&&<div style={{fontSize:9,fontFamily:"monospace",color:"#2c2c2c",letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:5}}>{label}</div>}
    {multi
      ?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",background:C.s3,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:13,padding:"9px 12px",fontFamily:"inherit",resize:"none",minHeight:72,outline:"none",boxSizing:"border-box"}}/>
      :<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",background:C.s3,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:13,padding:"9px 12px",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
    }
  </div>
);

const Card = ({title, icon, badge, color, children}) => {
  const bc = badge===100?C.accent:badge>0?C.amber:C.ghost;
  return (
    <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:12,marginBottom:12,overflow:"hidden"}}>
      <div style={{padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.s3}`,background:C.s2}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14}}>{icon}</span>
          <span style={{fontFamily:"monospace",fontSize:9,letterSpacing:"0.2em",color:color||C.accent,textTransform:"uppercase"}}>{title}</span>
        </div>
        {badge!==undefined&&<span style={{fontFamily:"monospace",fontSize:10,color:bc}}>{badge}%</span>}
      </div>
      {children}
    </div>
  );
};

export default function App() {
  const [tab,      setTab]      = useState("main");
  const [log,      setLog]      = useState(emptyLog());
  const [loading,  setLoading]  = useState(true);
  const [clock,    setClock]    = useState(fmtTime());
  const [prog,     setProg]     = useState(dayProg());
  const [phase,    setPhase]    = useState(getPhase());
  const [newGoal,  setNewGoal]  = useState("");
  const [expAmt,   setExpAmt]   = useState("");
  const [expCat,   setExpCat]   = useState("Food");
  const [expNote,  setExpNote]  = useState("");
  const [msgs,     setMsgs]     = useState([{role:"assistant",content:"I know your schedule, your goals, and exactly where you're at, Abdennour. Ask me anything."}]);
  const [userInput,setUserInput]= useState("");
  const [aiLoading,setAiLoading]= useState(false);
  const msgsRef = useRef(null);

  useEffect(() => {
    const t = setInterval(()=>{ setClock(fmtTime()); setProg(dayProg()); setPhase(getPhase()); }, 30000);
    return ()=>clearInterval(t);
  },[]);

  useEffect(()=>{ load(); },[]);
  useEffect(()=>{ if(msgsRef.current) msgsRef.current.scrollTop=msgsRef.current.scrollHeight; },[msgs]);

  const load = () => {
    try {
      const r = localStorage.getItem(`log:${todayStr()}`);
      if(r) setLog(JSON.parse(r));
    } catch(e){}
    setLoading(false);
  };

  const persist = n => {
    try { localStorage.setItem(`log:${todayStr()}`, JSON.stringify(n)); } catch(e){}
  };

  const upd = (section, field, value) => {
    const n = {...log,[section]:{...log[section],[field]:value}};
    setLog(n); persist(n);
  };
  const tog = (section, field) => upd(section, field, !log[section][field]);
  const updRoot = (field, value) => { const n={...log,[field]:value}; setLog(n); persist(n); };

  const addGoal = () => {
    if(!newGoal.trim()) return;
    updRoot("goals",[...log.goals,{id:Date.now(),text:newGoal.trim(),done:false}]);
    setNewGoal("");
  };
  const togGoal = id => updRoot("goals", log.goals.map(g=>g.id===id?{...g,done:!g.done}:g));
  const delGoal = id => updRoot("goals", log.goals.filter(g=>g.id!==id));

  const addExp = () => {
    if(!expAmt) return;
    const exp={id:Date.now(),amount:parseFloat(expAmt),category:expCat,note:expNote,time:fmtTime()};
    const n={...log,finance:{expenses:[...log.finance.expenses,exp]}};
    setLog(n); persist(n); setExpAmt(""); setExpNote("");
  };
  const delExp = id => { const n={...log,finance:{expenses:log.finance.expenses.filter(e=>e.id!==id)}}; setLog(n); persist(n); };

  const score = pct([
    log.morning.woke7am,log.morning.eggs,log.morning.d3k2,log.morning.creatine,
    log.morning.ashwagandha,log.morning.skincare,log.morning.gesture,
    log.workout.done,log.study.classes,log.study.activeRecall,log.study.python,
    log.art.gesture,log.art.block,log.evening.mgZinc,log.evening.phoneDown
  ]);
  const scoreColor = score>=80?C.accent:score>=50?C.amber:C.red;
  const goalsPct = log.goals.length ? pct(log.goals.map(g=>g.done)) : 0;

  const R=48, circ=2*Math.PI*R;
  const sleepPct = log.sleep.hours ? Math.min(100,Math.round(parseFloat(log.sleep.hours)/9*100)) : 0;
  const sleepColor = sleepPct>=90?C.green:sleepPct>=70?C.blue:C.amber;

  const sendMsg = async () => {
    if(!userInput.trim()||aiLoading) return;
    const text = userInput.trim();
    setUserInput("");
    const newMsgs=[...msgs,{role:"user",content:text}];
    setMsgs(newMsgs);
    setAiLoading(true);
    try {
      const sys = `You are the personal AI advisor for Abdennour, an 18-year-old engineering student in Morocco. Address him by name occasionally.

ABOUT HIM:
- Studies Génie Informatique at EMSI — top of class despite competing against students 3-4 years older. Perfect algorithm score semester 1.
- Deadlifts 180kg (2.4× bodyweight), trains 5×/week + 30min cardio. Has jiu jitsu and judo background.
- Clean supplement stack: creatine, D3/K2 MK7, ashwagandha, Mg bisglycinate, zinc. 150g protein/day. 5 eggs every morning.
- Learning Python — just built his first grade calculator from scratch on day one.
- Artist with 4K+ monthly Instagram views (@abdauxx). Draws manga recreations (Tokyo Ghoul, Vagabond). Wants to develop GAWX/Vexx style with alcohol markers.
- Speaks Arabic (native), French (fluent), English (strong), Chinese (beginner, 95-day Duolingo streak).
- Life audit score: 7.7/10. Strongest: athletics (9.5), skincare (9.0), sleep (8.8). Needs work: finance (5.5), coding (6.0).
- Dreams: Voge 300DS coming soon, long-term: Audi RS3 / BMW M3 / Hellcat, Yamaha Tracer 9 GT / R1.
- Aesthetic: sigilism, dark, gothic, Y2K, baggy cropped clothing.
- Went from overweight and insecure to elite athlete. High standards, selective social circle, keeps things between himself and God.
- No income yet. First art commission is the next financial milestone.

TODAY: Day score ${score}%, goals ${log.goals.filter(g=>g.done).length}/${log.goals.length}, gym: ${log.workout.done?"done":"pending"}, python: ${log.study.python?"done":"pending"}, art: ${log.art.block?"done":"pending"}, sleep last night: ${log.sleep.hours||"not logged"}h.

ROLE: Direct, honest, concise — 2-4 sentences max. Push him toward his goals. No flattery. No generic advice.`;

      const res = await fetch('/api/chat', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ messages:newMsgs.map(m=>({role:m.role,content:m.content})), system:sys })
      });
      const data = await res.json();
      const reply = data.content?.map(b=>b.text||"").join("")||data.error||"Something went wrong.";
      setMsgs([...newMsgs,{role:"assistant",content:reply}]);
    } catch(e){
      setMsgs([...newMsgs,{role:"assistant",content:"Connection issue. Make sure ANTHROPIC_API_KEY is set in Vercel environment variables."}]);
    }
    setAiLoading(false);
  };

  const TABS = [
    {id:"main",icon:"⌂",label:"Main"},
    {id:"health",icon:"⚡",label:"Health"},
    {id:"study",icon:"⬡",label:"Study"},
    {id:"art",icon:"◉",label:"Art"},
    {id:"finance",icon:"◇",label:"Finance"},
    {id:"advisor",icon:"◈",label:"Advisor"},
  ];

  if(loading) return (
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <span style={{fontFamily:"monospace",color:C.accent,fontSize:11,letterSpacing:"0.3em"}}>LOADING...</span>
    </div>
  );

  return (
    <div style={{background:C.bg,minHeight:"100vh",maxWidth:480,margin:"0 auto",paddingBottom:80,fontFamily:"'DM Sans','Inter',sans-serif",color:C.text}}>

      {/* HEADER */}
      <div style={{padding:"18px 18px 12px",borderBottom:`1px solid ${C.s3}`,background:C.s1,position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div>
            <div style={{fontFamily:"monospace",fontSize:9,color:"#2a2a2a",letterSpacing:"0.25em",marginBottom:2}}>ABDENNOUR'S DASHBOARD</div>
            <div style={{fontSize:20,fontWeight:700,letterSpacing:-0.5}}>Abdennour's <span style={{color:C.accent}}>Dashboard</span></div>
            <div style={{fontFamily:"monospace",fontSize:9,color:"#242424",marginTop:1}}>GÉNIE INFORMATIQUE · EMSI · {fmtDate()} · {clock}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:44,fontWeight:900,color:scoreColor,lineHeight:1,fontFamily:"monospace"}}>{score}<span style={{fontSize:16}}>%</span></div>
            <div style={{fontFamily:"monospace",fontSize:8,color:"#2a2a2a",letterSpacing:"0.15em"}}>DAY SCORE</div>
          </div>
        </div>
        <div style={{fontFamily:"monospace",fontSize:10,color:C.accent,letterSpacing:"0.08em",marginBottom:4}}>{phase}</div>
        <div style={{fontSize:10,color:C.muted,marginBottom:7}}>{awakeLeft()}</div>
        <div style={{height:2,background:C.s3,borderRadius:2}}>
          <div style={{height:"100%",width:`${prog}%`,background:C.accent,borderRadius:2,transition:"width 1s ease"}}/>
        </div>
      </div>

      <div style={{padding:"14px 14px 0"}}>

        {/* ══ MAIN ══ */}
        {tab==="main"&&(
          <div>
            {/* Instagram */}
            <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:12,marginBottom:12,overflow:"hidden"}}>
              <div style={{padding:"11px 16px",borderBottom:`1px solid ${C.s3}`,background:C.s2,display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:14}}>📱</span>
                <span style={{fontFamily:"monospace",fontSize:9,letterSpacing:"0.2em",color:C.accent,textTransform:"uppercase"}}>Instagram</span>
                <span style={{marginLeft:"auto",fontFamily:"monospace",fontSize:8,color:"#c8f54270",padding:"2px 7px",border:"1px solid #c8f54225",borderRadius:3}}>● LIVE</span>
              </div>
              <div style={{padding:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <div style={{fontFamily:"monospace",fontSize:9,color:"#2c2c2c",letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:5}}>Monthly Views</div>
                  <div style={{fontSize:36,fontWeight:900,color:C.accent,fontFamily:"monospace",lineHeight:1}}>4K+</div>
                  <input value={log.ig.followers} onChange={e=>upd("ig","followers",e.target.value)} placeholder="Log today's followers"
                    style={{marginTop:8,width:"100%",background:C.s3,border:`1px solid ${C.border}`,borderRadius:5,color:C.text,fontSize:12,padding:"6px 10px",fontFamily:"monospace",outline:"none",boxSizing:"border-box"}}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",justifyContent:"center",gap:5}}>
                  <div style={{fontSize:11,color:C.muted}}>@abdauxx</div>
                  <div style={{fontSize:11,color:"#333"}}>Tokyo Ghoul · Vagabond</div>
                  <div style={{fontFamily:"monospace",fontSize:10,color:C.accent}}>→ GAWX style transition</div>
                </div>
              </div>
            </div>

            {/* Goals */}
            <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:12,marginBottom:12,overflow:"hidden"}}>
              <div style={{padding:"11px 16px",borderBottom:`1px solid ${C.s3}`,background:C.s2,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:14}}>🎯</span>
                  <span style={{fontFamily:"monospace",fontSize:9,letterSpacing:"0.2em",color:C.accent,textTransform:"uppercase"}}>Goalmaxxing</span>
                </div>
                <span style={{fontFamily:"monospace",fontSize:10,color:goalsPct===100?C.accent:goalsPct>0?C.amber:C.ghost}}>{goalsPct}%</span>
              </div>
              <div style={{padding:"14px 16px 10px",borderBottom:`1px solid ${C.border}`}}>
                <div style={{fontFamily:"monospace",fontSize:9,color:"#2c2c2c",letterSpacing:"0.2em",marginBottom:6}}>TODAY — {fmtDate()}</div>
                <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                  <span style={{fontSize:40,fontWeight:900,fontFamily:"monospace",color:goalsPct===100?C.accent:goalsPct>0?C.amber:C.text,lineHeight:1}}>{log.goals.filter(g=>g.done).length}</span>
                  <span style={{fontFamily:"monospace",fontSize:12,color:C.ghost}}>/ {log.goals.length} COMPLETE</span>
                </div>
              </div>
              {log.goals.map(g=>(
                <div key={g.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderBottom:`1px solid ${C.border}`,background:g.done?C.accentDim:"transparent"}}>
                  <div onClick={()=>togGoal(g.id)} style={{width:18,height:18,borderRadius:3,border:`1.5px solid ${g.done?C.accent:C.b2}`,background:g.done?C.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer",transition:"all 0.15s"}}>
                    {g.done&&<span style={{color:"#000",fontSize:10,fontWeight:900}}>✓</span>}
                  </div>
                  <span style={{flex:1,fontSize:13,color:g.done?C.dim:C.text,textDecoration:g.done?"line-through":"none"}}>{g.text}</span>
                  <span onClick={()=>delGoal(g.id)} style={{color:"#2a2a2a",cursor:"pointer",fontSize:18,padding:"0 4px"}}>✕</span>
                </div>
              ))}
              <div style={{padding:"10px 16px",display:"flex",gap:8}}>
                <input value={newGoal} onChange={e=>setNewGoal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addGoal()} placeholder="Add a goal for today..."
                  style={{flex:1,background:C.s3,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:13,padding:"8px 12px",fontFamily:"inherit",outline:"none"}}/>
                <div onClick={addGoal} style={{background:C.accent,color:"#000",borderRadius:6,padding:"8px 14px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"monospace"}}>+ ADD</div>
              </div>
            </div>

            <Card title="Plan Tomorrow" icon="📅">
              <Inp value={log.tomorrow} onChange={v=>updRoot("tomorrow",v)} placeholder="What needs to happen tomorrow? Write tonight, commit to it." multi/>
            </Card>
            <Card title="Wins & Positives" icon="⚔️">
              <Inp label="What went right today?" value={log.wins} onChange={v=>updRoot("wins",v)} placeholder="What you crushed. What felt good." multi/>
            </Card>
            <Card title="Current Struggles" icon="🧱">
              <Inp label="What's on your mind right now?" value={log.struggles} onChange={v=>updRoot("struggles",v)} placeholder="What's hard. What needs fixing. Be honest." multi/>
            </Card>

            {!log.ended?(
              <div onClick={()=>updRoot("ended",true)} style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:12,padding:18,textAlign:"center",marginBottom:12,cursor:"pointer"}}>
                <div style={{fontFamily:"monospace",fontSize:11,color:C.muted,letterSpacing:"0.2em"}}>⊠  END DAY</div>
                <div style={{fontSize:11,color:"#262626",marginTop:4}}>Lock today's log and prepare for tomorrow</div>
              </div>
            ):(
              <div style={{background:"rgba(200,245,66,0.04)",border:"1px solid rgba(200,245,66,0.12)",borderRadius:12,padding:20,textAlign:"center",marginBottom:12}}>
                <div style={{fontFamily:"monospace",fontSize:10,color:C.accent,letterSpacing:"0.2em",marginBottom:8}}>✓ DAY COMPLETE</div>
                <div style={{fontSize:48,fontWeight:900,color:scoreColor,fontFamily:"monospace",lineHeight:1}}>{score}<span style={{fontSize:18}}>%</span></div>
                <div style={{fontSize:11,color:C.dim,marginTop:6}}>See you at 7:00 AM tomorrow</div>
              </div>
            )}
          </div>
        )}

        {/* ══ HEALTH ══ */}
        {tab==="health"&&(
          <div>
            <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:12,marginBottom:12,overflow:"hidden"}}>
              <div style={{padding:"11px 16px",borderBottom:`1px solid ${C.s3}`,background:C.s2,display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:14}}>😴</span>
                <span style={{fontFamily:"monospace",fontSize:9,letterSpacing:"0.2em",color:C.blue,textTransform:"uppercase"}}>Sleep Performance</span>
              </div>
              <div style={{padding:20,display:"flex",flexDirection:"column",alignItems:"center"}}>
                <div style={{position:"relative",marginBottom:16}}>
                  <svg width={120} height={120} viewBox="0 0 120 120">
                    <circle cx={60} cy={60} r={R} fill="none" stroke={C.s3} strokeWidth={10}/>
                    <circle cx={60} cy={60} r={R} fill="none" stroke={sleepColor} strokeWidth={10}
                      strokeDasharray={circ} strokeDashoffset={circ*(1-sleepPct/100)}
                      strokeLinecap="round" transform="rotate(-90 60 60)"
                      style={{transition:"stroke-dashoffset 0.8s ease"}}/>
                  </svg>
                  <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
                    <div style={{fontSize:28,fontWeight:900,fontFamily:"monospace",color:C.text,lineHeight:1}}>{log.sleep.hours||"—"}</div>
                    <div style={{fontFamily:"monospace",fontSize:8,color:"#2c2c2c",letterSpacing:"0.15em"}}>HOURS</div>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,width:"100%",marginBottom:16}}>
                  {[
                    {label:"Hours vs. Needed",val:log.sleep.hours?`${sleepPct}%`:"—",color:sleepColor},
                    {label:"Quality (1–10)",val:log.sleep.quality||"—",color:C.text},
                    {label:"Bedtime",val:log.sleep.bedtime||"—",color:C.text},
                    {label:"Mg Bisglycinate",val:log.evening.mgZinc?"✓ Taken":"Pending",color:log.evening.mgZinc?C.accent:C.muted},
                  ].map(s=>(
                    <div key={s.label} style={{background:C.s2,borderRadius:8,padding:"10px 12px"}}>
                      <div style={{fontFamily:"monospace",fontSize:8,color:"#2c2c2c",letterSpacing:"0.1em",marginBottom:3}}>{s.label.toUpperCase()}</div>
                      <div style={{fontSize:15,fontWeight:600,color:s.color,fontFamily:"monospace"}}>{s.val}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{borderTop:`1px solid ${C.border}`}}>
                <Inp label="Hours slept" value={log.sleep.hours} onChange={v=>upd("sleep","hours",v)} placeholder="9" type="number"/>
                <Inp label="Sleep quality (1–10)" value={log.sleep.quality} onChange={v=>upd("sleep","quality",v)} placeholder="8" type="number"/>
                <Inp label="Bedtime last night" value={log.sleep.bedtime} onChange={v=>upd("sleep","bedtime",v)} placeholder="22:00"/>
              </div>
            </div>

            <Card title="Morning Protocol" icon="🌅"
              badge={pct([log.morning.woke7am,log.morning.noPhone,log.morning.eggs,log.morning.d3k2,log.morning.creatine,log.morning.ashwagandha,log.morning.skincare,log.morning.gesture,log.morning.outfit])}>
              <div style={{paddingTop:4,borderBottom:`1px solid ${C.border}`}}>
                <div style={{padding:"5px 16px 3px",fontFamily:"monospace",fontSize:8,color:"#252525",letterSpacing:"0.2em"}}>PRE-GYM</div>
                <HRow label="Woke at 7:00 AM" sub="No snooze — feet on floor" checked={log.morning.woke7am} onToggle={()=>tog("morning","woke7am")}/>
                <HRow label="No phone for 20 minutes" checked={log.morning.noPhone} onToggle={()=>tog("morning","noPhone")}/>
                <HRow label="5 eggs + breakfast" sub="150g protein target daily" checked={log.morning.eggs} onToggle={()=>tog("morning","eggs")}/>
              </div>
              <div style={{borderBottom:`1px solid ${C.border}`}}>
                <div style={{padding:"5px 16px 3px",fontFamily:"monospace",fontSize:8,color:"#252525",letterSpacing:"0.2em"}}>SUPPLEMENTS</div>
                <HRow label="D3 + K2 MK7" sub="With eggs — fat soluble" checked={log.morning.d3k2} onToggle={()=>tog("morning","d3k2")}/>
                <HRow label="Creatine Monohydrate" checked={log.morning.creatine} onToggle={()=>tog("morning","creatine")}/>
                <HRow label="Ashwagandha" checked={log.morning.ashwagandha} onToggle={()=>tog("morning","ashwagandha")}/>
              </div>
              <div>
                <div style={{padding:"5px 16px 3px",fontFamily:"monospace",fontSize:8,color:"#252525",letterSpacing:"0.2em"}}>GROOMING & FOCUS</div>
                <HRow label="Skincare" sub="Cleanser → Vit C → SPF (damp skin)" checked={log.morning.skincare} onToggle={()=>tog("morning","skincare")}/>
                <HRow label="15min gesture drawing" sub="line.do — 30 sec poses" checked={log.morning.gesture} onToggle={()=>tog("morning","gesture")}/>
                <HRow label="Outfit sorted" checked={log.morning.outfit} onToggle={()=>tog("morning","outfit")}/>
              </div>
            </Card>

            <Card title="Workout" icon="💪" badge={log.workout.done?100:0}>
              <HRow label="Session completed" checked={log.workout.done} onToggle={()=>tog("workout","done")}/>
              {log.workout.done&&<>
                <Inp label="Session type" value={log.workout.type} onChange={v=>upd("workout","type",v)} placeholder="Push / Pull / Legs / Cardio"/>
                <Inp label="Duration (min)" value={log.workout.duration} onChange={v=>upd("workout","duration",v)} placeholder="75" type="number"/>
                <Inp label="Main lifts + weights" value={log.workout.lifts} onChange={v=>upd("workout","lifts",v)} placeholder="Deadlift 180kg × 3..." multi/>
                <Inp label="Session notes" value={log.workout.notes} onChange={v=>upd("workout","notes",v)} placeholder="Energy, form, what to improve..." multi/>
              </>}
              <div style={{padding:16,textAlign:"center"}}>
                <div style={{fontFamily:"monospace",fontSize:9,color:"#2a2a2a",letterSpacing:"0.2em",marginBottom:6}}>DEADLIFT PR</div>
                <div style={{fontSize:52,fontWeight:900,color:C.accent,fontFamily:"monospace",lineHeight:1}}>180<span style={{fontSize:18}}> KG</span></div>
                <div style={{fontFamily:"monospace",fontSize:9,color:"#2a2a2a",marginTop:4}}>2.4× BODYWEIGHT · ELITE</div>
              </div>
            </Card>

            <Card title="Evening Protocol" icon="🌙" badge={pct([log.evening.mgZinc,log.evening.phoneDown])}>
              <HRow label="Mg bisglycinate + Zinc" sub="Before bed — not with food" checked={log.evening.mgZinc} onToggle={()=>tog("evening","mgZinc")}/>
              <HRow label="Phone down by 9:30 PM" checked={log.evening.phoneDown} onToggle={()=>tog("evening","phoneDown")}/>
              <Inp label="Planned sleep time" value={log.evening.sleepTime} onChange={v=>upd("evening","sleepTime",v)} placeholder="22:00"/>
              <Inp label="Night reflection" value={log.evening.reflection} onChange={v=>upd("evening","reflection",v)} placeholder="What went well? What to fix tomorrow?" multi/>
            </Card>
          </div>
        )}

        {/* ══ STUDY ══ */}
        {tab==="study"&&(
          <div>
            <Card title="Today's Classes" icon="🎓"
              badge={pct(["Algorithm","Analysis","Thermodynamics","Circuits","Electro","French","Language","Elements","Tech"].map(s=>!!log.study[`c_${s}`]))}>
              {["Algorithm","Analysis","Thermodynamics","Circuits","Electro","French","Language","Elements","Tech"].map(s=>(
                <HRow key={s} label={s} checked={!!log.study[`c_${s}`]} onToggle={()=>tog("study",`c_${s}`)}/>
              ))}
            </Card>
            <Card title="Study Habits" icon="🧠" badge={pct([log.study.activeRecall,log.study.reviewed])}>
              <HRow label="Active recall after every lecture" sub="15min from memory — no notes open" checked={log.study.activeRecall} onToggle={()=>tog("study","activeRecall")}/>
              <HRow label="Reviewed unclear concepts" checked={log.study.reviewed} onToggle={()=>tog("study","reviewed")}/>
            </Card>
            <Card title="Coding Block" icon="💻" badge={log.study.python?100:0}>
              <HRow label="Coding block done (1hr minimum)" checked={log.study.python} onToggle={()=>tog("study","python")}/>
              <Inp label="What did you build today?" value={log.study.pythonNotes} onChange={v=>upd("study","pythonNotes",v)} placeholder="What you built, learned, or debugged..." multi/>
              <div style={{padding:"11px 16px"}}>
                <div style={{fontFamily:"monospace",fontSize:9,color:"#252525",letterSpacing:"0.2em",marginBottom:4}}>GITHUB REMINDER</div>
                <div style={{fontSize:12,color:C.muted}}>Commit before sleep. One push a day builds the portfolio that speaks louder than any CV.</div>
              </div>
            </Card>
            <Card title="Academic Targets" icon="🎯" color={C.amber}>
              <div style={{padding:16}}>
                {[
                  {s:"Algorithm",n:"Perfect score S1 — repeat and surpass it"},
                  {s:"Math",n:"14.5 while sick — your ceiling is higher"},
                  {s:"C → Python",n:"Your CS foundation is real. Build on it."},
                  {s:"English",n:"Your biggest international career differentiator"},
                ].map((t,i)=>(
                  <div key={i} style={{marginBottom:12,paddingBottom:12,borderBottom:`1px solid ${C.border}`}}>
                    <div style={{fontSize:13,color:C.text,fontWeight:500}}>{t.s}</div>
                    <div style={{fontSize:12,color:C.muted,marginTop:2}}>{t.n}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ══ ART ══ */}
        {tab==="art"&&(
          <div>
            <Card title="Gesture Drawing" icon="✏️" badge={pct([log.morning.gesture,log.art.gesture])}>
              <HRow label="Morning 15min session" sub="30-second poses — warmup" checked={log.morning.gesture} onToggle={()=>tog("morning","gesture")}/>
              <HRow label="Evening gesture session" checked={log.art.gesture} onToggle={()=>tog("art","gesture")}/>
              <Inp label="Total poses today" value={log.art.poses} onChange={v=>upd("art","poses",v)} placeholder="25" type="number"/>
            </Card>
            <Card title="Art Block" icon="🖊️" badge={log.art.block?100:0}>
              <HRow label="Art block completed" checked={log.art.block} onToggle={()=>tog("art","block")}/>
              <Inp label="What did you work on?" value={log.art.notes} onChange={v=>upd("art","notes",v)} placeholder="Style study, original work, manga recreation..." multi/>
              <Inp label="Style focus today" value={log.art.style} onChange={v=>upd("art","style",v)} placeholder="GAWX linework / Vagabond shadows..."/>
            </Card>
            <Card title="Instagram · @abdauxx" icon="📱">
              <div style={{padding:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontFamily:"monospace",fontSize:9,color:"#2c2c2c",letterSpacing:"0.15em",marginBottom:4}}>MONTHLY VIEWS</div>
                  <div style={{fontSize:32,fontWeight:900,color:C.accent,fontFamily:"monospace"}}>4K+</div>
                </div>
                <div style={{textAlign:"right",fontSize:11,color:C.muted}}>
                  <div>Post with intent</div>
                  <div style={{color:"#2c2c2c",marginTop:3}}>Document the journey</div>
                </div>
              </div>
            </Card>
            <Card title="Destination" icon="◉" color={C.amber}>
              <div style={{padding:16}}>
                {[
                  {n:"GAWX",d:"Doodles · Markers · Colors · Personality"},
                  {n:"Vexx",d:"Bold lines · Character expression"},
                  {n:"Yalocaloffgod",d:"Raw energy · Unique style"},
                ].map(a=>(
                  <div key={a.n} style={{display:"flex",gap:12,marginBottom:12,paddingBottom:12,borderBottom:`1px solid ${C.border}`}}>
                    <span style={{color:C.accent,fontFamily:"monospace",fontSize:11,marginTop:2}}>→</span>
                    <div>
                      <div style={{fontSize:13,fontWeight:500}}>{a.n}</div>
                      <div style={{fontSize:11,color:C.muted}}>{a.d}</div>
                    </div>
                  </div>
                ))}
                <div style={{background:"rgba(200,245,66,0.04)",border:"1px solid rgba(200,245,66,0.09)",borderRadius:8,padding:"12px 14px"}}>
                  <div style={{fontFamily:"monospace",fontSize:9,color:C.accent}}>NEXT PURCHASE</div>
                  <div style={{fontSize:13,color:C.dim,marginTop:3}}>Ohuhu alcohol markers</div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ══ FINANCE ══ */}
        {tab==="finance"&&(
          <div>
            <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:12,marginBottom:12,padding:20,textAlign:"center"}}>
              <div style={{fontFamily:"monospace",fontSize:9,color:"#2a2a2a",letterSpacing:"0.25em",marginBottom:8}}>SPENT TODAY</div>
              <div style={{fontSize:60,fontWeight:900,fontFamily:"monospace",lineHeight:1}}>{log.finance.expenses.reduce((s,e)=>s+e.amount,0).toFixed(0)}</div>
              <div style={{fontFamily:"monospace",fontSize:11,color:"#2a2a2a",marginTop:4}}>MAD</div>
            </div>
            <Card title="Log Expense" icon="◇">
              <div style={{padding:16,display:"flex",flexDirection:"column",gap:10}}>
                <input type="number" value={expAmt} onChange={e=>setExpAmt(e.target.value)} placeholder="Amount (MAD)"
                  style={{background:C.s3,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:22,padding:"12px 14px",fontFamily:"monospace",outline:"none",width:"100%",boxSizing:"border-box"}}/>
                <select value={expCat} onChange={e=>setExpCat(e.target.value)}
                  style={{background:C.s3,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:14,padding:"12px 14px",fontFamily:"inherit",outline:"none",width:"100%",boxSizing:"border-box"}}>
                  {["Food","Transport","Supplements","Skincare","Clothing","Tech","Art supplies","Other"].map(c=><option key={c}>{c}</option>)}
                </select>
                <input value={expNote} onChange={e=>setExpNote(e.target.value)} placeholder="Note (optional)"
                  style={{background:C.s3,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:14,padding:"12px 14px",fontFamily:"inherit",outline:"none",width:"100%",boxSizing:"border-box"}}/>
                <div onClick={addExp} style={{background:C.accent,color:"#000",borderRadius:8,padding:"13px 0",textAlign:"center",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"monospace",letterSpacing:"0.15em"}}>
                  + ADD EXPENSE
                </div>
              </div>
            </Card>
            {log.finance.expenses.length>0&&(
              <Card title={`Expenses today (${log.finance.expenses.length})`} icon="📋">
                {log.finance.expenses.map(exp=>(
                  <div key={exp.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:`1px solid ${C.border}`}}>
                    <div>
                      <div style={{fontSize:13}}>{exp.category}{exp.note?` — ${exp.note}`:""}</div>
                      <div style={{fontFamily:"monospace",fontSize:10,color:"#2a2a2a",marginTop:1}}>{exp.time}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:14}}>
                      <span style={{fontFamily:"monospace",fontSize:15,fontWeight:700}}>{exp.amount} MAD</span>
                      <span onClick={()=>delExp(exp.id)} style={{color:C.red,cursor:"pointer",fontSize:18}}>✕</span>
                    </div>
                  </div>
                ))}
              </Card>
            )}
            <Card title="Financial Goals" icon="🏁" color={C.amber}>
              <div style={{padding:16}}>
                {[
                  {label:"Voge 300DS",status:"INCOMING",color:C.accent},
                  {label:"First art commission",status:"BUILD TOWARD",color:C.amber},
                  {label:"Financial independence",status:"IN PROGRESS",color:C.blue},
                  {label:"Audi RS3 / BMW M3 / Hellcat",status:"5–7 YEARS",color:C.ghost},
                  {label:"Tracer 9 GT / R1",status:"LONG TERM",color:C.ghost},
                ].map((g,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",borderBottom:`1px solid ${C.border}`}}>
                    <span style={{fontSize:13,color:C.dim}}>{g.label}</span>
                    <span style={{fontFamily:"monospace",fontSize:9,color:g.color,letterSpacing:"0.1em"}}>{g.status}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ══ ADVISOR ══ */}
        {tab==="advisor"&&(
          <div>
            <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:12,marginBottom:12,overflow:"hidden"}}>
              <div style={{padding:"11px 16px",borderBottom:`1px solid ${C.s3}`,background:C.s2,display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:C.accent,boxShadow:`0 0 8px ${C.accent}`}}/>
                <span style={{fontFamily:"monospace",fontSize:9,letterSpacing:"0.2em",color:C.accent,textTransform:"uppercase"}}>Advisor · Online</span>
                <span style={{marginLeft:"auto",fontSize:10,color:C.muted}}>Knows your dashboard</span>
              </div>
              <div ref={msgsRef} style={{height:360,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:12}}>
                {msgs.map((m,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                    <div style={{maxWidth:"82%",padding:"10px 14px",lineHeight:1.65,fontSize:13,borderRadius:m.role==="user"?"12px 12px 3px 12px":"12px 12px 12px 3px",background:m.role==="user"?C.accent:C.s2,color:m.role==="user"?"#000":C.text,fontWeight:m.role==="user"?500:300}}>{m.content}</div>
                  </div>
                ))}
                {aiLoading&&(
                  <div style={{display:"flex",justifyContent:"flex-start"}}>
                    <div style={{background:C.s2,padding:"12px 16px",borderRadius:"12px 12px 12px 3px",display:"flex",gap:5,alignItems:"center"}}>
                      {[0,1,2].map(i=>(
                        <div key={i} style={{width:5,height:5,borderRadius:"50%",background:C.dim,animation:`bounce 1s ${i*0.18}s infinite`}}/>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={{padding:"12px 16px",borderTop:`1px solid ${C.border}`,display:"flex",gap:10}}>
                <input value={userInput} onChange={e=>setUserInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMsg()} placeholder="Ask anything..."
                  style={{flex:1,background:C.s3,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:13,padding:"10px 14px",fontFamily:"inherit",outline:"none"}}/>
                <div onClick={sendMsg} style={{background:aiLoading?"#2a2a2a":C.accent,color:aiLoading?C.muted:"#000",borderRadius:8,padding:"10px 16px",fontWeight:700,fontSize:14,cursor:aiLoading?"not-allowed":"pointer",transition:"background 0.2s"}}>↑</div>
              </div>
            </div>
            <Card title="Life Audit · May 2026" icon="◈">
              <div style={{padding:16}}>
                {[
                  {d:"Athletics",s:9.5,c:C.green},{d:"Skincare",s:9.0,c:C.green},{d:"Sleep",s:8.8,c:C.green},
                  {d:"Mindset",s:8.0,c:C.accent},{d:"Academics",s:8.0,c:C.accent},{d:"Nutrition",s:8.0,c:C.accent},
                  {d:"Mental",s:7.5,c:C.accent},{d:"Art",s:7.5,c:C.accent},{d:"Languages",s:7.5,c:C.accent},
                  {d:"Social",s:6.0,c:C.amber},{d:"Coding",s:6.0,c:C.amber},{d:"Finance",s:5.5,c:C.red},
                ].map(it=>(
                  <div key={it.d} style={{display:"flex",alignItems:"center",gap:12,marginBottom:9}}>
                    <div style={{width:72,fontSize:11,color:C.muted}}>{it.d}</div>
                    <div style={{flex:1,height:2,background:C.s3,borderRadius:2}}>
                      <div style={{height:"100%",width:`${it.s*10}%`,background:it.c,borderRadius:2}}/>
                    </div>
                    <div style={{width:28,fontFamily:"monospace",fontSize:12,color:it.c,textAlign:"right"}}>{it.s}</div>
                  </div>
                ))}
                <div style={{marginTop:12,background:C.accentDim,border:"1px solid rgba(200,245,66,0.1)",borderRadius:8,padding:"12px 14px",textAlign:"center"}}>
                  <span style={{fontFamily:"monospace",fontSize:30,fontWeight:900,color:C.accent}}>7.7</span>
                  <span style={{fontFamily:"monospace",fontSize:11,color:"#2a2a2a"}}> / 10 · Review November 2026</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:C.s1,borderTop:`1px solid ${C.s3}`,display:"flex",padding:"8px 0 14px",zIndex:200}}>
        {TABS.map(t=>(
          <div key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",cursor:"pointer",padding:"5px 2px",gap:3}}>
            <span style={{fontSize:16,opacity:tab===t.id?1:0.2,transition:"opacity 0.15s"}}>{t.icon}</span>
            <span style={{fontSize:8,fontFamily:"monospace",letterSpacing:"0.1em",textTransform:"uppercase",color:tab===t.id?C.accent:"#252525",transition:"color 0.15s"}}>{t.label}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes bounce{0%,100%{transform:translateY(0);opacity:.3}50%{transform:translateY(-4px);opacity:1}}
        input::placeholder,textarea::placeholder{color:#2c2c2c;}
        ::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:#222;border-radius:2px;}
      `}</style>
    </div>
  );
}
