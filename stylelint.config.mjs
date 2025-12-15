/** @type {import('stylelint').Config} */
export default {
  ignoreFiles: ['node_modules/**/*', '.DS_Store', 'dist/**/*', 'types/**/*', 'coverage/**/*', 'src/popup/popup.html', 'assets/icons/generate-icons.html'],
  extends: [
    'stylelint-config-standard',
  ],

  // add your custom config here
  // https://stylelint.io/user-guide/configuration
  rules: {
    'selector-class-pattern': undefined,
    'no-descending-specificity': undefined,
    'function-no-unknown': [true, { ignoreFunctions: ['v-bind'] }],
  },
}
