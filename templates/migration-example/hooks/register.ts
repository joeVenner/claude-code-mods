import type { On } from 'claude-code'

/**
 * Three classic hooks as function hooks. Each hooks the classic event under its `classic.` name.
 * Where a command hook exits 0 to let the event through, a function hook returns `next(e)`.
 * Where it exits 2 or prints a decision, a function hook returns an object.
 */
export function register(on: On) {
  // Classic PreToolUse: exit 2 blocks the tool call. The result is allow, ask or deny.
  on('classic.PreToolUse', ($, e, next) => {
    if (e.tool === 'Bash' && e.command.startsWith('rm ')) {
      return { deny: 'rm is blocked by this mod' }
    }
    return next(e)
  })

  // Classic Stop: exit 2 keeps Claude working. `block` carries the reason it is given.
  // stop_hook_active is true when Claude is already continuing because of a stop hook,
  // so a hook that always blocks must let that case through.
  on('classic.Stop', ($, e, next) => {
    if (e.stop_hook_active) return next(e)
    return { block: 'Run the tests before you stop' }
  })

  // Classic UserPromptSubmit: hookSpecificOutput.additionalContext. The result lists the notes.
  on('classic.UserPromptSubmit', async ($, e, next) => {
    const result = await next(e)
    return { ...result, additionalContext: [...(result.additionalContext ?? []), 'This repository uses pnpm'] }
  })
}
