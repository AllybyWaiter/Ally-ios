/**
 * Stream Parser Utility
 * 
 * Parses SSE stream from AI API to detect tool calls vs content.
 * Accumulates tool call arguments that arrive in chunks.
 */

export interface ToolCallDelta {
  index: number;
  id?: string;
  type?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
}

export interface AccumulatedToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

export interface StreamParseResult {
  hasToolCalls: boolean;
  toolCalls: AccumulatedToolCall[];
  contentBuffer: string;
  finishReason: string | null;
}

interface StreamParseOptions {
  maxStreamBytes?: number;
}

/**
 * Parse a complete SSE stream to detect tool calls and accumulate content.
 * Uses buffering strategy for reliability.
 */
export async function parseStreamForToolCalls(
  response: Response,
  options: StreamParseOptions = {}
): Promise<StreamParseResult> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body to parse');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let contentBuffer = '';
  const toolCallsMap = new Map<number, AccumulatedToolCall>();
  let finishReason: string | null = null;
  const maxStreamBytes = options.maxStreamBytes ?? 2_000_000;
  let consumedBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      consumedBytes += value.byteLength;
      if (consumedBytes > maxStreamBytes) {
        throw new Error('OPENAI_STREAM_BUFFER_EXCEEDED');
      }

      buffer += decoder.decode(value, { stream: true });
      
      // Process complete SSE lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          
          if (data === '[DONE]') {
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta;
            const choice = parsed.choices?.[0];
            
            // Capture finish reason
            if (choice?.finish_reason) {
              finishReason = choice.finish_reason;
            }

            // Accumulate content
            if (delta?.content) {
              contentBuffer += delta.content;
            }

            // Accumulate tool calls
            if (delta?.tool_calls) {
              for (const toolCallDelta of delta.tool_calls as ToolCallDelta[]) {
                const idx = toolCallDelta.index;
                
                if (!toolCallsMap.has(idx)) {
                  // Initialize new tool call
                  toolCallsMap.set(idx, {
                    id: toolCallDelta.id || '',
                    type: toolCallDelta.type || 'function',
                    function: {
                      name: toolCallDelta.function?.name || '',
                      arguments: toolCallDelta.function?.arguments || '',
                    },
                  });
                } else {
                  // Accumulate to existing tool call
                  const existing = toolCallsMap.get(idx)!;
                  if (toolCallDelta.id) existing.id = toolCallDelta.id;
                  if (toolCallDelta.type) existing.type = toolCallDelta.type;
                  if (toolCallDelta.function?.name) {
                    existing.function.name = toolCallDelta.function.name;
                  }
                  if (toolCallDelta.function?.arguments) {
                    existing.function.arguments += toolCallDelta.function.arguments;
                  }
                }
              }
            }
          } catch {
            // Skip invalid JSON chunks
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Convert map to sorted array
  // Only require function.name for filtering (id may arrive late in stream)
  const toolCalls = Array.from(toolCallsMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([, tc]) => tc)
    .filter(tc => tc.function.name); // Only require name, id may come late

  return {
    hasToolCalls: toolCalls.length > 0,
    toolCalls,
    contentBuffer,
    finishReason,
  };
}

/**
 * Convert accumulated content buffer to an SSE stream format.
 * Used when we've already parsed the stream but need to return it as SSE.
 */
export function createContentStream(content: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      // Send content in a single chunk formatted as SSE
      const sseData = {
        choices: [{
          delta: { content },
          index: 0,
          finish_reason: null
        }]
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(sseData)}\n\n`));

      // Send finish marker
      const finishData = {
        choices: [{
          delta: {},
          index: 0,
          finish_reason: 'stop'
        }]
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(finishData)}\n\n`));
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    }
  });
}

/**
 * Tool execution feedback interface for streaming to client
 */
export interface ToolExecutionFeedback {
  toolName: string;
  success: boolean;
  message: string;
}

/**
 * Data card payload for water test visualizations
 */
export interface DataCardPayload {
  card_type: 'latest_test' | 'parameter_trend' | 'tank_summary';
  title: string;
  aquarium_name: string;
  timestamp: string;
  test_count?: number;
  parameters: Array<{
    name: string;
    value: number;
    unit: string;
    status: 'good' | 'warning' | 'critical';
    trend?: 'up' | 'down' | 'stable';
    sparkline?: number[];
    change?: number;
  }>;
}

/**
 * Create a stream that first emits tool execution feedback and data cards, then pipes the AI response.
 * The tool_executions event allows the UI to show confirmations before the AI response.
 * Data cards are shown as visual components for water test results.
 */
export function createToolExecutionStream(
  toolExecutions: ToolExecutionFeedback[],
  aiResponseStream: ReadableStream<Uint8Array> | null,
  dataCards?: DataCardPayload[]
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      // First, send tool execution feedback as a custom SSE event
      const toolEvent = {
        type: 'tool_executions',
        executions: toolExecutions,
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(toolEvent)}\n\n`));

      // Send data cards if present
      if (dataCards && dataCards.length > 0) {
        for (const card of dataCards) {
          const cardEvent = {
            type: 'data_card',
            card,
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(cardEvent)}\n\n`));
        }
      }

      // Then pipe through the AI response
      if (aiResponseStream) {
        const reader = aiResponseStream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } finally {
          reader.releaseLock();
        }
      }

      controller.close();
    },
  });
}
