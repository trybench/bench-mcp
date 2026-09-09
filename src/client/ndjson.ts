/**
 * Consumes a newline-delimited JSON response.
 *
 * Some bench-api endpoints stream progress as one JSON object per line
 * rather than resolving once, so the caller can show "N of M done" while
 * a slow stage runs. An MCP tool call returns exactly once, so this
 * collapses the stream to its final line.
 *
 * The reason this cannot just be `await response.json()`: the useful
 * result arrives in the last line, and a mid-stream failure is reported
 * *in band* as an event rather than as an HTTP status — by then the
 * response is already 200 and there is no status left to change. So an
 * error event has to be turned back into a thrown error here, or a failed
 * generation would look like a successful one with missing fields.
 */

export interface NdjsonEvent {
  error?: string;
  [key: string]: unknown;
}

export interface ConsumeOptions<T> {
  /** Picks the event that carries the finished result. */
  isFinal: (event: NdjsonEvent) => boolean;
  /** Extracts the value to return from that event. */
  select: (event: NdjsonEvent) => T;
}

export async function consumeNdjson<T>(
  response: Response,
  { isFinal, select }: ConsumeOptions<T>,
): Promise<T> {
  if (!response.body) throw new Error("bench-api returned no response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let final: NdjsonEvent | undefined;

  const handle = (line: string): void => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let event: NdjsonEvent;
    try {
      event = JSON.parse(trimmed) as NdjsonEvent;
    } catch {
      // A malformed line is not worth failing the whole stream over;
      // the final event is what matters and arrives on its own line.
      return;
    }

    // In-band failure: the HTTP status was already 200 by the time this
    // was written, so this is the only way the server can report it.
    if (event.error) throw new Error(event.error);
    if (isFinal(event)) final = event;
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newline: number;
      while ((newline = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        handle(line);
      }
    }
    // A stream that ends without a trailing newline still has a line left.
    handle(buffer);
  } finally {
    reader.releaseLock();
  }

  if (!final) {
    throw new Error("bench-api's response ended before the result arrived");
  }
  return select(final);
}
