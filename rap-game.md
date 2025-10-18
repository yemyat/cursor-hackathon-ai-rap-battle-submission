# Human vs Human Rap Battle Game

## Overview

This is a multiplayer rap battle game where humans control AI agents to battle each other. Users pair up as "rapping partners" to give strategic instructions to AI agents, while spectators act as cheerleaders. The game transforms the original AI vs AI rap battle into an interactive, competitive experience.

## Core Concept

### Game Roles

1. **Rapping Partners (2 per battle)**

   - Control one side of the battle (e.g., "Claude" or "Gemini")
   - Have 10 seconds per turn to give instructions to their AI agent
   - Instructions guide what the agent should rap about, what to diss, style to use, etc.
   - Cannot see opponent's instructions until after the rap is generated

2. **Cheerleaders (unlimited spectators)**
   - Watch battles in real-time
   - Send reactions: Applause (👏), Fire (🔥), or Boo (👎)
   - Cannot give instructions to agents
   - All reactions are stored with timestamps

### Battle Flow

1. **Battle Creation**

   - User selects a predefined theme (e.g., "Claude vs Gemini")
   - System randomly assigns user to one side
   - Battle enters "waiting for partner" state

2. **Partner Joins**

   - Second player finds and joins the waiting battle
   - Gets assigned to opposite side
   - System randomly determines who goes first
   - First player's 10-second timer starts

3. **Turn Execution**

   - Current player has 10 seconds to type instructions
   - Timer is strictly enforced server-side
   - Auto-submits empty string if time runs out
   - Agent generates rap with music based on instructions
   - Everyone (both partners + spectators) listens to the music

4. **Battle Progression**
   - Alternates between partners for 3 rounds (6 total turns)
   - Each turn: instructions → AI generation → music playback → next turn
   - Battle completes after all rounds

## Predefined Themes

Users can only create battles under these 4 themes:

1. **Claude vs Gemini**

   - Sides: Claude (Anthropic) vs Gemini (Google)
   - Description: "Battle of the AI titans"

2. **Supabase vs Convex**

   - Sides: Supabase vs Convex
   - Description: "Backend battle royale"

3. **Python vs Javascript**

   - Sides: Python vs Javascript
   - Description: "Classic programming language showdown"

4. **GPT vs Grok**
   - Sides: GPT (OpenAI) vs Grok (xAI)
   - Description: "OpenAI's flagship vs xAI's challenger"

## Technical Implementation

### Backend (Convex) - ✅ COMPLETED

#### Database Schema

**users table**

```typescript
{
  clerkUserId: string,      // Clerk authentication ID
  username: string,         // Display name
  createdAt: number,        // Timestamp
}
// Index: by_clerk_id
```

**themes table**

```typescript
{
  name: string,             // "Claude vs Gemini"
  side1Name: string,        // "Claude"
  side2Name: string,        // "Gemini"
  description: string,      // Theme description
  order: number,            // Display order (1-4)
}
```

**rapBattles table**

```typescript
{
  themeId: Id<"themes">,
  theme: string,
  state: "waiting_for_partner" | "preparing" | "in_progress" | "done",
  currentRound: number,                    // 1-3
  agent1Name: string,                      // e.g., "Claude"
  agent2Name: string,                      // e.g., "Gemini"
  agent1ThreadId: optional string,         // Created when partner joins
  agent2ThreadId: optional string,
  partner1UserId: Id<"users">,            // Creator
  partner2UserId: optional Id<"users">,   // Joiner
  partner1Side: string,                    // Which agent partner1 controls
  partner2Side: optional string,
  waitingForPartner: boolean,
  currentTurnUserId: optional Id<"users">, // Whose turn is it
  currentTurnStartTime: optional number,
  currentTurnDeadline: optional number,    // startTime + 10000ms
  pendingInstructions: optional string,    // Temporary storage
  pendingPartnerId: optional Id<"users">,
  createdAt: number,
  updatedAt: number,
}
// Indexes: by_theme, by_waiting, by_partner1, by_partner2
```

**turns table**

```typescript
{
  rapBattleId: Id<"rapBattles">,
  roundNumber: number,              // 1-3
  turnNumber: number,               // 1 or 2
  agentName: string,                // "Claude" or "Gemini"
  partnerId: Id<"users">,           // Who gave the instructions
  instructions: string,             // User's instructions to agent
  instructionSubmittedAt: number,
  lyrics: string,                   // Generated rap lyrics
  musicTrackId: Id<"musicTracks">,
  threadId: string,
  createdAt: number,
}
// Index: by_battle
```

**cheers table**

```typescript
{
  battleId: Id<"rapBattles">,
  userId: Id<"users">,
  cheerType: "applause" | "boo" | "fire",
  timestamp: number,
  roundNumber: number,
}
// Index: by_battle_and_time
```

#### Key Backend Functions

**convex/users.ts**

- `getCurrentUser()` - Query: Get current Clerk user (returns null if not synced)
- `getUser({ userId })` - Query: Get user by ID

**convex/themes.ts**

- `listThemes()` - Query: Get all 4 themes sorted by order
- `getTheme({ themeId })` - Query: Get single theme
- `seedThemes()` - Mutation: Initialize the 4 predefined themes (run once)

**convex/rapBattle.ts**

- `createBattle({ themeId })` - Mutation: Create battle waiting for partner
  - Randomly assigns creator to side1 or side2
  - Sets state to "waiting_for_partner"
- `joinBattle({ battleId })` - Mutation: Join as second partner
  - Assigns to opposite side
  - Creates both agent threads
  - Randomly determines first player
  - Starts 10-second timer
- `submitInstructions({ battleId, instructions })` - Mutation: Submit turn
  - Validates it's user's turn and deadline hasn't passed
  - Stores instructions temporarily
  - Triggers agent generation
- `checkTurnTimeout({ battleId, expectedUserId, deadline })` - Internal Mutation
  - Auto-called by scheduler at deadline
  - Submits empty instructions if user didn't submit
- `executeRound({ battleId, agentName, threadId, roundNumber, previousLyrics, instructions, partnerId })` - Internal Action
  - Creates prompt with user's instructions
  - Generates rap lyrics via AI agent
  - Triggers music generation
- `incrementBattleRound({ battleId })` - Internal Mutation
  - Checks if round complete (2 turns)
  - Advances to next round or marks battle as done
- `setupNextTurn({ battleId })` - Internal Mutation
  - Sets up next partner's turn after music generation
  - Starts new 10-second timer
- `getBattle({ battleId })` - Query: Get battle by ID
- `getBattlesForTheme({ themeId })` - Query: List battles for theme
- `getWaitingBattles({ themeId })` - Query: Battles waiting for partners
- `getCurrentTurnInfo({ battleId })` - Query: Current turn user, deadline, time remaining
- `getTurnsByBattle({ battleId })` - Query: All turns for a battle
- `getMusicTrack({ trackId })` - Query: Get track with storage URL

**convex/cheers.ts**

- `sendCheer({ battleId, cheerType })` - Mutation: Send a cheer
  - Validates user is NOT a rapping partner (cheerleaders only)
  - Stores with timestamp
- `getCheersForBattle({ battleId })` - Query: All cheers with usernames
- `getRecentCheers({ battleId })` - Query: Last 10 cheers
- `getCheerStats({ battleId })` - Query: Counts per cheer type

**convex/agents/tools/generateMusic.ts**

- Modified to work with new battle flow
- Retrieves instructions from battle's pendingInstructions
- Saves turn with instructions, partner ID, and music
- Clears pending instructions
- Sets up next turn timer

#### Constants

- `TURN_DURATION_MS = 10_000` (10 seconds)
- `MAX_ROUNDS = 3`

### Frontend - 🚧 IN PROGRESS (Needs Completion)

#### Completed Components

**src/routes/battles.index.tsx**

- Shows 4 theme cards in grid
- Each card has:
  - Theme name and description
  - Side1 vs Side2 display
  - "Create Battle" button (calls `createBattle` mutation)
  - "View Battles" link to theme page
- Note: Has routing TypeScript errors that need fixing

**src/routes/battles.theme.$themeId.tsx**

- Theme-specific battle listing with tabs
- Tabs: Waiting for Partner / In Progress / Completed
- Waiting battles show "Join Battle" button for non-creators
- Note: Route may need to be renamed to match Tanstack Router conventions

**src/routes/battles.$battleId.tsx**

- Main battle view with multiple states:

1. **Waiting State** (waitingForPartner)

   - Shows "Waiting for opponent..."
   - Copy battle link button
   - Displays user's assigned side

2. **Active Battle State** (in_progress)

   - InstructionInput component (only for current rapping partner)
   - Two columns for agent1 and agent2 verses (TurnCard components)
   - CheerDisplay sidebar
   - AudioPlayer at bottom with cheer buttons

3. **Turn Management**
   - Shows whose turn it is
   - Timer countdown display
   - Auto-plays music when ready

**src/components/battle/instruction-input.tsx**

- Text area for instructions (500 char limit)
- 10-second countdown timer
  - Green/normal when > 3 seconds
  - Red/pulsing when ≤ 3 seconds
- Auto-submits when timer hits 0
- Shows "Waiting for opponent..." when not your turn

**src/components/battle/cheer-display.tsx**

- Shows cheer stats (counts for 👏, 🔥, 👎)
- Scrollable feed of recent 10 cheers
- Each cheer shows: icon, username, timestamp

**src/components/battle/audio-player.tsx**

- "Play Agent1" and "Play Agent2" buttons
- Cheer buttons (only visible to cheerleaders):
  - 👏 Applause
  - 🔥 Fire
  - 👎 Boo
- Currently playing track info

**src/routes/battles.create.tsx**

- Redirects to battles list (themes)

#### Frontend Issues to Fix

1. **Routing/TypeScript Errors**

   - `battles.theme.$themeId.tsx` route not properly registered
   - Type errors with route params
   - May need to regenerate routes or rename file

2. **Styling Issues**

   - Some CSS class ordering issues (Biome linter)
   - Magic numbers need extraction to constants

3. **Missing Features**

   - Show partner usernames in battle view
   - Instructions reveal button in TurnCard
   - Cheer animations (flying icons)

4. **Component Improvements**
   - Reduce complexity in BattleView component
   - Better error handling/loading states
   - Navigate after creating battle

### Authentication Flow

1. User logs in with Clerk
2. Clerk sends a webhook
3. User document created in Convex with Clerk ID
4. All subsequent operations use Convex user ID
5. Auth verified server-side via `ctx.auth.getUserIdentity()`

### Data Flow Example

**Creating a Battle:**

```
User clicks "Create Battle" on theme card
→ Frontend: createBattle({ themeId })
→ Backend: Creates rapBattle with state="waiting_for_partner"
→ Frontend: Navigate to battle page
→ Shows "Waiting for opponent..." state
```

**Joining a Battle:**

```
User clicks "Join Battle" on waiting battle
→ Frontend: joinBattle({ battleId })
→ Backend: Assigns to opposite side, creates threads
→ Backend: Randomly picks first player, starts 10s timer
→ Frontend: Navigate to battle page
→ Shows instruction input if your turn, else "waiting..."
```

**Taking a Turn:**

```
User types instructions and clicks submit (or timer expires)
→ Frontend: submitInstructions({ battleId, instructions })
→ Backend: Validates turn and deadline
→ Backend: Schedules executeRound action
→ Backend: AI generates rap with instructions
→ Backend: Music generation (ElevenLabs API)
→ Backend: Saves turn, increments round if needed
→ Backend: Sets up next player's turn with new timer
→ Frontend: Real-time updates via Convex reactivity
→ Music auto-plays when ready
```

**Cheerleading:**

```
Spectator clicks cheer button
→ Frontend: sendCheer({ battleId, cheerType })
→ Backend: Validates user is NOT a rapping partner
→ Backend: Stores cheer with timestamp
→ Frontend: Cheer appears in live feed
→ Stats update in real-time
```

## Setup Instructions

### Backend Setup (Already Done)

1. ✅ Database schema created with all tables
2. ✅ All backend functions implemented
3. ✅ TypeScript compilation successful
4. 🔄 Need to run once: `seedThemes()` mutation via dashboard

### Frontend Setup (Needs Completion)

1. ❌ Fix routing for theme battles page
2. ❌ Call `syncUser()` on app initialization
3. ❌ Fix TypeScript errors in route params
4. ❌ Test battle creation flow
5. ❌ Test joining and turn-taking
6. ❌ Test cheering functionality
7. ❌ Add missing UI features (animations, instruction reveals)

## Environment Requirements

- Clerk authentication (already configured)
- ElevenLabs API key for music generation
- Convex deployment
- Node.js with pnpm

## File Structure

```
convex/
  ├── schema.ts              ✅ Complete
  ├── users.ts               ✅ Complete
  ├── themes.ts              ✅ Complete
  ├── rapBattle.ts           ✅ Complete
  ├── cheers.ts              ✅ Complete
  └── agents/
      ├── rapAgent.ts        ✅ Existing
      └── tools/
          └── generateMusic.ts ✅ Updated

src/
  ├── routes/
  │   ├── battles.index.tsx          🔄 Complete (has minor linting issues)
  │   ├── battles.theme.$themeId.tsx 🚧 Complete but needs route fix
  │   ├── battles.$battleId.tsx      🔄 Complete (needs cleanup)
  │   └── battles.create.tsx         ✅ Complete (redirects)
  └── components/
      └── battle/
          ├── instruction-input.tsx  🔄 Complete (has linting issues)
          ├── cheer-display.tsx      🔄 Complete (has linting issues)
          ├── audio-player.tsx       ✅ Complete
          └── turn-card.tsx          ✅ Existing
```

## Next Steps for Frontend Developer

1. **Fix Routing Issues**

   - Resolve type errors in theme route
   - Ensure Tanstack Router properly recognizes routes
   - May need to run route generation

2. **User Sync**

   - Add `syncUser()` call on app mount
   - Handle user not synced state gracefully

3. **Polish UI**

   - Fix CSS ordering issues
   - Extract magic numbers to constants
   - Add loading states
   - Add error boundaries

4. **Test Full Flow**

   - Create battle → Join battle → Take turns → Complete battle
   - Test as spectator (cheerleading)
   - Test timeout behavior

5. **Enhancements**
   - Instruction reveal in TurnCard
   - Cheer animations
   - Show partner usernames
   - Battle list filtering/sorting

## Known Issues

- Frontend routing TypeScript errors need resolution
- Some linting warnings (CSS ordering, magic numbers)
- BattleView component has high complexity (26 vs max 15)
- Need to call `seedThemes()` once before themes appear

## Success Criteria

- Users can create battles under predefined themes
- Two users can join and battle with 10-second turns
- Instructions guide AI rap generation
- Music plays for all participants
- Spectators can send cheers
- Battle progresses through 3 rounds
- Real-time updates work seamlessly
