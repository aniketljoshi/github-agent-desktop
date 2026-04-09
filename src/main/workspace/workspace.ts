import { readFileSync, readdirSync, existsSync } from 'fs'
import { resolve, join, sep } from 'path'
import { dialog } from 'electron'
import { assertWithinWorkspace } from './path-guard'
import type { WorkspaceContext } from '../../shared/types'

let currentWorkspace: WorkspaceContext | null = null

function detectBranch(rootPath: string): string {
  try {
    const headPath = join(rootPath, '.git', 'HEAD')
    if (!existsSync(headPath)) return 'unknown'
    const head = readFileSync(headPath, 'utf-8').trim()
    if (head.startsWith('ref: refs/heads/')) return head.slice('ref: refs/heads/'.length)
    return head.slice(0, 8) // detached HEAD — short SHA
  } catch {
    return 'unknown'
  }
}

function repoName(rootPath: string): string {
  return rootPath.split(sep).filter(Boolean).pop() ?? 'workspace'
}

export async function selectWorkspace(path?: string): Promise<WorkspaceContext | null> {
  let chosen = path
  if (!chosen) {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select Workspace'
    })
    if (result.canceled || result.filePaths.length === 0) return null
    chosen = result.filePaths[0]
  }

  const root = resolve(chosen)
  currentWorkspace = {
    rootPath: root,
    repoName: repoName(root),
    branch: detectBranch(root)
  }
  return currentWorkspace
}

export function getWorkspaceInfo(): WorkspaceContext | null {
  return currentWorkspace
}

export function readWorkspaceFile(filePath: string): string {
  if (!currentWorkspace) throw new Error('No workspace selected')
  const abs = resolve(currentWorkspace.rootPath, filePath)
  assertWithinWorkspace(currentWorkspace.rootPath, abs)
  return readFileSync(abs, 'utf-8')
}

export function listWorkspaceDir(dirPath: string): string[] {
  if (!currentWorkspace) throw new Error('No workspace selected')
  const abs = resolve(currentWorkspace.rootPath, dirPath)
  assertWithinWorkspace(currentWorkspace.rootPath, abs)
  return readdirSync(abs, { withFileTypes: true }).map((d) =>
    d.isDirectory() ? d.name + '/' : d.name
  )
}
