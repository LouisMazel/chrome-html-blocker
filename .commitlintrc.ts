import type { UserConfig } from '@commitlint/types'

export default <UserConfig> {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'perf',
        'refactor',
        'test',
        'docs',
        'style',
        'chore',
        'clean',
        'ci',
        'revert',
        'build',
      ],
    ],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
    'header-max-length': [2, 'always', 200],
  },
}
