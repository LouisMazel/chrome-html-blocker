import { defineConfig } from 'relizy'

export default defineConfig({
  templates: {
    emptyChangelogContent: 'No relevant changes since last release',
  },

  changelog: {
    formatCmd: 'git add --all && pnpm pre-commit && git reset',
  },

  publish: {
    registry: 'https://registry.npmjs.org',
    buildCmd: process.env.CI ? undefined : 'pnpm build',
    access: 'public',
    token: process.env.RELIZY_NPM_TOKEN,
    packageManager: 'npm',
    safetyCheck: true,
  },
})
