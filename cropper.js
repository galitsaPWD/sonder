/* SONDER - Image Cropper Logic */

class SonderCropper {
    constructor() {
        this.modal = null;
        this.image = null; // The DOM image element
        this.canvas = null; // The DOM canvas used for cropping
        this.file = null;
        this.currentScale = 1;
        this.currentX = 0;
        this.currentY = 0;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.minScale = 1;
        this.aspectRatio = 4 / 5; // Default to Portrait (0.8)

        // Callback
        this.onConfirm = null;
        this.onCancel = null;

        this.initElements();
    }

    initElements() {
        // We will bind to the elements once the DOM is ready in the modal
        // But for now, we assume the HTML structure exists when start() is called
    }

    start(file, onConfirmCallback, onCancelCallback) {
        this.file = file;
        this.onConfirm = onConfirmCallback;
        this.onCancel = onCancelCallback;

        this.modal = document.getElementById('cropModal');
        const imgContainer = document.getElementById('cropImageContainer');
        this.image = document.getElementById('cropImageTarget');

        if (!this.modal || !this.image) {
            console.error("Cropper elements not found");
            return;
        }

        // Reset State
        this.currentScale = 1;
        this.currentX = 0;
        this.currentY = 0;

        // Load Image
        const reader = new FileReader();
        reader.onload = (e) => {
            this.image.src = e.target.result;
            this.modal.hidden = false;

            this.image.onload = () => {
                this.setupInteraction();
                this.fitImage();
            };
        };
        reader.readAsDataURL(file);

        // Bind Buttons
        document.getElementById('cropBtnDone').onclick = () => this.finish();
        document.getElementById('cropBtnCancel').onclick = () => this.cancel();

        // Aspect Ratio Buttons
        const ratioBtns = document.querySelectorAll('.btn-ratio');
        const setActive = (targetId) => {
            ratioBtns.forEach(b => b.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
        };

        document.getElementById('btnRatioSquare').onclick = () => { this.setRatio(1); setActive('btnRatioSquare'); };
        document.getElementById('btnRatioPortrait').onclick = () => { this.setRatio(4 / 5); setActive('btnRatioPortrait'); };
        document.getElementById('btnRatioOriginal').onclick = () => { this.setRatio(this.image.naturalWidth / this.image.naturalHeight); setActive('btnRatioOriginal'); };

        // Set Default Active
        setActive('btnRatioPortrait'); // Algorithm defaults to 4:5


        // Zoom Slider
        const slider = document.getElementById('cropZoomSlider');
        if (slider) {
            slider.value = 1;
            slider.oninput = (e) => {
                this.applyZoom(parseFloat(e.target.value));
            };
        }
    }

    setRatio(ratio) {
        this.aspectRatio = ratio;
        this.updateViewport();
        this.fitImage(); // Reset position logic for new ratio
    }

    updateViewport() {
        // Adjust the "hole" or viewport Visuals via CSS if needed
        // For now, we assume a fixed viewport container size, or we can adjust logic
        // But simplifying: Let's keep a flexible viewport in CSS that matches aspect ratio
        const viewport = document.getElementById('cropViewport');
        if (viewport) {
            // Calculate width/height based on max available space (e.g. 300px width)
            const maxW = 300;
            const h = maxW / this.aspectRatio;
            viewport.style.width = `${maxW}px`;
            viewport.style.height = `${h}px`;
        }
    }

    fitImage() {
        // Fit image inside viewport to start
        // Actually, "Cover" logic is usually better for initial view if image is larger
        // But let's start with "Contain" or min-scale that covers.

        const viewport = document.getElementById('cropViewport');
        const vw = viewport.clientWidth;
        const vh = viewport.clientHeight;
        const iw = this.image.naturalWidth;
        const ih = this.image.naturalHeight;

        // Calculate scale to COVER the viewport
        const scaleW = vw / iw;
        const scaleH = vh / ih;
        this.minScale = Math.max(scaleW, scaleH);

        this.currentScale = this.minScale;

        // Center
        this.currentX = (vw - iw * this.currentScale) / 2;
        this.currentY = (vh - ih * this.currentScale) / 2;

        this.updateTransform();

        // Reset slider
        const slider = document.getElementById('cropZoomSlider');
        if (slider) {
            slider.min = this.minScale;
            slider.max = this.minScale * 3;
            slider.value = this.currentScale;
        }
    }

    setupInteraction() {
        const sensitiveArea = document.getElementById('cropViewport'); // Interaction within frame

        const start = (x, y) => {
            this.isDragging = true;
            this.startX = x - this.currentX;
            this.startY = y - this.currentY;
        };

        const move = (x, y) => {
            if (!this.isDragging) return;
            // Free movement
            this.currentX = x - this.startX;
            this.currentY = y - this.startY;
            this.updateTransform();
        };

        const end = () => {
            this.isDragging = false;
            this.constrain();
        };

        // Mouse
        sensitiveArea.onmousedown = (e) => start(e.clientX, e.clientY);
        window.onmousemove = (e) => move(e.clientX, e.clientY); // Window to catch drag out
        window.onmouseup = end;

        // Touch
        // Touch
        let initialPinchDist = 0;
        let initialZoom = 1;

        const getDistance = (touches) => {
            return Math.hypot(
                touches[0].clientX - touches[1].clientX,
                touches[0].clientY - touches[1].clientY
            );
        };

        sensitiveArea.ontouchstart = (e) => {
            if (e.cancelable) e.preventDefault();
            
            if (e.touches.length === 2) {
                // Pinch Start
                this.isDragging = false; // Stop dragging
                initialPinchDist = getDistance(e.touches);
                initialZoom = this.currentScale;
            } else if (e.touches.length === 1) {
                // Drag Start
                start(e.touches[0].clientX, e.touches[0].clientY);
            }
        };

        window.ontouchmove = (e) => {
            if (e.cancelable) e.preventDefault();

            if (e.touches.length === 2) {
                // Pinch Move
                const dist = getDistance(e.touches);
                if (initialPinchDist > 0) {
                    const zoomFactor = dist / initialPinchDist;
                    let newScale = initialZoom * zoomFactor;
                    
                    // Constrain Zoom
                    const slider = document.getElementById('cropZoomSlider');
                    if (slider) {
                        const min = parseFloat(slider.min);
                        const max = parseFloat(slider.max);
                        newScale = Math.max(min, Math.min(newScale, max));
                        
                        // Update UI
                        slider.value = newScale;
                        this.applyZoom(newScale);
                    }
                }
            } else if (e.touches.length === 1 && this.isDragging) {
                // Drag Move
                move(e.touches[0].clientX, e.touches[0].clientY);
            }
        };
        
        window.ontouchend = (e) => {
            if (e.touches.length < 2) {
                initialPinchDist = 0; // Reset pinch
            }
            if (e.touches.length === 0) {
                end(); // Reset drag
            }
        };
    }

    applyZoom(val) {
        // Zoom towards center
        // Basic: just set scale. Better: Zoom towards center of viewport
        // For simplicity v1: Just set scale
        this.currentScale = val;
        this.updateTransform();
    }

    updateTransform() {
        this.image.style.transform = `translate(${this.currentX}px, ${this.currentY}px) scale(${this.currentScale})`;
        // Reset origin to top-left to make math easier
        this.image.style.transformOrigin = '0 0';
    }

    constrain() {
        // Ensure image doesn't leave viewport (No whitespace)
        const viewport = document.getElementById('cropViewport');
        const vw = viewport.clientWidth;
        const vh = viewport.clientHeight;

        const drawnW = this.image.naturalWidth * this.currentScale;
        const drawnH = this.image.naturalHeight * this.currentScale;

        // X boundaries
        if (this.currentX > 0) this.currentX = 0; // Gap left
        if (this.currentX + drawnW < vw) this.currentX = vw - drawnW; // Gap right

        // Y boundaries
        if (this.currentY > 0) this.currentY = 0; // Gap top
        if (this.currentY + drawnH < vh) this.currentY = vh - drawnH; // Gap bottom

        this.updateTransform();
    }

    cancel() {
        this.modal.hidden = true;
        this.image.src = '';
        if (this.onCancel) this.onCancel();
    }

    finish() {
        // Generate Blob
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Target Size: 1080px wide (High Quality)
        const targetW = 1080;
        const targetH = targetW / this.aspectRatio;

        canvas.width = targetW;
        canvas.height = targetH;

        // Mapping:
        // Viewport (Screen Pixels) -> Image (Natural Pixels)

        const viewport = document.getElementById('cropViewport');
        const vw = viewport.clientWidth;
        // relativeX = this.currentX (Screen coords relative to viewport)
        // We need to find which part of the Image is under the Viewport (0,0) to (vw, vh)

        // ImageX_screen = currentX
        // ViewportMinX = 0
        // CropStart_ImageSpace = (0 - currentX) / scale

        const sourceX = (-this.currentX) / this.currentScale;
        const sourceY = (-this.currentY) / this.currentScale;
        const sourceW = vw / this.currentScale;
        const sourceH = (vw / this.aspectRatio) / this.currentScale; // vh derived from width logic

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, targetW, targetH);

        // Draw
        ctx.drawImage(
            this.image,
            sourceX, sourceY, sourceW, sourceH, // Source
            0, 0, targetW, targetH // Destination
        );

        canvas.toBlob((blob) => {
            if (this.onConfirm) this.onConfirm(blob);
            this.modal.hidden = true;
            this.image.src = ''; // cleanup
        }, 'image/jpeg', 0.9);
    }
}

// Attach to window
window.SonderCropper = new SonderCropper();
