import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowUp, ArrowDown, Check, Share2, Sparkles, Trophy, X } from "lucide-react";
import "./styles.css";

const MAX = 6;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
function money(n) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}
function formatQty(p) {
  return `${p.quantity} ${p.unit}`;
}
function heatClass(ratio) {
  if (ratio == null) return "";
  const closeness = 1 - ratio;
  if (closeness >= 0.86) return "heat-5";
  if (closeness >= 0.66) return "heat-4";
  if (closeness >= 0.43) return "heat-3";
  if (closeness >= 0.20) return "heat-2";
  return "heat-1";
}

export default function App() {
  const [game, setGame] = useState(null);
  const [guess, setGuess] = useState("");
  const [tries, setTries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shake, setShake] = useState(false);
  const [showHow, setShowHow] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    fetch("/api/daily", { cache: "no-store" })
      .then(r => r.json())
      .then(setGame)
      .catch(() => setGame({ error: true }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-mark">नापतोल</div>
        <div>Loading today's market...</div>
      </div>
    );
  }

  if (!game || game.error) {
    return <div className="loading">Unable to load today's product. Please refresh.</div>;
  }

  const finished = tries.length >= MAX || tries.some(x => x.type === "correct");
  const won = tries.some(x => x.type === "correct");
  const answer = tries.find(x => x.answer != null)?.answer;
  const last = tries[tries.length - 1];
  const currentTry = Math.min(tries.length + 1, MAX);

  async function submit(e) {
    e.preventDefault();
    if (finished) return;

    const n = Number(String(guess).replace(/,/g, "").trim());
    if (!Number.isFinite(n) || n <= 0) return;

    const res = await fetch("/api/guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: game.date,
        source_product_id: game.product.source_product_id,
        guess: n,
        attempt: tries.length + 1
      })
    });

    const d = await res.json();
    if (!res.ok) return;

    setTries(t => [...t, { guess: n, ...d.result, answer: d.answer ?? null }]);
    setGuess("");

    if (d.result.type !== "correct") {
      setShake(true);
      setTimeout(() => setShake(false), 450);
    }
  }

  async function share() {
    const text = `नापतोल — I ${won ? `got today's price in ${tries.length} guesses.` : `played today's price challenge.`}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "नापतोल", text });
      } else {
        await navigator.clipboard.writeText(text);
        setShared(true);
        setTimeout(() => setShared(false), 1800);
      }
    } catch {}
  }

  return (
    <div className="page">
      <div className="grain" />
      <div className="shade" />

      <header>
        <div className="mini-logo">
          <span>नापतोल</span>
          <small>NAAPTOL</small>
        </div>
        <nav>
          <button onClick={() => setShowHow(true)}>How to Play</button>
          <button onClick={share}><Share2 size={14} /> Share</button>
        </nav>
      </header>

      <section className="hero">
        <div className="eyebrow"><Sparkles size={13} /> THE DAILY PRICE GAME</div>
        <div className="hero-logo"><div>नापतोल</div><small>NAAPTOL</small></div>
        <p>Look at the product. Guess the price. You get six chances.</p>
      </section>

      <main className="game-wrap">
        <section className={`game-card ${shake ? "shake" : ""}`}>
          <div className="card-head">
            <div className="attempt-label"><span className="tiny-dot" /> GUESS <b>{currentTry}</b><em>/ {MAX}</em></div>
            <div className="today-pill"><Trophy size={13} /> TODAY'S CHALLENGE</div>
          </div>

          <div className="product-stage">
            <div className="stage-ring" />
            <div className="product-image">
              {game.product.image_url
                ? <img src={game.product.image_url} alt={game.product.product_name} />
                : <div className="image-fallback">PRODUCT</div>}
            </div>
          </div>

          <div className="product-copy">
            <div className="category">{game.product.category}</div>
            <h1>{game.product.product_name}</h1>
            <p>{game.product.brand} · {formatQty(game.product)}</p>
          </div>

          <div className="price-zone">
            <form onSubmit={submit} className="guess-form">
              <div className="price-input">
                <span>₹</span>
                <input
                  autoFocus
                  inputMode="numeric"
                  value={guess}
                  onChange={e => setGuess(e.target.value)}
                  placeholder="Enter your guess"
                  disabled={finished}
                  aria-label="Price guess"
                />
              </div>
              <button disabled={finished || !guess.trim()}>GUESS <ArrowUp size={17} /></button>
            </form>
            <div className="hint">
              {finished
                ? (won ? "Correct price range hit!" : "No chances left.")
                : `${MAX - tries.length} chances remaining`}
            </div>
          </div>

          <div className="guess-track">
            {Array.from({ length: MAX }).map((_, i) => {
              const x = tries[i];
              return <span key={i} className={`dot ${x ? x.type : ""} ${x?.ratio != null ? heatClass(x.ratio) : ""}`} />;
            })}
          </div>

          {last && (
            <div className={`latest ${last.type}`}>
              <div className="latest-price">₹{money(last.guess)}</div>
              <div className="latest-message">
                {last.type === "correct" ? <Check size={17} /> : last.type === "low" ? <ArrowUp size={17} /> : <ArrowDown size={17} />}
                {last.label}
              </div>
              <div className={`proximity ${last.ratio != null ? heatClass(last.ratio) : ""}`} />
            </div>
          )}

          {tries.length > 1 && (
            <div className="history">
              {tries.slice(0, -1).map((x, i) => (
                <div className="history-row" key={i}>
                  <b>₹{money(x.guess)}</b>
                  <span className={x.type}>
                    {x.type === "low" ? "↑ Higher" : x.type === "high" ? "↓ Lower" : "✓ Correct"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {finished && (
            <div className={`result ${won ? "win" : "lose"}`}>
              <div className="result-copy">
                <small>{won ? "Nice one. You got the price." : "The actual price was"}</small>
                <strong>₹{answer != null ? money(answer) : "—"}</strong>
              </div>
              <button onClick={share}><Share2 size={15} /> {shared ? "Copied" : "Share"}</button>
            </div>
          )}
        </section>
      </main>

      <footer><span>Built around everyday Indian shopping</span><i>•</i><span>All prices in ₹</span></footer>

      {showHow && (
        <div className="modal-backdrop" onClick={() => setShowHow(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="close" onClick={() => setShowHow(false)}><X size={20} /></button>
            <div className="modal-kicker">NAAPTOL 101</div>
            <h2>How to Play</h2>
            <ol>
              <li>A real product appears on screen.</li>
              <li>Guess its current selling price in ₹.</li>
              <li>You get a total of <b>6 chances</b>.</li>
              <li>Every guess tells you whether the price is <b>higher</b> or <b>lower</b>.</li>
              <li>The deeper the colour, the closer your guess.</li>
              <li>A guess within the nearest ₹5 range counts as correct.</li>
            </ol>
            <p>For example, if the actual price is ₹163, any guess from ₹160 to ₹165 wins.</p>
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
