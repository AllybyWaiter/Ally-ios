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

/**
 * Parse a complete SSE stream to detect tool calls and accumulate content.
 * Uses buffering strategy for reliability.
 */
export async function parseStreamForToolCalls(
  response: Response
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

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

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
  const toolCalls = Array.from(toolCallsMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([, tc]) => tc)
    .filter(tc => tc.id && tc.function.name); // Filter out incomplete tool calls

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
