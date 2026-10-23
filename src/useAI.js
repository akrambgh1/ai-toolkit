import { useCallback, useEffect, useRef, useState } from "react";

// One shared worker for the whole app. Each request gets an id so replies can't get mixed up.
export function useAI() {
  const worker = useRef(null);
  const pending = useRef(new Map());
  const [status, setStatus] = useState({}); // tool -> { state: "idle"|"loading"|"ready"|"error", progress }

  useEffect(() => {
    const w = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
    worker.current = w;

    w.addEventListener("message", ({ data }) => {
      const { type, tool } = data;
      if (type === "loading") setStatus((s) => ({ ...s, [tool]: { state: "loading", progress: 0 } }));
      if (type === "progress") {
        setStatus((s) => ({ ...s, [tool]: { state: "loading", progress: data.loaded / data.total, loaded: data.loaded, total: data.total } }));
      }
      if (type === "ready") setStatus((s) => ({ ...s, [tool]: { state: "ready" } }));
      if (type === "result" || type === "error") {
        const req = pending.current.get(data.id);
        pending.current.delete(data.id);
        if (type === "error") {
          setStatus((s) => ({ ...s, [tool]: { ...(s[tool] ?? {}), state: s[tool]?.state === "ready" ? "ready" : "error" } }));
          req?.reject(new Error(data.message));
        } else {
          req?.resolve({ result: data.result, ms: data.ms });
        }
      }
    });

    return () => w.terminate();
  }, []);

  const run = useCallback((tool, input) => {
    const id = crypto.randomUUID?.() ?? String(Math.random());
    return new Promise((resolve, reject) => {
      pending.current.set(id, { resolve, reject });
      worker.current.postMessage({ id, tool, input });
    });
  }, []);

  const preload = useCallback((tool) => worker.current?.postMessage({ tool, preload: true }), []);

  return { run, preload, status };
}

export const formatBytes = (n) => (n > 1e6 ? `${(n / 1e6).toFixed(0)} MB` : `${Math.round(n / 1e3)} KB`);
