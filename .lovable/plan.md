

## Build Timestamp in Footer

Add a build timestamp generated at compile time using Vite's `define` config, then display it in the footer.

### Changes

1. **`vite.config.ts`** — Add a global `define` that injects the build timestamp at compile time:
   ```ts
   define: {
     __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
   }
   ```

2. **`src/vite-env.d.ts`** — Declare the global constant for TypeScript.

3. **`src/components/Footer.tsx`** — Display the timestamp in small muted text next to the copyright, formatted as a short date+time (e.g., "Build: 2026-03-02 14:30").

This way, every build produces a unique timestamp. You can compare the footer in preview vs. published to instantly know if they match.

