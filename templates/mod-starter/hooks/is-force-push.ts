/**
 * True when a shell command runs `git push` with a force flag (`--force`, `-f`, or `-f` combined with
 * other short flags such as `-fu`) or a forced refspec such as `+main`.
 *
 * It splits on `;`, `&`, `|`, parentheses and newlines, skips leading `NAME=value` words and git's
 * own options (`-C dir`, `-c key=value`), and needs `push` to be the git subcommand, so
 * `cd app && git push -f` and `GIT_SSH_COMMAND=ssh git -C app push -f` are caught and
 * `git branch -f push main` is not.
 *
 * It is a teaching example, not a security boundary: it does not read aliases or scripts, it does not
 * see through wrappers such as `sudo`, `env` or `bash -c`, and it lets `--force-with-lease`,
 * `--delete` and `--mirror` pass.
 */
export function isForcePush(command: string): boolean {
  return command.split(/[;&|()\n]+/).some((segment) => {
    const words = withoutEnvironmentAssignments(segment.trim().split(/\s+/))
    if (words[0] !== 'git') return false
    const subcommandIndex = gitSubcommandIndex(words)
    return words[subcommandIndex] === 'push' && words.slice(subcommandIndex + 1).some(isForceWord)
  })
}

function withoutEnvironmentAssignments(words: readonly string[]): readonly string[] {
  const firstCommandWord = words.findIndex((word) => !/^[A-Za-z_][A-Za-z0-9_]*=/.test(word))
  return firstCommandWord === -1 ? [] : words.slice(firstCommandWord)
}

/** Index of git's subcommand: the first word after `git` that is not a global option or an option's value. */
function gitSubcommandIndex(words: readonly string[]): number {
  let index = 1
  while (index < words.length) {
    const word = words[index]
    if (word === '-C' || word === '-c') index += 2
    else if (word.startsWith('-')) index += 1
    else return index
  }
  return -1
}

function isForceWord(word: string): boolean {
  const isForceFlag = word === '--force' || /^-[A-Za-z]*f[A-Za-z]*$/.test(word)
  const isForcedRefspec = word.length > 1 && word.startsWith('+')
  return isForceFlag || isForcedRefspec
}
