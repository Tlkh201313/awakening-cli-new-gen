export const DESCRIPTION = `
Agent-first browser automation via the mini-browser (\`mb\`) CLI (https://github.com/runablehq/mini-browser).
Uses Chrome DevTools Protocol on a debug Chrome instance (default port 9222).

Before first use, ensure Chrome is running: \`mb-start-chrome\` (or action \`start_chrome\`).

**Navigation:** go (url), url, back, forward
**Observe:** text (optional selector), shot (optional file path), snap (interactive elements + coords)
**Interact:** click (x,y), type (text; optional x,y), fill (label=value pairs), key (key combos), scroll, drag, move
**Other:** js (code), wait (ms | selector | networkidle | url:pattern), audit, tab_list, tab_new, tab_close

Optional: tab_id, timeout_ms, json_output (structured snap/tabs/audit/logs).

Prefer this tool over raw Bash \`mb\` for structured actions. Use WebFetch for static HTML without a real browser.
`
