import { resolve, sep } from 'path'

export class PathTraversalError extends Error {
  constructor(target: string, root: string) {
    super(`Path "${target}" is outside workspace root "${root}"`)
    this.name = 'PathTraversalError'
  }
}

export function assertWithinWorkspace(root: string, targetPath: string): void {
  const resolvedRoot = resolve(root)
  const resolvedTarget = resolve(targetPath)
  if (!resolvedTarget.startsWith(resolvedRoot + sep) && resolvedTarget !== resolvedRoot) {
    throw new PathTraversalError(targetPath, root)
  }
}

export function isWithinWorkspace(root: string, targetPath: string): boolean {
  try {
    assertWithinWorkspace(root, targetPath)
    return true
  } catch {
    return false
  }
}
