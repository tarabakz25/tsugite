# AI Agent Feature

The AI Agent feature allows successors to consult with the previous proprietor through a RAG-based chat interface.

## Overview

**Core Message**: "The previous proprietor is always by your side."

The Agent uses Retrieval Augmented Generation (RAG) to reference accumulated tacit knowledge tags and interview transcripts, reproducing the proprietor's judgment patterns, speaking style, and personality to respond to successor questions via text and audio.

## Features

- **RAG-powered Responses**: Uses pgvector similarity search on tacit_tags and interviews to provide context-aware answers
- **Streaming Responses**: GPT-4 responses stream in real-time for better UX
- **Text-to-Speech**: OpenAI TTS generates audio for assistant responses with female voice
- **Citations**: Displays source tacit tags that were referenced in the response
- **Sample Questions**: Provides 3 sample questions to help users get started

## Architecture

### Data Flow

1. User submits a question
2. Question is converted to embedding vector using OpenAI text-embedding-3-small
3. The API verifies the signed-in user can access the requested shop
4. pgvector similarity search finds top-5 most similar tacit_tags
5. If fewer than 5 embedded tags are available, recent tacit_tags are used as fallback context
6. Related interview transcripts are retrieved based on matching tags
7. RAG prompt is built with context from tags and interviews
8. GPT-4o generates a streaming response in the proprietor's voice
9. Referenced tacit_tags are streamed to the UI as AI SDK data parts
10. OpenAI TTS converts the response to audio

### Technical Stack

| Layer         | Technology                                 |
| ------------- | ------------------------------------------ |
| DB Schema     | Drizzle + Supabase migrations              |
| Chat UI       | Next.js + Vercel AI SDK                    |
| Embedding     | OpenAI text-embedding-3-small              |
| Vector Search | Supabase RPC + pgvector                    |
| LLM           | GPT-4o                                     |
| TTS           | OpenAI TTS API (nova voice)                |
| Backend       | Next.js Route Handlers (`app/api/agent/*`) |

## File Structure

```
features/agent/
├── components/
│   └── agent-chat.tsx       # Chat UI component
└── README.md                # This file

lib/agent/
└── rag.ts                   # RAG utilities (embedding, search, prompt)

app/api/agent/
├── chat/route.ts            # POST /api/agent/chat
└── tts/route.ts             # POST /api/agent/tts

app/successor/agent/
└── page.tsx                 # Agent page

types/
└── agent.ts                 # Type definitions
```

## API Endpoints

### POST /api/agent/chat

Streams a response to the user's question using RAG.

**Request Body:**

```json
{
  "messages": [
    {
      "id": "message-id",
      "role": "user",
      "parts": [{ "type": "text", "text": "常連の田中様が来られた時の対応は？" }]
    }
  ],
  "shopId": "uuid"
}
```

**Response:**

- Streaming response using Vercel AI SDK UI message streams
- Citations are sent as a `data-citations` part and rendered below the assistant message

### POST /api/agent/tts

Converts text to speech using OpenAI TTS.

**Request Body:**

```json
{
  "text": "Response text to convert to audio"
}
```

**Response:**

- Audio/mpeg binary data

## Environment Variables

```bash
# Required for Agent feature
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Vector search uses the `match_tacit_tags_for_agent` RPC from migration
`20260506130000_agent_rag_rpc_and_access.sql`. If the RPC is not applied yet, Agent falls back
to recent tacit_tags so the chat can still answer from recorded tacit knowledge.

## Usage

### For Successors

1. Ensure the successor profile has a target shop ID in `profiles.organization_ids`
2. Navigate to `/successor/agent` in the app
3. Either:
   - Click one of the sample questions
   - Type your own question in the input field
4. Submit the question
5. View the streaming response
6. Click the audio button to hear the response
7. View citations to see which tacit_tags were referenced

### For Shops

1. Navigate to `/shop/agent` in the app
2. Either:
   - Click one of the sample questions
   - Type your own question in the input field
3. Submit the question
4. View the streaming response
5. Click the audio button to hear the response
6. View citations to see which knowledge was referenced

### Sample Questions (MVP)

1. "常連の田中様が来られた時の対応は？" (How to handle regular customer Tanaka-san?)
2. "季節の挨拶で気をつけることは？" (What to be careful about seasonal greetings?)
3. "お茶の温度はどのくらいが適切？" (What is the appropriate tea temperature?)

## Dependencies

The Agent feature requires:

1. **Archive Feature (#3)**: Must be implemented first to populate tacit_tags, tag_embeddings, and interviews tables
2. **Database**: Supabase with pgvector extension enabled
3. **API Keys**: OpenAI API key with access to:
   - text-embedding-3-small
   - GPT-4o
   - TTS API

## MVP Implementation Status

- [x] Chat UI with message history
- [x] Question embedding
- [x] pgvector similarity search (top-k=5)
- [x] recent-tag fallback when embeddings are missing
- [x] RAG prompt with LLM streaming
- [x] Text response display
- [x] OpenAI TTS audio generation & playback
- [x] Citation display from streamed `data-citations`
- [x] Authenticated shop access check before RAG lookup
- [x] 3 sample questions with working demo

## Future Enhancements (Out of Scope for MVP)

- Voice cloning (MVP uses generic female TTS)
- Voice input (Whisper for question capture)
- Conversation history / long-term memory
- Video avatar
- Multi-turn conversations with context

## Technical Risks & Mitigations

| Risk               | Impact | Mitigation                                                                |
| ------------------ | ------ | ------------------------------------------------------------------------- |
| Low RAG precision  | High   | Use higher top-k and re-rank with LLM                                     |
| LLM hallucinations | High   | Prompt instructs "only answer based on provided context" + show citations |
| TTS latency        | Medium | Show text first, audio plays asynchronously                               |

## Demo Acceptance Criteria

- [x] Sample questions "Regular customer handling", "Seasonal greetings", "Tea temperature" return appropriate responses
- [x] Responses start streaming within 3 seconds
- [x] Audio plays with proprietor-like speaking style
- [x] Citations are displayed

## Related

- Depends on: #3 Archive (for data source)
- Related to: #5 Guide (also uses Archive data)
