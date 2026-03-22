import type { WorkspaceFile } from './types';
import { File, FileCode, FileImage, FileJson, FileText } from 'lucide-react';

export interface TreeNode {
  readonly name: string;
  readonly path: string;
  readonly isDirectory: boolean;
  readonly file?: WorkspaceFile;
  readonly children: TreeNode[];
}

export function buildTree(files: WorkspaceFile[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    // Directory records from the backend
    if (file.isDirectory) {
      const parts = file.path.split('/');
      let current = root;
      for (let i = 0; i < parts.length; i++) {
        const name = parts[i];
        const pathSoFar = parts.slice(0, i + 1).join('/');
        const existing = current.find(n => n.name === name);
        if (existing && existing.isDirectory) {
          current = existing.children;
        } else if (!existing) {
          const dir: TreeNode = {
            name,
            path: pathSoFar,
            isDirectory: true,
            children: [],
          };
          current.push(dir);
          current = dir.children;
        }
      }
      continue;
    }

    const parts = file.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLast = i === parts.length - 1;
      const pathSoFar = parts.slice(0, i + 1).join('/');

      const existing = current.find(n => n.name === name);

      if (isLast) {
        if (!existing) {
          current.push({
            name,
            path: pathSoFar,
            isDirectory: false,
            file,
            children: [],
          });
        }
      } else {
        if (existing && existing.isDirectory) {
          current = existing.children;
        } else {
          const dir: TreeNode = {
            name,
            path: pathSoFar,
            isDirectory: true,
            children: [],
          };
          current.push(dir);
          current = dir.children;
        }
      }
    }
  }

  // Sort: directories first, then alphabetically
  function sortNodes(nodes: TreeNode[]): TreeNode[] {
    return [...nodes].sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  function sortTree(nodes: TreeNode[]): TreeNode[] {
    return sortNodes(nodes).map(node =>
      node.isDirectory ? { ...node, children: sortTree(node.children) } : node
    );
  }

  return sortTree(root);
}

export function getFileIcon(mimeType: string, fileName: string): typeof File {
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType === 'application/json' || fileName.endsWith('.json'))
    return FileJson;
  if (
    mimeType.startsWith('text/') ||
    mimeType === 'application/javascript' ||
    mimeType === 'application/typescript' ||
    mimeType === 'application/xml'
  )
    return FileCode;
  if (mimeType === 'text/plain' || fileName.endsWith('.txt')) return FileText;
  return File;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getParentDir(path: string): string {
  const idx = path.lastIndexOf('/');
  return idx > 0 ? path.substring(0, idx) : '';
}

export const INVALID_FILENAME_CHARS = /[<>:"/\\|?*]/;

export function validateFileName(
  name: string,
  existingNames?: readonly string[]
): string | null {
  if (!name) return null;
  if (INVALID_FILENAME_CHARS.test(name)) {
    return 'invalidFileName';
  }
  if (name === '.' || name === '..') {
    return 'invalidFileName';
  }
  if (name.endsWith(' ') || name.endsWith('.')) {
    return 'invalidFileName';
  }
  if (existingNames?.some(n => n.toLowerCase() === name.toLowerCase())) {
    return 'nameAlreadyExists';
  }
  return null;
}
