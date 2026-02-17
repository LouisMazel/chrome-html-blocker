# Changelog

## v0.3.0...v0.4.0

[compare changes](https://github.com/LouisMazel/chrome-html-blocker/compare/v0.3.0...v0.4.0)

### 🚀 Enhancements

- Add force scroll and custom CSS injection per site ([bbb2048](https://github.com/LouisMazel/chrome-html-blocker/commit/bbb2048))

  Each site now supports additional blocking features:
  - **Force scroll**: toggle that prevents websites from
    blocking page scrolling (e.g. scroll-locking overlays)
  - **Custom CSS**: inject your own CSS rules into pages
    CSS selector is now optional. At least one feature must
    be configured (selector, force scroll, or custom CSS).
    All features can be combined on the same site.

- Add debug mode with toggle in popup ([0871a5e](https://github.com/LouisMazel/chrome-html-blocker/commit/0871a5e))

  verbose logging. When disabled, only errors and warnings
  appear in the console. State persists across sessions.

### ❤️ Contributors

- LouisMazel ([@LouisMazel](https://github.com/LouisMazel))

## v0.2.0...v0.3.0

[compare changes](https://github.com/LouisMazel/chrome-html-blocker/compare/v0.2.0...v0.3.0)

### 🚀 Enhancements

- Add element picker for visual CSS selector generation ([f5d086e](https://github.com/LouisMazel/chrome-html-blocker/commit/f5d086e))

  Click the "Pick" button next to the CSS Selector field to visually
  select an element on the page. Hover to preview the selector, click
  to confirm. The popup reopens automatically with the selector
  pre-filled. If the popup can't reopen, the config is saved directly.

### ❤️ Contributors

- LouisMazel ([@LouisMazel](https://github.com/LouisMazel))

## v0.1.2...v0.2.0

[compare changes](https://github.com/LouisMazel/chrome-html-blocker/compare/v0.1.2...v0.2.0)

### 🚀 Enhancements

- Add default setting on add new site ([105bf46](https://github.com/LouisMazel/chrome-html-blocker/commit/105bf46))

### ❤️ Contributors

- LouisMazel ([@LouisMazel](https://github.com/LouisMazel))

## v0.1.1...v0.1.2

[compare changes](https://github.com/LouisMazel/chrome-html-blocker/compare/v0.1.1...v0.1.2)

### 🩹 Fixes

- Sync package version with manifest version ([17c5be3](https://github.com/LouisMazel/chrome-html-blocker/commit/17c5be3))

### ❤️ Contributors

- LouisMazel ([@LouisMazel](https://github.com/LouisMazel))

## v0.1.0...v0.1.1

[compare changes](https://github.com/LouisMazel/chrome-html-blocker/compare/v0.1.0...v0.1.1)

### 💅 Refactors

- Improve logs ([01bb2ea](https://github.com/LouisMazel/chrome-html-blocker/commit/01bb2ea))

### ❤️ Contributors

- LouisMazel ([@LouisMazel](https://github.com/LouisMazel))

## v0.0.0...v0.1.0

[compare changes](https://github.com/LouisMazel/chrome-html-blocker/compare/d120727f17c797852cb28543dffd00b3a82d5dda...v0.1.0)

No relevant changes since last release
