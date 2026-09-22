// Each line below must FAIL to typecheck against Anthropic's declarations. `@ts-expect-error` makes
// the compiler report an unused directive when a line stops failing, so scripts/typecheck-templates.mjs
// fails the day the declarations stop saying what the Learn pages say.
import type { On } from 'claude-code'

export function register(on: On) {
  // @ts-expect-error classic.Stop reads block, not deny
  on('classic.Stop', () => ({ deny: 'no' }))

  // @ts-expect-error classic.PreToolUse answers allow, ask or deny, not block
  on('classic.PreToolUse', () => ({ block: 'no' }))

  // @ts-expect-error classic.PreToolUse has no preventContinuation
  on('classic.PreToolUse', () => ({ preventContinuation: true }))

  // @ts-expect-error a mod names a classic event as classic.<Name>, never bare
  on('PreToolUse', ($, e, next) => next(e))

  // @ts-expect-error there is no classic event called classic.Halt
  on('classic.Halt', ($, e, next) => next(e))

  // @ts-expect-error classic.Notification reads no additionalContext
  on('classic.Notification', () => ({ additionalContext: ['x'] }))

  // @ts-expect-error a hook takes ($, e, next), so a single string parameter is not a hook
  on('classic.Stop', (input: string) => ({ block: input }))

  on('classic.PreToolUse', ($, e, next) => {
    if (e.tool === 'Bash') {
      // @ts-expect-error e is typed read-only: return a changed copy instead
      e.command = 'ls'
    }
    return next(e)
  })
}
