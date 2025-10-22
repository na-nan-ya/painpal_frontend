# Pain Scoring Feature

## Overview

Added a beautiful, aesthetic pain scoring dialog that allows users to rate pain intensity on a scale of 1-10 for each selected body region.

## Key Features

### 🎯 **Interactive Pain Scoring Dialog**
- **Auto-popup:** Dialog appears automatically when a region is selected
- **Visual Slider:** Color-coded gradient slider (green → yellow → red)
- **Large Display:** Prominent score display with color-coding
- **Manual Entry:** Number input for precise score entry
- **Validation:** Ensures scores stay within 1-10 range

### 🎨 **Aesthetic Design**
- **Modern UI:** Rounded corners, smooth animations, and gradients
- **Color Coding:** 
  - Green (1-3): Mild pain
  - Yellow (4-6): Moderate pain
  - Red (7-10): Severe pain
- **Backdrop Blur:** Elegant overlay with backdrop blur effect
- **Smooth Transitions:** Fade and scale animations for dialog

### ✨ **User Experience**
- **Click Region:** Opens scoring dialog automatically
- **Click Tag:** Re-open dialog to edit score
- **Delete Score:** Button to remove score from a region
- **Score Badges:** Visual indicators on selected region tags
- **Cancel/Save:** Clear action buttons

## How It Works

### **Selecting a Region**
1. **Click Body Part:** Click on any body region
2. **Dialog Appears:** Pain scoring dialog opens automatically
3. **Set Score:** Use slider or manual input to set pain score
4. **Save:** Click "Save Score" to confirm

### **Editing a Score**
1. **Click Tag:** Click on a selected region tag in the sidebar
2. **Dialog Opens:** Shows current score
3. **Adjust Score:** Modify using slider or input
4. **Save/Delete:** Save changes or delete the score

### **Removing a Region**
1. **Click × on Tag:** Removes region from selection
2. **Double Click Tag:** Alternative way to remove
3. **Delete Score Button:** Available in the dialog

## Visual Elements

### **Dialog Components**

**Header:**
- Blue gradient background
- "Rate Pain Intensity" title
- Close button (×)

**Body:**
- Region name display
- Color-coded slider (1-10)
- Large score display with description
- Manual number input field

**Footer:**
- Delete Score button (red, only shows if score exists)
- Cancel button
- Save Score button (blue)

### **Color Coding System**

**Low Pain (1-3):** 
- Green gradient `#10b981 → #059669`
- Description: "Mild Pain"

**Medium Pain (4-6):**
- Yellow/Orange gradient `#f59e0b → #d97706`
- Description: "Moderate Pain" to "Noticeable Pain"

**High Pain (7-10):**
- Red gradient `#ef4444 → #dc2626`
- Description: "Severe Pain" to "Very Severe Pain"

## Score Descriptions

| Score | Description |
|-------|-------------|
| 1-2 | Mild Pain |
| 3-4 | Moderate Pain |
| 5-6 | Noticeable Pain |
| 7-8 | Severe Pain |
| 9-10 | Very Severe Pain |

## Technical Implementation

### **Data Structure**
```javascript
data() {
  return {
    showScoreDialog: false,
    currentScoringRegion: null,
    tempScore: 5,
    regionScores: {} // { regionId: score }
  }
}
```

### **Key Methods**

**openScoreDialog(regionId):**
- Opens dialog for a specific region
- Loads existing score or defaults to 5

**saveScore():**
- Validates score (1-10)
- Saves to regionScores object
- Closes dialog

**deleteScore():**
- Removes score from regionScores
- Closes dialog

**validateScore():**
- Ensures score is between 1-10
- Handles invalid inputs

**getScoreClass(score):**
- Returns CSS class based on score
- Used for color-coding tags and display

### **Event Handling**
```javascript
toggleRegion(regionId) {
  // When region is newly selected
  if (index === -1) {
    this.openScoreDialog(regionId)
  }
}
```

## Styling Features

### **Dialog Animations**
- Fade in/out transition
- Scale animation for card
- Smooth backdrop blur

### **Interactive Elements**
- Hover effects on buttons
- Slider thumb scaling on hover
- Smooth color transitions

### **Responsive Design**
- Max width: 480px
- Mobile-friendly sizing
- Touch-friendly controls

## User Interactions

### **Primary Actions**
1. **Select Region:** Opens dialog
2. **Adjust Slider:** Change score
3. **Type Number:** Manual entry
4. **Save Score:** Confirm changes
5. **Delete Score:** Remove score

### **Secondary Actions**
1. **Click Tag:** Edit existing score
2. **Close Dialog:** Cancel without saving
3. **Click Overlay:** Close dialog
4. **Remove Region:** Delete from selection

## Visual Feedback

### **Score Badges**
- Displayed on region tags
- Color-coded by severity
- Shows numeric score

### **Tag Colors**
- **No Score:** Blue gradient (default)
- **Low Score (1-3):** Green gradient
- **Medium Score (4-6):** Yellow gradient
- **High Score (7-10):** Red gradient

### **Large Score Display**
- 3.5rem font size
- Color-coded border
- Severity description below

## Keyboard Accessibility

- **Number Input:** Direct keyboard entry
- **Tab Navigation:** Navigate between controls
- **Enter/ESC:** (Can be added for save/cancel)

## Validation Rules

1. **Range:** Score must be between 1-10
2. **Type:** Must be a number
3. **Default:** Defaults to 5 if invalid
4. **Auto-correct:** Adjusts out-of-range values on blur

## Benefits

1. **Intuitive:** Natural interaction flow
2. **Visual:** Clear color-coding and large displays
3. **Flexible:** Multiple input methods (slider, manual)
4. **Editable:** Easy to modify or delete scores
5. **Beautiful:** Modern, aesthetic design
6. **Responsive:** Works on all screen sizes

## Status: Complete ✅

The pain scoring feature is fully functional with:
- ✅ Auto-opening dialog on region selection
- ✅ Color-coded slider (green-yellow-red)
- ✅ Large score display with descriptions
- ✅ Manual number input with validation
- ✅ Edit existing scores
- ✅ Delete scores
- ✅ Score badges on tags
- ✅ Beautiful animations and transitions
- ✅ No linting errors

## Access Points

- **Demo Page:** http://localhost:8000/demo
- **Current Map:** http://localhost:8000/
- **History:** http://localhost:8000/history

Users can now select body regions and rate their pain intensity with a beautiful, intuitive scoring system! 🎉
