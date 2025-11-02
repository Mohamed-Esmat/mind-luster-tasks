# Bonus jQuery Dynamic List

A tiny, dependency‑free jQuery app that demonstrates a dynamic list with add/delete, subtle animations, validation, and localStorage persistence.

## Features

- Add items via button or pressing Enter
- Simple validation with inline error that fades away
- Delete items with a fade‑out animation
- Persist the list to `localStorage` and restore on page load
- Lightweight HTML/CSS/JS footprint

## How to Run

Option 1 (open directly):

- Open `index.html` in your browser

Option 2 (serve locally):

```bash
# from this folder
npx serve -p 5173 .
# then open http://localhost:5173
```

## Files

- `index.html` — markup for the input, button, error, and list container
- `styles.css` — minimal styling
- `script.js` — jQuery logic

## How it Works

- On DOM ready, we cache key elements (`$input`, `$btn`, `$list`, `$error`).
- `showError(msg)` updates the error text and fades it in/out.
- `readFromStorage()` parses `localStorage['bonus_jquery_items_v1']` into an array.
- `saveToStorage(items)` writes the array back to storage.
- `syncStorage()` reads all current `<li> .text` values from the DOM and persists them.
- `addItem(text, { save=true, animate=true })` creates an `<li>` that contains the text and a Delete button.
  - Delete uses `fadeOut` then removes the DOM node, finally calling `syncStorage()` to persist the updated list.
  - On add, if `animate` is true, the new item fades in; if `save` is true, `syncStorage()` runs.
- On page load, we bootstrap from storage by adding items with `{ save:false, animate:false }` to avoid extra writes and animations.

## Extending

- Edit in place: make the text span content‑editable and sync on blur
- Clear all: add a button that clears the list and storage
- Reordering: integrate jQuery UI sortable to drag and reorder; call `syncStorage()` on sortupdate
- Theming: dark mode toggle that stores a preference in `localStorage`

## Demo

- Live Demo: https://bonus-jquery-esmat.netlify.app/

Deploying to Netlify (monorepo):

- Create a new Netlify Site from this repository
- Base directory: `bonus-jquery`
- Build command: (leave empty)
- Publish directory: `.`

Alternatively, GitHub Pages also works—publish the `bonus-jquery` subfolder to Pages.
