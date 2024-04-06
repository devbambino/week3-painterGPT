import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';

export async function POST(req: Request) {
    const { messages } = await req.json();
    const assist_id = process.env.ASSISTANT_ID!;
    let readableStream: ReadableStream<any> = new ReadableStream();

    const run = await openai.beta.threads.createAndRun({
        assistant_id: assist_id,
        thread: {
            messages: messages,
        },
    });
    let runStatus = await openai.beta.threads.runs.retrieve(run.thread_id, run.id);

    while (runStatus.status !== 'completed') {
      if (runStatus.status === 'failed' || runStatus.status === 'cancelled') {
        throw new Error(`The run has ended in a non-successful status: ${runStatus.status}`);
      }
      runStatus = await openai.beta.threads.runs.retrieve(run.thread_id, run.id);
    }
    const msgs = await openai.beta.threads.messages.list(run.thread_id);
    const res = msgs.data.at(0)?.content[0].text.value;
    return new Response(res, {
        status: 200,
    });
}