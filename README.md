# Serenity Companion

[![Deploy to Cloudflare][![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/a3908169-droid/serenity-companion-healing-ai-counseling)]

A production-ready AI chat companion built on Cloudflare Workers with Durable Objects for stateful multi-session conversations. Features streaming responses, tool calling (web search, weather, MCP tools), model switching (Gemini family), and a responsive React frontend with shadcn/ui.

## 🚀 Features

- **Multi-Session Chat**: Persistent conversations across sessions with title generation and management
- **Streaming Responses**: Real-time AI responses with low latency
- **Tool Integration**: Built-in web search (SerpAPI), weather lookup, and extensible MCP tool support
- **Model Switching**: Support for Gemini 2.5 Flash/Pro/2.0 via Cloudflare AI Gateway
- **Responsive UI**: Modern React app with Tailwind CSS, shadcn/ui components, and dark mode
- **Session Management**: Create, list, update, delete sessions with activity tracking
- **Production-Ready**: Error handling, CORS, logging, health checks, client error reporting
- **Cloudflare Native**: Durable Objects for agents, Workers for API, Pages for static assets

## 🛠️ Tech Stack

- **Backend**: Cloudflare Workers, Hono, Agents SDK (Durable Objects), OpenAI SDK
- **Frontend**: React 18, Vite, TanStack Query, React Router, shadcn/ui, Tailwind CSS
- **AI**: Cloudflare AI Gateway, Gemini models, SerpAPI, Model Context Protocol (MCP)
- **State**: Immer, Zustand (ready for use), TanStack Query
- **Dev Tools**: Bun, TypeScript, ESLint, Wrangler

## 📋 Prerequisites

- [Bun](https://bun.sh/) 1.0+ (package manager)
- [Cloudflare Account](https://dash.cloudflare.com/) with Workers/Pages enabled
- Cloudflare AI Gateway setup (for `@cloudflare/ai` models)
- API Keys: Cloudflare API Token, SerpAPI (optional for web search)

## 🏁 Quick Start

1. **Clone & Install**
   ```bash
   git clone <your-repo-url>
   cd serenity-companion-p6cghwt2adxndrlnopae4
   bun install
   ```

2. **Configure Environment** (edit `wrangler.jsonc`)
   ```json
   "vars": {
     "CF_AI_BASE_URL": "https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai",
     "CF_AI_API_KEY": "your-cloudflare-api-key",
     "SERPAPI_KEY": "your-serpapi-key"  // Optional
   }
   ```

3. **Generate Types**
   ```bash
   bun run cf-typegen
   ```

4. **Development**
   ```bash
   bun dev  # Starts at http://localhost:3000 (frontend + worker)
   ```

5. **Production Build & Deploy**
   ```bash
   bun run deploy  # Builds frontend + deploys worker
   ```

## 💻 Usage

### API Endpoints
All routes under `/api/`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat/:sessionId/chat` | `POST` | Send message `{message: string, model?: string, stream?: boolean}` |
| `/api/chat/:sessionId/messages` | `GET` | Get chat state |
| `/api/chat/:sessionId/clear` | `DELETE` | Clear messages |
| `/api/chat/:sessionId/model` | `POST` | Update model `{model: string}` |
| `/api/sessions` | `GET/POST/DELETE` | List/Create/Clear sessions |
| `/api/sessions/:id` | `DELETE` | Delete session |
| `/api/sessions/:id/title` | `PUT` | Update title `{title: string}` |

### Frontend
- Chat interface auto-creates sessions
- Sidebar for session management (edit `src/components/app-sidebar.tsx`)
- Theme toggle and responsive design

### Customization
- **Add Tools**: Extend `worker/tools.ts`
- **UI**: Replace `src/pages/HomePage.tsx`, use shadcn components
- **Routes**: Add to `worker/userRoutes.ts`
- **Sidebar**: Edit `src/components/app-sidebar.tsx`

## 🔧 Development

- **Hot Reload**: `bun dev` proxies frontend to worker
- **TypeScript**: Full type safety with Workers types
- **Linting**: `bun lint`
- **Build**: `bun build` (frontend only)
- **Preview**: `bun preview`

Watch files:
```
worker/   # Backend logic (DO NOT edit index.ts)
src/      # Frontend React app
```

## ☁️ Deployment

Deploy to Cloudflare Workers/Pages with one command:

```bash
bun run deploy
```

Or manually:

1. **Build Frontend**
   ```bash
   bun build
   ```

2. **Deploy Worker**
   ```bash
   npx wrangler deploy
   ```

Bindings auto-configured via `wrangler.jsonc`:
- `CHAT_AGENT`: Stateful chat Durable Object
- `APP_CONTROLLER`: Session management DO

Custom domain via Cloudflare Dashboard. Assets served as SPA.

[![Deploy to Cloudflare][![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/a3908169-droid/serenity-companion-healing-ai-counseling)]

## ⚙️ Configuration

### Environment Variables
| Key | Required | Description |
|-----|----------|-------------|
| `CF_AI_BASE_URL` | Yes | Cloudflare AI Gateway URL |
| `CF_AI_API_KEY` | Yes | Cloudflare API token |
| `SERPAPI_KEY` | No | Web search |
| `OPENROUTER_API_KEY` | No | Alt models |

### Models
Edit `src/lib/chat.ts`:
```ts
export const MODELS = [
  { id: 'google-ai-studio/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  // Add more
];
```

## 🤝 Contributing

1. Fork & clone
2. `bun install`
3. Create feature branch
4. `bun dev` & test
5. PR with changes

Report issues for bugs/features.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.