import { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}

export function SearchableSelect({ options, value, onChange }: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLabel = options.find(o => o.value === value)?.label ?? value;

  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    if (open) {
      setQuery('');
      // Small delay so the dropdown renders before focusing
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Enter' && filtered.length === 1) {
      onChange(filtered[0].value);
      setOpen(false);
    }
  }

  return (
    <div className="searchable-select" ref={containerRef}>
      <button
        type="button"
        className="searchable-select-trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {selectedLabel}
        <svg className="searchable-select-chevron" viewBox="0 0 12 12" width="12" height="12">
          <path fill="currentColor" d="M6 8L1 3h10z" />
        </svg>
      </button>

      {open && (
        <div className="searchable-select-dropdown" role="listbox">
          <input
            ref={inputRef}
            className="searchable-select-input"
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="search..."
          />
          <div className="searchable-select-options">
            {filtered.map(o => (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={o.value === value}
                className={`searchable-select-option ${o.value === value ? 'selected' : ''}`}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                {o.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="searchable-select-empty">no results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
