import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

const showOpenDialogMock = vi.fn()

vi.mock('electron', () => ({
  dialog: {
    showOpenDialog: showOpenDialogMock
  }
}))

describe('workspace service', () => {
  let root: string

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    root = mkdtempSync(join(tmpdir(), 'gh-agent-workspace-'))
    mkdirSync(join(root, '.git'), { recursive: true })
    writeFileSync(join(root, '.git', 'HEAD'), 'ref: refs/heads/main')
    mkdirSync(join(root, 'src'), { recursive: true })
    writeFileSync(join(root, 'src', 'index.ts'), 'export const ok = true\n')
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it('selects a workspace from an explicit path and infers repo metadata', async () => {
    const { selectWorkspace, getWorkspaceInfo } = await import(
      '../../../src/main/workspace/workspace'
    )

    const workspace = await selectWorkspace(root)

    expect(workspace).toEqual({
      rootPath: root,
      repoName: root.split(/[/\\]/).filter(Boolean).pop(),
      branch: 'main'
    })
    expect(getWorkspaceInfo()).toEqual(workspace)
  })

  it('returns null when the directory picker is canceled', async () => {
    showOpenDialogMock.mockResolvedValue({ canceled: true, filePaths: [] })
    const { selectWorkspace } = await import('../../../src/main/workspace/workspace')

    await expect(selectWorkspace()).resolves.toBeNull()
  })

  it('can select a workspace through the Electron picker', async () => {
    showOpenDialogMock.mockResolvedValue({ canceled: false, filePaths: [root] })
    const { selectWorkspace } = await import('../../../src/main/workspace/workspace')

    await expect(selectWorkspace()).resolves.toMatchObject({ rootPath: root, branch: 'main' })
  })

  it('reads files and lists directories within the selected workspace', async () => {
    const { selectWorkspace, readWorkspaceFile, listWorkspaceDir } = await import(
      '../../../src/main/workspace/workspace'
    )

    await selectWorkspace(root)

    expect(readWorkspaceFile('src/index.ts')).toBe('export const ok = true\n')
    expect(listWorkspaceDir('src')).toEqual(['index.ts'])
  })

  it('blocks reads outside the selected workspace', async () => {
    const outside = mkdtempSync(join(tmpdir(), 'gh-agent-outside-'))
    writeFileSync(join(outside, 'secret.txt'), 'nope')

    const { selectWorkspace, readWorkspaceFile } = await import(
      '../../../src/main/workspace/workspace'
    )
    await selectWorkspace(root)

    expect(() => readWorkspaceFile(join(outside, 'secret.txt'))).toThrow('outside workspace')
    rmSync(outside, { recursive: true, force: true })
  })

  it('returns unknown for detached or missing git heads', async () => {
    writeFileSync(join(root, '.git', 'HEAD'), '1234567890abcdef')
    const { selectWorkspace } = await import('../../../src/main/workspace/workspace')

    const detached = await selectWorkspace(root)
    expect(detached?.branch).toBe('12345678')

    rmSync(join(root, '.git'), { recursive: true, force: true })
    const missingGit = await selectWorkspace(root)
    expect(missingGit?.branch).toBe('unknown')
  })

  it('throws when reading or listing without a selected workspace', async () => {
    const { readWorkspaceFile, listWorkspaceDir } = await import(
      '../../../src/main/workspace/workspace'
    )

    expect(() => readWorkspaceFile('src/index.ts')).toThrow('No workspace selected')
    expect(() => listWorkspaceDir('src')).toThrow('No workspace selected')
  })
})
