# Panoramic Image Viewer

A simple, responsive web viewer for displaying multiple panoramic images with smooth cell-based navigation.

## Quick Start

1. Add your panoramic images to the `images/` folder as `1.png`, `2.png`, `3.png`, etc.
2. Open `index.html` in a web browser
3. Navigate using arrow keys, mouse wheel, drag, or swipe

## Features

- **Automatic image detection** from `images/` folder
- **Cell-based navigation** - each image divided into viewport-width sections
- **Individual end-frames** after each image
- **Responsive design** - works on desktop and mobile
- **Multiple input methods** - keyboard, mouse, touch
- **Zoom functionality** - zoom in/out with controls

## File Structure

```
saiku/
├── index.html
├── style.css
├── script.js
└── images/
    ├── 1.png
    ├── 2.png
    └── ...
```

## Usage

Simply add sequentially numbered PNG files (`1.png`, `2.png`, etc.) to the `images/` folder. The viewer will automatically discover and display them.

## Customization

- **End-frame content**: Edit `createEndFrame()` in `script.js`
- **Styling**: Modify colors and gradients in `style.css`
- **Artist links**: Update the support links in the end-frame template

## Browser Support

Requires a modern browser with ES6 support (Chrome, Safari, Firefox, Edge).

---

For detailed documentation, see [CLAUDE.md](CLAUDE.md)
