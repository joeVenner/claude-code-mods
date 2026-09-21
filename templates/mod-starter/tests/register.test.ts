import { describe, expect, test, tier } from 'claude-code/testing'

tier('user')

describe('register', () => {
  test('refuses a force push', async ($, on) => {
    on('tool.call', () => ({ result: 'ran' }))

    const outcome = await $.tool.call({ tool: 'Bash', command: 'git push --force origin main' })

    expect(outcome).toEqual({ deny: 'Force pushes are blocked by this mod. Ask the person to run it themselves.' })
  })

  test('passes any other call to the hooks beneath', async ($, on) => {
    on('tool.call', () => ({ result: 'ran' }))

    const outcome = await $.tool.call({ tool: 'Bash', command: 'git push origin main' })

    expect(outcome).toEqual({ result: 'ran' })
  })

  test('passes a call to another tool to the hooks beneath', async ($, on) => {
    on('tool.call', () => ({ result: 'ran' }))

    const outcome = await $.tool.call({ tool: 'Read', file_path: '/tmp/notes.txt' })

    expect(outcome).toEqual({ result: 'ran' })
  })
})
