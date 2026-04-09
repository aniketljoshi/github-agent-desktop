import { useWorkspaceStore } from '../../store/workspace'
import { FolderOpen, GitBranch } from 'lucide-react'

export function RepoPicker() {
  const { workspace, selectWorkspace } = useWorkspaceStore()

  return (
    <button onClick={selectWorkspace} className="repo-chip no-drag">
      <FolderOpen size={12} />
      {workspace ? (
        <>
          <span className="repo-chip-name">{workspace.repoName}</span>
          <span className="repo-chip-branch">
            <GitBranch size={10} />
            <span>{workspace.branch}</span>
          </span>
        </>
      ) : (
        <span className="repo-chip-placeholder">Select repository</span>
      )}
    </button>
  )
}
