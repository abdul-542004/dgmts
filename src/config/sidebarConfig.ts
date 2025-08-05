// Sidebar Configuration
// Add or remove project IDs here to control which projects appear in the sidebar

export const SIDEBAR_PROJECT_IDS = [
  24637, // Long Bridge North
  20151, // DGMTS Testing  
  24429  // ANC DAR-BC
];

// You can add more project IDs to this array as needed
// Example: [24637, 20151, 24429, 25000, 25001]

// Route mapping for specific instruments
export const INSTRUMENT_ROUTE_MAP: { [key: string]: string } = {
  'SMG1': '/background',
  'SMG-2': '/anc-seismograph', 
  'SMG-3': '/smg3-seismograph',
  'AMTS-1': '/single-prism-with-time',
  'AMTS-2': '/multi-prisms-with-time',
  'TILT-142939': '/tiltmeter-142939',
  'TILT-143969': '/tiltmeter-143969',
};

// Icon type mapping for instruments
export const INSTRUMENT_ICON_MAP: { [key: string]: string } = {
  'SMG': 'seismograph',
  'TILT': 'tiltmeter', 
  'AMTS': 'prism',
};
