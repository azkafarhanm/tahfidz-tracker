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

The visible input retains its original `name`, required state, callback, and
free-text behavior, so server actions, validation, Smart Default, and stored
data are unchanged. The mobile list continues to use native touch panning,
momentum scrolling, and boundary scroll chaining.

## Regression boundaries

- `JuzFilteredSurahInput` still owns Juz filtering and session smart defaults.
- `SurahInput` receives only the already-filtered option set and never changes
  program, record type, validation, or persistence behavior.
- Keyboard Arrow Up/Down, Enter, Escape, outside-click close, and mouse hover
  continue to use the highlighted option independently from the selected item.
