// public/src/desktop.ts
class DesktopImageProcessor {
  jobs = new Map;
  activeJobs = new Set;
  isPaused = false;
  settings = {
    concurrentUploads: 2,
    autoDownload: false,
    qualityLevel: "high"
  };
  elements = {
    uploadArea: document.getElementById("uploadArea"),
    fileInput: document.getElementById("fileInput"),
    selectFilesBtn: document.getElementById("selectFilesBtn"),
    processingSection: document.getElementById("processingSection"),
    queueSection: document.getElementById("queueSection"),
    resultsSection: document.getElementById("resultsSection"),
    totalFiles: document.getElementById("totalFiles"),
    processedFiles: document.getElementById("processedFiles"),
    pendingFiles: document.getElementById("pendingFiles"),
    failedFiles: document.getElementById("failedFiles"),
    progressFill: document.getElementById("progressFill"),
    pauseBtn: document.getElementById("pauseBtn"),
    cancelBtn: document.getElementById("cancelBtn"),
    downloadAllBtn: document.getElementById("downloadAllBtn"),
    clearResultsBtn: document.getElementById("clearResultsBtn"),
    newBatchBtn: document.getElementById("newBatchBtn"),
    queueList: document.getElementById("queueList"),
    resultsGrid: document.getElementById("resultsGrid"),
    concurrentUploads: document.getElementById("concurrentUploads"),
    autoDownload: document.getElementById("autoDownload"),
    qualityLevel: document.getElementById("qualityLevel"),
    toastContainer: document.getElementById("toastContainer"),
    loadingOverlay: document.getElementById("loadingOverlay")
  };
  constructor() {
    this.initializeEventListeners();
    this.loadSettings();
    this.showToast("¡Listo para procesar imágenes!", "success");
  }
  initializeEventListeners() {
    this.elements.selectFilesBtn.addEventListener("click", () => {
      this.elements.fileInput.click();
    });
    this.elements.fileInput.addEventListener("change", (e) => {
      const files = e.target.files;
      if (files) {
        this.addFiles(Array.from(files));
      }
    });
    this.elements.uploadArea.addEventListener("click", () => {
      this.elements.fileInput.click();
    });
    this.elements.uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      this.elements.uploadArea.classList.add("dragover");
    });
    this.elements.uploadArea.addEventListener("dragleave", () => {
      this.elements.uploadArea.classList.remove("dragover");
    });
    this.elements.uploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      this.elements.uploadArea.classList.remove("dragover");
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length > 0) {
        this.addFiles(files);
      }
    });
    this.elements.pauseBtn.addEventListener("click", () => this.togglePause());
    this.elements.cancelBtn.addEventListener("click", () => this.cancelAll());
    this.elements.downloadAllBtn.addEventListener("click", () => this.downloadAll());
    this.elements.clearResultsBtn.addEventListener("click", () => this.clearResults());
    this.elements.newBatchBtn.addEventListener("click", () => this.newBatch());
    this.elements.concurrentUploads.addEventListener("change", () => this.updateSettings());
    this.elements.autoDownload.addEventListener("change", () => this.updateSettings());
    this.elements.qualityLevel.addEventListener("change", () => this.updateSettings());
  }
  addFiles(files) {
    const imageFiles = files.filter((file) => file.type.startsWith("image/") || file.name.toLowerCase().endsWith(".heic"));
    if (imageFiles.length === 0) {
      this.showToast("No se encontraron archivos de imagen válidos", "warning");
      return;
    }
    imageFiles.forEach((file) => {
      const job = {
        id: this.generateJobId(),
        file,
        status: "pending"
      };
      this.jobs.set(job.id, job);
    });
    this.showToast(`${imageFiles.length} imágenes añadidas a la cola`, "success");
    this.updateUI();
    this.startProcessing();
  }
  async startProcessing() {
    if (this.isPaused)
      return;
    this.elements.processingSection.style.display = "block";
    this.elements.queueSection.style.display = "block";
    while (this.activeJobs.size < this.settings.concurrentUploads && this.hasPendingJobs() && !this.isPaused) {
      const pendingJob = this.getNextPendingJob();
      if (pendingJob) {
        this.processJob(pendingJob);
      }
    }
  }
  async processJob(job) {
    this.activeJobs.add(job.id);
    job.status = "processing";
    this.updateUI();
    try {
      const formData = new FormData;
      formData.append("image", job.file);
      const response = await fetch("/api/process-image", {
        method: "POST",
        body: formData
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      job.status = "completed";
      job.result = result;
      if (this.settings.autoDownload && result.processedImageUrl) {
        this.downloadImage(result.processedImageUrl, result.newName);
      }
      this.showToast(`✅ ${job.file.name} procesada correctamente`, "success");
    } catch (error) {
      job.status = "failed";
      job.error = error instanceof Error ? error.message : "Error desconocido";
      this.showToast(`❌ Error procesando ${job.file.name}`, "error");
    } finally {
      this.activeJobs.delete(job.id);
      this.updateUI();
      if (this.hasPendingJobs() && !this.isPaused) {
        setTimeout(() => this.startProcessing(), 100);
      } else if (!this.hasPendingJobs() && this.activeJobs.size === 0) {
        this.onProcessingComplete();
      }
    }
  }
  onProcessingComplete() {
    const completed = Array.from(this.jobs.values()).filter((job) => job.status === "completed");
    const failed = Array.from(this.jobs.values()).filter((job) => job.status === "failed");
    if (completed.length > 0) {
      this.elements.resultsSection.style.display = "block";
      this.showToast(`\uD83C\uDF89 Procesamiento completado: ${completed.length} exitosas, ${failed.length} errores`, "success");
    }
  }
  togglePause() {
    this.isPaused = !this.isPaused;
    this.elements.pauseBtn.textContent = this.isPaused ? "▶️ Reanudar" : "⏸️ Pausar";
    if (!this.isPaused) {
      this.startProcessing();
      this.showToast("Procesamiento reanudado", "info");
    } else {
      this.showToast("Procesamiento pausado", "warning");
    }
  }
  cancelAll() {
    this.isPaused = true;
    this.jobs.forEach((job) => {
      if (job.status === "pending") {
        this.jobs.delete(job.id);
      }
    });
    this.updateUI();
    this.showToast("Procesamiento cancelado", "warning");
  }
  async downloadAll() {
    const completedJobs = Array.from(this.jobs.values()).filter((job) => job.status === "completed" && job.result);
    if (completedJobs.length === 0) {
      this.showToast("No hay imágenes procesadas para descargar", "warning");
      return;
    }
    this.showToast(`Descargando ${completedJobs.length} imágenes...`, "info");
    for (const job of completedJobs) {
      if (job.result) {
        await this.downloadImage(job.result.processedImageUrl, job.result.newName);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
    this.showToast("Descarga completa", "success");
  }
  async downloadImage(url, filename) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  }
  clearResults() {
    this.jobs.clear();
    this.activeJobs.clear();
    this.elements.resultsSection.style.display = "none";
    this.elements.processingSection.style.display = "none";
    this.elements.queueSection.style.display = "none";
    this.updateUI();
    this.showToast("Resultados limpiados", "info");
  }
  newBatch() {
    this.clearResults();
    this.elements.fileInput.click();
  }
  updateSettings() {
    this.settings.concurrentUploads = parseInt(this.elements.concurrentUploads.value);
    this.settings.autoDownload = this.elements.autoDownload.checked;
    this.settings.qualityLevel = this.elements.qualityLevel.value;
    this.saveSettings();
  }
  loadSettings() {
    const saved = localStorage.getItem("mies-desktop-settings");
    if (saved) {
      this.settings = { ...this.settings, ...JSON.parse(saved) };
      this.elements.concurrentUploads.value = this.settings.concurrentUploads.toString();
      this.elements.autoDownload.checked = this.settings.autoDownload;
      this.elements.qualityLevel.value = this.settings.qualityLevel;
    }
  }
  saveSettings() {
    localStorage.setItem("mies-desktop-settings", JSON.stringify(this.settings));
  }
  updateUI() {
    const jobs = Array.from(this.jobs.values());
    const total = jobs.length;
    const completed = jobs.filter((job) => job.status === "completed").length;
    const pending = jobs.filter((job) => job.status === "pending").length;
    const failed = jobs.filter((job) => job.status === "failed").length;
    const processing = jobs.filter((job) => job.status === "processing").length;
    this.elements.totalFiles.textContent = total.toString();
    this.elements.processedFiles.textContent = completed.toString();
    this.elements.pendingFiles.textContent = (pending + processing).toString();
    this.elements.failedFiles.textContent = failed.toString();
    const progress = total > 0 ? (completed + failed) / total * 100 : 0;
    this.elements.progressFill.style.width = `${progress}%`;
    this.updateQueueList();
    this.updateResultsGrid();
  }
  updateQueueList() {
    const jobs = Array.from(this.jobs.values()).sort((a, b) => {
      const statusOrder = { processing: 0, pending: 1, completed: 2, failed: 3 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
    this.elements.queueList.innerHTML = jobs.map((job) => `
      <div class="queue-item ${job.status}">
        <div class="queue-item-icon">
          ${this.getStatusIcon(job.status)}
        </div>
        <div class="queue-item-info">
          <div class="queue-item-name">${job.file.name}</div>
          <div class="queue-item-status">${this.getStatusText(job)}</div>
        </div>
      </div>
    `).join("");
  }
  updateResultsGrid() {
    const completedJobs = Array.from(this.jobs.values()).filter((job) => job.status === "completed" && job.result);
    this.elements.resultsGrid.innerHTML = completedJobs.map((job) => `
      <div class="result-card">
        <img src="${job.result.processedImageUrl}" alt="${job.result.extractedTitle}" class="result-image">
        <div class="result-info">
          <div class="result-title">${job.result.extractedTitle}</div>
          <div class="result-filename">${job.result.newName}</div>
          <div class="result-meta">
            <span>${this.formatFileSize(job.result.originalSize)} → ${this.formatFileSize(job.result.processedSize)}</span>
            <span>${job.result.format}</span>
          </div>
          <div class="result-actions">
            <button class="btn-primary btn-small" onclick="app.downloadSingle('${job.result.processedImageUrl}', '${job.result.newName}')">
              \uD83D\uDCE5 Descargar
            </button>
            <button class="btn-secondary btn-small" onclick="app.viewImage('${job.result.processedImageUrl}')">
              \uD83D\uDC41️ Ver
            </button>
          </div>
        </div>
      </div>
    `).join("");
  }
  downloadSingle(url, filename) {
    this.downloadImage(url, filename);
  }
  viewImage(url) {
    window.open(url, "_blank");
  }
  getStatusIcon(status) {
    const icons = {
      pending: "⏳",
      processing: "⚡",
      completed: "✅",
      failed: "❌"
    };
    return icons[status] || "❓";
  }
  getStatusText(job) {
    switch (job.status) {
      case "pending":
        return "En cola";
      case "processing":
        return "Procesando...";
      case "completed":
        return `Completado - ${job.result?.extractedTitle || "Sin título"}`;
      case "failed":
        return `Error: ${job.error || "Desconocido"}`;
      default:
        return "Desconocido";
    }
  }
  formatFileSize(bytes) {
    if (bytes === 0)
      return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }
  hasPendingJobs() {
    return Array.from(this.jobs.values()).some((job) => job.status === "pending");
  }
  getNextPendingJob() {
    return Array.from(this.jobs.values()).find((job) => job.status === "pending") || null;
  }
  generateJobId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    this.elements.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 5000);
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const app = new DesktopImageProcessor;
  window.app = app;
});
