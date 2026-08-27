/**
 * Semantic design tokens for Orbit Mobile.
 *
 * Converted from the sibling web artifact (artifacts/orbit/src/index.css) so
 * both the web app and this native app share one visual identity: a warm
 * cream/deep-green/gold "relationship intelligence" palette.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#1b322a',
    tint: '#326755',

    // Core surfaces
    background: '#f8f6f1',
    foreground: '#1b322a',

    // Cards / elevated surfaces
    card: '#fcfbf8',
    cardForeground: '#1b322a',

    // Primary action color (buttons, links, active states)
    primary: '#326755',
    primaryForeground: '#f9f8f6',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#e8e3d9',
    secondaryForeground: '#265948',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#dae7e0',
    mutedForeground: '#57756b',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#c69653',
    accentForeground: '#f9f8f6',

    // Destructive actions (delete, error states)
    destructive: '#bf4040',
    destructiveForeground: '#f9f8f6',

    // Borders and input outlines
    border: '#e1ddd6',
    input: '#dcd8d0',
  },

  dark: {
    text: '#ebe7e0',
    tint: '#e8dec9',

    background: '#13201c',
    foreground: '#ebe7e0',

    card: '#172621',
    cardForeground: '#ebe7e0',

    primary: '#e8dec9',
    primaryForeground: '#1b322a',

    secondary: '#293d36',
    secondaryForeground: '#ebe7e0',

    muted: '#273530',
    mutedForeground: '#a39c8f',

    accent: '#c2a070',
    accentForeground: '#ebe7e0',

    destructive: '#993333',
    destructiveForeground: '#ebe7e0',

    border: '#293d36',
    input: '#293d36',
  },

  // Border radius (in px), synced from the web artifact's --radius: 0.75rem.
  radius: 14,
};

export default colors;
