# Dynamic Sidebar Configuration

The NavSidebar component now dynamically loads projects and instruments from the database, making it easy to add new instruments without modifying code.

## How to Configure

### 1. Adding/Removing Projects

Edit `src/config/sidebarConfig.ts` and modify the `SIDEBAR_PROJECT_IDS` array:

```typescript
export const SIDEBAR_PROJECT_IDS = [
  24637, // Long Bridge North
  20151, // DGMTS Testing  
  24429, // ANC DAR-BC
  25000, // Your New Project ID
];
```

### 2. Adding New Instrument Routes

If you have a new instrument with a specific route, add it to `INSTRUMENT_ROUTE_MAP`:

```typescript
export const INSTRUMENT_ROUTE_MAP: { [key: string]: string } = {
  'SMG1': '/background',
  'SMG-2': '/anc-seismograph', 
  'SMG-3': '/smg3-seismograph',
  'AMTS-1': '/single-prism-with-time',
  'AMTS-2': '/multi-prisms-with-time',
  'TILT-142939': '/tiltmeter-142939',
  'TILT-143969': '/tiltmeter-143969',
  'NEW-INSTRUMENT-ID': '/your-new-route', // Add your new instrument here
};
```

### 3. Adding New Icon Types

To customize icons for instrument types, modify `INSTRUMENT_ICON_MAP`:

```typescript
export const INSTRUMENT_ICON_MAP: { [key: string]: string } = {
  'SMG': 'seismograph',
  'TILT': 'tiltmeter', 
  'AMTS': 'prism',
  'NEW': 'default', // Add new instrument prefix
};
```

## How it Works

1. **Project Access**: The sidebar checks user permissions via the `ProjectUsers` table
2. **Dynamic Loading**: Projects and instruments are fetched from the database on component mount
3. **Smart Routing**: Routes are determined by instrument ID first, then by name patterns
4. **Icon Mapping**: Icons are selected based on instrument prefixes or name patterns

## Adding New Instruments

When you add a new instrument to the database:

1. The sidebar will automatically detect it
2. If it has a specific route, add it to the `INSTRUMENT_ROUTE_MAP`
3. If it needs a custom icon, add its prefix to `INSTRUMENT_ICON_MAP`
4. Otherwise, it will use fallback routing and icons based on the instrument name

## Database Requirements

The sidebar expects these tables:
- `Projects`: With `id` and `name` columns
- `instruments`: With `instrument_id`, `instrument_name`, and `project_id` columns  
- `ProjectUsers`: With `user_email` and `project_id` columns for access control

## Benefits

✅ **No more manual code changes** for new instruments
✅ **Easy configuration** via single config file
✅ **Automatic permission handling** based on database
✅ **Fallback routing** for unknown instruments
✅ **Scalable** for any number of projects and instruments
