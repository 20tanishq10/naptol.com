import React,{useEffect,useState} from "react";
import {createRoot} from "react-dom/client";
import {ArrowDown,ArrowUp,Check,Info,Share2,Trophy,RotateCcw,ShoppingBasket} from "lucide-react";
import "./styles.css";

const MAX=6;
const STORAGE="bhav-batao-v1";
function money(n){return new Intl.NumberFormat("en-IN").format(n)}
function formatQty(p){return `${Number(p.quantity)%1===0?Number(p.quantity):p.quantity} ${p.unit}`}
function heatClass(ratio){const closeness=1-ratio;return `heat-${Math.max(1,Math.min(5,Math.ceil(closeness*5)))}`}

function App(){
 const [game,setGame]=useState(null),[guess,setGuess]=useState(""),[tries,setTries]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[showHow,setShowHow]=useState(false),[shared,setShared]=useState(false);
 useEffect(()=>{fetch("/api/daily",{cache:"no-store"}).then(r=>r.json()).then(d=>{setGame(d);setLoading(false)}).catch(()=>{setError("Game load nahi hua. Please refresh.");setLoading(false)})},[]);
 if(loading)return <div className="loading"><div className="loading-mark">भाव<br/>बताओ</div><div>आज का भाव आ रहा है…</div></div>;
 if(error)return <div className="loading"><div>{error}</div></div>;
 const finished=tries.length>=MAX||tries.some(x=>x.type==="correct");
 const won=tries.some(x=>x.type==="correct");
 async function submit(e){e.preventDefault(); if(finished)return; const n=Math.round(Number(guess.replace(/,/g,"")));if(!Number.isFinite(n)||n<=0)return;setGuess("");const res=await fetch("/api/guess",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({date:game.date,source_product_id:game.product.source_product_id,guess:n})});const d=await res.json();if(!res.ok)return;setTries(t=>[...t,{guess:n,...d.result}]);}
 async function share(){const text=`भाव बताओ 🇮🇳\nआज का भाव मैंने ${tries.length} guess में ${won?"पकड़ लिया!":"try किया!"}`;try{if(navigator.share)await navigator.share({title:"भाव बताओ",text});else{await navigator.clipboard.writeText(text);setShared(true);setTimeout(()=>setShared(false),1800)}}catch{}}
 return <div className="page">
   <div className="veil"/>
   <header><div className="mini-logo"><span>भाव बताओ</span><small>BHAV BATAO</small></div><nav><button onClick={()=>setShowHow(true)}>कैसे खेलें</button><button onClick={share}><Share2 size={14}/> Share</button></nav></header>
   <section className="hero"><div className="hero-logo"><div>भाव बताओ</div><small>BHAV BATAO</small></div><p>आज के सामान का सही भाव बताओ। छह मौके हैं।</p></section>
   <main className="card">
     <div className="top"><span>{tries.length+1 > MAX?MAX:tries.length+1} / {MAX}</span><span className="score"><Trophy size={14}/> {won?"जीत गया":"आज का खेल"}</span></div>
     <div className="photo">{game.product.image_url?<img src={game.product.image_url} alt=""/>:<ShoppingBasket size={86}/>}</div>
     <div className="product"><div className="category">{game.product.category}</div><h1>{game.product.product_name}</h1><p>{game.product.brand} · {formatQty(game.product)}</p></div>
     <form onSubmit={submit} className="guess"><div className="input"><span>₹</span><input autoFocus inputMode="numeric" value={guess} onChange={e=>setGuess(e.target.value)} placeholder="कितने का?" disabled={finished}/></div><button disabled={finished||!guess.trim()}>बताओ</button></form>
     <div className="dots">{Array.from({length:MAX}).map((_,i)=>{const x=tries[i];return <span key={i} className={`dot ${x?x.type:""} ${x?.ratio!=null?heatClass(x.ratio):""}`}/>})}</div>
     <div className="hint">{finished?(won?"वाह! सही भाव पकड़ लिया।":"आज के 6 मौके खत्म।"):`${MAX-tries.length} मौके बाकी`}</div>
     {tries.length>0&&<div className="history">{tries.map((x,i)=>{const Icon=x.type==="low"?ArrowUp:x.type==="high"?ArrowDown:Check;return <div className={`row ${x.type}`} key={i}><b>₹{money(x.guess)}</b><span><Icon size={15}/>{x.label}</span></div>})}</div>}
     {finished&&<div className={`result ${won?"win":"lose"}`}><div><small>{won?"आज का सही भाव":"सही भाव था"}</small><strong>{won?"₹ —":"₹ —"}</strong></div><button onClick={share}>{shared?"Copied!":"Share result"}</button></div>}
   </main>
   <footer><span>भारत की रोज़मर्रा की खरीदारी से बना खेल</span><span>·</span><span>₹ में खेलें</span></footer>
   {showHow&&<div className="modal-backdrop" onClick={()=>setShowHow(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setShowHow(false)}>×</button><h2>कैसे खेलें?</h2><ol><li>एक असली Indian product दिखेगा।</li><li>उसका selling price ₹ में guess करो।</li><li>तुम्हारे पास 6 मौके हैं।</li><li>हर guess बताएगा — भाव <b>ऊपर</b> है या <b>नीचे</b>।</li><li>गहरा लाल मतलब तुम सही भाव के बहुत करीब हो।</li></ol><p>हर दिन नया product. हर दिन नया भाव.</p></div></div>}
 </div>
}
createRoot(document.getElementById("root")).render(<App/>);
