import { createClient } from '@deepgram/sdk';
import { env } from '../../config/env.js';
import type { SttAdapter, TranscriptResult, TranscriptSegment } from '../../types/adapters.js';
import { AppError } from '../../core/errors.js';

export function createDeepgramAdapter(): SttAdapter {
  const deepgram = createClient(env.DEEPGRAM_API_KEY);

  return {
    async transcribeFile({ audioBuffer, audioUrl, mimeType, enableDiarization = true }) {
      if (!audioBuffer && !audioUrl) {
        throw new AppError('Either audioBuffer or audioUrl must be provided', 400, 'STT_INVALID_INPUT');
      }

      const options = {
        model: 'nova-2-medical' as const,
        smart_format: true,
        diarize: enableDiarization,
        punctuate: true,
        utterances: true,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let result: any;

      if (audioBuffer) {
        const response = await deepgram.listen.prerecorded.transcribeFile(
          audioBuffer,
          { ...options, mimetype: mimeType },
        );
        result = response.result;
      } else {
        const response = await deepgram.listen.prerecorded.transcribeUrl(
          { url: audioUrl! },
          options,
        );
        result = response.result;
      }

      if (!result?.results?.channels?.[0]) {
        throw new AppError('Deepgram returned empty result', 502, 'STT_EMPTY_RESULT');
      }

      const channel = result.results.channels[0];
      const alternative = channel.alternatives[0];
      const fullText: string = alternative?.transcript ?? '';

      const utterances = result.results.utterances ?? [];
      const segments: TranscriptSegment[] = utterances.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (u: any) => ({
          speaker: u.speaker !== undefined ? `Speaker ${u.speaker}` : undefined,
          startSeconds: u.start,
          endSeconds: u.end,
          text: u.transcript,
        }),
      );

      const durationSeconds: number = result.metadata?.duration ?? 0;

      return { fullText, segments, durationSeconds } satisfies TranscriptResult;
    },
  };
}
