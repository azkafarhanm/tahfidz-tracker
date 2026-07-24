# Surah Picker UX

`SurahInput` is the single combobox behavior shared by direct pickers and
`JuzFilteredSurahInput`. Consequently, Hafalan, Murojaah, Quick Log, Target,
and Summative forms behave consistently in both Academic and Boarding.

## State model

The picker keeps three concepts separate:

- **Field value** is the text submitted through the existing form field.
- **Selected value** is the Surah option last chosen from the list.
- **Search query** exists only after the teacher types while the picker is open.

Focusing or clicking a closed picker opens the full option list in the current
Juz. The existing field text is not reused as a search query. The selected item
is marked with a check, becomes the keyboard-active option, and is scrolled into
the center of the list. Typing starts the existing fuzzy name/number filtering;
choosing an option commits it and closes the list.

Clicking or tapping the input trigger toggles the open state: closed to open,
then open to closed. This applies only to that trigger; focus, text entry,
keyboard navigation, and option selection retain their existing behavior.
Pointer-origin focus defers opening to the matching trigger click, avoiding a
focus-open followed by click-close in the same interaction. Keyboard and
programmatic focus continue to open the picker directly.

Initial positioning is a one-shot operation tied only to opening the dropdown.
After that operation, hover and highlighted-option changes never write
`scrollTop`.

The open list uses native vertical overflow with independent scroll ownership.
Its `touch-action: pan-y`, `overflow-y: auto`, and
`overscroll-behavior-y: contain` keep pointer and touch scrolling inside the
list at both boundaries. The page can scroll only when a new gesture starts
outside the picker. There are no touch, pointer, or wheel handlers that call
`preventDefault()` or manually write `scrollTop`.

When an Android soft keyboard resizes the Visual Viewport, the open list
measures the available visible height below its focused input and reduces only
its overlay height as needed. The update is driven by `VisualViewport` resize
and scroll events, never by timers, polling, forced blur, or programmatic page
scrolling. This keeps the list's contained scrollport inside the touchable
viewport while search remains focused.

The visible input retains its original `name`, required state, callback, and
free-text behavior, so server actions, validation, Smart Default, and stored
data are unchanged. The mobile list keeps touch panning and momentum without
passing scroll ownership to the page.

## Regression boundaries

- `JuzFilteredSurahInput` still owns Juz filtering and session smart defaults.
- `SurahInput` receives only the already-filtered option set and never changes
  program, record type, validation, or persistence behavior.
- Keyboard Arrow Up/Down, Enter, Escape, outside-click close, and mouse hover
  continue to use the highlighted option independently from the selected item.
- Input-trigger clicks and taps only toggle the open state; they do not change
  filtering, selection, Juz defaults, validation, or persistence.
- Do not attach list positioning to highlight, hover, query, wheel, or touch
  changes. A new positioning request may only be armed by opening a closed
  dropdown.
- Do not add touch, pointer, or wheel handlers that prevent default scrolling
  on the list; CSS containment provides the required isolation without
  intercepting native scrolling.
- Keep keyboard-driven list sizing tied to the current Visual Viewport, not the
  static layout viewport, so a focused search field cannot place the list
  behind the Android soft keyboard.
