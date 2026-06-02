import type { Readable } from 'stream';

// ─── AI Chat ───────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiChatAdapter {
  chat(params: {
    systemPrompt: string;
    messages: ChatMessage[];
    maxTokens?: number;
    temperature?: number;
  }): Promise<string>;

  streamChat(params: {
    systemPrompt: string;
    messages: ChatMessage[];
    onChunk: (chunk: string) => void;
  }): Promise<void>;
}

// ─── Embeddings ────────────────────────────────────────────────────────────

export interface EmbeddingAdapter {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

// ─── STT ───────────────────────────────────────────────────────────────────

export interface TranscriptSegment {
  speaker?: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
}

export interface TranscriptResult {
  fullText: string;
  segments: TranscriptSegment[];
  durationSeconds: number;
}

export interface SttAdapter {
  transcribeFile(params: {
    audioBuffer?: Buffer;
    audioUrl?: string;
    mimeType: string;
    enableDiarization?: boolean;
  }): Promise<TranscriptResult>;
}

// ─── Storage ───────────────────────────────────────────────────────────────

export interface StorageAdapter {
  upload(params: {
    bucket: string;
    key: string;
    body: Buffer | Readable;
    contentType: string;
    metadata?: Record<string, string>;
  }): Promise<{ url: string }>;

  download(bucket: string, key: string): Promise<Buffer>;

  getSignedUrl(bucket: string, key: string, expiresInSeconds: number): Promise<string>;

  delete(bucket: string, key: string): Promise<void>;
}

// ─── OCR ───────────────────────────────────────────────────────────────────

export interface OcrAdapter {
  extractText(params: {
    imageBuffer: Buffer;
    mimeType: 'image/jpeg' | 'image/png' | 'application/pdf';
  }): Promise<{ text: string; confidence?: number }>;
}

// ─── Email ─────────────────────────────────────────────────────────────────

export interface EmailAdapter {
  send(params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void>;
}

// ─── LiveKit ───────────────────────────────────────────────────────────────

export interface LiveKitRoomInfo {
  sid: string;
  name: string;
  numParticipants: number;
  creationTime: bigint;
}

export interface LiveKitParticipantInfo {
  sid: string;
  identity: string;
  name: string;
  metadata: string;
}

export interface LiveKitAdapter {
  createRoomToken(params: {
    roomName: string;
    participantIdentity: string;
    participantName: string;
    canPublish: boolean;
    canSubscribe: boolean;
    metadata?: string;
  }): Promise<string>;

  createRoom(roomName: string): Promise<LiveKitRoomInfo>;

  deleteRoom(roomName: string): Promise<void>;

  listParticipants(roomName: string): Promise<LiveKitParticipantInfo[]>;
}

// ─── PDF Export ────────────────────────────────────────────────────────────

export interface PdfExportAdapter {
  generateFromHtml(html: string): Promise<Buffer>;
}

// ─── Vector Chunk ──────────────────────────────────────────────────────────

export interface VectorChunk {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  documentType: string;
  documentId?: string;
  appointmentId?: string;
}
