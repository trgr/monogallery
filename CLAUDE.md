# Panoramic Image Viewer

A simple, responsive image viewer designed for displaying multiple long horizontal panoramic images with smooth continuous scrolling.

## Overview

This viewer automatically discovers and displays multiple panoramic images from the `images/` folder. Users can smoothly scroll through each image pixel-by-pixel, with each image followed by its own end-frame displaying artist information.

## Features

- **Multi-image support**: Automatically detects and displays `1.png`, `2.png`, `3.png`, etc. from the `images/` folder
- **Smooth continuous scrolling**: Pixel-perfect scrolling through panoramic images
- **Individual end-frames**: Each image has its own dedicated end-frame with artist information
- **Multiple navigation methods**:
  - Arrow keys (left/right) on desktop - scrolls 100px per press
  - Mouse wheel scrolling - smooth pixel-by-pixel movement
  - Mouse drag - direct 1:1 dragging
  - Touch swipe gestures on mobile - natural scrolling with finger
- **Fully responsive**: Images scale to viewport height while maintaining aspect ratio
- **Progress indicator**: Shows current position (e.g., "Image 1 - 45%" or "About Image 1")
- **Zoom functionality**: Zoom controls with +/- buttons and reset

## File Structure

```
saiku/
├── index.html          - Main HTML structure (dynamically populated)
├── style.css           - Responsive styling for viewer, navigation, and end-frames
├── script.js           - JavaScript class handling image discovery, scrolling, and navigation
├── endframes.json      - Configuration file for end-frame content, styling, and positioning
└── images/
    ├── 1.png          - First panoramic image
    ├── 2.png          - Second panoramic image
    ├── 3.png          - Third panoramic image
    └── ...            - Add more numbered images
```

## How It Works

1. **Image Discovery**: Automatically searches for `images/1.png`, `images/2.png`, etc. until a file is not found
2. **Dynamic DOM Generation**: Creates image sections and end-frames for each discovered image
3. **Dimension Calculation**:
   - Calculates the displayed width of each image at full viewport height
   - Maintains aspect ratio while scaling images to fit viewport height
   - Calculates total scrollable width across all images and end-frames
4. **Smooth Scrolling**:
   - Tracks current horizontal offset in pixels
   - Updates transform position directly without transitions
   - Provides immediate visual feedback to user input
5. **Navigation Flow**:
   - Image 1 → Image 1 end-frame → Image 2 → Image 2 end-frame → etc.
   - Continuous smooth scrolling through all images and their end-frames
6. **Responsive**: Recalculates dimensions on window resize while maintaining scroll position

## Adding Images

Simply add numbered image files to the `images/` folder:

1. Save your panoramic images as `1.png`, `2.jpg`, `3.jpeg`, etc.
2. Place them in the `images/` folder
3. The viewer will automatically detect and display them on page load

**Supported Formats**: `.png`, `.jpg`, `.jpeg`

**Note**: Images must be sequentially numbered starting from 1. If image 3 is missing (no `3.png`, `3.jpg`, or `3.jpeg`), but image 4 exists, the viewer will only display images 1-2.

## Customization

### Customizing End-Frames

Edit `endframes.json` to customize end-frame content, styling, and positioning:

```json
[
  {
    "after_images": [1, 3, 5],
    "title": "Artist Name",
    "bio": "Optional artist bio text",
    "support_section_title": "Support the Artist",
    "links": [
      {
        "icon": "🎨",
        "text": "Portfolio",
        "url": "https://yourportfolio.com"
      }
    ],
    "restart_hint": "Press left arrow or swipe right to continue",
    "style": {
      "background": "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
      "title_gradient": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      "text_color": "#cccccc"
    }
  }
]
```

**Configuration Options:**
- `after_images`: Array of image numbers after which this end-frame appears (e.g., `[1, 3]` = after images 1 and 3)
  - Set to `null` to show after every image
  - Set to `[]` (empty array) to not show any end-frames
- `title`: Main heading text
- `bio`: Optional biography paragraph (leave empty to hide)
- `support_section_title`: Heading above links
- `links`: Array of link objects with `icon`, `text`, and `url`
- `restart_hint`: Text shown at bottom
- `style`: Custom colors and gradients
  - `background`: CSS background property
  - `title_gradient`: CSS gradient for title
  - `text_color`: Color for hint text

### Multiple End-Frame Configurations

You can define multiple end-frame configurations in the array, each appearing after different images:

```json
[
  {
    "after_images": [1, 2],
    "title": "Series 1",
    ...
  },
  {
    "after_images": [3, 4],
    "title": "Series 2",
    ...
  }
]
```

### Global Styling

- **End-frame layout**: Modify `.end-frame` in `style.css`
- **Link hover effects**: Adjust `.support-link:hover` in `style.css`
- **Responsive breakpoints**: Edit media queries in `style.css`

## Technical Details

### Image Discovery Logic

```javascript
// Sequentially checks for images/1.png, images/1.jpg, images/1.jpeg, etc.
const extensions = ['png', 'jpg', 'jpeg'];
while (true) {
    let foundImage = null;
    for (const ext of extensions) {
        const imagePath = `images/${imageNumber}.${ext}`;
        const exists = await this.checkImageExists(imagePath);
        if (exists) {
            foundImage = imagePath;
            break;
        }
    }
    if (!foundImage) break;
    discoveredImages.push(foundImage);
    imageNumber++;
}
```

### Dimension Calculation Logic

```javascript
// For each image:
const viewportHeight = window.innerHeight;
const imageAspectRatio = img.naturalWidth / img.naturalHeight;
const displayedImageWidth = viewportHeight * imageAspectRatio;

// Calculate total scrollable width
totalWidth += displayedImageWidth; // Image width
totalWidth += viewportWidth;        // End-frame width
maxOffset = totalWidth - viewportWidth; // Max scroll position
```

### Navigation Structure

- Uses a horizontal flexbox layout (`.viewer-container-inner`)
- Each image is in an `.image-section` wrapper
- End-frames are flex items positioned after each image section
- Single `translateX()` transform moves the entire container horizontally
- No CSS transitions - immediate position updates for smooth scrolling feel

### Scrolling Behavior

- **Arrow keys**: Scroll 100px per press (configurable via `scrollSpeed`)
- **Mouse wheel**: Delta-based scrolling scaled by 0.5x for smoothness
- **Mouse drag**: 1:1 pixel mapping - drag distance equals scroll distance
- **Touch drag**: 1:1 pixel mapping with real-time position updates
- **Pinch-to-zoom detection**: Prevents scrolling during two-finger zoom gestures

### Progress Tracking

- Tracks horizontal offset in pixels (`currentOffset`)
- Calculates which image is in viewport center
- Shows percentage progress through current image (0-100%)
- Updates indicator in real-time during scrolling

## Browser Compatibility

- Modern browsers with ES6 support (async/await)
- CSS Grid and Flexbox support required
- Touch events for mobile devices
- Tested on Chrome, Safari, Firefox, and mobile browsers

## Performance Considerations

- Uses `will-change: transform` for optimized rendering
- No CSS transitions - direct transform updates for instant feedback
- Efficient resize handling with dimension recalculation
- Async image discovery prevents blocking
- Parallel image loading with `Promise.all()`
- Real-time position updates without debouncing for maximum responsiveness

## Future Enhancements

Potential additions:
- Configurable image folder path
- Support for WebP and other formats
- Keyboard shortcuts (Home/End keys for first/last image)
- URL hash navigation for direct linking to specific images
- Preloader/loading state with progress indicator
- Fullscreen mode
- Auto-play slideshow mode
- Lazy loading for better performance with many images
- Image preloading for smoother transitions
