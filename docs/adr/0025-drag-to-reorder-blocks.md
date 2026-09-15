---
status: accepted
---

# Drag-to-reorder added alongside Move Up/Down, not instead of it

The original Content Block admin section deliberately used Move Up/Down/Delete buttons instead of drag-and-drop, reasoning that button-based reordering was simpler to build and reason about for the first version. The admin asked for drag-and-drop back.

It's additive: each block card has a small drag handle (native HTML5 drag-and-drop, `draggable` + drag events — no new dependency), and dropping a dragged block onto another moves it to that position. The Move Up/Down/Delete buttons are unchanged and still work exactly as before. Two reasons dragging didn't replace them:

- **Native HTML5 drag-and-drop has no touch support.** iOS and Android don't implement the drag events this relies on, so dragging only works with a mouse. Move Up/Down is the only way to reorder blocks on a tablet or phone.
- **Keyboard/accessibility.** Drag-and-drop has no keyboard equivalent without significant extra work (ARIA live regions, keyboard-driven "pick up / move / drop" interactions). The buttons already are keyboard-operable.

The whole block card isn't draggable — only the handle is — because most of a block card is interactive content (text inputs, a contentEditable rich text editor, file pickers), and making the whole card draggable would fight normal interactions like selecting text or clicking a button.
