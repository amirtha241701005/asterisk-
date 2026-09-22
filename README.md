# Asterisk AI

AI-native UI/UX design workspace. Asterisk reasons about users and tasks, researches real design patterns via Inspo MCP, generates structured multi-screen interfaces with Gemini, evaluates quality, and supports natural-language refinement.

## Architecture

```
User brief
  → UX reasoning (Gemini)
  → Inspiration research (Inspo MCP)
  → Multi-screen design synthesis (Gemini)
  → Quality evaluation (+ bounded auto-improvement)
  → Canvas rendering with design tokens
  → Natural-language refinement
```

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key for UX reasoning, generation, evaluation, refinement |
| `GEMINI_MODEL` | No | Preferred model (defaults to `gemini-3.6-flash` with fallbacks) |
| `INSPO_MCP_URL` | No | Inspo MCP endpoint (defaults to `https://inspomcp.dev/api/mcp`) |

Store secrets in `.env.local`. Never commit API keys.

## API routes

- `POST /api/design` — Full pipeline: UX reasoning, Inspo, generation, quality check, optional improvement
- `POST /api/design/refine` — Targeted refinement of existing design JSON
- `POST /api/inspiration` — Standalone Inspo research

## Project structure

```
app/                    Next.js app and API routes
components/designer/    Designer shell, canvas, AI panel, renderer
lib/ai/                 Gemini service, schemas, prompts, pipeline
lib/inspo/              Inspo MCP client
lib/design/             Token resolution and device dimensions
```

## Development

```bash
npm run dev      # Development server
npm run build    # Production build + typecheck
npm run lint     # ESLint
```

## Limitations

- Export is not yet implemented (toolbar shows disabled state)
- Drawing tools (frame/text/shape) are UI placeholders
- Quality auto-improvement runs at most one retry per generation
- Inspo availability depends on external MCP service
