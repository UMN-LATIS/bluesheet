// a workaround for creating web workers in vite with typescript
// see: https://github.com/vitejs/vite/issues/13680#issuecomment-1819274694

export default class ViteWorker extends Worker {
  objectUrl: string | null = null;
  eventListeners = new Map<string, EventListener[]>();

  constructor(workerURL: string, workerOptions: WorkerOptions = {}) {
    const js = `import ${JSON.stringify(new URL(workerURL, import.meta.url))}`;
    const blob = new Blob([js], { type: "application/javascript" });
    const objectURL = URL.createObjectURL(blob);

    super(objectURL, { type: "module", ...workerOptions });

    this.objectUrl = objectURL;
  }

  terminate() {
    super.terminate();
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }

  // track event listeners for cleanup
  addEventListener(
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions,
  ): void {
    const currentListeners = this.eventListeners.get(type) || [];

    this.eventListeners.set(type, [...currentListeners, listener]);
    return super.addEventListener(type, listener, options);
  }

  removeEventListener(type: string, listener: EventListener) {
    const currentListeners = this.eventListeners.get(type);

    if (!currentListeners) {
      throw new Error(`No listeners found for event type: ${type}`);
    }

    this.eventListeners.set(
      type,
      currentListeners.filter((l) => l !== listener),
    );

    super.removeEventListener(type, listener);
  }

  removeAllEventListeners() {
    for (const [type, listeners] of this.eventListeners.entries()) {
      for (const listener of listeners) {
        this.removeEventListener(type, listener);
      }
    }
  }
}
