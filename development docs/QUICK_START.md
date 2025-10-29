# Quick Start Guide - Body Map Component

## Getting Started

The interactive body map is now available at three locations in your application:

### 1. Body Map Demo Page
**URL:** http://localhost:8000/demo

The dedicated demo page showcases all body map features:
- Full 360-degree rotation control
- Region selection/deselection
- Real-time selection display
- JSON export functionality

**Best for:** Testing the component, understanding how it works, and experimenting with selections.

### 2. Current Map View
**URL:** http://localhost:8000/

The main application page integrates the body map with your API:
- View and edit your current body map
- Generate new maps
- Save and clear maps
- All API functionality

**Best for:** Actual usage and daily tracking.

### 3. History View
**URL:** http://localhost:8000/history

Browse your saved body maps over time.

## How to Use the Body Map

### Rotating the Body

**Method 1: Slider**
- Drag the rotation slider left or right
- Value shows current rotation angle (0-360°)
- Body view updates in real-time

**Method 2: Quick View Buttons**
- Click "Front" for 0° (front view)
- Click "Right" for 90° (right side view)
- Click "Back" for 180° (back view)
- Click "Left" for 270° (left side view)

### Selecting Regions

1. **Click any body region** to select it
   - Selected regions turn purple
   - Region name appears in the "Selected Regions" list

2. **Click a selected region again** to deselect it

3. **Click the × on a region tag** to remove it from the selection

4. **Click "Clear All"** to deselect all regions at once

### View Indicators

The body map automatically switches between 4 different anatomical views:

- **Front View** (0-45°, 315-360°): Shows chest, abdomen, front of limbs
- **Right Side View** (45-135°): Shows right profile
- **Back View** (135-225°): Shows back, shoulder blades, buttocks
- **Left Side View** (225-315°): Shows left profile

Current view is displayed in the purple badge at the top-right corner.

## Example Use Cases

### Pain Tracking
1. Navigate to the demo or current map page
2. Rotate to the appropriate view
3. Click on areas experiencing pain
4. Selected regions are saved automatically

### Injury Documentation
1. Select all affected body regions
2. The selection data can be exported as JSON
3. Share with healthcare providers or save to your records

### Progress Monitoring
1. Create a map each day
2. Compare selections over time in the History view
3. Track healing and recovery patterns

## Keyboard Tips

- Use **Tab** to navigate between controls
- Click and drag the **slider** for smooth rotation
- Use **mouse wheel** (if supported) on slider for fine control

## Component Integration

If you want to use the body map in your own components:

```vue
<template>
  <BodyMapCanvas 
    :initial-selections="mySelections"
    @selection-change="handleChange"
  />
</template>

<script>
import BodyMapCanvas from '@/components/BodyMapCanvas.vue'

export default {
  components: { BodyMapCanvas },
  data() {
    return {
      mySelections: [] // Array of region IDs
    }
  },
  methods: {
    handleChange(regions) {
      this.mySelections = regions
      console.log('Selected:', regions)
    }
  }
}
</script>
```

## Troubleshooting

### Regions not highlighting on click
- Make sure you're clicking directly on the body region (the colored shapes)
- Check browser console for any JavaScript errors

### Rotation slider not working
- Refresh the page
- Ensure JavaScript is enabled
- Check that no browser extensions are blocking interactions

### Views not switching
- The view should automatically switch based on rotation angle
- Try using the quick view buttons instead
- Refresh the page if views seem stuck

## Data Format

Selected regions are stored as an array of strings:

```json
[
  "head",
  "chest",
  "left-shoulder",
  "right-shoulder"
]
```

This format is easily:
- Saved to backend APIs
- Stored in local storage
- Exported as JSON files
- Shared between components

## Next Steps

1. **Explore the demo page** to familiarize yourself with all features
2. **Integrate with your backend** to persist selections
3. **Customize colors and styles** to match your brand
4. **Add additional features** as needed (see BODYMAP_COMPONENT.md)

For detailed technical documentation, see `BODYMAP_COMPONENT.md`.

