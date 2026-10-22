export function AdminTheme({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <style>{css}</style>
      {children}
    </>
  )
}

const css = `
@font-face {
  font-family: Lookback;
  src: url('/fonts/book.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: Lookback;
  src: url('/fonts/medium.woff2') format('woff2');
  font-weight: 500;
  font-display: swap;
}
@font-face {
  font-family: Lookback;
  src: url('/fonts/bold.woff2') format('woff2');
  font-weight: 700;
  font-display: swap;
}
@font-face {
  font-family: LookbackMono;
  src: url('/fonts/mono.woff2') format('woff2');
  font-weight: 500;
  font-display: swap;
}

html[data-theme=dark] {
  --font-body: 'Lookback', Arial, Helvetica, sans-serif;
  --font-mono: 'LookbackMono', 'Courier New', monospace;
}

html[data-theme=dark] body,
html[data-theme=dark] input,
html[data-theme=dark] textarea,
html[data-theme=dark] select,
html[data-theme=dark] button {
  font-family: 'Lookback', Arial, Helvetica, sans-serif;
  -webkit-font-smoothing: antialiased;
}

html[data-theme=dark] .dashboard .collections__group {
  display: none;
}

html[data-theme=dark] .nav__label,
html[data-theme=dark] .nav__link,
html[data-theme=dark] .nav__group-label,
html[data-theme=dark] label,
html[data-theme=dark] .field-label,
html[data-theme=dark] .table__header-cell,
html[data-theme=dark] .pill,
html[data-theme=dark] .sort-column__label,
html[data-theme=dark] .where-builder__relation,
html[data-theme=dark] time,
html[data-theme=dark] .doc-tab__label {
  font-family: 'LookbackMono', 'Courier New', monospace;
  font-size: 11px;
  letter-spacing: -0.02em;
}
`
