interface Window {
  /** Present only inside the Pondy Hub Android app (see mobile/android ImageSaver). */
  PondyHubApp?: {
    saveImage(dataUrl: string, fileName: string): boolean
  }
}
