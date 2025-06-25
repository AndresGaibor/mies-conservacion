// Desktop Image Processor for MIES Conservación

interface ProcessingJob {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: ProcessingResult;
  error?: string;
  progress?: number;
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

interface Settings {
  concurrentUploads: number;
  autoDownload: boolean;
  qualityLevel: 'high' | 'medium' | 'low';
}

class DesktopImageProcessor {
  private jobs: Map<string, ProcessingJob> = new Map();
  private activeJobs: Set<string> = new Set();
  private isPaused: boolean = false;
  private settings: Settings = {
    concurrentUploads: 2,
    autoDownload: false,
    qualityLevel: 'high'
  };

  private elements = {
    uploadArea: document.getElementById('uploadArea') as HTMLElement,
    fileInput: document.getElementById('fileInput') as HTMLInputElement,
    selectFilesBtn: document.getElementById('selectFilesBtn') as HTMLButtonElement,
    processingSection: document.getElementById('processingSection') as HTMLElement,
    queueSection: document.getElementById('queueSection') as HTMLElement,
    resultsSection: document.getElementById('resultsSection') as HTMLElement,
    
    // Stats
    totalFiles: document.getElementById('totalFiles') as HTMLElement,
    processedFiles: document.getElementById('processedFiles') as HTMLElement,
    pendingFiles: document.getElementById('pendingFiles') as HTMLElement,
    failedFiles: document.getElementById('failedFiles') as HTMLElement,
    progressFill: document.getElementById('progressFill') as HTMLElement,
    
    // Controls
    pauseBtn: document.getElementById('pauseBtn') as HTMLButtonElement,
    cancelBtn: document.getElementById('cancelBtn') as HTMLButtonElement,
    downloadAllBtn: document.getElementById('downloadAllBtn') as HTMLButtonElement,
    clearResultsBtn: document.getElementById('clearResultsBtn') as HTMLButtonElement,
    newBatchBtn: document.getElementById('newBatchBtn') as HTMLButtonElement,
    
    // Lists
    queueList: document.getElementById('queueList') as HTMLElement,
    resultsGrid: document.getElementById('resultsGrid') as HTMLElement,
    
    // Settings
    concurrentUploads: document.getElementById('concurrentUploads') as HTMLSelectElement,
    autoDownload: document.getElementById('autoDownload') as HTMLInputElement,
    qualityLevel: document.getElementById('qualityLevel') as HTMLSelectElement,
    
    // Toast
    toastContainer: document.getElementById('toastContainer') as HTMLElement,
    loadingOverlay: document.getElementById('loadingOverlay') as HTMLElement
  };

  constructor() {
    this.initializeEventListeners();
    this.loadSettings();
    this.showToast('¡Listo para procesar imágenes!', 'success');
  }

  private initializeEventListeners(): void {
    // File selection
    this.elements.selectFilesBtn.addEventListener('click', () => {
      this.elements.fileInput.click();
    });

    this.elements.fileInput.addEventListener('change', (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        this.addFiles(Array.from(files));
      }
    });

    // Drag and drop
    this.elements.uploadArea.addEventListener('click', () => {
      this.elements.fileInput.click();
    });

    this.elements.uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.elements.uploadArea.classList.add('dragover');
    });

    this.elements.uploadArea.addEventListener('dragleave', () => {
      this.elements.uploadArea.classList.remove('dragover');
    });

    this.elements.uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      this.elements.uploadArea.classList.remove('dragover');
      
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length > 0) {
        this.addFiles(files);
      }
    });

    // Processing controls
    this.elements.pauseBtn.addEventListener('click', () => this.togglePause());
    this.elements.cancelBtn.addEventListener('click', () => this.cancelAll());

    // Results controls
    this.elements.downloadAllBtn.addEventListener('click', () => this.downloadAll());
    this.elements.clearResultsBtn.addEventListener('click', () => this.clearResults());
    this.elements.newBatchBtn.addEventListener('click', () => this.newBatch());

    // Settings
    this.elements.concurrentUploads.addEventListener('change', () => this.updateSettings());
    this.elements.autoDownload.addEventListener('change', () => this.updateSettings());
    this.elements.qualityLevel.addEventListener('change', () => this.updateSettings());
  }

  private addFiles(files: File[]): void {
    const imageFiles = files.filter(file => 
      file.type.startsWith('image/') || 
      file.name.toLowerCase().endsWith('.heic')
    );

    if (imageFiles.length === 0) {
      this.showToast('No se encontraron archivos de imagen válidos', 'warning');
      return;
    }

    imageFiles.forEach(file => {
      const job: ProcessingJob = {
        id: this.generateJobId(),
        file,
        status: 'pending'
      };
      this.jobs.set(job.id, job);
    });

    this.showToast(`${imageFiles.length} imágenes añadidas a la cola`, 'success');
    this.updateUI();
    this.startProcessing();
  }

  private async startProcessing(): Promise<void> {
    if (this.isPaused) return;

    // Show processing sections
    this.elements.processingSection.style.display = 'block';
    this.elements.queueSection.style.display = 'block';

    while (this.activeJobs.size < this.settings.concurrentUploads && this.hasPendingJobs() && !this.isPaused) {
      const pendingJob = this.getNextPendingJob();
      if (pendingJob) {
        this.processJob(pendingJob);
      }
    }
  }

  private async processJob(job: ProcessingJob): Promise<void> {
    this.activeJobs.add(job.id);
    job.status = 'processing';
    this.updateUI();

    try {
      const formData = new FormData();
      formData.append('image', job.file);

      const response = await fetch('/api/process-image', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ProcessingResult = await response.json();
      
      job.status = 'completed';
      job.result = result;

      if (this.settings.autoDownload && result.processedImageUrl) {
        this.downloadImage(result.processedImageUrl, result.newName);
      }

      this.showToast(`✅ ${job.file.name} procesada correctamente`, 'success');

    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Error desconocido';
      this.showToast(`❌ Error procesando ${job.file.name}`, 'error');
    } finally {
      this.activeJobs.delete(job.id);
      this.updateUI();
      
      // Continue processing if there are more jobs
      if (this.hasPendingJobs() && !this.isPaused) {
        setTimeout(() => this.startProcessing(), 100);
      } else if (!this.hasPendingJobs() && this.activeJobs.size === 0) {
        this.onProcessingComplete();
      }
    }
  }

  private onProcessingComplete(): void {
    const completed = Array.from(this.jobs.values()).filter(job => job.status === 'completed');
    const failed = Array.from(this.jobs.values()).filter(job => job.status === 'failed');

    if (completed.length > 0) {
      this.elements.resultsSection.style.display = 'block';
      this.showToast(`🎉 Procesamiento completado: ${completed.length} exitosas, ${failed.length} errores`, 'success');
    }
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;
    this.elements.pauseBtn.textContent = this.isPaused ? '▶️ Reanudar' : '⏸️ Pausar';
    
    if (!this.isPaused) {
      this.startProcessing();
      this.showToast('Procesamiento reanudado', 'info');
    } else {
      this.showToast('Procesamiento pausado', 'warning');
    }
  }

  private cancelAll(): void {
    this.isPaused = true;
    
    // Cancel pending jobs
    this.jobs.forEach(job => {
      if (job.status === 'pending') {
        this.jobs.delete(job.id);
      }
    });

    this.updateUI();
    this.showToast('Procesamiento cancelado', 'warning');
  }

  private async downloadAll(): Promise<void> {
    const completedJobs = Array.from(this.jobs.values()).filter(
      job => job.status === 'completed' && job.result
    );

    if (completedJobs.length === 0) {
      this.showToast('No hay imágenes procesadas para descargar', 'warning');
      return;
    }

    this.showToast(`Descargando ${completedJobs.length} imágenes...`, 'info');

    for (const job of completedJobs) {
      if (job.result) {
        await this.downloadImage(job.result.processedImageUrl, job.result.newName);
        await new Promise(resolve => setTimeout(resolve, 200)); // Small delay
      }
    }

    this.showToast('Descarga completa', 'success');
  }

  private async downloadImage(url: string, filename: string): Promise<void> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  }

  private clearResults(): void {
    this.jobs.clear();
    this.activeJobs.clear();
    this.elements.resultsSection.style.display = 'none';
    this.elements.processingSection.style.display = 'none';
    this.elements.queueSection.style.display = 'none';
    this.updateUI();
    this.showToast('Resultados limpiados', 'info');
  }

  private newBatch(): void {
    this.clearResults();
    this.elements.fileInput.click();
  }

  private updateSettings(): void {
    this.settings.concurrentUploads = parseInt(this.elements.concurrentUploads.value);
    this.settings.autoDownload = this.elements.autoDownload.checked;
    this.settings.qualityLevel = this.elements.qualityLevel.value as 'high' | 'medium' | 'low';
    this.saveSettings();
  }

  private loadSettings(): void {
    const saved = localStorage.getItem('mies-desktop-settings');
    if (saved) {
      this.settings = { ...this.settings, ...JSON.parse(saved) };
      this.elements.concurrentUploads.value = this.settings.concurrentUploads.toString();
      this.elements.autoDownload.checked = this.settings.autoDownload;
      this.elements.qualityLevel.value = this.settings.qualityLevel;
    }
  }

  private saveSettings(): void {
    localStorage.setItem('mies-desktop-settings', JSON.stringify(this.settings));
  }

  private updateUI(): void {
    const jobs = Array.from(this.jobs.values());
    const total = jobs.length;
    const completed = jobs.filter(job => job.status === 'completed').length;
    const pending = jobs.filter(job => job.status === 'pending').length;
    const failed = jobs.filter(job => job.status === 'failed').length;
    const processing = jobs.filter(job => job.status === 'processing').length;

    // Update stats
    this.elements.totalFiles.textContent = total.toString();
    this.elements.processedFiles.textContent = completed.toString();
    this.elements.pendingFiles.textContent = (pending + processing).toString();
    this.elements.failedFiles.textContent = failed.toString();

    // Update progress
    const progress = total > 0 ? ((completed + failed) / total) * 100 : 0;
    this.elements.progressFill.style.width = `${progress}%`;

    // Update queue
    this.updateQueueList();

    // Update results
    this.updateResultsGrid();
  }

  private updateQueueList(): void {
    const jobs = Array.from(this.jobs.values()).sort((a, b) => {
      const statusOrder = { processing: 0, pending: 1, completed: 2, failed: 3 };
      return statusOrder[a.status] - statusOrder[b.status];
    });

    this.elements.queueList.innerHTML = jobs.map(job => `
      <div class="queue-item ${job.status}">
        <div class="queue-item-icon">
          ${this.getStatusIcon(job.status)}
        </div>
        <div class="queue-item-info">
          <div class="queue-item-name">${job.file.name}</div>
          <div class="queue-item-status">${this.getStatusText(job)}</div>
        </div>
      </div>
    `).join('');
  }

  private updateResultsGrid(): void {
    const completedJobs = Array.from(this.jobs.values()).filter(
      job => job.status === 'completed' && job.result
    );

    this.elements.resultsGrid.innerHTML = completedJobs.map(job => `
      <div class="result-card">
        <img src="${job.result!.processedImageUrl}" alt="${job.result!.extractedTitle}" class="result-image">
        <div class="result-info">
          <div class="result-title">${job.result!.extractedTitle}</div>
          <div class="result-filename">${job.result!.newName}</div>
          <div class="result-meta">
            <span>${this.formatFileSize(job.result!.originalSize)} → ${this.formatFileSize(job.result!.processedSize)}</span>
            <span>${job.result!.format}</span>
          </div>
          <div class="result-actions">
            <button class="btn-primary btn-small" onclick="app.downloadSingle('${job.result!.processedImageUrl}', '${job.result!.newName}')">
              📥 Descargar
            </button>
            <button class="btn-secondary btn-small" onclick="app.viewImage('${job.result!.processedImageUrl}')">
              👁️ Ver
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  public downloadSingle(url: string, filename: string): void {
    this.downloadImage(url, filename);
  }

  public viewImage(url: string): void {
    window.open(url, '_blank');
  }

  private getStatusIcon(status: string): string {
    const icons = {
      pending: '⏳',
      processing: '⚡',
      completed: '✅',
      failed: '❌'
    };
    return icons[status as keyof typeof icons] || '❓';
  }

  private getStatusText(job: ProcessingJob): string {
    switch (job.status) {
      case 'pending': return 'En cola';
      case 'processing': return 'Procesando...';
      case 'completed': return `Completado - ${job.result?.extractedTitle || 'Sin título'}`;
      case 'failed': return `Error: ${job.error || 'Desconocido'}`;
      default: return 'Desconocido';
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  private hasPendingJobs(): boolean {
    return Array.from(this.jobs.values()).some(job => job.status === 'pending');
  }

  private getNextPendingJob(): ProcessingJob | null {
    return Array.from(this.jobs.values()).find(job => job.status === 'pending') || null;
  }

  private generateJobId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    this.elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 5000);
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  const app = new DesktopImageProcessor();
  
  // Make app globally available for onclick handlers
  (window as any).app = app;
});
