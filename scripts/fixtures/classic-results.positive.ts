// Each hook below must COMPILE against Anthropic's declarations: one for each kind of result the
// Migration page's table says a function hook can return. They are checked by
// scripts/typecheck-templates.mjs and never run, so registering the same event twice is fine here.
import type { On } from 'claude-code'

export function register(on: On) {
  // classic.PreToolUse: allow, ask, deny, updatedInput and additionalContext
  on('classic.PreToolUse', () => ({ allow: true }))
  on('classic.PreToolUse', () => ({ ask: 'Really run this?' }))
  on('classic.PreToolUse', () => ({ deny: 'Not allowed' }))
  on('classic.PreToolUse', () => ({ updatedInput: { command: 'ls' } }))
  on('classic.PreToolUse', () => ({ additionalContext: ['A note for the model'] }))

  // e is the tool-call envelope: after narrowing to Bash, e.command is a string.
  on('classic.PreToolUse', ($, e, next) => {
    if (e.tool === 'Bash') {
      const command: string = e.command
      if (command.length > 1000) return { deny: 'Too long' }
    }
    return next(e)
  })

  // Every other classic event: block, and preventContinuation with stopReason
  on('classic.Stop', () => ({ block: 'Keep going' }))
  on('classic.Stop', () => ({ preventContinuation: true, stopReason: 'Done for now' }))
  on('classic.Stop', ($, e) => (e.stop_hook_active ? { additionalContext: ['Already continuing'] } : { block: 'Run the tests' }))

  // Event specific fields, each read only by its own events
  on('classic.UserPromptSubmit', () => ({ additionalContext: ['Uses pnpm'], sessionTitle: 'A title' }))
  on('classic.SessionStart', () => ({ watchPaths: ['/tmp/watched'] }))

  // The engine events around a classic one
  on('tool.call', () => ({ deny: 'Refused' }))
  on('tool.call', () => ({ result: 'Answered by the hook' }))
  on('prompt.submit', () => ({ drop: 'Dropped' }))
  on('session.compact', () => ({ skip: 'Not now' }))
}
