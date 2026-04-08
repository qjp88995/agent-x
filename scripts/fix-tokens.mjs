#!/usr/bin/env node
/**
 * Replace old Tailwind CSS token class names with new design system names.
 * Only processes files in packages/web/src/ (excluding components/ui/).
 */
import fs from 'fs';
import path from 'path';

const REPLACEMENTS = [
  // Text color tokens
  ['text-muted-foreground', 'text-foreground-muted'],
  ['text-card-foreground', 'text-foreground-secondary'],
  ['text-popover-foreground', 'text-foreground-secondary'],
  ['text-secondary-foreground', 'text-foreground-secondary'],
  ['text-accent-foreground', 'text-foreground-secondary'],
  // Background tokens
  ['bg-muted/50', 'bg-surface/50'],
  ['bg-muted', 'bg-surface'],
  ['bg-accent', 'bg-card'],
  ['bg-popover', 'bg-card'],
  ['bg-secondary', 'bg-surface'],
  // Border tokens
  ['border-input', 'border-border'],
  // Hover variants
  ['hover:bg-muted', 'hover:bg-surface'],
  ['hover:bg-accent', 'hover:bg-card'],
  ['hover:text-accent-foreground', 'hover:text-foreground-secondary'],
  // Data state
  ['data-[state=selected]:bg-muted', 'data-[state=selected]:bg-surface'],
  // Dark variants (legacy - should be cleaned)
  ['dark:bg-input/30', 'bg-card/30'],
  ['dark:hover:bg-input/50', 'hover:bg-card/50'],
  // Sidebar tokens (already migrated, but check for stragglers)
  ['bg-sidebar-accent', 'bg-card'],
  ['text-sidebar-foreground', 'text-foreground'],
  ['border-sidebar-border', 'border-border'],
];

function findFiles(dir, extensions) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') {
        results.push(...findFiles(fullPath, extensions));
      }
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

const srcDir = '/home/calf/projects/agent-x/packages/web/src';
const files = findFiles(srcDir, ['.tsx', '.ts']);

let totalChanges = 0;
let modifiedFiles = 0;

for (const file of files) {
  // Skip components/ui/ files (they have their own token usage)
  if (file.includes('components/ui/')) continue;

  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  for (const [old, replacement] of REPLACEMENTS) {
    // Use word-boundary-aware matching to avoid partial replacements
    // Match as a CSS class (preceded by space, quote, or start; followed by space, quote, /, or end)
    const regex = new RegExp(`(?<=[\\s"'\`])${old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[\\s"'\`/])`, 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, replacement);
      totalChanges += matches.length;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content);
    modifiedFiles++;
    console.log('Modified:', path.relative('/home/calf/projects/agent-x', file));
  }
}

console.log(`\nTotal: ${totalChanges} replacements in ${modifiedFiles} files`);
