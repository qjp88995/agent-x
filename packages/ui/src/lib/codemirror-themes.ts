import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';

/**
 * CodeMirror themes matching the Agent-X design system palette.
 * Colors derived from design tokens in index.css.
 */

const lightEditorTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: 'var(--card)',
      color: 'var(--foreground)',
    },
    '.cm-content': {
      caretColor: 'var(--primary)',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: 'var(--primary)',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
      {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
      },
    '.cm-activeLine': {
      backgroundColor: 'var(--surface)',
    },
    '.cm-gutters': {
      backgroundColor: 'var(--card)',
      color: 'var(--foreground-ghost)',
      borderRight: '1px solid var(--border)',
    },
    '.cm-activeLineGutter': {
      color: 'var(--primary)',
      backgroundColor: 'var(--surface)',
    },
    '.cm-matchingBracket': {
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      outline: '1px solid #34d399',
    },
    '.cm-searchMatch': {
      backgroundColor: 'rgba(6, 182, 212, 0.2)',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },
    '.cm-selectionMatch': {
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: 'var(--surface)',
      border: 'none',
      color: 'var(--primary)',
    },
  },
  { dark: false }
);

const lightHighlightStyle = HighlightStyle.define([
  { tag: t.comment, color: '#71717a', fontStyle: 'italic' },
  { tag: t.lineComment, color: '#71717a', fontStyle: 'italic' },
  { tag: t.blockComment, color: '#71717a', fontStyle: 'italic' },
  { tag: t.keyword, color: '#059669' },
  { tag: t.controlKeyword, color: '#059669' },
  { tag: t.operatorKeyword, color: '#059669' },
  { tag: t.definitionKeyword, color: '#059669' },
  { tag: t.moduleKeyword, color: '#059669' },
  { tag: t.string, color: '#0891b2' },
  { tag: t.escape, color: '#0e7490' },
  { tag: t.number, color: '#d97706' },
  { tag: t.bool, color: '#d97706' },
  { tag: t.null, color: '#d97706' },
  { tag: t.typeName, color: '#2563eb' },
  { tag: t.className, color: '#2563eb' },
  { tag: t.function(t.variableName), color: '#047857' },
  { tag: t.function(t.definition(t.variableName)), color: '#047857' },
  { tag: t.definition(t.variableName), color: '#334155' },
  { tag: t.variableName, color: '#334155' },
  { tag: t.propertyName, color: '#0d9488' },
  { tag: t.definition(t.propertyName), color: '#0d9488' },
  { tag: t.operator, color: '#64748b' },
  { tag: t.separator, color: '#64748b' },
  { tag: t.punctuation, color: '#64748b' },
  { tag: t.bracket, color: '#64748b' },
  { tag: t.tagName, color: '#059669' },
  { tag: t.attributeName, color: '#0891b2' },
  { tag: t.attributeValue, color: '#0d9488' },
  { tag: t.regexp, color: '#e11d48' },
  { tag: t.heading, color: '#059669', fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.link, color: '#0891b2', textDecoration: 'underline' },
  { tag: t.url, color: '#0891b2' },
  { tag: t.meta, color: '#71717a' },
]);

const darkEditorTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: 'var(--card)',
      color: 'var(--foreground)',
    },
    '.cm-content': {
      caretColor: 'var(--primary)',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: 'var(--primary)',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
      {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
      },
    '.cm-activeLine': {
      backgroundColor: 'var(--surface)',
    },
    '.cm-gutters': {
      backgroundColor: 'var(--card)',
      color: 'var(--foreground-ghost)',
      borderRight: '1px solid var(--border)',
    },
    '.cm-activeLineGutter': {
      color: 'var(--primary)',
      backgroundColor: 'var(--surface)',
    },
    '.cm-matchingBracket': {
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      outline: '1px solid #34d399',
    },
    '.cm-searchMatch': {
      backgroundColor: 'rgba(6, 182, 212, 0.2)',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },
    '.cm-selectionMatch': {
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: 'var(--surface)',
      border: 'none',
      color: 'var(--primary)',
    },
  },
  { dark: true }
);

const darkHighlightStyle = HighlightStyle.define([
  { tag: t.comment, color: '#52525b', fontStyle: 'italic' },
  { tag: t.lineComment, color: '#52525b', fontStyle: 'italic' },
  { tag: t.blockComment, color: '#52525b', fontStyle: 'italic' },
  { tag: t.keyword, color: '#34d399' },
  { tag: t.controlKeyword, color: '#34d399' },
  { tag: t.operatorKeyword, color: '#34d399' },
  { tag: t.definitionKeyword, color: '#34d399' },
  { tag: t.moduleKeyword, color: '#34d399' },
  { tag: t.string, color: '#22d3ee' },
  { tag: t.escape, color: '#67e8f9' },
  { tag: t.number, color: '#fbbf24' },
  { tag: t.bool, color: '#fbbf24' },
  { tag: t.null, color: '#fbbf24' },
  { tag: t.typeName, color: '#60a5fa' },
  { tag: t.className, color: '#60a5fa' },
  { tag: t.function(t.variableName), color: '#6ee7b7' },
  { tag: t.function(t.definition(t.variableName)), color: '#6ee7b7' },
  { tag: t.definition(t.variableName), color: '#e2e8f0' },
  { tag: t.variableName, color: '#e2e8f0' },
  { tag: t.propertyName, color: '#2dd4bf' },
  { tag: t.definition(t.propertyName), color: '#2dd4bf' },
  { tag: t.operator, color: '#94a3b8' },
  { tag: t.separator, color: '#94a3b8' },
  { tag: t.punctuation, color: '#94a3b8' },
  { tag: t.bracket, color: '#94a3b8' },
  { tag: t.tagName, color: '#34d399' },
  { tag: t.attributeName, color: '#22d3ee' },
  { tag: t.attributeValue, color: '#2dd4bf' },
  { tag: t.regexp, color: '#fb7185' },
  { tag: t.heading, color: '#34d399', fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.link, color: '#22d3ee', textDecoration: 'underline' },
  { tag: t.url, color: '#22d3ee' },
  { tag: t.meta, color: '#52525b' },
]);

export const cmThemeLight: Extension = [
  lightEditorTheme,
  syntaxHighlighting(lightHighlightStyle),
];

export const cmThemeDark: Extension = [
  darkEditorTheme,
  syntaxHighlighting(darkHighlightStyle),
];
