import React from 'react';

export default function HighlightText({ text, query, className }) {
  if (!query || !query.trim()) return <span className={className}>{text}</span>;
  const q = query.trim();
  const lower = text.toLowerCase();
  const ql = q.toLowerCase();
  const parts = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    const idx = lower.indexOf(ql, i);
    if (idx === -1) { parts.push(text.slice(i)); break; }
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(<mark key={key++} className="bg-[#8e9aaf]/30 text-white rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>);
    i = idx + q.length;
  }
  return <span className={className}>{parts}</span>;
}