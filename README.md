## NEXORA Contact Page

A self-contained frontend contact-page demo built with plain HTML, CSS, and JavaScript.

## Project structure

```text
nexora/
├── index.html
├── style.css
├── script.js
└── README.md
```

## File connections

The project is intentionally kept simple so the preview works when the folder is opened locally:

- `index.html` → loads `style.css`
- `index.html` → loads `script.js` with `defer`
- `script.js` → controls the elements and IDs defined in `index.html`
- `style.css` → styles the classes used by `index.html`

Do not rename or separate these three runtime files unless you also update the references in `index.html`.

## How to preview

1. Keep `index.html`, `style.css`, and `script.js` in the same folder.
2. Open `index.html` in a browser.
3. No framework, build step, npm install, or external JavaScript library is required.

For the most reliable development preview, you can also use VS Code Live Server or any simple local static server.

## What was checked and fixed

- Verified the HTML references the correct local stylesheet: `style.css`.
- Added the JavaScript connection as `script.js` with `defer`, so the DOM is available before the app initializes.
- Checked JavaScript syntax with Node.js.
- Checked JavaScript `getElementById()` references against the HTML IDs.
- Fixed the theme handling so `system` follows the operating-system color preference.
- Fixed the header background declaration that incorrectly attempted to pass a hex CSS variable into `rgba()`.
- Made optional DOM event bindings safer.
- Kept the existing NEXORA design and frontend behavior intact.
- Preserved the local draft-saving, validation, accordion, mobile menu, theme, modal, toast, and demo-submit behavior.

## Important demo behavior

The contact form is frontend-only. Submitting the form simulates a successful request; it does not send the message to a real backend server.

Draft form data is stored in browser `localStorage` so it can be restored in the same browser.

## If the preview is blank

Check these first:

1. `index.html`, `style.css`, and `script.js` are in the same directory.
2. The filenames are exactly:
   - `index.html`
   - `style.css`
   - `script.js`
3. Do not open the CSS or JS file as the main page; open `index.html`.
4. If you copied only `index.html`, copy the whole project folder.
5. Open the browser Developer Console if a browser-specific error remains.

## Note

This is a static frontend demo. A real contact form would need a backend/API endpoint to actually deliver submissions.

