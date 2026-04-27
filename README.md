# Bios Recipe Recommender — Friko & Antillana

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white&style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38BDF8?logo=tailwindcss&logoColor=white&style=flat-square)
![N8N](https://img.shields.io/badge/N8N-EA4B71?logo=n8n&logoColor=white&style=flat-square)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?logo=google&logoColor=white&style=flat-square)
![OpenAI GPT-4o](https://img.shields.io/badge/OpenAI_GPT--4o-412991?logo=openai&logoColor=white&style=flat-square)
![Deployed on Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white&style=flat-square)

An MVP recipe recommender built for **Reto 12 (NODO EAFIT × Grupo Bios)**. Users filter Friko and Antillana products by region, occasion, cooking method, and number of people — the app then recommends a matching product from a 55-item catalog and generates an AI-powered recipe suggestion on demand.

🔗 **Live site:** [recetasbios.vercel.app](https://recetasbios.vercel.app)

---

![Bios Recipe Recommender — Hero](public/screenshots/hero.png)

---

## Overview

The user selects up to four filters (region, occasion, cooking method, number of people), and the app resolves the best-matching Friko or Antillana product from a static local catalog. Once a product is found, the frontend sends its metadata to an N8N webhook, which constructs a strict-JSON prompt and forwards it to Google Gemini (Gemma-3-27b-it) as the primary model. If Gemini fails after exhausting retries, OpenAI GPT-4o takes over as fallback. The response is parsed by a model-agnostic code node and rendered alongside the product card in real time.

---

## Key Features

- **Filter-based recommendation engine** over a 55-product catalog (Friko + Antillana)
- **Four filter dimensions:** region, occasion, cooking method, and number of people
- **Inferred fields** (`Rango_Personas`, `Ocasion`) derived from raw catalog data via Python notebook preprocessing, keeping the original Bios dataset untouched
- **AI-generated recipes** via N8N orchestration with **dual-model architecture** (Gemini primary, GPT-4o fallback)
- **JSON-strict prompt engineering** with model-agnostic response parser
- **Graceful fallback recipe object** on parse failure — the UI never crashes
- **Download recipe as image** via `modern-screenshot` (PNG export from DOM)
- **WhatsApp share** for generated recipes
- **Single-page responsive layout** with custom Outfit font and mobile-first breakpoints
- **Inline SVG icons** — no icon library added to the bundle
- **Deployed on Vercel** with automatic deploys from `main`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 19 |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS 3 |
| Backend Orchestration | N8N (self-hosted workflow) |
| AI — Primary | Google Gemini (Gemma-3-27b-it) |
| AI — Fallback | OpenAI GPT-4o |
| Image Export | modern-screenshot |
| Hosting | Vercel |
| Data Source | Static JSON catalog (preprocessed from Excel via Python notebook) |

---

## Project Structure

```
├── n8n/
│   └── workflow.json           # N8N workflow export (webhook → AI → response)
├── public/
│   └── screenshots/            # README assets
├── src/
│   ├── RecomendadorFriko.jsx   # Main component (catalog, filter logic, UI)
│   ├── App.jsx                 # Root app shell
│   ├── App.css                 # App-level styles
│   ├── main.jsx                # Vite entry point
│   └── index.css               # Tailwind directives
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- An N8N instance (self-hosted or cloud) with **two credentials configured**: Google Gemini API and OpenAI API

### Installation

```bash
git clone https://github.com/CauseofDeathLife/bios-recipercommender-website.git
cd bios-recipercommender-website
npm install
```

### Environment Variables

Create `.env.local` at the project root:

```env
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.app/webhook/generar-receta
```

### Development

```bash
npm run dev
```

Then open `http://localhost:5173`.

### Build

```bash
npm run build
npm run preview
```

Output is placed in the `dist/` directory.

---

## How It Works — N8N + AI Integration

![N8N Workflow](public/screenshots/n8n-workflow.png)

The workflow is committed at `n8n/workflow.json` for reference and reproducibility. It implements a **dual-model architecture** for resilience across six nodes:

1. **Webhook (`/generar-receta`)** — receives a POST request from React with `{ producto, descripcion, presentacion, preparacion_elegida, personas }`
2. **Code node — Build Prompt** — validates the incoming payload and constructs a strict-JSON prompt requesting a recipe with a maximum of 5 ingredients and 4 preparation steps, scaled to the requested number of people
3. **Gemini node (primary)** — calls `models/gemma-3-27b-it`, configured with retry-on-fail (3 attempts, 2 s wait between retries)
4. **OpenAI node (fallback)** — calls `gpt-4o` and takes over when Gemini fails after exhausting all retries
5. **Code node — Parse Response** — model-agnostic parser that detects which model responded by inspecting the JSON shape (`content.parts[0].text` for Gemini, `choices[0].message.content` for OpenAI), strips Markdown code fences, and returns a pre-built fallback recipe object if parsing fails
6. **Respond to Webhook** — returns the final recipe JSON to the React frontend

> **Why dual-model?** Relying on a single AI provider creates a single point of failure. If Gemini's API is rate-limited or unavailable, the workflow automatically continues through OpenAI without any user-visible degradation.

---

## Full Layout Preview

![Full Layout](public/screenshots/full.png)

Full vertical layout showing all sections of the application.

---

## Deployment

The app is hosted on Vercel with automatic deploys triggered on every push to the `main` branch. Build command: `npm run build`. Output directory: `dist`. The `VITE_N8N_WEBHOOK_URL` environment variable must be added to the Vercel project settings so the frontend can reach the N8N webhook at runtime.

---

## Design Decisions

- **Static catalog over database** — 55 products fit comfortably inline; avoiding a database simplifies hosting and removes a failure point for an MVP
- **Inferred fields via notebook** — `Rango_Personas` and `Ocasion` were derived from `Presentación` text via a preprocessing Jupyter notebook rather than added to the source data, keeping the original Bios catalog untouched
- **N8N over a custom backend** — visual workflow orchestration lets non-developers on the team understand and modify the AI integration without reading code
- **Dual-model architecture** — running Gemini as primary with GPT-4o as fallback eliminates single-provider risk; the parser is model-agnostic so swapping or adding models requires no frontend changes
- **Strict JSON prompt + universal parser** — both models occasionally return Markdown-wrapped JSON; the parse node strips fences, evaluates the response shape dynamically, and returns a graceful fallback recipe instead of crashing the UI
- **No icon library** — inline SVG icons keep the bundle small and avoid version-pinning a dependency for a handful of icons
- **Outfit font via Google Fonts CDN** — single font family across the app, loaded once

---

## Author

**Daniel Esteban Quintero Caro** — Full Stack Developer

- [GitHub: CauseofDeathLife](https://github.com/CauseofDeathLife)
- [Linktree](https://linktr.ee/DanielEstebanQuintero)
- [LinkedIn](https://www.linkedin.com/in/danielesban/)

---

## License

This project was developed as an MVP for an educational challenge
(Reto 12 · NODO EAFIT - Grupo Bios). The source code is hosted on
GitHub for portfolio purposes under **All Rights Reserved**.

Brand assets (Friko and Antillana logos), product catalog data, and
recipe information were provided by Grupo Bios under the scope of
this academic project and remain property of their respective owners.
These assets are included in the repository for demonstration purposes
only and may not be reused, redistributed, or repurposed without
explicit permission from Grupo Bios.

Authorship and Collaboration

**Full-Stack Development & Software Architect:** Daniel Esteban Quintero Caro (Responsible for all React code, project structure, and ProCode integration logic).

**Research and Analysis:** Challenge 12 Team (Product research, catalog analysis, and client requirements).

**Quality Assurance (QA) and n8n Support:** Collaborative team effort on stress testing, prompt refinement, and adjustments to LowCode workflows.


This repository constitutes a work of individual authorship in terms of its architecture and source code, developed under a group collaboration framework. Credits for all team members for their management and support work are duly integrated into the application’s user interface.
