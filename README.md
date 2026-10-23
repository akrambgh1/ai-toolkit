# ✨ Lumen AI Toolkit — AI in your browser

Lumen runs four real machine-learning models **entirely in your web browser** with [Transformers.js](https://huggingface.co/docs/transformers.js). There's no server, no API key and no cost, and your text and images **never leave your device**.

**🔗 Live demo:** https://akrambgh1.github.io/ai-toolkit/

## ✨ Tools

| Tool | What it does | Model | Size* |
|------|--------------|-------|------:|
| 😊 **Sentiment analysis** | Decides whether a text is positive or negative, with confidence | `distilbert-base-uncased-finetuned-sst-2-english` | ~67 MB |
| 🏷️ **Topic classifier** | Sorts text into **any labels you type**, with no training needed (zero-shot) | `nli-deberta-v3-xsmall` | ~90 MB |
| 📝 **Summarizer** | Turns a long article into a short summary, with an adjustable length | `distilbart-cnn-6-6` | ~290 MB |
| 🖼️ **Image recognition** | Upload or drop a photo and get the top 5 guesses (1,000 ImageNet classes) | `vit-base-patch16-224` | ~90 MB |

\* Each model downloads **once** on first use, then loads from the browser cache in about a second.

Measured on a laptop: sentiment and topic results take about **0.2–0.4 s**, an image takes about **2 s**, and a summary about **3 s**.

## 🧠 How it works

1. On first use, the quantized ONNX model is downloaded from the Hugging Face Hub (with a live progress bar) and cached.
2. A **Web Worker** runs it with **ONNX Runtime Web** (WebAssembly), so the interface never freezes.
3. Results come back to React through `postMessage`, matched by request id so replies never mix up.

## ⭐ Highlights

- Live **download progress** per model, plus a "ready" badge on the tabs
- **Inference timing** shown for every run
- Sample inputs for each tool, drag-and-drop image upload, and a copy button for summaries
- Summaries are trimmed to the last full sentence
- Works **offline** after the first load
- Responsive, accessible UI

## 🛠️ Tech Stack

| Part | Technology |
|------|------------|
| AI runtime | Transformers.js v3 + ONNX Runtime Web (WASM) |
| UI | React 18 |
| Concurrency | Web Worker (ES module) |
| Build tool | Vite |
| CI/CD | GitHub Actions to GitHub Pages |

## 🚀 Run Locally

```bash
git clone https://github.com/akrambgh1/ai-toolkit.git
cd ai-toolkit
npm install
npm run dev
```

Then open http://localhost:5173/ai-toolkit/

## 📂 Project Structure

```
src/
├── worker.js               # Loads models, runs inference, reports progress
├── useAI.js                # React hook: worker messages, status, promises
├── App.jsx                 # Layout, tool tabs, "how it works"
├── styles.css
└── components/
    ├── Tools.jsx           # The 4 tools
    └── common.jsx          # Model status, score bars, buttons
```

## 📚 What I Learned

- Running transformer models client-side with WebAssembly
- Picking models by size, speed and accuracy (I swapped a weaker zero-shot model for DeBERTa-v3 after testing)
- Moving heavy work into a Web Worker and talking to it with `postMessage`
- Showing download progress and caching large assets in the browser
- Designing a privacy-first AI product

## 🙏 Credits

Models by their authors on the [Hugging Face Hub](https://huggingface.co/Xenova), converted to ONNX by Xenova.

## 📄 License

MIT. Free to use and modify.
