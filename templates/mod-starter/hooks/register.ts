import type { On } from 'claude-code'

import { isForcePush } from './is-force-push'

/**
 * The mod's one entry. `on` hooks an event with a function `($, e, next)`:
 * `e` is the event's input, `next(e)` runs the hooks beneath, and returning `{ deny }` refuses.
 *
 * @param on the engine's registrar
 */
export function register(on: On) {
  on('tool.call', ($, e, next) => {
    if (e.tool === 'Bash' && isForcePush(e.command)) {
      return { deny: 'Force pushes are blocked by this mod. Ask the person to run it themselves.' }
    }
    return next(e)
  })
}
