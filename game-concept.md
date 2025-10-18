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

## Success Criteria

- Users can create battles under predefined themes
- Two users can join and battle with 10-second turns
- Instructions guide AI rap generation
- Music plays for all participants
- Spectators can send cheers
- Battle progresses through 3 rounds
- Real-time updates work seamlessly
