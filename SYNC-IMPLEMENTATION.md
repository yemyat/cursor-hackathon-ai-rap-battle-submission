# Synchronized Battle Experience Implementation

## Overview

Implemented a Kahoot-like synchronized multiplayer experience for the rap battle app using Convex's real-time capabilities. All participants (2 rapping partners + unlimited spectators) now see and hear the same thing at the same time.

## Key Features Implemented

### 1. Server-Driven Playback Timing ⏱️
- **Server timestamps**: Audio playback starts at a specific server timestamp
- **Automatic sync**: Clients calculate their position based on server time
- **Late joiners**: Can sync immediately to the current playback position
- **No drift**: Single source of truth prevents client desynchronization

### 2. Automatic Playback Progression 🎵
- **Auto-advance**: When a turn finishes, automatically plays the next turn
- **Round transitions**: Automatically advances to next round when both agents finish
- **Scheduled checks**: Server uses Convex scheduler to manage transitions
- **Buffer time**: 500ms buffer prevents premature transitions

### 3. Synchronized State 🔄
- **Shared round view**: All users view the same round at the same time
- **Shared playback**: Everyone hears the same audio simultaneously
- **Global controls**: Round/playback changes broadcast to all viewers
- **Real-time updates**: Convex reactivity keeps all clients in sync

## Architecture Changes

### Schema Updates (`convex/schema.ts`)
Added to `rapBattles` table:
```typescript
playbackStartedAt: v.optional(v.number()), // Server timestamp when playback started
playbackDuration: v.optional(v.number()),  // Track duration in ms
playbackState: v.optional(
  v.union(v.literal("idle"), v.literal("playing"), v.literal("completed"))
)
```

### Backend Changes (`convex/rapBattle.ts`)

#### Updated Mutations:
- **`setPlayingTurn`**: Now stores server timestamp and schedules auto-advance
- **`startRoundPlayback`**: Sets timing info when starting a round
- **`setActiveRound`**: Stops playback when changing rounds manually

#### New Scheduled Function:
- **`checkPlaybackComplete`**: 
  - Checks if playback has finished
  - Auto-advances to next turn or next round
  - Handles end-of-battle gracefully
  - Recursively schedules itself for continuous playback

### Frontend Architecture

#### New Components Created:

1. **`AudioSync`** (`src/components/battle/audio-sync.tsx`)
   - Logic-only component handling audio synchronization
   - Calculates playback position from server timestamps
   - Compensates for network latency
   - Handles late joiners by seeking to correct position
   - Syncs only when >1 second off to avoid micro-adjustments

2. **`BattleHeader`** (`src/components/battle/battle-header.tsx`)
   - Displays battle theme, agents, round, and state
   - Shows which agent the user controls

3. **`RoundSelector`** (`src/components/battle/round-selector.tsx`)
   - Navigate between rounds
   - Shows current round out of total rounds

4. **`WaitingForPartner`** (`src/components/battle/waiting-for-partner.tsx`)
   - Handles waiting room before battle starts
   - Join button for second partner
   - Share battle link functionality

#### Refactored Main Component:
- **`battles.$battleId.tsx`**: Simplified from 500+ lines to ~330 lines
- Removed local state management
- Uses Convex state as single source of truth
- Cleaner separation of concerns

## How It Works

### Synchronization Flow:

1. **User clicks play** → Mutation called with turn ID
2. **Server records timestamp** → `playbackStartedAt = Date.now()`
3. **All clients receive update** → Convex reactivity broadcasts to all
4. **AudioSync calculates position**:
   ```typescript
   elapsedMs = Date.now() - playbackStartedAt
   positionSeconds = elapsedMs / 1000
   audioElement.currentTime = positionSeconds
   audioElement.play()
   ```
5. **Server schedules check** → After duration + 500ms buffer
6. **Auto-advance** → When track ends, play next turn/round
7. **Repeat** → Until battle completes

### Late Joiner Handling:

A user joining mid-playback will:
1. Receive current `playbackStartedAt` timestamp
2. Calculate how much time has elapsed
3. Seek audio to correct position
4. Start playing synchronized with others

### Example Timeline:
```
T=0s:   Server starts playback, sets playbackStartedAt=1000
T=2s:   Late joiner arrives
        Calculates: elapsed = Date.now() - 1000 = 2000ms
        Seeks to: 2 seconds into track
        Plays from 2s onward (synchronized!)
```

## Benefits

✅ **True multiplayer sync** - All users experience the battle together
✅ **Kahoot-like feel** - Live event experience for spectators
✅ **No client-side control** - Can't skip ahead or pause independently
✅ **Automatic progression** - Seamless flow between turns/rounds
✅ **Late joiner support** - Can join mid-battle and sync immediately
✅ **Simplified client code** - Server manages all timing logic
✅ **Better debugging** - Single source of truth on server

## Testing

To test synchronization:
1. Open battle in two browser windows
2. Join as both partners
3. Submit instructions and watch auto-playback
4. Both windows should play audio at exactly the same time
5. Try joining late (after track starts) - should sync to current position

## Technical Details

### Constants:
- `PLAYBACK_BUFFER_MS = 500` - Buffer after track ends before advancing
- `SYNC_THRESHOLD_SECONDS = 1` - Only resync if >1 second off
- `MS_TO_SECONDS = 1000` - Conversion factor

### State Machine:
```
idle → (user plays) → playing → (track ends) → completed → (auto-advance) → playing
                                                          ↓
                                                        idle (if no more turns)
```

## Future Enhancements

Potential improvements for v2:
- Pre-buffer next track for instant transitions
- Network latency compensation (ping server to measure offset)
- Countdown animation before playback starts
- Visual sync indicator (beats/waveform)
- Pause/resume for rapping partners (post-battle review)
