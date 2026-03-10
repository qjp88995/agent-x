import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';

/**
 * Custom CodeMirror themes matching the Agent-X purple/cyan OKLCH palette.
 * Colors are kept in sync with lib/monaco-themes.ts.
 */

const lightEditorTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#FDFDFF',
      color: '#1E1B4B',
    },
    '.cm-content': {
      caretColor: '#7C3AED',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#7C3AED',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
      {
        backgroundColor: '#DDD6FE80',
      },
    '.cm-activeLine': {
      backgroundColor: '#F0EEFA',
    },
    '.cm-gutters': {
      backgroundColor: '#FDFDFF',
      color: '#A5A3C0',
      borderRight: '1px solid #E8E5F0',
    },
    '.cm-activeLineGutter': {
      color: '#7C3AED',
      backgroundColor: '#F0EEFA',
    },
    '.cm-matchingBracket': {
      backgroundColor: '#DDD6FE50',
      outline: '1px solid #A78BFA',
    },
    '.cm-searchMatch': {
      backgroundColor: '#A5F3FC60',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: '#DDD6FE40',
    },
    '.cm-selectionMatch': {
      backgroundColor: '#DDD6FE30',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: '#EDE9FE',
      border: 'none',
      color: '#7C3AED',
    },
  },
  { dark: false }
);

const lightHighlightStyle = HighlightStyle.define([
  { tag: t.comment, color: '#8E8EA0', fontStyle: 'italic' },
  { tag: t.lineComment, color: '#8E8EA0', fontStyle: 'italic' },
  { tag: t.blockComment, color: '#8E8EA0', fontStyle: 'italic' },
  { tag: t.keyword, color: '#7C3AED' },
  { tag: t.controlKeyword, color: '#7C3AED' },
  { tag: t.operatorKeyword, color: '#7C3AED' },
  { tag: t.definitionKeyword, color: '#7C3AED' },
  { tag: t.moduleKeyword, color: '#7C3AED' },
  { tag: t.string, color: '#0891B2' },
  { tag: t.escape, color: '#0E7490' },
  { tag: t.number, color: '#D97706' },
  { tag: t.bool, color: '#D97706' },
  { tag: t.null, color: '#D97706' },
  { tag: t.typeName, color: '#2563EB' },
  { tag: t.className, color: '#2563EB' },
  { tag: t.function(t.variableName), color: '#6D28D9' },
  { tag: t.function(t.definition(t.variableName)), color: '#6D28D9' },
  { tag: t.definition(t.variableName), color: '#334155' },
  { tag: t.variableName, color: '#334155' },
  { tag: t.propertyName, color: '#0D9488' },
  { tag: t.definition(t.propertyName), color: '#0D9488' },
  { tag: t.operator, color: '#64748B' },
  { tag: t.separator, color: '#64748B' },
  { tag: t.punctuation, color: '#64748B' },
  { tag: t.bracket, color: '#64748B' },
  { tag: t.tagName, color: '#7C3AED' },
  { tag: t.attributeName, color: '#0891B2' },
  { tag: t.attributeValue, color: '#0D9488' },
  { tag: t.regexp, color: '#E11D48' },
  { tag: t.heading, color: '#7C3AED', fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.link, color: '#0891B2', textDecoration: 'underline' },
  { tag: t.url, color: '#0891B2' },
  { tag: t.meta, color: '#8E8EA0' },
]);

const darkEditorTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#1A1730',
      color: '#E2E0F0',
    },
    '.cm-content': {
      caretColor: '#A78BFA',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#A78BFA',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
      {
        backgroundColor: '#7C3AED40',
      },
    '.cm-activeLine': {
      backgroundColor: '#1E1B4B',
    },
    '.cm-gutters': {
      backgroundColor: '#1A1730',
      color: '#4C4A6D',
      borderRight: '1px solid #2A2750',
    },
    '.cm-activeLineGutter': {
      color: '#A78BFA',
      backgroundColor: '#1E1B4B',
    },
    '.cm-matchingBracket': {
      backgroundColor: '#7C3AED30',
      outline: '1px solid #A78BFA',
    },
    '.cm-searchMatch': {
      backgroundColor: '#0891B240',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: '#7C3AED25',
    },
    '.cm-selectionMatch': {
      backgroundColor: '#7C3AED20',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: '#312E5A',
      border: 'none',
      color: '#A78BFA',
    },
  },
  { dark: true }
);

const darkHighlightStyle = HighlightStyle.define([
  { tag: t.comment, color: '#6B6B8D', fontStyle: 'italic' },
  { tag: t.lineComment, color: '#6B6B8D', fontStyle: 'italic' },
  { tag: t.blockComment, color: '#6B6B8D', fontStyle: 'italic' },
  { tag: t.keyword, color: '#A78BFA' },
  { tag: t.controlKeyword, color: '#A78BFA' },
  { tag: t.operatorKeyword, color: '#A78BFA' },
  { tag: t.definitionKeyword, color: '#A78BFA' },
  { tag: t.moduleKeyword, color: '#A78BFA' },
  { tag: t.string, color: '#22D3EE' },
  { tag: t.escape, color: '#67E8F9' },
  { tag: t.number, color: '#FBBF24' },
  { tag: t.bool, color: '#FBBF24' },
  { tag: t.null, color: '#FBBF24' },
  { tag: t.typeName, color: '#60A5FA' },
  { tag: t.className, color: '#60A5FA' },
  { tag: t.function(t.variableName), color: '#C084FC' },
  { tag: t.function(t.definition(t.variableName)), color: '#C084FC' },
  { tag: t.definition(t.variableName), color: '#E2E8F0' },
  { tag: t.variableName, color: '#E2E8F0' },
  { tag: t.propertyName, color: '#2DD4BF' },
  { tag: t.definition(t.propertyName), color: '#2DD4BF' },
  { tag: t.operator, color: '#94A3B8' },
  { tag: t.separator, color: '#94A3B8' },
  { tag: t.punctuation, color: '#94A3B8' },
  { tag: t.bracket, color: '#94A3B8' },
  { tag: t.tagName, color: '#A78BFA' },
  { tag: t.attributeName, color: '#22D3EE' },
  { tag: t.attributeValue, color: '#2DD4BF' },
  { tag: t.regexp, color: '#FB7185' },
  { tag: t.heading, color: '#A78BFA', fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.link, color: '#22D3EE', textDecoration: 'underline' },
  { tag: t.url, color: '#22D3EE' },
  { tag: t.meta, color: '#6B6B8D' },
]);

export const cmAgentxLight: Extension = [
  lightEditorTheme,
  syntaxHighlighting(lightHighlightStyle),
];

export const cmAgentxDark: Extension = [
  darkEditorTheme,
  syntaxHighlighting(darkHighlightStyle),
];
