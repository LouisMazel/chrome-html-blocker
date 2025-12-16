# HTML Blocker

![html blocker](./assets/screenshots/image.png)

Modern Chrome extension to automatically remove unwanted HTML elements from websites.

## Features

- 🚫 Automatic removal of HTML modals via configurable CSS selectors
- 👁️ Real-time monitoring of dynamic elements (MutationObserver)
- ⚙️ Intuitive popup interface for configuration management
- 🌐 Multi-site support with URL patterns
- 🔄 Global on/off toggle
- ☁️ Automatic configuration sync across devices (chrome.storage.sync)
- 🎨 Modern and responsive interface
- 📊 Statistics tracking with blocked elements counter

## Default Configuration

The extension comes pre-configured to block L'Équipe modals:

- **Site**: https://www.lequipe.fr/tv/*
- **Selector**: `div.Modal[data-modal="amsBlock"]`

## Installation

### Prerequisites

- Node.js 18+ and npm (or pnpm)
- Chrome, Edge, Arc, or any Chromium-based browser

### Development Installation

1. **Clone or download the project**

   ```bash
   cd lequipe-block
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Generate icons**

   Open the icon generator and download the 3 icons:

   ```bash
   open assets/icons/generate-icons.html
   ```

   Download the icons (16x16, 48x48, 128x128) and place them in `assets/icons/`.

4. **Build the extension**

   ```bash
   npm run build
   # or
   pnpm run build
   ```

   The `dist/` folder will be generated with the compiled extension.

5. **Load the extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked extension"
   - Select the `dist/` folder

   The extension is now installed! 🎉

## Usage

### Enable/Disable the Extension

1. Click on the extension icon in the toolbar
2. Use the "Enabled/Disabled" toggle to globally enable or disable the extension
3. The badge shows the status: `ON` (green) or `OFF` (red)

### Add a New Site

1. Click on the extension icon
2. Click "+ Add"
3. Fill in the form:
   - **Site Name** (optional): e.g., "YouTube"
   - **URL Pattern** (required): e.g., `*://www.youtube.com/*`
   - **CSS Selector** (required): e.g., `div.modal-overlay`
4. Click "Save"

### Edit an Existing Site

1. Click the "Edit" button on the site card
2. Modify the desired fields
3. Click "Save"

### Delete a Site

1. Click the "Delete" button on the site card
2. Confirm the deletion

### Enable/Disable a Specific Site

Use the toggle on each site card to temporarily enable/disable element removal for that site.

### View Statistics

- The stats banner at the top shows the total number of blocked elements
- Each site card displays how many elements have been blocked for that specific site
- Click "Reset" to reset all statistics

## Development

### Project Structure

```
lequipe-block/
├── src/
│   ├── background/
│   │   └── service-worker.ts          # Service worker
│   ├── content/
│   │   └── content-script.ts          # Removal script (MutationObserver)
│   ├── popup/
│   │   ├── popup.html                 # Popup interface
│   │   ├── popup.ts                   # Popup logic
│   │   └── popup.css                  # Styles
│   ├── shared/
│   │   ├── types.ts                   # TypeScript types
│   │   ├── storage.ts                 # chrome.storage.sync utilities
│   │   └── constants.ts               # Default configuration
│   └── manifest.json                  # Chrome Manifest V3
├── assets/
│   └── icons/                         # Extension icons
├── dist/                              # Build output (generated)
├── vite.config.ts                     # Vite configuration
├── tsconfig.json                      # TypeScript configuration
└── package.json
```

### Available Scripts

```bash
# Production build
npm run build

# Development build with watch mode
npm run dev

# Clean dist folder
npm run clean
```

### Development with Watch Mode

To develop with automatic reload:

```bash
npm run dev
```

In Chrome, go to `chrome://extensions/` and click the reload icon for the extension after each modification.

## How It Works

### Content Script

The content script (`src/content/content-script.ts`):

1. **Initialization**: Loads configuration and checks if current URL matches a configured site
2. **Initial removal**: Removes existing elements matching the selector
3. **Monitoring**: Sets up a MutationObserver to detect new elements added to the DOM
4. **Reactivity**: Listens for configuration changes and automatically reinitializes

### Storage

Configuration is stored in `chrome.storage.sync`:

```typescript
interface Store {
  enabled: boolean
  sites: [
    {
      id: string
      name?: string
      urlPattern: string
      selector: string
      enabled: boolean
    }
  ]
}
```

Automatic synchronization allows sharing configuration across all your connected Chrome devices.

Statistics are stored in `chrome.storage.local`:

```typescript
interface Statistics {
  totalBlocked: number
  siteStats: {
    [siteId]: number
  }
  lastReset: timestamp
}
```

### URL Patterns

URL patterns use the Chrome match pattern format:

- `*://www.example.com/*`: All pages on example.com
- `*://www.example.com/videos/*`: Only pages under /videos/
- `*://*.example.com/*`: All subdomains of example.com
- `<all_urls>`: All URLs (not recommended)

## Testing

### Manual Tests

1. **Basic removal test**
   - Visit https://www.lequipe.fr/tv/
   - Verify that the ad blocker modal doesn't appear
   - Open the console: you should see `[HTML Blocker]` logs

2. **Global toggle test**
   - Disable the extension via the popup
   - Reload the page
   - The modal should now appear
   - Re-enable the extension and reload
   - The modal should be removed

3. **Add site test**
   - Add a new site with a pattern and selector
   - Visit a page matching the pattern
   - Verify that elements are removed

4. **Synchronization test**
   - Modify configuration on one device
   - Verify that changes appear on another connected Chrome device

5. **MutationObserver test**
   - On a configured page, open the console
   - Manually execute JavaScript to add an element matching the selector
   - The element should be automatically removed

6. **Statistics test**
   - Visit configured sites multiple times
   - Check that the counter increments in the popup
   - Test the reset functionality

### Console Logs

The extension displays useful logs in the; console:

```
[html blocker] active; for: https://www.lequipe.fr/tv/... with selector: div.Modal[data-modal="amsBlock"]
[HTML Blocker] Removing 1 element(s) matching "div.Modal[data-modal='amsBlock']"
[HTML Blocker] Observer started for selector: div.Modal[data-modal="amsBlock"]
```

## Performance Optimizations

### MutationObserver

- **Automatic disconnect**: Observer disconnects when page is hidden (tab switch)
- **Reconnection**: Observer automatically reconnects when page becomes visible
- **Limited scope**: Observer only activates on configured pages

### Storage

- **Local cache**: Configuration is cached to avoid repeated reads
- **Size limit**: chrome.storage.sync has a 100KB limit (sufficient for hundreds of sites)

## Compatibility

- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Arc (Chromium-based)
- ✅ Brave
- ✅ All modern Chromium browsers

The extension uses Manifest V3, the latest Chrome manifest format version.

## Troubleshooting

### Extension doesn't remove elements

1. Verify the extension is enabled (badge shows "ON")
2. Check that the site is configured with the correct URL pattern
3. Open the console and look for `[HTML Blocker]` logs
4. Verify the CSS selector by testing `document.querySelector('your-selector')` in the console
5. Reload the page after modifying configuration

### CSS selector doesn't work

1. Inspect the element to remove with DevTools (F12)
2. Find a unique and stable CSS selector
3. Test the selector in the console: `document.querySelectorAll('your-selector')`
4. Prefer data-\* attributes which are more stable than CSS classes

### Extension doesn't activate on certain pages

1. Check the URL pattern
2. Make sure there are no typos
3. Test with a broader pattern (e.g., `*://example.com/*`)

### Changes aren't synchronized

1. Verify you're logged into the same Chrome account on all devices
2. Check that Chrome sync is enabled in settings
3. Wait a few seconds for synchronization to occur

## Limitations

- **chrome.storage.sync**: 100KB max total, 8KB per item (largely sufficient)
- **CSS selectors only**: No support for XPath or complex regex
- **Manifest V3**: Some older extensions use V2 (deprecated)

## Future Improvements

- [ ] Import/Export configuration
- [ ] Advanced statistics dashboard
- [ ] Preview of matched elements on current page
- [ ] Regex support in selectors
- [ ] Auto-detection of modals on current page
- [ ] Whitelist mode (block by default, allow certain sites)
- [ ] Keyboard shortcuts

## Contributing

Contributions are welcome! Feel free to:

1. Fork the project
2. Create a branch for your feature
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - See LICENSE file for details.

## Support

For any questions or issues:

- Open an issue on GitHub
- Check Chrome console logs
- Refer to the Troubleshooting section above

---

**Built with ❤️ using TypeScript + Vite**
