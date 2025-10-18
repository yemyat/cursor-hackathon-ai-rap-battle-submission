# Workflow Implementation Guide

## Current Status 🔴

The workflow implementation has been **partially completed** but has several type errors that need to be resolved before it can run on Convex.

## What Was Created ✅

1. **`convex/workflows/battleWorkflow.ts`** - Main workflow orchestrator
2. **`convex/battleWorkflowHelpers.ts`** - Helper functions for workflow
3. **`convex/startBattleWorkflow.ts`** - Workflow starter wrapper
4. **`convex/agents/rapAgent.ts`** - Updated to support lyrics-only mode

## Key Issues to Fix 🔧

### 1. Workflow Manager Configuration
```typescript
// Line 6-12 in battleWorkflow.ts
export const workflow = new WorkflowManager(components.workflow, {
  defaultRetryBehavior: {  // ❌ This option doesn't exist
    maxAttempts: 3,
    initialBackoffMs: 1000,
    base: 2,
  },
  retryActionsByDefault: true,
});
```

**Fix:** Check Convex Workflows documentation for correct WorkflowManager options.

### 2. Music Generation API Calls
The workflow calls non-existent functions:
- `internal.agents.tools.generateMusic.createCompositionPlan` ❌
- `internal.agents.tools.generateMusic.saveCompositionPlan` ❌
- `internal.agents.tools.generateMusic.generateMusicFromPlan` ❌
- `internal.agents.tools.generateMusic.saveMusicTrack` ❌

**Actual functions:**
- `internal.agents.tools.generateMusic.generateCompositionPlan` ✅
- Need to check what other functions exist

### 3. Type Safety Issues
```typescript
// Line 87 - trying to access .handler on a RegisteredMutation
step: Parameters<typeof battleWorkflow.handler>[0]  // ❌ Type error
```

**Fix:** Use proper Convex Workflow step type from the library.

### 4. Agent Result Structure
```typescript
// In battleWorkflowHelpers.ts
const result = await agent.generateText(...);
return result.text || "";  // ❌ May not have .text property
```

**Fix:** Check actual agent.generateText() return type.

## Recommended Approach 🎯

### Option A: Simplify Workflow (Recommended)
Instead of a complex durable workflow, use a **simpler state machine** with Convex scheduler:

```typescript
// On joinBattle:
1. Start with Round 1, Turn 1
2. Schedule checkTurnCompletion after 10s
3. On turn completion:
   - Generate lyrics
   - Generate music
   - Start playback
   - Schedule next turn after playback
4. Repeat until 3 rounds complete
```

Benefits:
- ✅ Easier to debug
- ✅ Less complex types
- ✅ Can use existing code structure
- ✅ Still gets you synchronized experience

### Option B: Fix Workflow Types
If you want to stick with workflows:

1. **Check Convex Workflows docs** for correct API
2. **Create proper internal actions** for music generation steps
3. **Fix all type signatures** to match Workflow library types
4. **Test incrementally** - start with 1 round, then expand

## Quick Win: Hybrid Approach 🚀

Keep the synchronized playback system we built, but use simpler orchestration:

```typescript
// In submitInstructions mutation:
export const submitInstructions = mutation({
  handler: async (ctx, args) => {
    // Save instructions
    await ctx.db.patch(battleId, {
      pendingInstructions: args.instructions,
      pendingPartnerId: userId,
    });
    
    // Trigger turn execution
    await ctx.scheduler.runAfter(0, internal.executeTurnSequence, {
      battleId,
      agentName,
      threadId,
      instructions: args.instructions,
    });
  },
});

// New internal action:
export const executeTurnSequence = internalAction({
  handler: async (ctx, args) => {
    // 1. Generate lyrics
    const lyrics = await generateLyrics(...);
    
    // 2. Generate composition plan
    const plan = await ctx.runAction(internal.agents.tools.generateMusic.generateCompositionPlan, {
      agentName: args.agentName,
      lyrics,
    });
    
    // 3. Generate music
    const musicId = await ctx.runAction(internal.agents.tools.generateMusic.composeMusicFromPlan, {
      compositionPlanId: plan.compositionPlanId,
    });
    
    // 4. Save turn
    const turnId = await ctx.runMutation(internal.saveTurnComplete, {
      battleId: args.battleId,
      ...turnData,
    });
    
    // 5. Start synchronized playback
    await ctx.runMutation(internal.startSyncPlayback, {
      battleId: args.battleId,
      turnId,
      duration: plan.compositionPlan.duration,
    });
    
    // 6. Schedule next turn after playback
    await ctx.scheduler.runAfter(
      plan.compositionPlan.duration + 1000,
      internal.setupNextTurn,
      { battleId: args.battleId }
    );
  },
});
```

This gives you:
- ✅ Orchestrated flow
- ✅ Synchronized playback
- ✅ Auto-progression
- ✅ Simpler than full workflows
- ✅ Can deploy today

## Next Steps 📋

1. **Decide**: Full workflows vs. simpler approach
2. **Fix**: Type errors if going with workflows
3. **Test**: Run `npx convex dev` to check for errors
4. **Deploy**: Once type-safe and working

## Files to Review

- `convex/workflows/battleWorkflow.ts` - Main workflow (has errors)
- `convex/battleWorkflowHelpers.ts` - Helper functions (mostly good)
- `convex/agents/tools/generateMusic.ts` - Check actual API
- Your existing sync system - Already working! ✅
