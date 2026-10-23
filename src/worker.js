// Runs the AI models off the main thread so the page never freezes.
// Models are downloaded once from the Hugging Face Hub and then cached by the browser.
import { env, pipeline } from "@huggingface/transformers";

env.allowLocalModels = false;

export const TOOLS = {
  sentiment: { task: "sentiment-analysis", model: "Xenova/distilbert-base-uncased-finetuned-sst-2-english" },
  topics: { task: "zero-shot-classification", model: "Xenova/nli-deberta-v3-xsmall" },
  summarize: { task: "summarization", model: "Xenova/distilbart-cnn-6-6" },
  image: { task: "image-classification", model: "Xenova/vit-base-patch16-224" },
};

const pipelines = {};
const files = {}; // tool -> { fileName: { loaded, total } }

function report(tool, event) {
  if (event.status === "progress" && event.total) {
    files[tool] ??= {};
    files[tool][event.file] = { loaded: event.loaded, total: event.total };
    const all = Object.values(files[tool]);
    const loaded = all.reduce((s, f) => s + f.loaded, 0);
    const total = all.reduce((s, f) => s + f.total, 0);
    self.postMessage({ type: "progress", tool, loaded, total });
  }
}

function load(tool) {
  if (!pipelines[tool]) {
    const { task, model } = TOOLS[tool];
    self.postMessage({ type: "loading", tool });
    pipelines[tool] = pipeline(task, model, { progress_callback: (e) => report(tool, e) })
      .then((pipe) => {
        self.postMessage({ type: "ready", tool });
        return pipe;
      })
      .catch((err) => {
        delete pipelines[tool];
        throw err;
      });
  }
  return pipelines[tool];
}

async function run(tool, input) {
  const pipe = await load(tool);
  switch (tool) {
    case "sentiment": {
      const [result] = await pipe(input.text);
      return result; // { label: "POSITIVE" | "NEGATIVE", score }
    }
    case "topics": {
      const out = await pipe(input.text, input.labels, { hypothesis_template: "This text is about {}." });
      return out.labels.map((label, i) => ({ label, score: out.scores[i] }));
    }
    case "summarize": {
      const [out] = await pipe(input.text, { max_new_tokens: input.maxTokens ?? 100, no_repeat_ngram_size: 3 });
      const text = out.summary_text.trim();
      // If the token limit cut the last sentence short, drop that unfinished sentence
      const lastStop = Math.max(text.lastIndexOf("."), text.lastIndexOf("!"), text.lastIndexOf("?"));
      return /[.!?]["')\]]?$/.test(text) || lastStop < 0 ? text : text.slice(0, lastStop + 1);
    }
    case "image":
      return pipe(input.src, { top_k: 5 }); // [{ label, score }]
    default:
      throw new Error(`Unknown tool: ${tool}`);
  }
}

self.addEventListener("message", async ({ data }) => {
  const { id, tool, input, preload } = data;
  try {
    if (preload) {
      await load(tool);
      return;
    }
    await load(tool); // time only the model run, not the first download
    const started = performance.now();
    const result = await run(tool, input);
    self.postMessage({ type: "result", id, tool, result, ms: Math.round(performance.now() - started) });
  } catch (err) {
    self.postMessage({ type: "error", id, tool, message: err?.message ?? String(err) });
  }
});
