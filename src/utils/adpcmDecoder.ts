/**
 * ADPCM Audio Decoder
 * Decodes IMA ADPCM compressed audio from OpenWebRX/KiwiSDR
 */

// IMA ADPCM step size table
const STEP_TABLE = [
  7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41, 45,
  50, 55, 60, 66, 73, 80, 88, 97, 107, 118, 130, 143, 157, 173, 190, 209, 230,
  253, 279, 307, 337, 371, 408, 449, 494, 544, 598, 658, 724, 796, 876, 963,
  1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066, 2272, 2499, 2749, 3024, 3327,
  3660, 4026, 4428, 4871, 5358, 5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487,
  12635, 13899, 15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767
];

// IMA ADPCM index adjustment table
const INDEX_TABLE = [
  -1, -1, -1, -1, 2, 4, 6, 8,
  -1, -1, -1, -1, 2, 4, 6, 8
];

export class ADPCMDecoder {
  private predictor: number = 0;
  private stepIndex: number = 0;

  reset() {
    this.predictor = 0;
    this.stepIndex = 0;
  }

  /**
   * Decode IMA ADPCM to 16-bit PCM
   */
  decode(adpcmData: Uint8Array): Int16Array {
    const outputLength = adpcmData.length * 2; // Each byte contains 2 samples (4-bit each)
    const pcmData = new Int16Array(outputLength);
    let outputIndex = 0;

    for (let i = 0; i < adpcmData.length; i++) {
      const byte = adpcmData[i];

      // Decode low nibble (first sample)
      const nibble1 = byte & 0x0F;
      pcmData[outputIndex++] = this.decodeSample(nibble1);

      // Decode high nibble (second sample)
      const nibble2 = (byte >> 4) & 0x0F;
      pcmData[outputIndex++] = this.decodeSample(nibble2);
    }

    return pcmData;
  }

  /**
   * Decode a single 4-bit ADPCM sample to 16-bit PCM
   */
  private decodeSample(nibble: number): number {
    const step = STEP_TABLE[this.stepIndex];

    // Compute difference
    let diff = step >> 3;
    if (nibble & 1) diff += step >> 2;
    if (nibble & 2) diff += step >> 1;
    if (nibble & 4) diff += step;
    if (nibble & 8) diff = -diff;

    // Update predictor
    this.predictor += diff;

    // Clamp to 16-bit range
    if (this.predictor > 32767) this.predictor = 32767;
    if (this.predictor < -32768) this.predictor = -32768;

    // Update step index
    this.stepIndex += INDEX_TABLE[nibble];
    if (this.stepIndex < 0) this.stepIndex = 0;
    if (this.stepIndex > 88) this.stepIndex = 88;

    return this.predictor;
  }

  /**
   * Decode and convert to Float32Array for Web Audio API
   */
  decodeToFloat32(adpcmData: Uint8Array): Float32Array {
    const pcmData = this.decode(adpcmData);
    const floatData = new Float32Array(pcmData.length);

    // Convert 16-bit PCM to float [-1.0, 1.0]
    for (let i = 0; i < pcmData.length; i++) {
      floatData[i] = pcmData[i] / 32768.0;
    }

    return floatData;
  }
}

/**
 * Simple PCM decoder for uncompressed audio
 */
export class PCMDecoder {
  /**
   * Convert 16-bit PCM to Float32Array for Web Audio API
   */
  static decode(pcmData: Int16Array): Float32Array {
    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      floatData[i] = pcmData[i] / 32768.0;
    }
    return floatData;
  }

  /**
   * Decode from ArrayBuffer
   */
  static decodeBuffer(buffer: ArrayBuffer): Float32Array {
    const pcmData = new Int16Array(buffer);
    return this.decode(pcmData);
  }
}
