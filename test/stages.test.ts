import { describe, expect, it } from "vitest";

import { consumeNdjson } from "../src/client/ndjson.js";

/**
 * The streaming reader, tested directly. Its failure mode is the
 * dangerous kind: a stage that failed halfway reports it *in band*,
 * because the response was already 200 by then. Get this wrong and a
 * failed generation looks like a successful one with missing fields.
 */

function ndjsonResponse(lines: string[], chunkSize = 1_000_000): Response {
  const body = lines.join("\n");
  const bytes = new TextEncoder().encode(body);
  let offset = 0;

  return new Response(
    new ReadableStream({
      pull(controller) {
        if (offset >= bytes.length) {
          controller.close();
          return;
        }
        controller.enqueue(bytes.slice(offset, offset + chunkSize));
        offset += chunkSize;
      },
    }),
  );
}

const asDone = {
  isFinal: (e: { part?: unknown }) => e.part === "done",
  select: (e: { final?: unknown }) => e.final,
};

describe("consumeNdjson", () => {
  it("returns the final event's payload, discarding progress lines", async () => {
    const result = await consumeNdjson(
      ndjsonResponse([
        '{"part":"rubric","result":{"criteria":[]}}',
        '{"part":"scoring","result":{"cases":[]}}',
        '{"part":"done","final":{"call_site_id":"a.py:1","reused":false}}',
      ]),
      asDone,
    );

    expect(result).toEqual({ call_site_id: "a.py:1", reused: false });
  });

  // The case that matters: the HTTP status was 200 before the failure
  // happened, so an error event is the only signal there is.
  it("throws on an in-band error rather than returning a partial result", async () => {
    await expect(
      consumeNdjson(
        ndjsonResponse([
          '{"part":"rubric","result":{"criteria":[]}}',
          '{"error":"scoring failed: provider timeout"}',
        ]),
        asDone,
      ),
    ).rejects.toThrow("scoring failed: provider timeout");
  });

  it("throws when the stream ends before the result arrives", async () => {
    await expect(
      consumeNdjson(ndjsonResponse(['{"part":"rubric","result":{}}']), asDone),
    ).rejects.toThrow(/ended before the result/);
  });

  // Chunk boundaries fall wherever the network puts them, not on lines.
  it("reassembles events split across chunk boundaries", async () => {
    const result = await consumeNdjson(
      ndjsonResponse(
        [
          '{"part":"rubric","result":{"criteria":[1,2,3]}}',
          '{"part":"done","final":{"ok":true}}',
        ],
        7,
      ),
      asDone,
    );

    expect(result).toEqual({ ok: true });
  });

  it("reads a final line with no trailing newline", async () => {
    const result = await consumeNdjson(ndjsonResponse(['{"part":"done","final":{"ok":true}}']), asDone);

    expect(result).toEqual({ ok: true });
  });

  // A malformed line should not lose a result that arrives on its own.
  it("skips unparseable lines", async () => {
    const result = await consumeNdjson(
      ndjsonResponse(["not json at all", '{"part":"done","final":{"ok":true}}']),
      asDone,
    );

    expect(result).toEqual({ ok: true });
  });

  it("rejects a response with no body", async () => {
    await expect(consumeNdjson(new Response(null), asDone)).rejects.toThrow(/no response body/);
  });
});
