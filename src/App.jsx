import { useEffect, useState } from "react";
import { ImageTool, SentimentTool, SummarizeTool, TopicsTool } from "./components/Tools.jsx";
import { useAI } from "./useAI.js";

const TOOLS = [
  { id: "sentiment", icon: "😊", name: "Sentiment", desc: "Is this text positive or negative?", Component: SentimentTool },
  { id: "topics", icon: "🏷️", name: "Topic classifier", desc: "Sort text into any labels you choose", Component: TopicsTool },
  { id: "summarize", icon: "📝", name: "Summarizer", desc: "Turn a long article into a few sentences", Component: SummarizeTool },
  { id: "image", icon: "🖼️", name: "Image recognition", desc: "Find out what's in a photo", Component: ImageTool },
];

const readHash = () => {
  const id = window.location.hash.replace("#", "");
  return TOOLS.some((t) => t.id === id) ? id : "sentiment";
};

export default function App() {
  const ai = useAI();
  const [active, setActive] = useState(readHash);

  useEffect(() => {
    const onHash = () => setActive(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const tool = TOOLS.find((t) => t.id === active);
  const ActiveTool = tool.Component;

  return (
    <div className="app">
      <header className="hero">
        <div className="badge">🔒 100% private · runs in your browser</div>
        <h1>Lumen <span className="grad">AI</span> Toolkit</h1>
        <p>Four real machine-learning models running on <strong>your own device</strong> with Transformers.js. No server, no API key, no data sent anywhere.</p>
      </header>

      <nav className="tool-tabs" aria-label="Tools">
        {TOOLS.map((t) => (
          <a key={t.id} href={`#${t.id}`} className={`tool-tab ${active === t.id ? "active" : ""}`} aria-current={active === t.id ? "page" : undefined}>
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-text">
              <strong>{t.name}</strong>
              <span>{t.desc}</span>
            </span>
            {ai.status[t.id]?.state === "ready" && <span className="ready-dot" title="Model loaded" />}
          </a>
        ))}
      </nav>

      <main className="panel">
        <h2>{tool.icon} {tool.name}</h2>
        <ActiveTool ai={ai} />
      </main>

      <section className="how">
        <h2>How does it work?</h2>
        <div className="steps">
          <div><span>1</span><p>The first time you use a tool, its model is <strong>downloaded</strong> from the Hugging Face Hub and saved in your browser cache.</p></div>
          <div><span>2</span><p>A <strong>Web Worker</strong> runs the model with ONNX Runtime (WebAssembly), so the page stays smooth.</p></div>
          <div><span>3</span><p>Your text and images are processed <strong>locally</strong>. Nothing is uploaded, and it even works offline after the first load.</p></div>
        </div>
      </section>

      <footer className="footer">
        Built with React, Vite and <a href="https://huggingface.co/docs/transformers.js" target="_blank" rel="noopener noreferrer">Transformers.js</a>. Models by Hugging Face and their authors.
      </footer>
    </div>
  );
}
