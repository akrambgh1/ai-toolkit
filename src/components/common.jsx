import { formatBytes } from "../useAI.js";

export function ModelStatus({ status, size, model }) {
  const state = status?.state ?? "idle";
  return (
    <div className={`model-status ${state}`}>
      <span className="dot" />
      <div className="model-text">
        <strong>
          {state === "idle" && "Model not loaded yet"}
          {state === "loading" && `Downloading model${status.total ? `: ${Math.round((status.progress ?? 0) * 100)}%` : "…"}`}
          {state === "ready" && "Model ready, running on your device"}
          {state === "error" && "Model failed to load"}
        </strong>
        <span className="muted">
          {model} · {state === "loading" && status.total ? `${formatBytes(status.loaded)} / ${formatBytes(status.total)}` : `~${size}, downloaded once then cached`}
        </span>
      </div>
      {state === "loading" && (
        <div className="progress"><span style={{ width: `${Math.round((status.progress ?? 0) * 100)}%` }} /></div>
      )}
    </div>
  );
}

export function ScoreBars({ items, max = 5, highlight }) {
  return (
    <ul className="bars">
      {items.slice(0, max).map((item, i) => (
        <li key={item.label} className={i === 0 && highlight ? "top" : ""}>
          <div className="bar-label">
            <span>{item.label}</span>
            <strong>{(item.score * 100).toFixed(1)}%</strong>
          </div>
          <div className="bar"><span style={{ width: `${Math.max(1, item.score * 100)}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

export function RunButton({ busy, disabled, onClick, children }) {
  return (
    <button className="btn primary" onClick={onClick} disabled={busy || disabled}>
      {busy ? <><span className="spinner" /> Thinking…</> : children}
    </button>
  );
}

export function Samples({ samples, onPick }) {
  return (
    <div className="samples">
      <span className="muted">Try:</span>
      {samples.map((s) => (
        <button key={s.label} className="chip" onClick={() => onPick(s.value)}>{s.label}</button>
      ))}
    </div>
  );
}

export const Timing = ({ ms }) => (ms ? <span className="timing">⚡ {ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`}</span> : null);
