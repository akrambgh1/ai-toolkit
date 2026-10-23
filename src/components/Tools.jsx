import { useState } from "react";
import { ModelStatus, RunButton, Samples, ScoreBars, Timing } from "./common.jsx";

function useRunner(ai, tool) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [output, setOutput] = useState(null);
  const go = async (input) => {
    setBusy(true);
    setError("");
    try {
      setOutput(await ai.run(tool, input));
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, output, go, reset: () => setOutput(null) };
}

const ErrorNote = ({ text }) =>
  text ? <p className="error">⚠️ {text}. Check your internet connection (needed for the first download) and try again.</p> : null;

// ---------- 1. Sentiment ----------
const SENTIMENT_SAMPLES = [
  { label: "😍 Happy review", value: "I absolutely love this product! It arrived early and works better than I expected." },
  { label: "😡 Angry review", value: "Terrible service. The package was broken and nobody answered my emails for two weeks." },
  { label: "🤔 Mixed", value: "The food was great but the waiting time was way too long." },
];

export function SentimentTool({ ai }) {
  const [text, setText] = useState(SENTIMENT_SAMPLES[0].value);
  const r = useRunner(ai, "sentiment");
  const res = r.output?.result;
  const positive = res?.label === "POSITIVE";

  return (
    <div className="tool">
      <ModelStatus status={ai.status.sentiment} size="67 MB" model="DistilBERT SST-2" />
      <textarea value={text} onChange={(e) => { setText(e.target.value); r.reset(); }} rows={5} maxLength={2000} placeholder="Type a review, tweet or any sentence…" aria-label="Text to analyze" />
      <Samples samples={SENTIMENT_SAMPLES} onPick={(v) => { setText(v); r.reset(); }} />
      <div className="actions">
        <RunButton busy={r.busy} disabled={!text.trim()} onClick={() => r.go({ text })}>Analyze sentiment</RunButton>
        <Timing ms={r.output?.ms} />
      </div>
      <ErrorNote text={r.error} />
      {res && (
        <div className={`result sentiment ${positive ? "pos" : "neg"}`}>
          <span className="big-emoji">{res.score < 0.75 ? "😐" : positive ? "😊" : "😞"}</span>
          <div>
            <h3>{res.score < 0.75 ? "Mixed / uncertain" : positive ? "Positive" : "Negative"}</h3>
            <p className="muted">The model is {(res.score * 100).toFixed(1)}% confident this text is {res.label.toLowerCase()}.</p>
            <div className="meter"><span style={{ "--x": `calc(${(positive ? res.score : 1 - res.score) * 100}% - 2px)` }} /></div>
            <div className="meter-labels"><span>Negative</span><span>Positive</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- 2. Topics (zero-shot) ----------
const TOPIC_SAMPLES = [
  { label: "⚽ Sports news", value: "The striker scored twice in the second half to send his team into the final." },
  { label: "💻 Tech news", value: "The new phone has a faster chip, a brighter screen and a battery that lasts two days." },
  { label: "💸 Finance", value: "The central bank raised interest rates again to fight rising inflation." },
];

export function TopicsTool({ ai }) {
  const [text, setText] = useState(TOPIC_SAMPLES[0].value);
  const [labels, setLabels] = useState("sports, technology, politics, finance, health, entertainment");
  const r = useRunner(ai, "topics");
  const list = labels.split(",").map((l) => l.trim()).filter(Boolean);

  return (
    <div className="tool">
      <ModelStatus status={ai.status.topics} size="90 MB" model="DeBERTa-v3 NLI (zero-shot)" />
      <textarea value={text} onChange={(e) => { setText(e.target.value); r.reset(); }} rows={4} maxLength={2000} placeholder="Paste any text…" aria-label="Text to classify" />
      <Samples samples={TOPIC_SAMPLES} onPick={(v) => { setText(v); r.reset(); }} />
      <label className="field">
        <span>Your labels (comma separated). The model was never trained on them; that's zero-shot learning.</span>
        <input value={labels} onChange={(e) => { setLabels(e.target.value); r.reset(); }} aria-label="Labels" />
      </label>
      <div className="actions">
        <RunButton busy={r.busy} disabled={!text.trim() || list.length < 2} onClick={() => r.go({ text, labels: list })}>Classify text</RunButton>
        <Timing ms={r.output?.ms} />
        {list.length < 2 && <span className="muted small">Add at least 2 labels</span>}
      </div>
      <ErrorNote text={r.error} />
      {r.output && (
        <div className="result">
          <h3>Best match: <span className="accent">{r.output.result[0].label}</span></h3>
          <ScoreBars items={r.output.result} max={10} highlight />
        </div>
      )}
    </div>
  );
}

// ---------- 3. Summarize ----------
const ARTICLE = `The James Webb Space Telescope has captured new images of a distant galaxy cluster, revealing thousands of galaxies that formed shortly after the Big Bang. Scientists say the images are the deepest and sharpest infrared view of the universe so far. The telescope, launched in December 2021, orbits the Sun about 1.5 million kilometres from Earth. Its large gold-coated mirror and sensitive instruments allow it to see light that has travelled for more than 13 billion years. Researchers hope the data will help explain how the first stars and galaxies formed, and whether planets around other stars could support life. Over the next year, teams around the world will study the images in detail and publish their findings.`;

export function SummarizeTool({ ai }) {
  const [text, setText] = useState(ARTICLE);
  const [length, setLength] = useState(80);
  const r = useRunner(ai, "summarize");
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="tool">
      <ModelStatus status={ai.status.summarize} size="290 MB" model="DistilBART CNN" />
      <textarea value={text} onChange={(e) => { setText(e.target.value); r.reset(); }} rows={9} maxLength={6000} placeholder="Paste an article or long text (English)…" aria-label="Text to summarize" />
      <div className="row">
        <span className="muted small">{words} words</span>
        <label className="range">
          <span>Summary length</span>
          <input type="range" min="40" max="160" step="20" value={length} onChange={(e) => setLength(Number(e.target.value))} />
          <span className="muted small">{length <= 60 ? "Short" : length <= 100 ? "Medium" : "Long"}</span>
        </label>
      </div>
      <div className="actions">
        <RunButton busy={r.busy} disabled={words < 30} onClick={() => r.go({ text, maxTokens: length })}>Summarize</RunButton>
        <Timing ms={r.output?.ms} />
        {words < 30 && <span className="muted small">Needs at least 30 words</span>}
      </div>
      <p className="muted small">This is the biggest model, so the first run downloads about 290 MB. After that it's instant to load.</p>
      <ErrorNote text={r.error} />
      {r.output && (
        <div className="result">
          <div className="result-head">
            <h3>Summary</h3>
            <button className="btn ghost sm" onClick={() => navigator.clipboard?.writeText(r.output.result)}>Copy</button>
          </div>
          <p className="summary-text">{r.output.result}</p>
          <p className="muted small">{words} → {r.output.result.split(/\s+/).length} words</p>
        </div>
      )}
    </div>
  );
}

// ---------- 4. Image ----------
const SAMPLE_IMAGE = "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/tiger.jpg";

export function ImageTool({ ai }) {
  const [src, setSrc] = useState(SAMPLE_IMAGE);
  const [dragging, setDragging] = useState(false);
  const r = useRunner(ai, "image");

  const readFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => { setSrc(reader.result); r.reset(); };
    reader.readAsDataURL(file);
  };

  const pretty = (label) => label.split(",")[0].replace(/^\w/, (c) => c.toUpperCase());

  return (
    <div className="tool">
      <ModelStatus status={ai.status.image} size="90 MB" model="Vision Transformer (ImageNet)" />
      <label
        className={`dropzone ${dragging ? "drag" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); readFile(e.dataTransfer.files[0]); }}
      >
        <input type="file" accept="image/*" hidden onChange={(e) => readFile(e.target.files[0])} />
        {src ? <img src={src} alt="Selected" crossOrigin="anonymous" /> : null}
        <span className="drop-hint">📷 Click or drop an image here. It never leaves your device.</span>
      </label>
      <div className="actions">
        <RunButton busy={r.busy} disabled={!src} onClick={() => r.go({ src })}>Recognize image</RunButton>
        <Timing ms={r.output?.ms} />
        {src !== SAMPLE_IMAGE && <button className="btn ghost sm" onClick={() => { setSrc(SAMPLE_IMAGE); r.reset(); }}>Use sample 🐯</button>}
      </div>
      <ErrorNote text={r.error} />
      {r.output && (
        <div className="result">
          <h3>I think this is: <span className="accent">{pretty(r.output.result[0].label)}</span></h3>
          <ScoreBars items={r.output.result.map((x) => ({ ...x, label: pretty(x.label) }))} highlight />
        </div>
      )}
    </div>
  );
}
