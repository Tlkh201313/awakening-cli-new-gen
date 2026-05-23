import React from 'react';
import type { StatsStore } from './context/stats.js';
import type { Root } from './ink.js';
import type { Props as REPLProps } from './screens/REPL.js';
import type { AppState } from './state/AppStateStore.js';
import type { FpsMetrics } from './utils/fpsTracker.js';
type AppWrapperProps = {
  getFpsMetrics: () => FpsMetrics | undefined;
  stats?: StatsStore;
  initialState: AppState;
};
function loadReplModules() {
  return Promise.all([
    import('./components/App.js'),
    import('./screens/REPL.js'),
  ]).then(([app, repl]) => ({
    App: app.App,
    REPL: repl.REPL,
  }));
}
let replModulesPreload: ReturnType<typeof loadReplModules> | null = null;
export function preloadReplModules(): void {
  if (!replModulesPreload) {
    replModulesPreload = loadReplModules();
  }
}
export async function launchRepl(root: Root, appProps: AppWrapperProps, replProps: REPLProps, renderAndRun: (root: Root, element: React.ReactNode) => Promise<void>): Promise<void> {
  const {
    App,
    REPL
  } = await (replModulesPreload ?? loadReplModules());
  await renderAndRun(root, <App {...appProps}>
      <REPL {...replProps} />
    </App>);
}
