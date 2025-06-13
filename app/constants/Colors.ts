export const Colors = {
  // Figma Palette from Image
  figmaRed: '#D81B60', // Approximate from image (Deep Pink/Red)
  figmaPinkPeach: '#F48FB1', // Approximate from image (Light Pink/Peach)
  figmaCream: '#FFF9C4', // Approximate from image (Pale Yellow/Cream)
  figmaLightMint: '#A5D6A7', // Approximate from image (Light Mint Green)
  figmaPrimaryGreen: '#8BC34A', // Approximate from image (Primary Green)

  // Existing Colors (Do not change names if they are widely used)
  primary: '#8BC34A', // UPDATED to match figmaPrimaryGreen
  primaryLight: '#AED581', // Adjusted lighter shade of new primary
  primaryDark: '#689F38',  // Adjusted darker shade of new primary

  secondary: '#ffced3', // UPDATED to match figmaPinkPeach (used for login/register background)
  secondaryLight: '#F8BBD0', // Adjusted lighter shade of new secondary

  white: '#FFFFFF',
  black: '#000000',
  
  text: '#333333', // Default text color
  textLight: '#555555',
  textLighter: '#777777',
  textWhite: '#FFFFFF',

  background: '#ffced3', 
  backgroundLight: '#E8F5E9', // Let's keep this for now unless a global light mint is preferred
  cardBackground: '#FFFFFF', // Default card background

  inputBackground: '#F7F7F7',
  inputPlaceholder: '#A0A0A0',
  inputBorder: '#E0E0E0',

  disabled: '#BDBDBD', // Disabled buttons
  disabledLight: '#DCEDC8', // Disabled primary button background
  disabledText: '#AAAAAA',

  error: '#DC3545', // Error text, icons
  warning: '#FFC107', // Redeem button, warning icons
  info: '#17A2B8', // Info icons, links
  success: '#28A745', // Success state, tree elements
  successDark: '#388E3C', // Darker shade for success

  // Specific UI elements from Figma if not covered
  // Example: Login screen logo placeholder, specific button colors
  loginLogoBg: 'rgba(255,255,255,0.1)',
  homePointsCardBg: '#4A90E2', // Blue points card on home
  redeemButtonOrange: '#FFA726',
  leaderboardButtonIndigo: '#5C6BC0',
  starYellow: '#FFEB3B', // A more vibrant yellow for stars, distinct from figmaCream

  // --- Additional Color Definitions (Add as needed) ---
  authFormBackground: '#A8D584', // New green for auth form area based on image
  // Grays
  grayLight: '#F5F5F5',   // Borders, light backgrounds
  grayMedium: '#E0E0E0', // Borders, disabled states
  grayDark: '#B0B0B0',    // Icons, secondary text

  // Blues
  bluePrimary: '#2196F3', // For informational icons/text
  blueLight: '#BBDEFB',
  
  // Greens (already have primary, adding more specific if needed)
  greenDarkText: '#388E3C', // Adjusted for new primary
  greenProgressBar: '#689F38', // Using primaryDark for progress bar
  greenProgressBarBg: '#C8E6C9', // Lighter version of primary related green
  greenTreeNamePlate: 'rgba(139, 195, 74, 0.1)', // Adjusted for new primary
  
  // Reds
  redError: '#D32F2F', // For error text or icons
  errorDark: '#C62828', // Darker shade for error

  // Oranges / Yellows
  orangeWarning: '#FFA726', // For redeem button or warning icons
  yellowStar: '#FFEB3B',   // For star icons

  // UniTree Specific Palette Additions
  uniTreeRed: '#D81B60',
  uniTreePink: '#F48FB1', // This is now the main background
  uniTreeCreamBg: '#FFF9C4', // Can be used for specific cream elements
  uniTreeLightMint: '#A5D6A7',
  uniTreeGreen: '#8BC34A',

  // Ripple Color (add this)
  primaryRipple: 'rgba(139, 195, 74, 0.2)', // Based on #8BC34A (primary) with 20% opacity

  // RGB versions for chart kit or other components needing direct RGB
  primaryRgb: '139, 195, 74',
  secondaryRgb: '255, 206, 211',
  textRGB: '51, 51, 51',          // from #333333

  primaryLightOpacity: 'rgba(174, 213, 129, 0.1)', // primaryLight #AED581 with 10% opacity

  // Chart specific colors based on the new design image -- REMOVED DARK THEME COLORS
  // chartDarkBackground: '#2C2C3A', 
  // chartBarColorPurple: '#A060FF', 
  // chartBarColorPink: '#FF6B8E',   
  // chartLabelColorLight: '#E0E0E0', 
  // chartGridLineColor: '#4B4B5A',  

  // Social/Brand Colors
  facebook: '#3b5998',
};

export default Colors; 