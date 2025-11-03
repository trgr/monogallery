# Panoramic Image Viewer

A simple, responsive image viewer designed for displaying multiple long horizontal panoramic images with cell-based navigation.

## Overview

This viewer automatically discovers and displays multiple panoramic images from the `images/` folder. Each image is divided into viewport-width "cells" that users can navigate through, with each image followed by its own end-frame displaying artist information.

## Features

- **Multi-image support**: Automatically detects and displays `1.png`, `2.png`, `3.png`, etc. from the `images/` folder
- **Cell-based navigation**: Automatically divides each panoramic image into viewport-width cells
- **Individual end-frames**: Each image has its own dedicated end-frame with artist information
- **Multiple navigation methods**:
  - Arrow keys (left/right) on desktop
  - Mouse wheel scrolling
  - Mouse drag
  - Touch swipe gestures on mobile
- **Fully responsive**: Adapts to both mobile and desktop viewports
- **Smooth transitions**: Animated sliding between cells
- **Cell indicator**: Shows current position (e.g., "Image 1: 3 / 8" or "About Image 1")
- **Zoom functionality**: Zoom controls with +/- buttons and reset

## File Structure

```
saiku/
├── index.html          - Main HTML structure (dynamically populated)
├── style.css           - Responsive styling for viewer, navigation, and end-frames
├── script.js           - JavaScript class handling image discovery, cell calculations, and navigation
└── images/
    ├── 1.png          - First panoramic image
    ├── 2.png          - Second panoramic image
    ├── 3.png          - Third panoramic image
    └── ...            - Add more numbered images
```

## How It Works

1. **Image Discovery**: Automatically searches for `images/1.png`, `images/2.png`, etc. until a file is not found
2. **Dynamic DOM Generation**: Creates image sections and end-frames for each discovered image
3. **Cell Calculation**:
   - Calculates the displayed width of each image at full viewport height
   - Divides each image's width by viewport width to determine number of cells
   - Each cell is exactly one viewport-width wide
4. **Navigation Flow**:
   - Image 1 cells → Image 1 end-frame → Image 2 cells → Image 2 end-frame → etc.
   - Seamless horizontal scrolling through all images and their end-frames
5. **Responsive**: Recalculates cells on window resize

## Adding Images

Simply add numbered PNG files to the `images/` folder:

1. Save your panoramic images as `1.png`, `2.png`, `3.png`, etc.
2. Place them in the `images/` folder
3. The viewer will automatically detect and display them on page load

**Note**: Images must be sequentially numbered starting from 1. If `3.png` is missing but `4.png` exists, the viewer will only display images 1-2.

## Customization

### Customizing End-Frames

Edit the `createEndFrame()` method in `script.js` (lines 120-158) to customize the end-frame content:

```javascript
endFrame.innerHTML = `
    <div class="end-frame-content">
        <h1 class="artist-name">Your Name</h1>
        <div class="support-section">
            <h2>Support the Artist</h2>
            <div class="support-links">
                <a href="https://yoursite.com" class="support-link">
                    <span class="link-icon">🎨</span>
                    <span class="link-text">Portfolio</span>
                </a>
                ...
            </div>
        </div>
    </div>
`;
```

### Styling

- **End-frame colors**: Modify the gradient in `.end-frame` (style.css:142)
- **Artist name gradient**: Change colors in `.artist-name` (style.css:162)
- **Link hover effects**: Adjust `.support-link:hover` (style.css:202)

## Technical Details

### Image Discovery Logic

```javascript
// Sequentially checks for images/1.png, images/2.png, etc.
while (true) {
    const imagePath = `images/${imageNumber}.png`;
    const exists = await this.checkImageExists(imagePath);
    if (!exists) break;
    discoveredImages.push(imagePath);
    imageNumber++;
}
```

### Cell Calculation Logic

```javascript
// For each image:
const viewportHeight = window.innerHeight;
const imageAspectRatio = img.naturalWidth / img.naturalHeight;
const displayedImageWidth = viewportHeight * imageAspectRatio;
const cellsForThisImage = Math.ceil(displayedImageWidth / viewportWidth);
```

### Navigation Structure

- Uses a horizontal flexbox layout (`.viewer-container-inner`)
- Each image is in an `.image-section` wrapper
- End-frames are flex items positioned after each image section
- Single `translateX()` transform moves the entire container horizontally

### Touch Handling

- Minimum swipe distance: 50px
- Swipe left: Navigate forward
- Swipe right: Navigate backward
- Pinch-to-zoom detection (prevents swipe navigation during zoom)

## Browser Compatibility

- Modern browsers with ES6 support (async/await)
- CSS Grid and Flexbox support required
- Touch events for mobile devices
- Tested on Chrome, Safari, Firefox, and mobile browsers

## Performance Considerations

- Uses `will-change: transform` for optimized animations
- Debounced wheel events (300ms) to prevent over-scrolling
- Efficient resize handling with recalculation
- Async image discovery prevents blocking
- Parallel image loading with `Promise.all()`

## Future Enhancements

Potential additions:
- Configurable image folder path
- Support for different image formats (jpg, webp)
- Keyboard shortcuts (Home/End keys for first/last image)
- URL hash navigation for direct linking to specific images/cells
- Preloader/loading state with progress indicator
- Fullscreen mode
- Image-specific end-frame content (different artist info per image)
- Auto-play slideshow mode
- Lazy loading for better performance with many images
