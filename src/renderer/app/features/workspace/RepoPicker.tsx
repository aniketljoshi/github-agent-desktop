import { useWorkspaceStore } from '../../store/workspace'
import { FolderOpen, GitBranch } from 'lucide-react'

export function RepoPicker() {
  const { workspace, selectWorkspace } = useWorkspaceStore()

  return (
    <button
      onClick={selectWorkspace}
      className="no-drag flex items-center gap-1.5 rounded-md border border-border-subtle px-2 py-1 text-xs text-text-secondary hover:bg-bg-hover"
    >
      <FolderOpen size={12} />
      {workspace ? (
        <>
          <span className="max-w-[100px] truncate">{workspace.repoName}</span>
          <GitBranch size={10} className="text-text-muted" />
          <span className="max-w-[80px] truncate text-text-muted">{workspace.branch}</span>
        </>
      ) : (
        <span className="text-text-muted">No workspace</span>
      )}
    </button>
  )
}
