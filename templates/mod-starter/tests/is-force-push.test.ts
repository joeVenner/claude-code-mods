import { describe, expect, test, tier } from 'claude-code/testing'

import { isForcePush } from '../hooks/is-force-push'

tier('user')

const cases: readonly (readonly [command: string, expected: boolean])[] = [
  ['git push --force', true],
  ['git push -f origin main', true],
  ['git push -fu origin main', true],
  ['git push -uf origin main', true],
  ['git push origin +main', true],
  ['git -C app push -f', true],
  ['git -c core.editor=vi push -f', true],
  ['GIT_SSH_COMMAND=ssh git push -f', true],
  ['cd app && git push origin main -f', true],
  ['echo hi; git push -f', true],
  ['true || git push -f', true],
  ['echo x | git push -f', true],
  ['sleep 1 & git push -f', true],
  ['(git push -f)', true],
  ['echo hi\ngit push -f', true],
  ['git push origin main', false],
  ['git push -u origin main', false],
  ['git push --force-with-lease', false],
  ['git branch -f push main', false],
  ['git log --grep push -f', false],
  ['echo git push --force', false],
  ['git status', false],
  ['', false],
]

// What the helper does not catch. The starter's guide names these limits, so a test holds them true:
// if a case here starts to be caught, update the guide's wording with it.
const knownLimits: readonly string[] = [
  'sudo git push -f',
  'env git push -f',
  'bash -c "git push -f"',
  'git push --delete origin main',
  'git push --mirror',
]

describe('is-force-push', () => {
  for (const [command, expected] of cases) {
    test(`${JSON.stringify(command)} is ${expected ? 'a force push' : 'not a force push'}`, () => {
      expect(isForcePush(command)).toBe(expected)
    })
  }

  for (const command of knownLimits) {
    test(`known limit: ${command} is not caught`, () => {
      expect(isForcePush(command)).toBe(false)
    })
  }
})
