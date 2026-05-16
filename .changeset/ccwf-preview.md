---
"@cc-wf-studio/cli": minor
"cc-wf-studio": patch
---

Add `ccwf preview <file>` and `ccwf run --launch`.

`ccwf preview` opens the cc-wf-studio canvas for a single workflow file in a local browser. It starts a localhost HTTP + WebSocket server backed by the bundled webview build, emulating the VSCode message channel through a small `bootstrap.js` polyfill that overrides `window.acquireVsCodeApi`. The webview source is unchanged. Saves from the canvas write back to the file; other VSCode-only flows (Slack, Claude API, MCP, export-for-*) return a `PREVIEW_UNSUPPORTED` error so the UI surfaces the limitation cleanly. The server binds to `127.0.0.1` with a URL token; the README documents the localhost-only threat model.

The CLI now bundles the webview assets in its npm tarball — `packages/cli/build` syncs `packages/vscode/src/webview/dist/**` into `packages/cli/dist/webview/` so `npx @cc-wf-studio/cli preview` works on a fresh install. `cc-wf-studio-webview` is added as a workspace devDependency of the CLI to make the pnpm build order topological, and `@cc-wf-studio/core` is declared as a workspace dependency of `cc-wf-studio-webview` so a clean rebuild succeeds.

`ccwf run --launch` does the existing file write and then walks `PATH` for the `claude` binary, spawning it in the output directory. Missing binary or non-claude-code agent prints a warning and exits cleanly. Without `--launch` the command is identical to before.
