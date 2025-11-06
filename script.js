class ImageViewer {
    constructor() {
        this.container = document.getElementById('viewerContainer');
        this.navHint = document.getElementById('navHint');
        this.cellIndicator = document.getElementById('cellIndicator');
        this.zoomControls = document.getElementById('zoomControls');
        this.zoomInBtn = document.getElementById('zoomIn');
        this.zoomOutBtn = document.getElementById('zoomOut');
        this.zoomResetBtn = document.getElementById('zoomReset');
        this.magnifier = document.getElementById('magnifier');
        this.magnifierContent = document.getElementById('magnifierContent');
        this.loadingIndicator = document.getElementById('loadingIndicator');

        this.images = [];
        this.imageSections = [];
        this.endframeConfigs = [];
        this.currentOffset = 0;
        this.maxOffset = 0;
        this.containerInner = null;
        this.scrollSpeed = 100; // pixels to scroll per action

        // Touch/swipe handling
        this.touchStartX = 0;
        this.touchCurrentX = 0;
        this.isTouching = false;
        this.isTouchZooming = false;
        this.initialTouchDistance = 0;
        this.touchStartOffset = 0;

        // Mouse drag handling
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartOffset = 0;

        // Zoom handling
        this.zoomLevel = 1;
        this.minZoom = 1;
        this.maxZoom = 3;
        this.zoomStep = 0.25;

        // Smooth animation
        this.animationFrame = null;
        this.pendingUpdate = false;

        // Magnifier
        this.isMagnifying = false;
        this.magnifierSize = 200;
        this.magnificationLevel = 2.5;

        this.init();
    }

    async init() {
        console.log('🎨 Smooth scrolling viewer v2.0 initialized');

        // Load end-frame configurations
        await this.loadEndframeConfigs();

        // Discover available images (images/1.png, images/2.png, etc.)
        await this.discoverImages();

        if (this.images.length === 0) {
            console.error('No images found!');
            return;
        }

        // Build the DOM structure
        this.buildViewer();

        // Wait for all images to load
        await this.waitForImages();

        // Calculate dimensions and setup
        this.calculateDimensions();
        this.setupEventListeners();
        this.updateIndicator();
        this.hideHintAfterDelay();

        // Hide loading indicator
        this.hideLoadingIndicator();
    }

    async loadEndframeConfigs() {
        try {
            const response = await fetch('endframes.json');
            if (!response.ok) {
                throw new Error('Failed to load endframes.json');
            }
            this.endframeConfigs = await response.json();
            console.log('Loaded end-frame configurations:', this.endframeConfigs);
        } catch (error) {
            console.warn('Could not load endframes.json, using default end-frames:', error);
            // Default configuration if file not found
            this.endframeConfigs = [{
                after_images: null, // null means after every image
                title: "Artist Name",
                bio: "",
                support_section_title: "Support the Artist",
                links: [
                    { icon: "🎨", text: "Portfolio", url: "#" },
                    { icon: "☕", text: "Buy Me a Coffee", url: "#" },
                    { icon: "🛒", text: "Shop Prints", url: "#" },
                    { icon: "📷", text: "Instagram", url: "#" }
                ],
                restart_hint: "Press left arrow or swipe right to continue",
                style: {
                    background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
                    title_gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    text_color: "#cccccc"
                }
            }];
        }
    }

    async discoverImages() {
        let imageNumber = 1;
        const discoveredImages = [];
        const extensions = ['png', 'jpg', 'jpeg'];

        // Try to load images images/1.png, images/1.jpg, etc. until none exist
        while (true) {
            let foundImage = null;

            // Check each extension for this image number
            for (const ext of extensions) {
                const imagePath = `images/${imageNumber}.${ext}`;
                const exists = await this.checkImageExists(imagePath);

                if (exists) {
                    foundImage = imagePath;
                    break;
                }
            }

            if (!foundImage) {
                break;
            }

            discoveredImages.push(foundImage);
            imageNumber++;
        }

        this.images = discoveredImages;
        console.log(`Discovered ${this.images.length} images:`, this.images);
    }

    checkImageExists(imagePath) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = imagePath;
        });
    }

    buildViewer() {
        // Create the inner container that will slide horizontally
        this.containerInner = document.createElement('div');
        this.containerInner.className = 'viewer-container-inner';
        this.container.appendChild(this.containerInner);

        // Build a map of which end-frames should appear after which images
        const endframeMap = this.buildEndframeMap();

        // For each image, create a section with the image
        this.images.forEach((imagePath, index) => {
            const imageNumber = index + 1; // 1-based indexing for user-facing numbers

            // Create image section wrapper
            const imageSection = document.createElement('div');
            imageSection.className = 'image-section';
            imageSection.dataset.imageIndex = index;

            // Create and add the image
            const img = document.createElement('img');
            img.src = imagePath;
            img.alt = `Panoramic Image ${imageNumber}`;
            img.className = 'panoramic-image';
            imageSection.appendChild(img);

            this.containerInner.appendChild(imageSection);
            this.imageSections.push(imageSection);

            // Check if any end-frames should appear after this image
            if (endframeMap.has(imageNumber)) {
                const configs = endframeMap.get(imageNumber);
                configs.forEach(config => {
                    const endFrame = this.createEndFrame(index, config);
                    this.containerInner.appendChild(endFrame);
                });
            }
        });
    }

    buildEndframeMap() {
        // Build a map of image number -> array of end-frame configs
        const map = new Map();

        this.endframeConfigs.forEach(config => {
            if (config.after_images === null || config.after_images === undefined) {
                // If after_images is null/undefined, add after every image
                for (let i = 1; i <= this.images.length; i++) {
                    if (!map.has(i)) map.set(i, []);
                    map.get(i).push(config);
                }
            } else if (Array.isArray(config.after_images) && config.after_images.length === 0) {
                // If after_images is an empty array, don't add any end-frames
                console.log('Skipping end-frame (empty after_images array)');
            } else {
                // Add after specified images only
                config.after_images.forEach(imageNum => {
                    if (imageNum > 0 && imageNum <= this.images.length) {
                        if (!map.has(imageNum)) map.set(imageNum, []);
                        map.get(imageNum).push(config);
                    }
                });
            }
        });

        console.log('End-frame map:', map);
        return map;
    }

    createEndFrame(imageIndex, config) {
        const endFrame = document.createElement('div');
        endFrame.className = 'end-frame';
        endFrame.dataset.imageIndex = imageIndex;

        // Apply custom background style if specified
        if (config.style && config.style.background) {
            endFrame.style.background = config.style.background;
        }

        // Build links HTML
        const linksHTML = config.links.map(link => `
            <a href="${link.url}" class="support-link" target="_blank" rel="noopener noreferrer">
                <span class="link-icon">${link.icon}</span>
                <span class="link-text">${link.text}</span>
            </a>
        `).join('');

        // Build bio section HTML (only if bio exists)
        const bioHTML = config.bio ? `<p class="artist-bio">${config.bio}</p>` : '';

        endFrame.innerHTML = `
            <div class="end-frame-content">
                <h1 class="artist-name" style="${config.style && config.style.title_gradient ? `background: ${config.style.title_gradient}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;` : ''}">${config.title}</h1>
                ${bioHTML}

                <div class="support-section">
                    <h2>${config.support_section_title}</h2>
                    <div class="support-links">
                        ${linksHTML}
                    </div>
                </div>

                <div class="restart-hint" style="${config.style && config.style.text_color ? `color: ${config.style.text_color};` : ''}">
                    ${config.restart_hint}
                </div>
            </div>
        `;

        return endFrame;
    }

    async waitForImages() {
        const imageElements = this.containerInner.querySelectorAll('.panoramic-image');
        const promises = Array.from(imageElements).map(img => {
            if (img.complete) {
                return Promise.resolve();
            }
            return new Promise((resolve) => {
                img.addEventListener('load', resolve);
                img.addEventListener('error', resolve); // Resolve even on error to not block
            });
        });

        await Promise.all(promises);
    }

    calculateDimensions() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Calculate total scrollable width
        let totalWidth = 0;

        const imageElements = this.containerInner.querySelectorAll('.panoramic-image');
        imageElements.forEach((img, index) => {
            const imageAspectRatio = img.naturalWidth / img.naturalHeight;
            const displayedImageWidth = viewportHeight * imageAspectRatio;

            // Store metadata
            const section = this.imageSections[index];
            section.dataset.width = displayedImageWidth;
            section.dataset.startOffset = totalWidth;
            section.style.width = `${displayedImageWidth}px`;

            totalWidth += displayedImageWidth;
            totalWidth += viewportWidth; // Add viewport width for the end-frame
        });

        // Max offset is total width minus viewport width
        this.maxOffset = totalWidth - viewportWidth;

        console.log(`Total scrollable width: ${totalWidth}px`);
        console.log(`Max offset: ${this.maxOffset}px`);

        // Clamp current offset to valid range
        this.currentOffset = Math.max(0, Math.min(this.currentOffset, this.maxOffset));
        this.updatePosition();
    }

    setupEventListeners() {
        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Mouse wheel navigation
        document.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

        // Touch/swipe navigation
        this.container.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        this.container.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.container.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });

        // Mouse drag navigation
        this.container.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.container.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.container.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.container.addEventListener('mouseleave', (e) => this.handleMouseUp(e));

        // Prevent default drag behavior on images
        const images = this.containerInner.querySelectorAll('.panoramic-image');
        images.forEach(img => {
            img.addEventListener('dragstart', (e) => e.preventDefault());
        });

        // Zoom controls
        this.zoomInBtn.addEventListener('click', () => this.zoom(this.zoomStep));
        this.zoomOutBtn.addEventListener('click', () => this.zoom(-this.zoomStep));
        this.zoomResetBtn.addEventListener('click', () => this.resetZoom());

        // Show zoom controls on mouse move
        this.container.addEventListener('mousemove', () => this.showZoomControls());

        // Magnifier (desktop only)
        this.container.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
        document.addEventListener('mouseup', (e) => this.handleMagnifierMouseUp(e));

        // Recalculate on window resize
        window.addEventListener('resize', () => {
            this.calculateDimensions();
            this.updateIndicator();
        });
    }

    handleKeyboard(e) {
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            this.scroll(this.scrollSpeed);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            this.scroll(-this.scrollSpeed);
        }
    }

    handleWheel(e) {
        // Allow Ctrl+scroll for zooming (don't prevent default or navigate)
        if (e.ctrlKey || e.metaKey) {
            return;
        }

        e.preventDefault();

        // Use deltaY for vertical scrolling, deltaX for horizontal
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        this.scroll(delta * 0.5); // Scale down the scroll speed
    }

    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchCurrentX = this.touchStartX;
        this.touchStartOffset = this.currentOffset;
        this.isTouching = true;
        this.isTouchZooming = false;

        // Detect if this is a multi-touch (pinch) gesture
        if (e.touches.length === 2) {
            this.isTouchZooming = true;
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            this.initialTouchDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
        }
    }

    handleTouchMove(e) {
        if (!this.isTouching) return;

        // Continue tracking if this is a pinch-to-zoom gesture
        if (e.touches.length === 2) {
            this.isTouchZooming = true;
            return;
        }

        if (this.isTouchZooming) return;

        e.preventDefault();

        this.touchCurrentX = e.touches[0].clientX;
        const deltaX = this.touchStartX - this.touchCurrentX;

        // Update offset based on drag distance
        this.currentOffset = Math.max(0, Math.min(this.touchStartOffset + deltaX, this.maxOffset));
        this.updatePosition();
        this.updateIndicator();
    }

    handleTouchEnd(e) {
        this.isTouching = false;
        this.isTouchZooming = false;
    }

    handleMouseDown(e) {
        // Don't start dragging if right-clicking for magnifier
        if (e.button === 2) return;

        // Hide magnifier if active
        if (this.isMagnifying) {
            this.hideMagnifier();
        }

        this.isDragging = true;
        this.dragStartX = e.clientX;
        this.dragStartOffset = this.currentOffset;
        this.container.style.cursor = 'grabbing';
    }

    handleMouseMove(e) {
        // Don't handle dragging if magnifying
        if (this.isMagnifying) return;

        if (!this.isDragging) {
            this.container.style.cursor = 'grab';
            return;
        }

        const deltaX = this.dragStartX - e.clientX;
        this.currentOffset = Math.max(0, Math.min(this.dragStartOffset + deltaX, this.maxOffset));
        this.updatePosition();
        this.updateIndicator();
    }

    handleMouseUp(e) {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.container.style.cursor = 'grab';
    }

    scroll(delta) {
        this.currentOffset = Math.max(0, Math.min(this.currentOffset + delta, this.maxOffset));
        this.updatePosition();
        this.updateIndicator();
    }

    updatePosition() {
        // Use requestAnimationFrame to ensure smooth updates across all browsers
        if (this.pendingUpdate) return;

        this.pendingUpdate = true;
        requestAnimationFrame(() => {
            // Use translate3d for hardware acceleration consistency across browsers
            this.containerInner.style.transform = `translate3d(-${this.currentOffset}px, 0, 0)`;
            this.pendingUpdate = false;
        });
    }

    updateIndicator() {
        const viewportWidth = window.innerWidth;
        const currentViewportCenter = this.currentOffset + (viewportWidth / 2);

        // Determine which image we're viewing
        let currentImageIndex = -1;
        let isOnEndFrame = false;

        let accumulatedWidth = 0;
        for (let i = 0; i < this.imageSections.length; i++) {
            const section = this.imageSections[i];
            const imageWidth = parseFloat(section.dataset.width);

            // Check if we're in this image
            if (currentViewportCenter >= accumulatedWidth && currentViewportCenter < accumulatedWidth + imageWidth) {
                currentImageIndex = i;
                break;
            }

            accumulatedWidth += imageWidth;

            // Check if we're in this image's end-frame
            if (currentViewportCenter >= accumulatedWidth && currentViewportCenter < accumulatedWidth + viewportWidth) {
                currentImageIndex = i;
                isOnEndFrame = true;
                break;
            }

            accumulatedWidth += viewportWidth;
        }

        if (isOnEndFrame) {
            this.cellIndicator.textContent = `About Image ${currentImageIndex + 1}`;
        } else if (currentImageIndex >= 0) {
            const section = this.imageSections[currentImageIndex];
            const imageStartOffset = parseFloat(section.dataset.startOffset);
            const imageWidth = parseFloat(section.dataset.width);
            const positionInImage = this.currentOffset - imageStartOffset;
            const percentage = Math.round((positionInImage / imageWidth) * 100);
            this.cellIndicator.textContent = `Image ${currentImageIndex + 1} - ${Math.max(0, Math.min(100, percentage))}%`;
        }

        console.log(`Offset: ${Math.round(this.currentOffset)}px / ${Math.round(this.maxOffset)}px`);
    }

    hideHintAfterDelay() {
        setTimeout(() => {
            this.navHint.classList.add('hidden');
        }, 3000);
    }

    hideLoadingIndicator() {
        // Add a small delay for smoother transition
        setTimeout(() => {
            this.loadingIndicator.classList.add('hidden');
        }, 300);
    }

    zoom(delta) {
        const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel + delta));

        if (newZoom !== this.zoomLevel) {
            this.zoomLevel = newZoom;
            this.applyZoom();
        }
    }

    resetZoom() {
        this.zoomLevel = this.minZoom;
        this.applyZoom();
    }

    applyZoom() {
        this.container.style.transform = `scale(${this.zoomLevel})`;
        this.container.style.transformOrigin = 'center center';

        // Update zoom reset button text
        this.zoomResetBtn.textContent = `${Math.round(this.zoomLevel * 100)}%`;

        // Disable buttons at limits
        this.zoomOutBtn.disabled = this.zoomLevel <= this.minZoom;
        this.zoomInBtn.disabled = this.zoomLevel >= this.maxZoom;
    }

    showZoomControls() {
        this.zoomControls.style.opacity = '1';

        // Hide after 2 seconds of no mouse movement
        clearTimeout(this.zoomControlsTimeout);
        this.zoomControlsTimeout = setTimeout(() => {
            this.zoomControls.style.opacity = '0';
        }, 2000);
    }

    handleContextMenu(e) {
        e.preventDefault();

        // Don't activate magnifier if already dragging or on mobile
        if (this.isDragging || window.innerWidth <= 768) return;

        this.isMagnifying = true;
        this.magnifier.classList.add('active');

        // Clone the viewer content for magnification
        this.setupMagnifierContent();

        // Update magnifier position
        this.updateMagnifier(e);

        // Add mousemove listener for tracking
        this.magnifierMouseMoveHandler = (e) => this.updateMagnifier(e);
        document.addEventListener('mousemove', this.magnifierMouseMoveHandler);
    }

    setupMagnifierContent() {
        // Clear previous content
        this.magnifierContent.innerHTML = '';

        // Clone the inner container
        const clone = this.containerInner.cloneNode(true);
        clone.style.position = 'absolute';
        clone.style.top = '0';
        clone.style.left = '0';

        this.magnifierContent.appendChild(clone);
    }

    updateMagnifier(e) {
        if (!this.isMagnifying) return;

        const halfSize = this.magnifierSize / 2;

        // Position the magnifier centered on the cursor
        this.magnifier.style.left = `${e.clientX - halfSize}px`;
        this.magnifier.style.top = `${e.clientY - halfSize}px`;

        // Calculate the source position (what we're magnifying)
        // Account for the current offset of the viewer
        const sourceX = e.clientX;
        const sourceY = e.clientY;

        // Apply transform to show magnified content
        // The content should be scaled up and positioned so the area under
        // the cursor appears in the center of the magnifier
        const scale = this.magnificationLevel;
        const translateX = -sourceX * scale + halfSize;
        const translateY = -sourceY * scale + halfSize;

        this.magnifierContent.style.transform = `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`;
    }

    handleMagnifierMouseUp(e) {
        if (!this.isMagnifying) return;

        // Only hide on right mouse button release
        if (e.button === 2 || e.button === 0) {
            this.hideMagnifier();
        }
    }

    hideMagnifier() {
        this.isMagnifying = false;
        this.magnifier.classList.remove('active');

        // Remove mousemove listener
        if (this.magnifierMouseMoveHandler) {
            document.removeEventListener('mousemove', this.magnifierMouseMoveHandler);
            this.magnifierMouseMoveHandler = null;
        }
    }
}

// Initialize the viewer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ImageViewer();
});
