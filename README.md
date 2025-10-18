# AI Rap Battle Game

A multiplayer rap battle game where humans control AI agents to battle each other. Users pair up as "rapping partners" to give strategic instructions to AI agents, while spectators act as cheerleaders.

Built with Convex, React, TypeScript, Vite, Clerk, Tailwind CSS, and shadcn/ui.

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm installed
- A [Clerk](https://clerk.dev/) account
- A [Convex](https://www.convex.dev/) account
- An [ElevenLabs](https://elevenlabs.io/) API key for music generation

### Installation

1. **Clone and install dependencies**

```bash
pnpm install
```

2. **Set up environment variables**

Create a `.env.local` file in the root directory with the following React/Vite environment variables:

```bash
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."

# Convex Backend
VITE_CONVEX_URL="https://your-convex-deployment.convex.cloud"
```

3. **Configure Convex environment variables**

Go to your Convex dashboard (https://dashboard.convex.dev) and add these environment variables to your deployment:

```bash
# Clerk Configuration
CLERK_JWT_ISSUER_DOMAIN="your-clerk-domain.clerk.accounts.dev"
CLERK_WEBHOOK_SECRET="whsec_..."

# ElevenLabs (for music generation)
ELEVENLABS_API_KEY="sk_..."
```

4. **Set up Clerk webhook**

- In your Clerk dashboard, go to Webhooks
- Create a webhook pointing to: `https://your-convex-deployment.convex.site/clerk-users-webhook`
- Subscribe to `user.created` and `user.updated` events
- Copy the signing secret to `CLERK_WEBHOOK_SECRET` in Convex

5. **Start development servers**

```bash
pnpm dev
```

This will start both the frontend (Vite) and backend (Convex) in parallel.

## Environment Variables Reference

### React (.env.local)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key for authentication | Yes |
| `VITE_CONVEX_URL` | Convex deployment URL | Yes |

### Convex (Dashboard)

| Variable | Description | Required |
|----------|-------------|----------|
| `CLERK_JWT_ISSUER_DOMAIN` | Clerk JWT issuer domain for auth validation | Yes |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook signing secret for user sync | Yes |
| `ELEVENLABS_API_KEY` | ElevenLabs API key for AI-generated music | Yes |

## Available Scripts

- `pnpm dev` - Start both frontend and backend in development mode
- `pnpm dev:frontend` - Start only the Vite dev server
- `pnpm dev:backend` - Start only the Convex backend
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build locally

## Documentation

- [Convex docs](https://docs.convex.dev/home)
- [Clerk + Convex integration](https://docs.convex.dev/auth/clerk)
- [Game concept](game-concept.md)
