class BarcodeScanner {
  constructor() {
    this.scanner = null;
    this.isScanning = false;
  }

  createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'scanner-overlay';
    overlay.innerHTML = `
      <div class="scanner-container">
        <div class="scanner-header">
          <h3>Escanear Código de Barras</h3>
          <button id="scanner-close" class="scanner-close-btn" aria-label="Cerrar escáner">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div id="scanner-viewport"></div>
        <p class="scanner-hint">Enfoca el código de barras del medicamento</p>
        <div class="scanner-manual">
          <p>¿No funciona? Introduce el código manualmente:</p>
          <div class="scanner-manual-input">
            <input type="text" id="manual-barcode" placeholder="Ej. 8470006439029" inputmode="numeric" />
            <button id="manual-barcode-submit" class="btn-primary-small">Buscar</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));
    return overlay;
  }

  async startScan() {
    return new Promise((resolve) => {
      const overlay = this.createOverlay();

      const closeBtn = document.getElementById('scanner-close');
      const manualInput = document.getElementById('manual-barcode');
      const manualSubmit = document.getElementById('manual-barcode-submit');

      const cleanup = async () => {
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 300);
        await this.stopCamera();
      };

      closeBtn.addEventListener('click', async () => {
        await cleanup();
        resolve(null);
      });

      overlay.addEventListener('click', async (e) => {
        if (e.target === overlay) {
          await cleanup();
          resolve(null);
        }
      });

      manualSubmit.addEventListener('click', async () => {
        const code = manualInput.value.trim();
        if (code) {
          await cleanup();
          resolve(code);
        }
      });

      manualInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
          const code = manualInput.value.trim();
          if (code) {
            await cleanup();
            resolve(code);
          }
        }
      });

      this.initCamera(async (decodedText) => {
        await cleanup();
        resolve(decodedText);
      });
    });
  }

  async initCamera(onSuccess) {
    try {
      this.scanner = new Html5Qrcode('scanner-viewport');
      this.isScanning = true;

      await this.scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 150 },
          aspectRatio: 1.5,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E
          ]
        },
        (decodedText) => {
          onSuccess(decodedText);
        },
        () => {}
      );
    } catch (err) {
      console.error('Error al iniciar cámara:', err);
      const viewport = document.getElementById('scanner-viewport');
      if (viewport) {
        viewport.innerHTML = `
          <div class="scanner-error">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E24A12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>No se pudo acceder a la cámara.<br/>Usa la entrada manual a continuación.</p>
          </div>
        `;
      }
    }
  }

  async stopCamera() {
    if (this.scanner && this.isScanning) {
      try {
        await this.scanner.stop();
      } catch {}
      this.isScanning = false;
      this.scanner = null;
    }
  }
}

const barcodeScanner = new BarcodeScanner();
