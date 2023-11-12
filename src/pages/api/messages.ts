import { encodeBase64 } from "oslo/encoding";
import { addMessageListener } from "../../lib/message";

export async function GET() {
  const textEncoder = new TextEncoder();
  let unsubscribe: () => void;
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(textEncoder.encode("\n"));
      unsubscribe = addMessageListener((message) => {
        let body = JSON.stringify({
          username: message.username,
          body: message.body,
          timestamp: Math.floor(message.date.getTime() / 1000),
        });
        body = encodeBase64(new TextEncoder().encode(body));
        controller.enqueue(textEncoder.encode("event: message\n"));
        controller.enqueue(textEncoder.encode("data: " + body + "\n\n"));
      });
    },
    cancel() {
      console.log("cancelled");
      unsubscribe();
    },
  });
  return new Response(stream, {
    headers: {
      "X-Content-Type-Options": "nosniff",
      "Content-Type": "text/event-stream; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
