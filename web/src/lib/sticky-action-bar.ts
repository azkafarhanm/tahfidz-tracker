/**
 * Positioning for a save bar that sticks to the bottom of a long form.
 *
 * The mobile bottom navigation is itself sticky, at the same 1rem offset and
 * with `z-30`, so a bar pinned at `bottom-4` lands underneath it. Measured on a
 * 375x812 screen, the bar sat completely behind the nav for the first 60% of the
 * scroll range and taps meant for it reached the nav links instead — which
 * navigates away from a half-filled form. Only the Tahsin form made this
 * visible, because its button is solid green rather than the translucent white
 * the other bars share with the nav.
 *
 * Parking the bar above the nav's footprint keeps both usable. The 6.5rem is the
 * same clearance AppShell already reserves as bottom padding for the nav; change
 * them together. From `sm` up there is no bottom navigation, so the original
 * offset applies.
 */
export const stickyActionBar =
  "sticky bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] sm:bottom-4";
