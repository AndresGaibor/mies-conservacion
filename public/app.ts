// Types
interface CameraState {
  stream: MediaStream | null;
  currentFacingMode: 'user' | 'environment';
  devices: MediaDeviceInfo[];
}

interface ProcessingResult {
  success: boolean;
  extractedTitle: string;
  newName: string;
  processedImageUrl: string;
  originalSize: number;
  processedSize: number;
  format?: string;
  metadata?: any;
}

interface ProcessedImage {
  filename: string;
  url: string;
  name: string;
}

interface ProcessingJob {
  id: string;
  blob: Blob;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: ProcessingResult;
  error?: string;
}

class MobileImageApp {
  private camera: CameraState;
  private currentImageBlob: Blob | null = null;
  private processingQueue: ProcessingJob[] = [];
  private isProcessing: boolean = false;
  private processingCounter: number = 0;
  private autoCaptureInterval: number | null = null;
  private autoCaptureActive: boolean = false;
  private elements: {
    video: HTMLVideoElement;
    canvas: HTMLCanvasElement;
    captureBtn: HTMLButtonElement;
    switchCamera: HTMLButtonElement;
    fileInput: HTMLInputElement;
    uploadBtn: HTMLButtonElement;
    previewImage: HTMLImageElement;
    retakeBtn: HTMLButtonElement;
    processBtn: HTMLButtonElement;
    quickCaptureBtn: HTMLButtonElement;
    downloadBtn: HTMLButtonElement;
    newPhotoBtn: HTMLButtonElement;
    cameraSection: HTMLElement;
    previewSection: HTMLElement;
    processingSection: HTMLElement;
    resultsSection: HTMLElement;
    galleryGrid: HTMLElement;
    toast: HTMLElement;
    progressFill: HTMLElement;
    extractedTitle: HTMLElement;
    newFileName: HTMLElement;
    fileSize: HTMLElement;
    fileFormat: HTMLElement;
    resultImage: HTMLImageElement;
    cameraError: HTMLElement;
    retryCamera: HTMLButtonElement;
    processingQueue: HTMLElement;
    processingCounter: HTMLElement;
    autoCaptureBtn: HTMLButtonElement;
    autoCaptureText: HTMLElement;
  };

  constructor() {
    this.camera = {
      stream: null,
      currentFacingMode: 'environment',
      devices: []
    };

    this.elements = this.initializeElements();
    this.initializeEventListeners();
    this.initializeCamera();
    this.loadGallery();
  }

  private initializeElements() {
    return {
      video: document.getElementById('video') as HTMLVideoElement,
      canvas: document.getElementById('canvas') as HTMLCanvasElement,
      captureBtn: document.getElementById('captureBtn') as HTMLButtonElement,
      switchCamera: document.getElementById('switchCamera') as HTMLButtonElement,
      fileInput: document.getElementById('fileInput') as HTMLInputElement,
      uploadBtn: document.getElementById('uploadBtn') as HTMLButtonElement,
      previewImage: document.getElementById('previewImage') as HTMLImageElement,
      retakeBtn: document.getElementById('retakeBtn') as HTMLButtonElement,
      processBtn: document.getElementById('processBtn') as HTMLButtonElement,
      quickCaptureBtn: document.getElementById('quickCaptureBtn') as HTMLButtonElement,
      downloadBtn: document.getElementById('downloadBtn') as HTMLButtonElement,
      newPhotoBtn: document.getElementById('newPhotoBtn') as HTMLButtonElement,
      cameraSection: document.getElementById('cameraSection') as HTMLElement,
      previewSection: document.getElementById('previewSection') as HTMLElement,
      processingSection: document.getElementById('processingSection') as HTMLElement,
      resultsSection: document.getElementById('resultsSection') as HTMLElement,
      galleryGrid: document.getElementById('galleryGrid') as HTMLElement,
      toast: document.getElementById('toast') as HTMLElement,
      progressFill: document.getElementById('progressFill') as HTMLElement,
      extractedTitle: document.getElementById('extractedTitle') as HTMLElement,
      newFileName: document.getElementById('newFileName') as HTMLElement,
      fileSize: document.getElementById('fileSize') as HTMLElement,
      fileFormat: document.getElementById('fileFormat') as HTMLButtonElement,
      resultImage: document.getElementById('resultImage') as HTMLImageElement,
      cameraError: document.getElementById('cameraError') as HTMLElement,
      retryCamera: document.getElementById('retryCamera') as HTMLButtonElement,
      processingQueue: document.getElementById('processingQueue') as HTMLElement,
      processingCounter: document.getElementById('processingCounter') as HTMLElement,
      autoCaptureBtn: document.getElementById('autoCaptureBtn') as HTMLButtonElement,
      autoCaptureText: document.getElementById('autoCaptureText') as HTMLElement
    };
  }

  private initializeEventListeners(): void {
    // Camera controls
    this.elements.captureBtn.addEventListener('click', () => this.capturePhoto());
    this.elements.switchCamera.addEventListener('click', () => this.switchCamera());
    this.elements.retryCamera.addEventListener('click', () => this.initializeCamera());
    
    // File upload
    this.elements.uploadBtn.addEventListener('click', () => this.elements.fileInput.click());
    this.elements.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
    
    // Preview controls
    this.elements.retakeBtn.addEventListener('click', () => this.returnToCamera());
    this.elements.processBtn.addEventListener('click', () => this.processImage());
    this.elements.quickCaptureBtn.addEventListener('click', () => this.quickCapture());
    
    // Results controls
    this.elements.downloadBtn.addEventListener('click', () => this.downloadImage());
    this.elements.newPhotoBtn.addEventListener('click', () => this.returnToCamera());

    // Auto capture
    this.elements.autoCaptureBtn.addEventListener('click', () => this.toggleAutoCapture());

    // Service Worker registration
    this.registerServiceWorker();
  }

  private async initializeCamera(): Promise<void> {
    try {
      this.elements.cameraError.style.display = 'none';
      
      // Get available devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.camera.devices = devices.filter(device => device.kind === 'videoinput');
      
      // Show/hide switch camera button based on available cameras
      this.elements.switchCamera.style.display = 
        this.camera.devices.length > 1 ? 'flex' : 'none';

      // Request camera access
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: this.camera.currentFacingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.camera.stream = stream;
      this.elements.video.srcObject = stream;
      
      // Wait for video to load
      await new Promise((resolve) => {
        this.elements.video.onloadedmetadata = resolve;
      });

      this.showToast('Cámara inicializada correctamente', 'success');
    } catch (error) {
      console.error('Error accessing camera:', error);
      this.elements.cameraError.style.display = 'block';
      this.showToast('Error al acceder a la cámara', 'error');
    }
  }

  private async switchCamera(): Promise<void> {
    if (this.camera.devices.length <= 1) return;

    try {
      // Stop current stream
      if (this.camera.stream) {
        this.camera.stream.getTracks().forEach(track => track.stop());
      }

      // Switch facing mode
      this.camera.currentFacingMode = 
        this.camera.currentFacingMode === 'user' ? 'environment' : 'user';

      // Reinitialize camera
      await this.initializeCamera();
    } catch (error) {
      console.error('Error switching camera:', error);
      this.showToast('Error al cambiar la cámara', 'error');
    }
  }

  private capturePhoto(): void {
    try {
      const context = this.elements.canvas.getContext('2d');
      if (!context || !this.elements.video.videoWidth) {
        this.showToast('Error: Video no disponible', 'error');
        return;
      }

      // Set canvas dimensions to match video
      this.elements.canvas.width = this.elements.video.videoWidth;
      this.elements.canvas.height = this.elements.video.videoHeight;

      // Draw current frame to canvas
      context.drawImage(this.elements.video, 0, 0);

      // Convert to blob
      this.elements.canvas.toBlob((blob) => {
        if (blob) {
          this.currentImageBlob = blob;
          this.showPreview(blob);
          this.showToast('📸 Foto capturada', 'success');
        }
      }, 'image/jpeg', 0.9);

    } catch (error) {
      console.error('Error capturing photo:', error);
      this.showToast('Error al capturar la foto', 'error');
    }
  }

  private quickCapture(): void {
    if (!this.currentImageBlob) {
      this.showToast('No hay imagen para procesar', 'error');
      return;
    }

    // Immediately add to processing queue and return to camera
    this.processImageInBackground(this.currentImageBlob);
    this.returnToCamera();
    
    // Auto-capture next photo after a short delay
    setTimeout(() => {
      this.capturePhoto();
    }, 100);
  }

  private processImageInBackground(blob: Blob): void {
    // Add to processing queue
    const jobId = this.generateJobId();
    const job: ProcessingJob = {
      id: jobId,
      blob: blob,
      timestamp: Date.now(),
      status: 'pending'
    };

    this.processingQueue.push(job);
    this.showToast(`⚡ Procesando en segundo plano...`, 'success');
    
    // Update counter
    this.updateProcessingCounter();
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private toggleAutoCapture(): void {
    this.autoCaptureActive = !this.autoCaptureActive;
    
    if (this.autoCaptureActive) {
      this.startAutoCapture();
    } else {
      this.stopAutoCapture();
    }
  }

  private startAutoCapture(): void {
    this.elements.autoCaptureBtn.classList.add('active');
    this.elements.autoCaptureText.textContent = 'Detener Auto-Captura';
    this.elements.autoCaptureBtn.style.display = 'flex';
    
    // Start auto capture every 3 seconds
    this.autoCaptureInterval = window.setInterval(() => {
      if (this.camera.stream && this.elements.video.videoWidth > 0) {
        this.autoTakePhoto();
      }
    }, 3000);
    
    this.showToast('🔄 Captura automática activada (cada 3 segundos)', 'success');
  }

  private stopAutoCapture(): void {
    this.elements.autoCaptureBtn.classList.remove('active');
    this.elements.autoCaptureText.textContent = 'Captura Automática';
    
    if (this.autoCaptureInterval) {
      clearInterval(this.autoCaptureInterval);
      this.autoCaptureInterval = null;
    }
    
    this.showToast('⏹️ Captura automática desactivada', 'success');
  }

  private autoTakePhoto(): void {
    try {
      const context = this.elements.canvas.getContext('2d');
      if (!context || !this.elements.video.videoWidth) return;

      this.elements.canvas.width = this.elements.video.videoWidth;
      this.elements.canvas.height = this.elements.video.videoHeight;
      context.drawImage(this.elements.video, 0, 0);

      this.elements.canvas.toBlob((blob) => {
        if (blob) {
          this.processImageInBackground(blob);
        }
      }, 'image/jpeg', 0.9);
    } catch (error) {
      console.error('Error in auto capture:', error);
    }
  }

  private showQuickCaptureMode(): void {
    let indicator = document.getElementById('quick-capture-mode');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'quick-capture-mode';
      indicator.className = 'quick-capture-mode';
      indicator.textContent = '⚡ Modo Captura Automática Activo';
      document.body.appendChild(indicator);
    }
    indicator.style.display = 'block';
  }

  private hideQuickCaptureMode(): void {
    const indicator = document.getElementById('quick-capture-mode');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }

  private processQueue(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  private showSection(sectionId: string): void {
    // Hide all sections
    const sections = ['cameraSection', 'previewSection', 'processingSection', 'resultsSection'];
    sections.forEach(id => {
      const element = document.getElementById(id);
      if (element) element.style.display = 'none';
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.style.display = 'block';
    }

    // Show/hide auto capture button only in camera section
    if (sectionId === 'cameraSection') {
      this.elements.autoCaptureBtn.style.display = 'flex';
    } else {
      this.elements.autoCaptureBtn.style.display = 'none';
      // Stop auto capture if user leaves camera section
      if (this.autoCaptureActive) {
        this.stopAutoCapture();
      }
    }
  }

  private async initializeCamera(): Promise<void> {
    try {
      this.elements.cameraError.style.display = 'none';
      
      // Get available devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.camera.devices = devices.filter(device => device.kind === 'videoinput');
      
      // Show/hide switch camera button based on available cameras
      this.elements.switchCamera.style.display = 
        this.camera.devices.length > 1 ? 'flex' : 'none';

      // Request camera access
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: this.camera.currentFacingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.camera.stream = stream;
      this.elements.video.srcObject = stream;
      
      // Wait for video to load
      await new Promise((resolve) => {
        this.elements.video.onloadedmetadata = resolve;
      });

      this.showToast('Cámara inicializada correctamente', 'success');
    } catch (error) {
      console.error('Error accessing camera:', error);
      this.elements.cameraError.style.display = 'block';
      this.showToast('Error al acceder a la cámara', 'error');
    }
  }

  private async switchCamera(): Promise<void> {
    if (this.camera.devices.length <= 1) return;

    try {
      // Stop current stream
      if (this.camera.stream) {
        this.camera.stream.getTracks().forEach(track => track.stop());
      }

      // Switch facing mode
      this.camera.currentFacingMode = 
        this.camera.currentFacingMode === 'user' ? 'environment' : 'user';

      // Reinitialize camera
      await this.initializeCamera();
    } catch (error) {
      console.error('Error switching camera:', error);
      this.showToast('Error al cambiar la cámara', 'error');
    }
  }

  private capturePhoto(): void {
    try {
      const context = this.elements.canvas.getContext('2d');
      if (!context || !this.elements.video.videoWidth) {
        this.showToast('Error: Video no disponible', 'error');
        return;
      }

      // Set canvas dimensions to match video
      this.elements.canvas.width = this.elements.video.videoWidth;
      this.elements.canvas.height = this.elements.video.videoHeight;

      // Draw current frame to canvas
      context.drawImage(this.elements.video, 0, 0);

      // Convert to blob
      this.elements.canvas.toBlob((blob) => {
        if (blob) {
          this.currentImageBlob = blob;
          this.showPreview(blob);
          this.showToast('📸 Foto capturada', 'success');
        }
      }, 'image/jpeg', 0.9);

    } catch (error) {
      console.error('Error capturing photo:', error);
      this.showToast('Error al capturar la foto', 'error');
    }
  }

  private quickCapture(): void {
    if (!this.currentImageBlob) {
      this.showToast('No hay imagen para procesar', 'error');
      return;
    }

    // Immediately add to processing queue and return to camera
    this.processImageInBackground(this.currentImageBlob);
    this.returnToCamera();
    
    // Auto-capture next photo after a short delay
    setTimeout(() => {
      this.capturePhoto();
    }, 100);
  }

  private processImageInBackground(blob: Blob): void {
    // Add to processing queue
    const jobId = this.generateJobId();
    const job: ProcessingJob = {
      id: jobId,
      blob: blob,
      timestamp: Date.now(),
      status: 'pending'
    };

    this.processingQueue.push(job);
    this.showToast(`⚡ Procesando en segundo plano...`, 'success');
    
    // Update counter
    this.updateProcessingCounter();
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private toggleAutoCapture(): void {
    this.autoCaptureActive = !this.autoCaptureActive;
    
    if (this.autoCaptureActive) {
      this.startAutoCapture();
    } else {
      this.stopAutoCapture();
    }
  }

  private startAutoCapture(): void {
    this.elements.autoCaptureBtn.classList.add('active');
    this.elements.autoCaptureText.textContent = 'Detener Auto-Captura';
    this.elements.autoCaptureBtn.style.display = 'flex';
    
    // Start auto capture every 3 seconds
    this.autoCaptureInterval = window.setInterval(() => {
      if (this.camera.stream && this.elements.video.videoWidth > 0) {
        this.autoTakePhoto();
      }
    }, 3000);
    
    this.showToast('🔄 Captura automática activada (cada 3 segundos)', 'success');
  }

  private stopAutoCapture(): void {
    this.elements.autoCaptureBtn.classList.remove('active');
    this.elements.autoCaptureText.textContent = 'Captura Automática';
    
    if (this.autoCaptureInterval) {
      clearInterval(this.autoCaptureInterval);
      this.autoCaptureInterval = null;
    }
    
    this.showToast('⏹️ Captura automática desactivada', 'success');
  }

  private autoTakePhoto(): void {
    try {
      const context = this.elements.canvas.getContext('2d');
      if (!context || !this.elements.video.videoWidth) return;

      this.elements.canvas.width = this.elements.video.videoWidth;
      this.elements.canvas.height = this.elements.video.videoHeight;
      context.drawImage(this.elements.video, 0, 0);

      this.elements.canvas.toBlob((blob) => {
        if (blob) {
          this.processImageInBackground(blob);
        }
      }, 'image/jpeg', 0.9);
    } catch (error) {
      console.error('Error in auto capture:', error);
    }
  }

  private showQuickCaptureMode(): void {
    let indicator = document.getElementById('quick-capture-mode');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'quick-capture-mode';
      indicator.className = 'quick-capture-mode';
      indicator.textContent = '⚡ Modo Captura Automática Activo';
      document.body.appendChild(indicator);
    }
    indicator.style.display = 'block';
  }

  private hideQuickCaptureMode(): void {
    const indicator = document.getElementById('quick-capture-mode');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }

  private processQueue(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  private showSection(sectionId: string): void {
    // Hide all sections
    const sections = ['cameraSection', 'previewSection', 'processingSection', 'resultsSection'];
    sections.forEach(id => {
      const element = document.getElementById(id);
      if (element) element.style.display = 'none';
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.style.display = 'block';
    }

    // Show/hide auto capture button only in camera section
    if (sectionId === 'cameraSection') {
      this.elements.autoCaptureBtn.style.display = 'flex';
    } else {
      this.elements.autoCaptureBtn.style.display = 'none';
      // Stop auto capture if user leaves camera section
      if (this.autoCaptureActive) {
        this.stopAutoCapture();
      }
    }
  }

  private async initializeCamera(): Promise<void> {
    try {
      this.elements.cameraError.style.display = 'none';
      
      // Get available devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.camera.devices = devices.filter(device => device.kind === 'videoinput');
      
      // Show/hide switch camera button based on available cameras
      this.elements.switchCamera.style.display = 
        this.camera.devices.length > 1 ? 'flex' : 'none';

      // Request camera access
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: this.camera.currentFacingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.camera.stream = stream;
      this.elements.video.srcObject = stream;
      
      // Wait for video to load
      await new Promise((resolve) => {
        this.elements.video.onloadedmetadata = resolve;
      });

      this.showToast('Cámara inicializada correctamente', 'success');
    } catch (error) {
      console.error('Error accessing camera:', error);
      this.elements.cameraError.style.display = 'block';
      this.showToast('Error al acceder a la cámara', 'error');
    }
  }

  private async switchCamera(): Promise<void> {
    if (this.camera.devices.length <= 1) return;

    try {
      // Stop current stream
      if (this.camera.stream) {
        this.camera.stream.getTracks().forEach(track => track.stop());
      }

      // Switch facing mode
      this.camera.currentFacingMode = 
        this.camera.currentFacingMode === 'user' ? 'environment' : 'user';

      // Reinitialize camera
      await this.initializeCamera();
    } catch (error) {
      console.error('Error switching camera:', error);
      this.showToast('Error al cambiar la cámara', 'error');
    }
  }

  private capturePhoto(): void {
    try {
      const context = this.elements.canvas.getContext('2d');
      if (!context || !this.elements.video.videoWidth) {
        this.showToast('Error: Video no disponible', 'error');
        return;
      }

      // Set canvas dimensions to match video
      this.elements.canvas.width = this.elements.video.videoWidth;
      this.elements.canvas.height = this.elements.video.videoHeight;

      // Draw current frame to canvas
      context.drawImage(this.elements.video, 0, 0);

      // Convert to blob
      this.elements.canvas.toBlob((blob) => {
        if (blob) {
          this.currentImageBlob = blob;
          this.showPreview(blob);
          this.showToast('📸 Foto capturada', 'success');
        }
      }, 'image/jpeg', 0.9);

    } catch (error) {
      console.error('Error capturing photo:', error);
      this.showToast('Error al capturar la foto', 'error');
    }
  }

  private quickCapture(): void {
    if (!this.currentImageBlob) {
      this.showToast('No hay imagen para procesar', 'error');
      return;
    }

    // Immediately add to processing queue and return to camera
    this.processImageInBackground(this.currentImageBlob);
    this.returnToCamera();
    
    // Auto-capture next photo after a short delay
    setTimeout(() => {
      this.capturePhoto();
    }, 100);
  }

  private processImageInBackground(blob: Blob): void {
    // Add to processing queue
    const jobId = this.generateJobId();
    const job: ProcessingJob = {
      id: jobId,
      blob: blob,
      timestamp: Date.now(),
      status: 'pending'
    };

    this.processingQueue.push(job);
    this.showToast(`⚡ Procesando en segundo plano...`, 'success');
    
    // Update counter
    this.updateProcessingCounter();
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private toggleAutoCapture(): void {
    this.autoCaptureActive = !this.autoCaptureActive;
    
    if (this.autoCaptureActive) {
      this.startAutoCapture();
    } else {
      this.stopAutoCapture();
    }
  }

  private startAutoCapture(): void {
    this.elements.autoCaptureBtn.classList.add('active');
    this.elements.autoCaptureText.textContent = 'Detener Auto-Captura';
    this.elements.autoCaptureBtn.style.display = 'flex';
    
    // Start auto capture every 3 seconds
    this.autoCaptureInterval = window.setInterval(() => {
      if (this.camera.stream && this.elements.video.videoWidth > 0) {
        this.autoTakePhoto();
      }
    }, 3000);
    
    this.showToast('🔄 Captura automática activada (cada 3 segundos)', 'success');
  }

  private stopAutoCapture(): void {
    this.elements.autoCaptureBtn.classList.remove('active');
    this.elements.autoCaptureText.textContent = 'Captura Automática';
    
    if (this.autoCaptureInterval) {
      clearInterval(this.autoCaptureInterval);
      this.autoCaptureInterval = null;
    }
    
    this.showToast('⏹️ Captura automática desactivada', 'success');
  }

  private autoTakePhoto(): void {
    try {
      const context = this.elements.canvas.getContext('2d');
      if (!context || !this.elements.video.videoWidth) return;

      this.elements.canvas.width = this.elements.video.videoWidth;
      this.elements.canvas.height = this.elements.video.videoHeight;
      context.drawImage(this.elements.video, 0, 0);

      this.elements.canvas.toBlob((blob) => {
        if (blob) {
          this.processImageInBackground(blob);
        }
      }, 'image/jpeg', 0.9);
    } catch (error) {
      console.error('Error in auto capture:', error);
    }
  }

  private showQuickCaptureMode(): void {
    let indicator = document.getElementById('quick-capture-mode');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'quick-capture-mode';
      indicator.className = 'quick-capture-mode';
      indicator.textContent = '⚡ Modo Captura Automática Activo';
      document.body.appendChild(indicator);
    }
    indicator.style.display = 'block';
  }

  private hideQuickCaptureMode(): void {
    const indicator = document.getElementById('quick-capture-mode');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }

  private processQueue(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  private showSection(sectionId: string): void {
    // Hide all sections
    const sections = ['cameraSection', 'previewSection', 'processingSection', 'resultsSection'];
    sections.forEach(id => {
      const element = document.getElementById(id);
      if (element) element.style.display = 'none';
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.style.display = 'block';
    }

    // Show/hide auto capture button only in camera section
    if (sectionId === 'cameraSection') {
      this.elements.autoCaptureBtn.style.display = 'flex';
    } else {
      this.elements.autoCaptureBtn.style.display = 'none';
      // Stop auto capture if user leaves camera section
      if (this.autoCaptureActive) {
        this.stopAutoCapture();
      }
    }
  }
}