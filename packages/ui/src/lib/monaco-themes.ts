/**
 * Custom Monaco editor themes matching the Agent-X Zinc/Emerald design palette.
 *
 * Light: "agentx-light" — clean zinc background with emerald/teal accents
 * Dark:  "agentx-dark"  — deep zinc background with vibrant emerald/teal accents
 */

interface MonacoThemeRule {
  readonly token: string;
  readonly foreground?: string;
  readonly fontStyle?: string;
}

interface MonacoThemeData {
  readonly base: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';
  readonly inherit: boolean;
  readonly rules: MonacoThemeRule[];
  readonly colors: Record<string, string>;
}

export const agentxLight: MonacoThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '8E8EA0', fontStyle: 'italic' },
    { token: 'keyword', foreground: '059669' },
    { token: 'keyword.control', foreground: '059669' },
    { token: 'storage', foreground: '059669' },
    { token: 'storage.type', foreground: '059669' },
    { token: 'string', foreground: '0d9488' },
    { token: 'string.escape', foreground: '0f766e' },
    { token: 'number', foreground: 'D97706' },
    { token: 'constant', foreground: 'D97706' },
    { token: 'type', foreground: '2563EB' },
    { token: 'type.identifier', foreground: '2563EB' },
    { token: 'class', foreground: '2563EB' },
    { token: 'interface', foreground: '2563EB' },
    { token: 'function', foreground: '047857' },
    { token: 'function.declaration', foreground: '047857' },
    { token: 'variable', foreground: '334155' },
    { token: 'variable.predefined', foreground: 'D97706' },
    { token: 'parameter', foreground: '475569' },
    { token: 'property', foreground: '0D9488' },
    { token: 'operator', foreground: '64748B' },
    { token: 'delimiter', foreground: '64748B' },
    { token: 'tag', foreground: '059669' },
    { token: 'attribute.name', foreground: '0d9488' },
    { token: 'attribute.value', foreground: '0D9488' },
    { token: 'meta.tag', foreground: '059669' },
    { token: 'regexp', foreground: 'E11D48' },
  ],
  colors: {
    'editor.background': '#FAFAFA',
    'editor.foreground': '#18181B',
    'editor.lineHighlightBackground': '#F4F4F5',
    'editor.selectionBackground': '#d1fae580',
    'editor.inactiveSelectionBackground': '#ecfdf5',
    'editorLineNumber.foreground': '#A1A1AA',
    'editorLineNumber.activeForeground': '#059669',
    'editorCursor.foreground': '#059669',
    'editorIndentGuide.background': '#E4E4E7',
    'editorIndentGuide.activeBackground': '#a7f3d0',
    'editorBracketMatch.background': '#d1fae550',
    'editorBracketMatch.border': '#34d399',
    'editor.findMatchBackground': '#99f6e460',
    'editor.findMatchHighlightBackground': '#d1fae540',
    'editorWidget.background': '#FAFAFA',
    'editorWidget.border': '#E4E4E7',
    'editorSuggestWidget.background': '#FAFAFA',
    'editorSuggestWidget.border': '#E4E4E7',
    'editorSuggestWidget.selectedBackground': '#ecfdf5',
    'scrollbarSlider.background': '#05966930',
    'scrollbarSlider.hoverBackground': '#05966950',
    'scrollbarSlider.activeBackground': '#05966970',
  },
};

export const agentxDark: MonacoThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '71717A', fontStyle: 'italic' },
    { token: 'keyword', foreground: '34d399' },
    { token: 'keyword.control', foreground: '34d399' },
    { token: 'storage', foreground: '34d399' },
    { token: 'storage.type', foreground: '34d399' },
    { token: 'string', foreground: '2dd4bf' },
    { token: 'string.escape', foreground: '5eead4' },
    { token: 'number', foreground: 'FBBF24' },
    { token: 'constant', foreground: 'FBBF24' },
    { token: 'type', foreground: '60A5FA' },
    { token: 'type.identifier', foreground: '60A5FA' },
    { token: 'class', foreground: '60A5FA' },
    { token: 'interface', foreground: '60A5FA' },
    { token: 'function', foreground: '6ee7b7' },
    { token: 'function.declaration', foreground: '6ee7b7' },
    { token: 'variable', foreground: 'E4E4E7' },
    { token: 'variable.predefined', foreground: 'FBBF24' },
    { token: 'parameter', foreground: 'A1A1AA' },
    { token: 'property', foreground: '2DD4BF' },
    { token: 'operator', foreground: '94A3B8' },
    { token: 'delimiter', foreground: '94A3B8' },
    { token: 'tag', foreground: '34d399' },
    { token: 'attribute.name', foreground: '2dd4bf' },
    { token: 'attribute.value', foreground: '2DD4BF' },
    { token: 'meta.tag', foreground: '34d399' },
    { token: 'regexp', foreground: 'FB7185' },
  ],
  colors: {
    'editor.background': '#09090B',
    'editor.foreground': '#E4E4E7',
    'editor.lineHighlightBackground': '#18181B',
    'editor.selectionBackground': '#05966940',
    'editor.inactiveSelectionBackground': '#1a2e2a',
    'editorLineNumber.foreground': '#52525B',
    'editorLineNumber.activeForeground': '#34d399',
    'editorCursor.foreground': '#34d399',
    'editorIndentGuide.background': '#27272A',
    'editorIndentGuide.activeBackground': '#05966960',
    'editorBracketMatch.background': '#05966930',
    'editorBracketMatch.border': '#34d399',
    'editor.findMatchBackground': '#05966940',
    'editor.findMatchHighlightBackground': '#05966925',
    'editorWidget.background': '#09090B',
    'editorWidget.border': '#27272A',
    'editorSuggestWidget.background': '#09090B',
    'editorSuggestWidget.border': '#27272A',
    'editorSuggestWidget.selectedBackground': '#1a2e2a',
    'scrollbarSlider.background': '#05966920',
    'scrollbarSlider.hoverBackground': '#05966935',
    'scrollbarSlider.activeBackground': '#05966950',
  },
};
