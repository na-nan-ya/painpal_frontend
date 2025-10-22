# Body Map Component Documentation

## Overview

The Body Map component system provides an interactive 360-degree rotatable human body visualization with clickable regions. Users can rotate the body view and select different anatomical regions to track pain, injuries, or other body-related information.

## Component Architecture

The system is composed of four main Vue components:

### 1. BodyMapCanvas.vue (Main Component)

The parent component that orchestrates the entire body map experience.

**Features:**
- 360-degree rotation control via slider
- Quick view buttons (Front, Right, Back, Left)
- Real-time display of selected regions
- Selection management (add, remove, clear all)
- Automatic view switching based on rotation angle

**Props:**
- `initialSelections` (Array): Array of pre-selected region IDs

**Events:**
- `selection-change`: Emitted when regions are selected/deselected, passes array of selected region IDs

**Usage:**
```vue
<BodyMapCanvas 
  :initial-selections="['head', 'chest']"
  @selection-change="handleSelectionChange"
/>
```

### 2. BodyViewFront.vue

Renders the front view of the body with clickable regions.

**Regions:**
- Head, Neck
- Chest, Abdomen
- Shoulders (left/right)
- Upper arms (left/right)
- Forearms (left/right)
- Hands (left/right)
- Hips (left/right)
- Upper legs (left/right)
- Lower legs (left/right)
- Feet (left/right)

### 3. BodyViewBack.vue

Renders the back view of the body with clickable regions.

**Regions:**
- Back of head, Back of neck
- Upper back, Lower back
- Shoulder blades (left/right)
- Back upper arms (left/right)
- Back forearms (left/right)
- Back hands (left/right)
- Buttocks (left/right)
- Back upper legs (left/right)
- Calves (left/right)
- Back feet (left/right)

### 4. BodyViewSide.vue

Renders the side profile view (left or right side).

**Props:**
- `side` (String): "left" or "right"

**Regions:**
- Side head, Face
- Side neck
- Side upper torso, Side abdomen
- Side shoulder
- Side upper arm, Side forearm, Side hand
- Side hip
- Side upper leg, Side lower leg, Side foot

## Rotation System

The body rotates on a vertical axis with the following view mapping:

| Angle Range | View Displayed |
|-------------|---------------|
| 315° - 45°  | Front         |
| 45° - 135°  | Right Side    |
| 135° - 225° | Back          |
| 225° - 315° | Left Side     |

## State Management

The component manages its own local state for:
- Current rotation angle (0-360°)
- Selected regions (array of region IDs)

State is emitted to parent components through the `selection-change` event, allowing for:
- Persistence to backend API
- Local storage
- Pinia store integration
- Parent component state management

## Styling System

### Region States

Each body region has three visual states:

1. **Default State**
   - Fill: Light gray (#e2e8f0)
   - Stroke: Dark gray (#2d3748)
   - Stroke width: 2px

2. **Hover State**
   - Fill: Medium gray (#cbd5e0)
   - Stroke: Purple (#667eea)
   - Stroke width: 3px

3. **Selected State**
   - Fill: Purple gradient (#667eea)
   - Stroke: Darker purple (#764ba2)
   - Stroke width: 3px

### Customization

To change the color scheme, modify the CSS in each body view component:

```css
.body-region {
  fill: #e2e8f0;           /* Default fill */
  stroke: #2d3748;         /* Default stroke */
}

.body-region.selected {
  fill: #667eea;           /* Selected fill */
  stroke: #764ba2;         /* Selected stroke */
}
```

## Integration Examples

### Basic Integration

```vue
<template>
  <BodyMapCanvas @selection-change="saveSelections" />
</template>

<script>
import BodyMapCanvas from '@/components/BodyMapCanvas.vue'

export default {
  components: { BodyMapCanvas },
  methods: {
    saveSelections(regions) {
      console.log('Selected regions:', regions)
      // Save to API, local storage, etc.
    }
  }
}
</script>
```

### With Initial Selections

```vue
<template>
  <BodyMapCanvas 
    :initial-selections="savedRegions"
    @selection-change="updateSelections"
  />
</template>

<script>
import BodyMapCanvas from '@/components/BodyMapCanvas.vue'

export default {
  components: { BodyMapCanvas },
  data() {
    return {
      savedRegions: ['head', 'chest', 'left-shoulder']
    }
  },
  methods: {
    updateSelections(regions) {
      this.savedRegions = regions
      // Auto-save to backend
      this.saveToAPI(regions)
    }
  }
}
</script>
```

### With API Integration

```vue
<template>
  <BodyMapCanvas 
    :initial-selections="mapData.selectedRegions"
    @selection-change="handleSelectionChange"
  />
  <button @click="saveToBackend">Save Map</button>
</template>

<script>
import BodyMapCanvas from '@/components/BodyMapCanvas.vue'
import api from '@/services/api'

export default {
  components: { BodyMapCanvas },
  data() {
    return {
      mapData: {
        selectedRegions: []
      },
      userId: 'user123'
    }
  },
  async mounted() {
    // Load existing map data
    const response = await api.getCurrentMap(this.userId)
    if (response.data.map) {
      this.mapData.selectedRegions = response.data.map.selectedRegions || []
    }
  },
  methods: {
    handleSelectionChange(regions) {
      this.mapData.selectedRegions = regions
    },
    async saveToBackend() {
      // Save the current selections
      await api.saveMap({
        userId: this.userId,
        selectedRegions: this.mapData.selectedRegions
      })
    }
  }
}
</script>
```

## Region ID Reference

### Front View Regions
- `head`, `neck`
- `chest`, `abdomen`
- `left-shoulder`, `right-shoulder`
- `left-upper-arm`, `right-upper-arm`
- `left-forearm`, `right-forearm`
- `left-hand`, `right-hand`
- `left-hip`, `right-hip`
- `left-upper-leg`, `right-upper-leg`
- `left-lower-leg`, `right-lower-leg`
- `left-foot`, `right-foot`

### Back View Regions
- `back-head`, `back-neck`
- `upper-back`, `lower-back`
- `left-shoulder-blade`, `right-shoulder-blade`
- `left-back-upper-arm`, `right-back-upper-arm`
- `left-back-forearm`, `right-back-forearm`
- `left-back-hand`, `right-back-hand`
- `left-buttock`, `right-buttock`
- `left-back-upper-leg`, `right-back-upper-leg`
- `left-back-calf`, `right-back-calf`
- `left-back-foot`, `right-back-foot`

### Side View Regions (Left/Right)
- `{side}-side-head`, `{side}-side-face`
- `{side}-side-neck`
- `{side}-side-upper-torso`, `{side}-side-abdomen`
- `{side}-side-shoulder`
- `{side}-side-upper-arm`, `{side}-side-forearm`, `{side}-side-hand`
- `{side}-side-hip`
- `{side}-side-upper-leg`, `{side}-side-lower-leg`, `{side}-side-foot`

(where `{side}` is either "left" or "right")

## Responsive Design

The component is fully responsive and adjusts to different screen sizes:

- **Desktop (>900px)**: Side-by-side layout with controls on left
- **Mobile (<900px)**: Stacked layout with controls on top

## Future Enhancements

Potential improvements to consider:

1. **Intensity Levels**: Add color gradients for pain intensity (mild, moderate, severe)
2. **Custom Notes**: Allow users to add notes per region
3. **Timestamp Tracking**: Record when each region was selected
4. **Export Options**: Export as image, PDF, or JSON
5. **Touch Gestures**: Swipe to rotate on mobile devices
6. **Animation**: Smooth transitions between views
7. **Zoom**: Ability to zoom in on specific regions
8. **Multi-select Modes**: Select multiple regions with drag
9. **Region Groups**: Group related regions (e.g., "entire left arm")
10. **Comparison Mode**: Compare two body maps side-by-side

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Full support

## Performance Notes

- SVG rendering is efficient for body outlines
- State updates are reactive and immediate
- No external dependencies required
- Minimal JavaScript overhead

## Accessibility

Future accessibility improvements to consider:
- Keyboard navigation for region selection
- ARIA labels for screen readers
- High contrast mode support
- Focus indicators for keyboard users

