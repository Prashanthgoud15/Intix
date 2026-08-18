import Groq from 'groq-sdk';
import env from '../config/env.js';
import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

class SpeechService {
    constructor() {
        this.client = new Groq({ apiKey: env.GROQ_API_KEY });
        this.model = 'whisper-large-v3-turbo';
    }

    /**
     * Transcribe an audio buffer using Groq Whisper API
     * @param {Buffer} audioBuffer - The audio file buffer
     * @param {string} mimetype - The mime type of the audio
     * @returns {Promise<string>} - The transcribed text
     */
    async transcribeAudio(audioBuffer, mimetype = 'audio/webm') {
        // Determine extension based on mimetype
        let ext = '.webm';
        if (mimetype.includes('mp4')) ext = '.mp4';
        else if (mimetype.includes('mp3')) ext = '.mp3';
        else if (mimetype.includes('wav')) ext = '.wav';
        else if (mimetype.includes('ogg')) ext = '.ogg';

        // Groq SDK requires a File object or a ReadStream.
        // We'll write the buffer to a temporary file, read it, and then delete it.
        const tempFilePath = path.join(os.tmpdir(), `audio_${uuidv4()}${ext}`);

        try {
            // Write buffer to temp file
            fs.writeFileSync(tempFilePath, audioBuffer);

            // Create a read stream for the Groq SDK
            const fileStream = fs.createReadStream(tempFilePath);

            logger.info(`Transcribing audio using ${this.model}...`);

            const transcription = await this.client.audio.transcriptions.create({
                file: fileStream,
                model: this.model,
                response_format: 'verbose_json',
                timestamp_granularities: ['word'],
                language: 'en',
            });

            return {
                text: transcription.text || '',
                words: transcription.words || []
            };
        } catch (error) {
            logger.error(`Speech transcription failed: ${error.message}`);
            throw new Error('Failed to transcribe audio. Please try again.');
        } finally {
            // Clean up temp file
            if (fs.existsSync(tempFilePath)) {
                try {
                    fs.unlinkSync(tempFilePath);
                } catch (e) {
                    logger.warn(`Failed to delete temp audio file: ${e.message}`);
                }
            }
        }
    }
}

export default new SpeechService();
