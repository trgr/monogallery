class ImageViewer {
    constructor() {
        this.container = document.getElementById('viewerContainer');
        this.navHint = document.getElementById('navHint');
        this.cellIndicator = document.getElementById('cellIndicator');
        this.zoomControls = document.getElementById('zoomControls');
        this.zoomInBtn = document.getElementById('zoomIn');
        this.zoomOutBtn = document.getElementById('zoomOut');
        this.zoomResetBtn = document.getElementById('zoomReset');

        this.images = [];
        this.imageSections = [];
        this.currentIndex = 0;
        this.totalCells = 0;
        this.cellWidth = 0;
        this.containerInner = null;

        // Touch/swipe handling
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.minSwipeDistance = 50;
        this.isTouchZooming = false;
        this.initialTouchDistance = 0;

        // Mouse drag handling
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragEndX = 0;

        // Zoom handling
        this.zoomLevel = 1;
        this.minZoom = 1;
        this.maxZoom = 3;
        this.zoomStep = 0.25;

        this.init();
    }

    async init() {
        // Discover available images (1.png, 2.png, etc.)
        await this.discoverImages();

        if (this.images.length === 0) {
            console.error('No images found!');
            return;
        }

        // Build the DOM structure
        this.buildViewer();

        // Wait for all images to load
        await this.waitForImages();

        // Calculate cells and setup
        this.calculateCells();
        this.setupEventListeners();
        this.updateCellIndicator();
        this.hideHintAfterDelay();
    }

    async discoverImages() {
        let imageNumber = 1;
        const discoveredImages = [];

        // Try to load images images/1.png, images/2.png, etc. until one fails
        while (true) {
            const imagePath = `images/${imageNumber}.png`;
            const exists = await this.checkImageExists(imagePath);

            if (!exists) {
                break;
            }

            discoveredImages.push(imagePath);
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

        // For each image, create a section with the image and its cells + end-frame
        this.images.forEach((imagePath, index) => {
            // Create image section wrapper
            const imageSection = document.createElement('div');
            imageSection.className = 'image-section';
            imageSection.dataset.imageIndex = index;

            // Create and add the image
            const img = document.createElement('img');
            img.src = imagePath;
            img.alt = `Panoramic Image ${index + 1}`;
            img.className = 'panoramic-image';
            imageSection.appendChild(img);

            this.containerInner.appendChild(imageSection);
            this.imageSections.push(imageSection);

            // Create end-frame for this image
            const endFrame = this.createEndFrame(index);
            this.containerInner.appendChild(endFrame);
        });
    }

    createEndFrame(imageIndex) {
        const endFrame = document.createElement('div');
        endFrame.className = 'end-frame';
        endFrame.dataset.imageIndex = imageIndex;

        endFrame.innerHTML = `
            <div class="end-frame-content">
                <h1 class="artist-name">Artist Name</h1>

                <div class="support-section">
                    <h2>Support the Artist</h2>
                    <div class="support-links">
                        <a href="#" class="support-link" target="_blank" rel="noopener noreferrer">
                            <span class="link-icon">🎨</span>
                            <span class="link-text">Portfolio</span>
                        </a>
                        <a href="#" class="support-link" target="_blank" rel="noopener noreferrer">
                            <span class="link-icon">☕</span>
                            <span class="link-text">Buy Me a Coffee</span>
                        </a>
                        <a href="#" class="support-link" target="_blank" rel="noopener noreferrer">
                            <span class="link-icon">🛒</span>
                            <span class="link-text">Shop Prints</span>
                        </a>
                        <a href="#" class="support-link" target="_blank" rel="noopener noreferrer">
                            <span class="link-icon">📷</span>
                            <span class="link-text">Instagram</span>
                        </a>
                    </div>
                </div>

                <div class="restart-hint">
                    Press left arrow or swipe right to continue
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

    calculateCells() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        this.cellWidth = viewportWidth;

        // Calculate cells for each image
        let totalCells = 0;
        const imageElements = this.containerInner.querySelectorAll('.panoramic-image');

        imageElements.forEach((img, index) => {
            const imageAspectRatio = img.naturalWidth / img.naturalHeight;
            const displayedImageWidth = viewportHeight * imageAspectRatio;
            const cellsForThisImage = Math.ceil(displayedImageWidth / viewportWidth);

            // Store metadata
            const section = this.imageSections[index];
            section.dataset.cells = cellsForThisImage;
            section.dataset.startCell = totalCells;
            section.style.width = `${displayedImageWidth}px`;

            totalCells += cellsForThisImage;
            totalCells += 1; // Add one for the end-frame

            console.log(`Image ${index + 1}: ${cellsForThisImage} cells, starts at cell ${section.dataset.startCell}`);
        });

        this.totalCells = totalCells - 1; // Subtract 1 because currentIndex is 0-based and includes the last end-frame

        console.log(`Total cells (including end-frames): ${this.totalCells + 1}`);
    }

    setupEventListeners() {
        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Mouse wheel navigation
        document.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

        // Touch/swipe navigation
        this.container.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        this.container.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
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

        // Recalculate on window resize
        window.addEventListener('resize', () => {
            this.calculateCells();
            // Clamp current index to valid range after resize
            if (this.currentIndex > this.totalCells) {
                this.currentIndex = this.totalCells;
            }
            this.updatePosition();
            this.updateCellIndicator();
        });
    }

    handleKeyboard(e) {
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            this.navigate(1);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            this.navigate(-1);
        }
    }

    handleWheel(e) {
        // Allow Ctrl+scroll for zooming (don't prevent default or navigate)
        if (e.ctrlKey || e.metaKey) {
            return;
        }

        e.preventDefault();

        // Debounce wheel events to prevent over-scrolling
        if (this.wheelTimeout) return;

        this.wheelTimeout = setTimeout(() => {
            this.wheelTimeout = null;
        }, 300);

        if (e.deltaY > 0 || e.deltaX > 0) {
            this.navigate(1);
        } else if (e.deltaY < 0 || e.deltaX < 0) {
            this.navigate(-1);
        }
    }

    handleTouchStart(e) {
        this.touchStartX = e.changedTouches[0].screenX;
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
        // Continue tracking if this is a pinch-to-zoom gesture
        if (e.touches.length === 2) {
            this.isTouchZooming = true;
        }
    }

    handleTouchEnd(e) {
        // Don't process swipe if the user was zooming
        if (this.isTouchZooming) {
            this.isTouchZooming = false;
            return;
        }

        this.touchEndX = e.changedTouches[0].screenX;
        this.handleSwipe();
    }

    handleSwipe() {
        const swipeDistance = this.touchStartX - this.touchEndX;

        if (Math.abs(swipeDistance) > this.minSwipeDistance) {
            if (swipeDistance > 0) {
                // Swiped left - go to next cell
                this.navigate(1);
            } else {
                // Swiped right - go to previous cell
                this.navigate(-1);
            }
        }
    }

    handleMouseDown(e) {
        this.isDragging = true;
        this.dragStartX = e.clientX;
        this.container.style.cursor = 'grabbing';
    }

    handleMouseMove(e) {
        if (!this.isDragging) {
            this.container.style.cursor = 'grab';
            return;
        }
        // Just track the position, don't navigate yet
        this.dragEndX = e.clientX;
    }

    handleMouseUp(e) {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.container.style.cursor = 'grab';
        this.dragEndX = e.clientX;

        const dragDistance = this.dragStartX - this.dragEndX;

        if (Math.abs(dragDistance) > this.minSwipeDistance) {
            if (dragDistance > 0) {
                // Dragged left - go to next cell
                this.navigate(1);
            } else {
                // Dragged right - go to previous cell
                this.navigate(-1);
            }
        }
    }

    navigate(direction) {
        const newIndex = this.currentIndex + direction;

        // Prevent navigating beyond boundaries
        if (newIndex < 0 || newIndex > this.totalCells) {
            return;
        }

        this.currentIndex = newIndex;
        this.updatePosition();
        this.updateCellIndicator();
    }

    updatePosition() {
        // Move the entire container to show the current cell
        const offset = -this.currentIndex * this.cellWidth;
        this.containerInner.style.transform = `translateX(${offset}px)`;
    }

    updateCellIndicator() {
        // Determine which image and cell we're on
        let cellCount = 0;
        let currentImageIndex = -1;
        let cellWithinImage = -1;
        let isOnEndFrame = false;

        for (let i = 0; i < this.imageSections.length; i++) {
            const section = this.imageSections[i];
            const cells = parseInt(section.dataset.cells);

            // Check if we're in this image's cells
            if (this.currentIndex >= cellCount && this.currentIndex < cellCount + cells) {
                currentImageIndex = i;
                cellWithinImage = this.currentIndex - cellCount;
                break;
            }

            cellCount += cells;

            // Check if we're on this image's end-frame
            if (this.currentIndex === cellCount) {
                currentImageIndex = i;
                isOnEndFrame = true;
                break;
            }

            cellCount += 1; // Add 1 for the end-frame
        }

        if (isOnEndFrame) {
            this.cellIndicator.textContent = `About Image ${currentImageIndex + 1}`;
        } else if (currentImageIndex >= 0) {
            const section = this.imageSections[currentImageIndex];
            const totalCellsInImage = parseInt(section.dataset.cells);
            this.cellIndicator.textContent = `Image ${currentImageIndex + 1}: ${cellWithinImage + 1} / ${totalCellsInImage}`;
        }
    }

    hideHintAfterDelay() {
        setTimeout(() => {
            this.navHint.classList.add('hidden');
        }, 3000);
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
}

// Initialize the viewer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ImageViewer();
});
