import { useState } from 'react'
import { useWorkspaceStore } from '../../store/workspace'
import { ChevronRight, ChevronDown, Folder, File } from 'lucide-react'

interface TreeNode {
  name: string
  isDir: boolean
  children?: TreeNode[]
  loaded?: boolean
}

function TreeItem({
  node,
  depth,
  onExpand
}: {
  node: TreeNode
  depth: number
  onExpand: (path: string) => Promise<string[]>
}) {
  const [expanded, setExpanded] = useState(false)
  const [children, setChildren] = useState<TreeNode[]>(node.children ?? [])

  const toggle = async () => {
    if (!node.isDir) return
    if (!expanded && children.length === 0) {
      const items = await onExpand(node.name)
      setChildren(
        items.map((name) => ({
          name: `${node.name}/${name.replace(/\/$/, '')}`,
          isDir: name.endsWith('/'),
          children: []
        }))
      )
    }
    setExpanded(!expanded)
  }

  const displayName = node.name.split('/').pop() ?? node.name

  return (
    <div>
      <button onClick={toggle} className="file-tree-item" style={{ paddingLeft: depth * 12 + 4 }}>
        {node.isDir ? (
          expanded ? (
            <ChevronDown size={12} className="text-text-muted" />
          ) : (
            <ChevronRight size={12} className="text-text-muted" />
          )
        ) : (
          <span className="w-3" />
        )}
        {node.isDir ? (
          <Folder size={12} className="file-tree-icon is-folder" />
        ) : (
          <File size={12} className="file-tree-icon" />
        )}
        <span className="file-tree-name">{displayName}</span>
      </button>
      {expanded &&
        children.map((child) => (
          <TreeItem key={child.name} node={child} depth={depth + 1} onExpand={onExpand} />
        ))}
    </div>
  )
}

export function FileTree() {
  const { files, workspace, listDir } = useWorkspaceStore()

  if (!workspace) {
    return <p className="sidebar-empty">No workspace selected</p>
  }

  const rootNodes: TreeNode[] = files.map((name) => ({
    name: name.replace(/\/$/, ''),
    isDir: name.endsWith('/'),
    children: []
  }))

  return (
    <div className="file-tree-shell">
      {rootNodes.map((node) => (
        <TreeItem key={node.name} node={node} depth={0} onExpand={listDir} />
      ))}
    </div>
  )
}
