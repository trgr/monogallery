# Panoramic Image Viewer

A simple, responsive web viewer for displaying multiple panoramic images with smooth continuous scrolling.

## Quick Start

1. Add your panoramic images to the `images/` folder as `1.png`, `2.jpg`, `3.png`, etc.
2. Open `index.html` in a web browser
3. Navigate using arrow keys, mouse wheel, drag, or swipe

**Note**: Supports `.png`, `.jpg`, and `.jpeg` formats. Images are auto-detected by number.

## Features

- **Automatic image detection** from `images/` folder
- **Smooth continuous scrolling** - pixel-perfect navigation
- **Individual end-frames** after each image
- **Responsive design** - works on desktop and mobile
- **Multiple input methods** - keyboard, mouse wheel, drag, touch
- **Progress indicator** - shows percentage through current image
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

Simply add sequentially numbered image files (`1.png`, `2.jpg`, `3.jpeg`, etc.) to the `images/` folder. The viewer will automatically discover and display them. Supports PNG, JPG, and JPEG formats.

## Customization

- **End-frame content**: Edit `endframes.json` to customize titles, links, colors, and positioning
- **When end-frames appear**: Set `after_images` in `endframes.json` (e.g., `[1, 3, 5]` shows after images 1, 3, and 5)
- **Styling**: Modify global styles in `style.css` or per-endframe styles in `endframes.json`

## Browser Support

Requires a modern browser with ES6 support (Chrome, Safari, Firefox, Edge).

---

For detailed documentation, see [CLAUDE.md](CLAUDE.md)
