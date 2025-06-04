/**
 * BackgroundAudioPlayer
 * 
 * A simple class to control background audio playback with a UI button.
 * - Disables the button until the audio is ready.
 * - Handles play, pause, stop, and volume control.
 * - Updates the button text based on playback state.
 * - Handles audio loading errors gracefully.
 *
 * @example
 * const player = new BackgroundAudioPlayer('/music.mp3', document.getElementById('audioBtn'), {
 *   playText: 'Play',
 *   pauseText: 'Pause',
 *   loop: true,
 *   volume: 0.7
 * });
 * 
 * // To destroy and clean up:
 * player.destroy();
 */
export class BackgroundAudioPlayer {
  #audio;
  #button;
  #playText;
  #pauseText;
  #onClick;
  #onPlay;
  #onPause;
  #onError;

  /**
   * @param {string} src - The audio file URL.
   * @param {HTMLElement} button - The button element to control playback.
   * @param {Object} [options]
   * @param {string} [options.playText='Start Music'] - Text for play state.
   * @param {string} [options.pauseText='Stop Music'] - Text for pause state.
   * @param {boolean} [options.loop=true] - Whether to loop the audio.
   * @param {number} [options.volume=0.5] - Initial volume (0 to 1).
   */
  constructor(src, button, options = {}) {
    this.#audio = new Audio(src);
    this.#audio.loop = options.loop ?? true;
    this.#audio.volume = options.volume ?? 0.5;
    this.#audio.preload = 'auto';

    this.#button = button;
    this.#playText = options.playText || 'Start Music';
    this.#pauseText = options.pauseText || 'Stop Music';

    // Disable button until audio is ready
    this.#button.disabled = true;

    // Bind handlers
    this.#onClick = () => this.toggle();
    this.#onPlay = () => this.#updateButton();
    this.#onPause = () => this.#updateButton();
    this.#onError = (e) => {
      console.error('Audio loading failed:', e);
      this.#button.disabled = true;
      this.#updateButton();
    };

    // Enable button when audio is ready
    this.#audio.addEventListener('canplaythrough', () => {
      this.#button.disabled = false;
      this.#updateButton();
    });

    this.#bindEvents();
    this.#updateButton();
  }

  #bindEvents() {
    this.#button.addEventListener('click', this.#onClick);
    this.#audio.addEventListener('play', this.#onPlay);
    this.#audio.addEventListener('pause', this.#onPause);
    this.#audio.addEventListener('error', this.#onError);
  }

  #updateButton() {
    this.#button.textContent = this.isPlaying() ? this.#pauseText : this.#playText;
  }

  /**
   * Play the audio.
   * @returns {Promise<void>}
   */
  async play() {
    try {
      await this.#audio.play();
    } catch (err) {
      console.warn('Playback failed:', err);
    }
  }

  /**
   * Pause the audio.
   */
  pause() {
    this.#audio.pause();
  }

  /**
   * Stop the audio and reset to start.
   */
  stop() {
    this.#audio.pause();
    this.#audio.currentTime = 0;
  }

  /**
   * Set the audio volume.
   * @param {number} volume - Volume between 0 and 1.
   */
  setVolume(volume) {
    this.#audio.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Check if the audio is currently playing.
   * @returns {boolean}
   */
  isPlaying() {
    return !this.#audio.paused;
  }

  /**
   * Toggle between play and stop.
   */
  toggle() {
    this.isPlaying() ? this.stop() : this.play();
  }

  /**
   * Clean up event listeners and pause audio.
   */
  destroy() {
    this.#audio.pause();
    this.#button.removeEventListener('click', this.#onClick);
    this.#audio.removeEventListener('play', this.#onPlay);
    this.#audio.removeEventListener('pause', this.#onPause);
    this.#audio.removeEventListener('error', this.#onError);
  }
}
