# PainLocationScoring API Integration

## Overview

The pain scoring feature is now fully integrated with the PainLocationScoring API concept from the backend. The system maintains the beautiful, aesthetic design while providing real-time synchronization with the backend.

## API Endpoints Integration

### 1. **addRegion** - POST /api/PainLocationScoring/addRegion

**When Called:** Automatically when a user clicks on a body region to select it.

**Purpose:** Creates a new BodyRegion in the backend and associates it with the current map.

**Request:**
```json
{
  "user": "string",
  "map": "string",
  "regionName": "string"
}
```

**Response:**
```json
{
  "region": "string" // The new region ID
}
```

**Implementation:**
- Stores the returned region ID locally for future API calls
- Opens the pain scoring dialog after successful creation

---

### 2. **scoreRegion** - POST /api/PainLocationScoring/scoreRegion

**When Called:** When a user saves a pain score (1-10) in the dialog.

**Purpose:** Associates a pain intensity score with the selected body region.

**Request:**
```json
{
  "user": "string",
  "region": "string",
  "score": number // 1-10
}
```

**Response:**
```json
{}
```

**Implementation:**
- Validates score is between 1-10
- Shows loading indicator during API call
- Updates local state on success
- Displays error message on failure

---

### 3. **deleteRegion** - POST /api/PainLocationScoring/deleteRegion

**When Called:** 
- When user deselects a region by clicking the × on a tag
- When user clicks "Clear All"
- When user removes a region from the body map

**Purpose:** Removes the region from the map in the backend.

**Request:**
```json
{
  "user": "string",
  "region": "string"
}
```

**Response:**
```json
{}
```

**Implementation:**
- Removes region from local state
- Cleans up stored region ID
- Removes associated score

---

### 4. **getRegionsForMap** - POST /api/PainLocationScoring/_getRegionsForMap

**When Called:**
- On component mount (if mapId is provided)
- When mapId prop changes

**Purpose:** Loads all regions and their scores for the current map.

**Request:**
```json
{
  "user": "string",
  "map": "string"
}
```

**Response:**
```json
[
  {
    "_id": "string",
    "mapId": "string",
    "name": "string",
    "score": number | undefined
  }
]
```

**Implementation:**
- Populates selectedRegions array
- Loads region IDs for future API calls
- Restores pain scores from backend

---

## Component Architecture

### **BodyMapCanvas.vue**

**Props:**
- `userId` (required): User ID for API calls
- `mapId` (optional): Map ID for API calls (if null, API calls are skipped)
- `initialSelections` (optional): Initial regions to display

**Data:**
```javascript
{
  regionScores: {},      // { regionName: score }
  regionIds: {},         // { regionName: regionId }
  isLoading: false,      // Loading state for API calls
  errorMessage: null     // Error message display
}
```

**Key Methods:**

**addRegionToAPI(regionName)**
- Calls POST /api/PainLocationScoring/addRegion
- Stores region ID for future operations
- Handles errors gracefully

**removeRegionFromAPI(regionName)**
- Calls POST /api/PainLocationScoring/deleteRegion
- Cleans up local state
- Handles errors gracefully

**saveScore()**
- Calls POST /api/PainLocationScoring/scoreRegion
- Updates local score storage
- Shows loading indicator
- Handles errors with user-friendly messages

**loadRegionsFromAPI()**
- Calls POST /api/PainLocationScoring/_getRegionsForMap
- Loads all regions for the map
- Restores scores and selections
- Called on mount and when mapId changes

---

## User Flow with API Integration

### **Selecting a Region**

1. User clicks on body part (e.g., "left-upper-arm")
2. **API Call:** `addRegion(userId, mapId, "left-upper-arm")`
3. Backend creates BodyRegion and returns ID
4. Component stores region ID locally
5. Pain scoring dialog opens automatically
6. User sets score (e.g., 7)
7. **API Call:** `scoreRegion(userId, regionId, 7)`
8. Backend saves the score
9. Tag shows score badge with color coding

### **Editing a Score**

1. User clicks on a region tag
2. Dialog opens with current score
3. User adjusts score (e.g., 7 → 4)
4. User clicks "Save Score"
5. **API Call:** `scoreRegion(userId, regionId, 4)`
6. Backend updates the score
7. Tag color changes based on new score

### **Removing a Region**

1. User clicks × on region tag
2. **API Call:** `deleteRegion(userId, regionId)`
3. Backend removes the region
4. Tag disappears from sidebar
5. Region deselects on body map

### **Loading Existing Map**

1. User navigates to Current Map page
2. **API Call:** `getCurrentMap(userId)`
3. Component receives mapId
4. **API Call:** `getRegionsForMap(userId, mapId)`
5. All regions and scores load
6. Body map displays selected regions
7. Tags show scores with color coding

---

## Error Handling

### **Network Errors**

- Shows error banner in dialog
- Keeps dialog open for user to retry
- Logs error to console for debugging

### **Validation Errors**

- Client-side validation prevents invalid scores (< 1 or > 10)
- Number input clamped on blur
- Slider restricted to 1-10 range

### **API Errors**

- Error messages displayed in dialog
- Operations don't modify local state on failure
- User can retry or cancel

---

## Offline/Demo Mode

When `mapId` is `null` or not provided:
- API calls are skipped with console warnings
- Local state still works for demo purposes
- Pain scores stored locally only
- Perfect for the demo page

---

## Data Synchronization

### **Map Generation**

When a new map is generated:
1. **API Call:** `generateMap(userId)`
2. Returns new `mapId`
3. Component loads with new mapId
4. Previous regions automatically saved (per API spec)

### **Map Saving**

When user saves current map:
1. **API Call:** `saveMap(userId)`
2. Map marked as saved in backend
3. All regions and scores preserved

### **Map Clearing**

When user clears map:
1. For each region: **API Call:** `deleteRegion(userId, regionId)`
2. **API Call:** `clearMap(userId)`
3. Map deleted from backend
4. Local state cleared

---

## API Service (`src/services/api.js`)

### **Configuration**

```javascript
const API_BASE_URL = 'http://localhost:3000'
```

### **PainLocationScoring Methods**

```javascript
addRegion(userId, mapId, regionName)
scoreRegion(userId, regionId, score)
deleteRegion(userId, regionId)
getRegion(userId, regionId)
getRegionsForMap(userId, mapId)
```

### **BodyMapGeneration Methods**

```javascript
generateMap(userId)
saveMap(userId)
clearMap(userId)
getCurrentMap(userId)
getSavedMaps(userId)
```

---

## State Management

### **Local State (Frontend)**

- `regionScores`: Maps region names to pain scores
- `regionIds`: Maps region names to backend IDs
- `selectedRegions`: Array of selected region names

### **Backend State**

- `BodyRegion`: Stored in database with mapId reference
- `score`: Associated with each BodyRegion
- Persistent across sessions

### **Synchronization**

- Load on mount: Fetch from backend
- Save on change: Push to backend
- Optimistic updates: Local state updates immediately
- Error rollback: Revert on API failure

---

## Visual Feedback During API Operations

### **Loading Indicator**

- Blue gradient banner with spinner
- "Saving..." text
- Appears during API calls
- Disables inputs to prevent conflicts

### **Error Banner**

- Red gradient with warning icon
- User-friendly error message
- Appears above score inputs
- Doesn't close dialog automatically

### **Button States**

- Save button shows "Saving..." when loading
- All buttons disabled during API calls
- Prevents duplicate requests

---

## Performance Considerations

### **Debouncing**

- No debouncing needed (single save action)
- User explicitly clicks "Save Score"

### **Caching**

- Region IDs cached locally
- Prevents redundant API calls
- Cleared on region deletion

### **Batch Operations**

- Clear All deletes regions sequentially
- Could be optimized with batch endpoint

---

## Testing

### **Demo Mode (No Backend)**

```vue
<BodyMapCanvas
  user-id="demo-user"
  :map-id="null"
/>
```

- All API calls skipped
- Local state works perfectly
- No errors or warnings

### **With Backend**

```vue
<BodyMapCanvas
  user-id="user123"
  :map-id="currentMap._id"
/>
```

- Full API integration
- Real-time synchronization
- Persistent storage

---

## Aesthetic Design Maintained

✅ **Beautiful Dialog**
- Blue gradient header
- Color-coded slider (green → yellow → red)
- Large score display with descriptions
- Smooth animations

✅ **Score Badges**
- Color-coded tags (green/yellow/red)
- Numeric score display
- Hover effects

✅ **Loading States**
- Elegant spinner animation
- Blue gradient loading banner
- Disabled state styling

✅ **Error Handling**
- Red gradient error banner
- User-friendly messages
- Non-intrusive display

---

## Summary

The PainLocationScoring API integration:

✅ Maintains beautiful, aesthetic design
✅ Provides real-time backend synchronization
✅ Handles errors gracefully
✅ Shows loading indicators
✅ Validates user input
✅ Supports demo mode (no backend)
✅ Loads existing data on mount
✅ Cleans up on region removal
✅ Follows API spec exactly
✅ User-friendly error messages

The system seamlessly integrates with the backend while providing an exceptional user experience!
