# PainPal Frontend

A Vue.js 3 application for tracking body maps over time. This application provides a visual interface to manage daily body map tracking without body measurements.

## Features

- 🗺️ **Current Map View**: View and manage your current body map
- 📚 **History View**: Browse all your saved body maps
- 🎯 **Interactive Body Map**: 360-degree rotatable body with clickable regions
  - Rotate body view from front, back, and both sides
  - Click to select/deselect specific body regions
  - Real-time visual feedback for selections
  - Export selections as JSON data
- 🎨 **Modern UI**: Beautiful, responsive design with gradient themes
- 🚀 **Fast Development**: Built with Vite for lightning-fast HMR

## Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn

## Project Setup

### Install Dependencies

```bash
npm install
```

### Development Server

Run the development server on http://localhost:8000

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
painpal_frontend/
├── src/
│   ├── assets/          # Static assets and global styles
│   │   └── main.css     # Global CSS styles
│   ├── components/      # Reusable Vue components
│   │   ├── BodyMapCanvas.vue    # Main body map component
│   │   ├── BodyViewFront.vue    # Front view of body
│   │   ├── BodyViewBack.vue     # Back view of body
│   │   └── BodyViewSide.vue     # Side view of body
│   ├── router/          # Vue Router configuration
│   │   └── index.js     # Route definitions
│   ├── services/        # API service layer
│   │   └── api.js       # API client and methods
│   ├── views/           # Page components
│   │   ├── CurrentMap.vue       # Current map view
│   │   ├── History.vue          # Saved maps history
│   │   └── BodyMapDemo.vue      # Interactive demo page
│   ├── App.vue          # Root component
│   └── main.js          # Application entry point
├── index.html                   # HTML entry point
├── vite.config.js               # Vite configuration
├── package.json                 # Project dependencies
├── BODYMAP_COMPONENT.md         # Body map component documentation
└── README.md                    # This file
```

## API Configuration

The application is configured to connect to a backend API. Update the API base URL in `src/services/api.js`:

```javascript
const API_BASE_URL = 'http://localhost:3000'  // Change this to your backend URL
```

## API Endpoints

The application integrates with the following endpoints:

- `POST /api/BodyMapGeneration/generateMap` - Generate a new body map
- `POST /api/BodyMapGeneration/saveMap` - Save the current map
- `POST /api/BodyMapGeneration/clearMap` - Clear the current map
- `POST /api/BodyMapGeneration/_getCurrentMap` - Get current map
- `POST /api/BodyMapGeneration/_getSavedMaps` - Get all saved maps
- `POST /api/BodyMapGeneration/triggerDailyMapGeneration` - Trigger daily generation

For detailed API specifications, see `api_spec.md`.

## Body Map Component

The interactive body map component allows users to visualize and select body regions. Key features include:

- **360° Rotation**: Smoothly rotate between front, back, and side views
- **Region Selection**: Click any body part to select/deselect it
- **Visual Feedback**: Selected regions are highlighted in purple
- **Multiple Views**: Automatically switches between 4 different viewing angles
- **Export Capability**: Download selected regions as JSON

For complete documentation on using and customizing the body map component, see `BODYMAP_COMPONENT.md`.

## User Authentication

Currently, the app uses a placeholder user ID (`user123`). To integrate with real authentication:

1. Implement authentication service in `src/services/auth.js`
2. Update `userId` in `CurrentMap.vue` and `History.vue` to use authenticated user ID
3. Add authentication guards to router if needed

## Customization

### Colors and Styling

- Global styles are in `src/assets/main.css`
- Component-specific styles are in each `.vue` file's `<style scoped>` section
- Main gradient theme uses: `#667eea` to `#764ba2`

### Port Configuration

The app is configured to run on port 8000. To change this:

1. Update `vite.config.js`:
```javascript
server: {
  port: YOUR_PORT,
  strictPort: true
}
```

2. Update `package.json` scripts:
```json
"dev": "vite --port YOUR_PORT"
```

## Contributing

1. Make changes in a feature branch
2. Test your changes with `npm run dev`
3. Build to verify production build works: `npm run build`
4. Submit a pull request

## License

Private - All rights reserved

