# Synchronized Battle Experience Brainstorming

## Current Challenge

The rap battle needs to be a synchronized experience where all participants (2 rapping partners + unlimited spectators) see and hear the same thing at the same time, similar to watching a live event together.

## Key Problems Identified

### 1. Audio Playback Synchronization
- All users need to hear the rap at the same moment
- Audio must start at the same time for everyone
- Playback controls should be global, not per-user

### 2. State Management Location
- Currently: Playback state is local (client-side)
- Problem: Each user has independent playback state
- Users can be at different points in the battle

### 3. Round/Turn Progression
- Round changes need to broadcast to all clients
- Turn transitions should be synchronized
- Everyone should see the same battle state

## Proposed Solution: Server-Driven Experience

### Client-Side Responsibilities (Minimal)
1. **Send reactions** (👏, 🔥, 👎)
2. **Send instruction prompts** (only for rapping partners on their turn)
3. **Render UI** based on server state
4. **Control local audio element** based on server commands

### Server-Side State (Authority)

#### Battle Playback State
```typescript
{
  currentlyPlaying: {
    trackId: Id<"musicTracks"> | null,
    startedAt: number,  // Server timestamp when playback started
    duration: number,   // Track duration in ms
    agentName: string,  // Which agent is rapping
  },
  playbackState: "idle" | "playing" | "paused" | "waiting_for_next",
}
```

#### Synchronization Approach

1. **Server Initiates Playback**
   - After music generation completes
   - Server sets `currentlyPlaying.startedAt = Date.now()`
   - Server broadcasts to all clients: "Start playing track X now"

2. **Clients Calculate Position**
   - Client receives server timestamp
   - Calculates elapsed time: `serverTime - startedAt`
   - Seeks audio to correct position (handles late joiners)
   - Compensates for network latency

3. **Server Manages Transitions**
   - Tracks when audio should finish (startedAt + duration)
   - Automatically transitions to next turn when audio ends
   - No client-side control over progression

### Battle Flow with Server-Driven Playback

```
Turn Submitted
  ↓
AI Generation (server)
  ↓
Music Generation (server)
  ↓
Server: Set currentlyPlaying.startedAt = now
Server: Broadcast "play_track" event
  ↓
All Clients: Start audio at position 0 (or calculated position if late)
  ↓
[Users listen - no controls]
  ↓
Server: Detect audio finished (startedAt + duration + buffer)
Server: Set playbackState = "waiting_for_next"
  ↓
Server: Setup next turn
Server: Broadcast turn change
  ↓
Next player's timer starts
```

## Implementation Changes Needed

### Schema Updates

Add to `rapBattles` table:
```typescript
{
  // ... existing fields
  currentlyPlayingTrackId: optional Id<"musicTracks">,
  playbackStartedAt: optional number,  // Server timestamp
  playbackDuration: optional number,
  playbackAgentName: optional string,
  playbackState: "idle" | "playing" | "completed",
}
```

### New Backend Functions

**convex/rapBattle.ts**
- `startPlayback({ battleId, trackId, duration, agentName })` - Internal Mutation
  - Sets playback state with server timestamp
  - Broadcasts to all clients
  
- `checkPlaybackComplete({ battleId })` - Scheduled check
  - Called after playbackDuration + 1s buffer
  - Transitions to next turn when complete
  
- `getPlaybackState({ battleId })` - Query
  - Returns current playback info
  - Clients use this for sync

### Frontend Changes

**Audio Player Component**
- Remove local play/pause buttons for partners/spectators
- Calculate playback position from server timestamp
- Auto-start when server broadcasts playback
- Show "Now playing: Agent X" (read-only)

**Sync Logic**
```typescript
// When receiving playback state from server
const serverTime = playbackStartedAt;
const now = Date.now();
const elapsedMs = now - serverTime;
const positionSeconds = elapsedMs / 1000;

if (positionSeconds >= 0 && positionSeconds < duration) {
  audioElement.currentTime = positionSeconds;
  audioElement.play();
}
```

## Benefits of Server-Driven Approach

1. **True Synchronization**
   - All users at same point in battle
   - Late joiners can sync immediately
   - No drift between clients

2. **Simplified Client Logic**
   - Clients are "dumb" renderers
   - No complex state management
   - No race conditions

3. **Better UX for Spectators**
   - Feels like watching a live event
   - Can't skip ahead or pause (fair for everyone)
   - Everyone cheers at the same moments

4. **Easier Debugging**
   - Single source of truth (server)
   - All state changes logged server-side
   - Reproducible issues

## Potential Challenges

### Network Latency
- **Problem**: Users receive playback command at different times
- **Solution**: Use server timestamp + client-side seeking
  - Client calculates how much audio has played since server started it
  - Seeks to correct position on start

### Audio Loading Time
- **Problem**: Some clients take longer to load audio
- **Mitigation**: 
  - Preload audio when turn is submitted (before playback)
  - Show loading indicator if audio not ready
  - Small buffer (1-2s) before server starts playback

### Time Synchronization
- **Problem**: Client and server clocks may differ
- **Solution**: 
  - Use server timestamps for all calculations
  - Client only calculates delta from server time
  - Accept minor (<500ms) desync as acceptable

### Mobile/Background Tab
- ❌ **Not a concern for MVP** - Users expected to stay focused during live battle

## Post-Battle Playback

Once battle state is `"done"`:
- Server sync no longer needed
- Local playback controls enabled for all users
- Anyone can replay any turn independently
- Spectators can continue sending cheers
- Battle becomes a "recording" rather than "live event"

## Alternative: Simpler Approach

If full audio sync is too complex, consider:

### Queue-Based System
- Server maintains a "current turn" pointer
- All clients show the same turn
- Audio is still local, but turn progression is global
- Users can't skip turns, must wait for timer
- "Next turn" button only appears after minimum duration

This gives synchronized battle flow without needing perfect audio sync.

## Open Questions

1. Should we allow rapping partners to pause/replay for review after battle?
2. How to handle user disconnects during their turn?
3. Should we show a "live" indicator to emphasize synchronization?
4. Pre-game countdown before first turn starts?
5. Victory animation/screen after battle completes?

## Recommendation

Start with **server-driven playback state** for battle progression (rounds, turns, whose turn) but keep audio playback local for MVP. This gives us:
- ✅ Synchronized battle flow
- ✅ Consistent turn progression  
- ✅ Simpler implementation
- ⚠️ Minor audio desync acceptable for MVP

Full audio synchronization can be added in v2 if user feedback shows it's necessary.
