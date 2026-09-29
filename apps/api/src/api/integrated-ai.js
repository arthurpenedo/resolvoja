import process from 'node:process';
import { PassThrough } from 'node:stream';
import Anthropic from '@anthropic-ai/sdk';
import logger from '../utils/logger.js';
import pocketbaseClient from '../utils/pocketbaseClient.js';

const anthropicClient = new Anthropic();
const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-5';
const PREVIEW_MAX_TOKENS = 2048;

const MessageRole = Object.freeze({
	User: 'user',
	Assistant: 'assistant',
	Tool: 'tool',
});

const SSEEventType = Object.freeze({
	Content: 'content',
	Reasoning: 'reasoning',
	ToolUse: 'tool_use',
	ToolResult: 'tool_result',
	Usage: 'usage',
	Error: 'error',
	Done: 'done',
	Completed: 'completed',
});

export const ContentBlockType = Object.freeze({
	Text: 'text',
	Image: 'image',
});

const MAX_HISTORY_MESSAGES = 60;

/**
 * @typedef {typeof SSEEventType[keyof typeof SSEEventType]} SSEEventTypeValue
 */

/**
 * @typedef {object} SSEEventContent
 * @property {'content'} type
 * @property {{ content: string }} data
 * @property {{ agentName?: string }} [metadata]
 */

/**
 * @typedef {object} SSEEventToolUse
 * @property {'tool_use'} type
 * @property {{ toolId: string, toolName: string, inputParams: Record<string, any> }} data
 * @property {{ agentName?: string }} [metadata]
 */

/**
 * @typedef {object} SSEEventToolResult
 * @property {'tool_result'} type
 * @property {{ toolCallId: string, content: string }} data
 * @property {{ agentName?: string }} [metadata]
 */

/**
 * @typedef {object} GenerateImageInput
 * @property {string} prompt
 * @property {string} image_size
 */

/**
 * @typedef {object} GenerateImageToolCall
 * @property {string} id
 * @property {'generate_image'} name
 * @property {GenerateImageInput} input
 * @property {string} [thought_signature]
 */

/**
 * @typedef {object} SSEEventToolUseGenerateImage
 * @property {'tool_use'} type
 * @property {{ role: string, agent_name: string, content: string, tool_calls: GenerateImageToolCall[] }} data
 * @property {{ agent_name: string }} [metadata]
 */

/**
 * @typedef {object} SSEEventToolResultGenerateImage
 * @property {'tool_result'} type
 * @property {{ tool_call_id: string, tool_name: 'generate_image', agent_name: string, content: string }} data
 * @property {{ agent_name: string }} [metadata]
 */

/**
 * @typedef {object} SSEEventUsage
 * @property {'usage'} type
 * @property {{ input_tokens: number, output_total_tokens: number, output_reasoning_tokens: number, output_non_reasoning_tokens: number, cache_creation_tokens: number, cache_read_tokens: number }} data
 */

/**
 * @typedef {object} SSEEventError
 * @property {'error'} type
 * @property {{ content: string }} data
 */

/**
 * @typedef {object} SSEEventDone
 * @property {'done'} type
 * @property {{ content: string }} data
 */

/**
 * @typedef {SSEEventContent | SSEEventToolUse | SSEEventToolResult | SSEEventUsage | SSEEventError | SSEEventDone} SSEEvent
 */

/**
 * @typedef {SSEEventContent | SSEEventToolUse | SSEEventToolResult} SSEEventHistory
 */

/**
 * @typedef {object} TextContentBlock
 * @property {string} text
 * @property {'text'} type
 */

/**
 * @typedef {object} ImageContentBlock
 * @property {string} image
 * @property {'image'} type
 */

/**
 * @typedef {TextContentBlock | ImageContentBlock} ContentBlock
 */

/**
 * @typedef {object} HistoryMessage
 * @property {string} role
 * @property {string} content
 * @property {string[]} [images]
 * @property {Array<{ id: string, type: string, function: { name: string, arguments: string } }>} [tool_calls]
 * @property {string} [tool_call_id]
 * @property {string} [agent_name]
 */

/**
 * Uploads images to PocketBase and returns their URLs.
 *
 * @param {{ images: Express.Multer.File[] }} params
 * @returns {Promise<string[]>}
 */
export async function uploadImagesToPocketBase({ images }) {
	const uploadPromises = images.map(async (file) => {
		const formData = new FormData();
		const blob = new Blob([file.buffer], { type: file.mimetype });
		formData.append('file', blob, file.originalname);

		const record = await pocketbaseClient.collection('_integratedAiImages').create(formData);

		const url = pocketbaseClient.files.getURL(record, record.file);

		return url.replace(process.env.POCKETBASE_URL || 'http://localhost:8090', process.env.POCKETBASE_PUBLIC_URL || 'http://localhost:8090');
	});

	return Promise.all(uploadPromises);
}

/**
 * Appends a file token to a URL, respecting any existing query string.
 *
 * @param {string} url
 * @param {string} token
 * @returns {string}
 */
function appendToken(url, token) {
	const signedUrl = new URL(url);
	signedUrl.searchParams.append('token', token);

	return signedUrl.toString();
}

/**
 * Signs a stored image reference with a short-lived file token so the AI service can fetch it.
 * Handles both full URLs and origin-less `/api/files/...` paths.
 *
 * @param {string} reference
 * @param {string} token
 * @returns {string}
 */
function signImageReference(reference, token) {
	if (!reference || !token) {
		return reference;
	}

	if (/^https?:\/\//i.test(reference)) {
		return appendToken(reference, token);
	}

	const base = process.env.POCKETBASE_PUBLIC_URL || 'http://localhost:8090';
	const path = reference.startsWith('/') ? reference : `/${reference}`;

	return appendToken(`${base}${path}`, token);
}

/**
 * Sends a message to the Claude API and pipes SSE events to the client, in the same
 * wire format the frontend already expects (SSEEventType.Content / .Error / .Completed).
 * Assistant message is saved to PocketBase when the stream ends.
 * This method should be used for text/text, image/text, image/image, text/image combinations.
 *
 * @param {{ userId: string, systemPrompt: string, userMessage: ContentBlock[] }} params
 * @returns {Promise<import('node:stream').Readable>}
 */
export async function stream({ userId, systemPrompt, userMessage }) {
	const fileToken = await pocketbaseClient.files.getToken();
	const history = await getHistory({ userId, fileToken });
	const anthropicMessages = buildAnthropicMessages({ history, userMessage, fileToken });

	const passThrough = new PassThrough();

	streamFromAnthropic({ userId, systemPrompt, userMessage, anthropicMessages, passThrough }).catch((error) => {
		logger.error('Failed to stream from Anthropic', error);
		passThrough.write(`data: ${JSON.stringify({ type: SSEEventType.Error, data: toClientError(error) })}\n\n`);
	}).finally(() => {
		passThrough.end(`data: ${JSON.stringify({ type: SSEEventType.Completed, data: { content: '[COMPLETED]' } })}\n\n`);
	});

	return passThrough;
}

export const AiErrorCode = Object.freeze({
	Unavailable: 'ai_unavailable',
	RateLimited: 'ai_rate_limited',
	Refused: 'ai_refused',
});

class PreviewRefusedError extends Error {}

/**
 * Maps an Anthropic/SDK failure to a message that is safe to show to the visitor.
 * Configuration problems (invalid key, no credits) and outages never leak raw API text.
 *
 * @param {unknown} error
 * @returns {{ content: string, code: string }}
 */
export function toClientError(error) {
	if (error instanceof PreviewRefusedError) {
		return { code: AiErrorCode.Refused, content: error.message };
	}

	if (error instanceof Anthropic.RateLimitError) {
		return {
			code: AiErrorCode.RateLimited,
			content: 'Muitas prévias sendo geradas agora. Seu pedido foi registrado; tente gerar a prévia de novo em alguns minutos.',
		};
	}

	return {
		code: AiErrorCode.Unavailable,
		content: 'A prévia instantânea está indisponível no momento. Seu pedido foi registrado e nossa equipe responde por e-mail.',
	};
}

/**
 * Streams a completion from the Claude API, forwarding text deltas to the client
 * as they arrive and saving the full assistant message to PocketBase once done.
 *
 * @param {{ userId: string, systemPrompt: string, userMessage: ContentBlock[], anthropicMessages: Anthropic.MessageParam[], passThrough: import('node:stream').PassThrough }} params
 * @returns {Promise<void>}
 */
async function streamFromAnthropic({ userId, systemPrompt, userMessage, anthropicMessages, passThrough }) {
	const anthropicStream = anthropicClient.messages.stream({
		model: process.env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL,
		max_tokens: PREVIEW_MAX_TOKENS,
		thinking: { type: 'disabled' },
		system: systemPrompt,
		messages: anthropicMessages,
	});

	let assistantText = '';

	for await (const event of anthropicStream) {
		if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
			assistantText += event.delta.text;
			passThrough.write(`data: ${JSON.stringify({ type: SSEEventType.Content, data: { content: event.delta.text } })}\n\n`);
		}
	}

	const finalMessage = await anthropicStream.finalMessage();

	if (finalMessage.stop_reason === 'refusal') {
		throw new PreviewRefusedError('A IA recusou gerar esta prévia. Tente reformular o problema descrito.');
	}

	await saveMessages({ userId, messages: [
		{
			role: MessageRole.User,
			content: userMessage,
		},
		{
			role: MessageRole.Assistant,
			content: [{ type: SSEEventType.Content, data: { content: assistantText } }],
		},
	] });
}

/**
 * Converts stored history plus the current user turn into Anthropic Messages API format.
 *
 * @param {{ history: HistoryMessage[], userMessage: ContentBlock[], fileToken?: string }} params
 * @returns {Anthropic.MessageParam[]}
 */
function buildAnthropicMessages({ history, userMessage, fileToken }) {
	const messages = history
		.filter(message => message.role === MessageRole.User || message.role === MessageRole.Assistant)
		.map(message => ({
			role: message.role,
			content: mapHistoryMessageToAnthropicContent({ message }),
		}));

	messages.push({
		role: MessageRole.User,
		content: mapCurrentUserMessageToAnthropicContent({ message: userMessage, fileToken }),
	});

	return messages;
}

/**
 * @param {{ message: HistoryMessage }} params
 * @returns {Array<{ type: string, text?: string, source?: object }>}
 */
function mapHistoryMessageToAnthropicContent({ message }) {
	const blocks = [];

	if (message.content) {
		blocks.push({ type: 'text', text: message.content });
	}

	for (const imageUrl of message.images || []) {
		blocks.push({ type: 'image', source: { type: 'url', url: imageUrl } });
	}

	return blocks;
}

/**
 * @param {{ message: ContentBlock[], fileToken?: string }} params
 * @returns {Array<{ type: string, text?: string, source?: object }>}
 */
function mapCurrentUserMessageToAnthropicContent({ message, fileToken }) {
	return message.map((block) => {
		if (block.type === ContentBlockType.Image) {
			return { type: 'image', source: { type: 'url', url: signImageReference(block.image, fileToken) } };
		}

		return { type: 'text', text: block.text };
	});
}

/**
 * @param {{ userId: string, messages: { role: typeof MessageRole[keyof typeof MessageRole], content: string }[] }} params
 * @returns {Promise<object>}
 */
async function saveMessages({ userId, messages }) {
	const batch = pocketbaseClient.createBatch();

	messages.map(message => batch.collection('_integratedAiMessages').create({
		...(userId && { userId }),
		role: message.role,
		content: message.content,
	}));

	await batch.send();
}

/**
 * Fetches message history and maps it to HistoryMessage format.
 *
 * @param {{ userId: string, fileToken?: string }} params
 * @returns {Promise<HistoryMessage[]>}
 */
export async function getHistory({ userId, fileToken }) {
	if (!userId) {
		return [];
	}

	const result = await pocketbaseClient.collection('_integratedAiMessages').getList(1, MAX_HISTORY_MESSAGES, {
		sort: '-created',
		...(userId && { filter: pocketbaseClient.filter('userId = {:userId}', { userId }) }),
	});

	const records = result.items.reverse();

	/** @type {HistoryMessage[]} */
	const historyMessages = [];

	for (const record of records) {
		if (record.role === MessageRole.User) {
			historyMessages.push(mapUserMessage({ message: record.content, fileToken }));
			continue;
		}

		historyMessages.push(...mapAssistantMessages({ message: record.content, fileToken }));
	}

	return historyMessages;
}

/**
 * @param {{ message: ContentBlock[], fileToken?: string }} params
 * @returns {HistoryMessage}
 */
function mapUserMessage({ message, fileToken }) {
	const textParts = message.filter(b => b.type === ContentBlockType.Text).map(b => b.text);
	const images = message
		.filter(b => b.type === ContentBlockType.Image)
		.map(b => signImageReference(b.image, fileToken));

	return {
		role: MessageRole.User,
		content: textParts.join('\n'),
		...(images.length > 0 && { images }),
	};
}

/**
 * @param {{ message: SSEEventHistory[], fileToken?: string }} params
 * @returns {HistoryMessage[]}
 */
function mapAssistantMessages({ message, fileToken }) {
	/** @type {HistoryMessage[]} */
	const messages = [];

	for (const event of message) {
		const agentName = event?.metadata?.agent_name;

		if (event.type === SSEEventType.ToolResult) {
			const content = event.data.content;
			const isImageResult = event.data.tool_name === 'generate_image'
				|| (typeof content === 'string' && !/\s/.test(content) && content.includes('/api/files/'));

			messages.push({
				role: MessageRole.Tool,
				tool_call_id: event.data.tool_call_id,
				content: isImageResult ? signImageReference(content, fileToken) : content,
				...(agentName && { agent_name: agentName }),
			});
			continue;
		}

		messages.push({
			role: MessageRole.Assistant,
			content: event.data.content,
			...(event.type === SSEEventType.ToolUse && {
				tool_calls: event.data.tool_calls.map(toolCall => ({
					id: toolCall.id,
					type: 'function',
					function: {
						name: toolCall.name,
						arguments: JSON.stringify(toolCall.input),
					},
				})),
			}),
			...(agentName && { agent_name: agentName }),
		});
	}

	return messages;
}
