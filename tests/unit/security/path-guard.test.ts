import { describe, it, expect } from 'vitest'
import { assertWithinWorkspace, isWithinWorkspace, PathTraversalError } from '../../../src/main/workspace/path-guard'
import { resolve, sep } from 'path'

const ROOT = resolve('/workspace/project')

describe('path-guard', () => {
  it('allows a file within the workspace', () => {
    expect(() => assertWithinWorkspace(ROOT, resolve(ROOT, 'src/index.ts'))).not.toThrow()
  })

  it('allows a nested file within the workspace', () => {
    expect(() =>
      assertWithinWorkspace(ROOT, resolve(ROOT, 'src/deep/nested/file.ts'))
    ).not.toThrow()
  })

  it('rejects path with ../ traversal', () => {
    expect(() =>
      assertWithinWorkspace(ROOT, resolve(ROOT, '../../../etc/passwd'))
    ).toThrow(PathTraversalError)
  })

  it('rejects absolute path outside workspace', () => {
    expect(() =>
      assertWithinWorkspace(ROOT, '/tmp/evil/file.txt')
    ).toThrow(PathTraversalError)
  })

  it('rejects path that starts with workspace prefix but escapes', () => {
    // e.g., /workspace/project-evil/ is not inside /workspace/project/
    expect(() =>
      assertWithinWorkspace(ROOT, ROOT + '-evil/file.txt')
    ).toThrow(PathTraversalError)
  })

  it('isWithinWorkspace returns true for valid paths', () => {
    expect(isWithinWorkspace(ROOT, resolve(ROOT, 'file.ts'))).toBe(true)
  })

  it('isWithinWorkspace returns false for traversal', () => {
    expect(isWithinWorkspace(ROOT, '/etc/passwd')).toBe(false)
  })
})
