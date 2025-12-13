/**
 * Opens the camera and streams to the video element.
 * @param {string} facingMode - 'user' or 'environment'
 * @returns {Promise<MediaStream>}
 */
let currentCameraStream = null;

async function openCamera(facingMode = 'user') {
    const videoEl = document.getElementById('cameraVideo');
    if (!videoEl) throw new Error('Camera video element not found');

    if (currentCameraStream) {
        currentCameraStream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
        video: {
            facingMode: facingMode,
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
        },
        audio: false
    };

    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        currentCameraStream = stream;
        videoEl.srcObject = stream;

        if (facingMode === 'user') {
            videoEl.classList.add('camera-mirror');
        } else {
            videoEl.classList.remove('camera-mirror');
        }
        return stream;
    } catch (err) {
        console.error('Camera access error:', err);
        throw err;
    }
}

function closeCamera() {
    if (currentCameraStream) {
        currentCameraStream.getTracks().forEach(track => track.stop());
        currentCameraStream = null;
    }
    const modal = document.getElementById('cameraModal');
    if (modal) modal.hidden = true;
}

/**
 * Captures a photo from the video stream.
 */
function capturePhoto(videoEl) {
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');

    // Check for mirroring class
    if (videoEl.classList.contains('camera-mirror')) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
    }

    ctx.drawImage(videoEl, 0, 0);
    return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
}

/**
 * Compresses an image file by resizing and converting to JPEG.
 * @param {File} file - The image file to compress.
 * @returns {Promise<Blob>} - The compressed image blob.
 */
async function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Resize if too large
                const maxWidth = SONDER_CONFIG.MAX_IMAGE_WIDTH || 1024;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to blob (Force JPEG for better compatibility/size)
                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Image compression failed'));
                        return;
                    }
                    resolve(blob);
                }, 'image/jpeg', 0.7);
            };
            img.onerror = () => {
                reject(new Error('Failed to load image for compression'));
            };
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Uploads an image file to Imgur.
 * @param {File} imageFile - The image file to upload.
 * @returns {Promise<string>} - The URL of the uploaded image.
 */
async function uploadToImgur(imageFile) {
    if (!SONDER_CONFIG.IMGUR_CLIENT_ID) {
        throw new Error('Imgur Client ID not configured');
    }

    const compressedImage = await compressImage(imageFile);
    const formData = new FormData();
    formData.append('image', compressedImage);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
        const response = await fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
                'Authorization': `Client-ID ${SONDER_CONFIG.IMGUR_CLIENT_ID}`
            },
            body: formData,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (data.success) {
            return data.data.link;
        } else {
            throw new Error(data.data.error || 'Imgur upload failed');
        }
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            throw new Error('Upload timed out (15s). Check connection.');
        }
        throw err;
    }
}

/**
 * Validates an image file.
 * @param {File} file 
 * @returns {Object} { valid: boolean, message: string }
 */
function validateImage(file) {
    if (!file) return { valid: false, message: 'No file' };

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const extension = file.name.split('.').pop().toLowerCase();

    const isValidMime = validTypes.includes(file.type);
    const isValidExt = validExtensions.includes(extension);

    if (!isValidMime && !isValidExt) {
        return { valid: false, message: `Format not supported (${file.type}). Use jpg, png, or webp.` };
    }

    if (file.size > SONDER_CONFIG.MAX_IMAGE_SIZE_BYTES) {
        return { valid: false, message: 'Image must be under 5MB' };
    }

    return { valid: true };
}
