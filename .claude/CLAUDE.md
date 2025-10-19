# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An AI-powered multiplayer rap battle game where humans control AI agents (like Claude and Gemini) to compete in real-time battles. Built with React, TypeScript, Vite, Convex (backend), Clerk (auth), and ElevenLabs (music generation).

**Key Concept**: Two players ("rapping partners") give 10-second instructions to AI agents each turn. The AI generates lyrics and music based on instructions. Spectators can cheer with reactions. Battles run for 3 rounds (6 total turns).

## Development Commands

### Package Manager
This project uses **pnpm** (version 10.17.0+). Always use `pnpm` commands, not `npm` or `yarn`.

### Core Commands
```bash
pnpm dev                 # Start both frontend (Vite) + backend (Convex) in parallel
pnpm dev:frontend        # Start only Vite dev server (port typically 5173)
pnpm dev:backend         # Start only Convex backend
pnpm build               # Build for production (TypeScript + Vite)
pnpm preview             # Preview production build locally
```

### Code Quality
```bash
pnpm dlx ultracite fix   # Format and auto-fix code with Ultracite/Biome
pnpm dlx ultracite check # Check for issues without fixing
```

Ultracite is a strict linter/formatter enforcing type safety and accessibility. It's configured via `biome.jsonc` which extends the ultracite preset. **Always run `ultracite fix` before committing** (enforced via husky + lint-staged).

## Architecture

### Frontend (React + TanStack Router)
- **Router**: TanStack Router with file-based routing in `src/routes/`
  - `__root.tsx` - Root layout with navigation
  - `index.tsx` - Home page
  - `battles.index.tsx` - List of all battles
  - `battles.create.tsx` - Create new battle
  - `battles.theme.$themeId.tsx` - Battles for specific theme
  - `battles.$battleId.tsx` - Active battle view (redirects to replay when done)
  - `replay.$battleId.tsx` - Replay completed battles
- **Components**: Located in `src/components/`
  - `ui/` - shadcn/ui components (Radix UI + Tailwind)
  - `battle/` - Battle-specific components (audio player, turn cards, etc.)
- **Hooks**: `src/hooks/` contains battle logic (`use-battle-logic.ts`) and replay logic (`use-battle-replay.ts`)
- **Styling**: Tailwind CSS with custom theme (coral/coralLight brand colors)

### Backend (Convex)
- **Schema**: `convex/schema.ts` defines all tables:
  - `users` - Synced from Clerk
  - `themes` - Predefined battle themes (e.g., "Claude vs Gemini")
  - `rapBattles` - Battle orchestration with state machine
  - `turns` - Individual turn records with instructions/lyrics
  - `compositionPlans` - Music composition plans from ElevenLabs
  - `musicTracks` - Generated music files (stored in Convex storage)
  - `cheers` - Spectator reactions (applause, fire, boo)

- **Key Files**:
  - `convex/rapBattle.ts` - Queries/mutations for battle lifecycle
  - `convex/workflows/battleWorkflow.ts` - Main workflow orchestrating battles
  - `convex/battleWorkflowHelpers.ts` - Helper functions for workflow
  - `convex/agents/rapAgent.ts` - AI agent using @convex-dev/agent
  - `convex/agents/tools/` - Agent tools for music generation
  - `convex/startBattleWorkflow.ts` - Entry point to start workflow
  - `convex/http.ts` - Clerk webhook endpoint for user sync
  - `convex/constants.ts` - Shared constants (turn duration, music duration)

### Battle State Machine
Battles follow this state progression:
1. `waiting_for_partner` - Created, waiting for second player
2. `in_progress` - Both partners joined, turns executing
3. `done` - All rounds complete

### Workflow System
Uses `@convex-dev/workflow` for orchestration:
- `battleWorkflow.ts` runs the entire battle asynchronously
- Handles turn timing (10-second countdown with server-side enforcement)
- Generates lyrics using AI agent with previous opponent context
- Generates music composition plan then composes music
- Manages synchronized playback timing across all clients
- Automatically progresses through rounds and marks battle complete

### Audio Synchronization
Server-driven synchronized playback:
- `rapBattles` table stores `playbackStartedAt`, `playbackDuration`, `playbackState`
- `AudioSync` component (`src/components/battle/audio-sync.tsx`) calculates playback position from server time
- All clients (partners + spectators) see/hear the same thing simultaneously
- No client-side play/pause controls during active battles

### Authentication
- **Clerk** handles authentication
- Webhook at `/clerk-users-webhook` syncs users to Convex
- JWT validation configured via `convex/auth.config.js`
- Required environment variables:
  - Frontend: `VITE_CLERK_PUBLISHABLE_KEY`
  - Convex: `CLERK_JWT_ISSUER_DOMAIN`, `CLERK_WEBHOOK_SECRET`

### AI Integration
- **Lyrics Generation**: Uses AI agents (configured in `convex/agents/rapAgent.ts`)
- **Music Generation**: ElevenLabs API for AI-generated music
  - Two-step process: composition plan → music composition
  - Requires `ELEVENLABS_API_KEY` in Convex environment
- **LLM Models**: Supports multiple providers via `ai` SDK (Anthropic, Google, OpenAI)

## Important Patterns

### Turn Execution Flow
1. Workflow sets current turn user + deadline in `rapBattles`
2. Frontend displays countdown timer (synced to server deadline)
3. User submits instructions OR timeout occurs (auto-submits empty string)
4. Workflow generates lyrics with context from previous opponent turn
5. Workflow generates composition plan then music
6. Workflow updates `rapBattles` with playback timing
7. All clients start synchronized playback via `AudioSync`
8. Workflow waits for playback duration before next turn

### Data Loading Pattern
Components use Convex's reactive queries:
```tsx
const battle = useQuery(api.rapBattle.getBattle, { battleId });
const turns = useQuery(api.rapBattle.getTurnsByBattle, { battleId });
```
Convex automatically re-renders components when data changes.

### Role Detection
`use-battle-logic.ts` determines user role:
- `isPartner1` / `isPartner2` - Is the user one of the partners?
- `isRappingPartner` - Is the user a partner (either side)?
- `isCheerleader` - Is the user a spectator (not a partner)?
- `isYourTurn` - Is it currently this user's turn to give instructions?

### Music Track URLs
Music stored in Convex storage:
```typescript
const track = await ctx.db.get(trackId);
const storageUrl = await ctx.storage.getUrl(track.storageId);
```
URLs are temporary and expire. Always fetch fresh URLs from storage.

## Environment Variables

### Frontend (.env.local)
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

### Backend (Convex Dashboard)
```
CLERK_JWT_ISSUER_DOMAIN=your-clerk-domain.clerk.accounts.dev
CLERK_WEBHOOK_SECRET=whsec_...
ELEVENLABS_API_KEY=sk_...
GOOGLE_GENERATIVE_AI_API_KEY=sk_...
```

## Key Constraints

1. **Turn Timing**: 10-second countdown enforced server-side (not client-side)
2. **Round Limit**: Exactly 3 rounds (6 total turns) per battle
3. **Partner Assignment**: Random side assignment on creation, opposite side for joiner
4. **First Turn**: Randomly determined when second partner joins
5. **Redirects**: Active battles (`battles.$battleId`) redirect to replay when state becomes `done`
6. **Synchronized Playback**: All clients must see/hear the same content at the same time
7. **Agent Context**: Each turn includes previous opponent's lyrics for continuity

## TypeScript Configuration
- `tsconfig.json` - Base config
- `tsconfig.app.json` - Frontend config (React)
- `tsconfig.node.json` - Vite config scripts
- `convex/tsconfig.json` - Convex backend config

All TypeScript errors must be resolved before building.

## Code Quality Notes
- This codebase uses **Ultracite** which enforces strict Biome rules (see `.claude/CLAUDE.md` in parent for full rule list)
- Key requirements: strict type safety, accessibility standards, no console/debugger statements
- Lint-staged runs `ultracite fix` on all staged files before commit
- TanStack Router generates `src/routeTree.gen.ts` automatically - do not edit manually
