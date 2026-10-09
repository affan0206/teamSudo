import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

export function academicInsightBackendPlugin(): Plugin;
export function handleApiHttpRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean>;
