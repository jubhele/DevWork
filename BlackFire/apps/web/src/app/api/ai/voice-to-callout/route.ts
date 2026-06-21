import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// Voice-to-Callout
// Accepts: multipart/form-data with audio file field "audio"
// 1. Transcribes via OpenAI Whisper
// 2. Extracts structured callout fields via Claude
// Returns: { transcript, callout: { service, location, priority, description, actions_taken } }

async function transcribeWithWhisper(audioBlob: Blob, filename: string): Promise<string> {
  const openAiKey = process.env.GBL_OPENAI_API_KEY
  if (!openAiKey) throw new Error('GBL_OPENAI_API_KEY not configured')

  const form = new FormData()
  form.append('file', audioBlob, filename)
  form.append('model', 'whisper-1')
  form.append('language', 'en')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${openAiKey}` },
    body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Whisper error ${res.status}: ${(err as { error?: { message?: string } }).error?.message ?? 'unknown'}`)
  }
  const data = await res.json() as { text: string }
  return data.text ?? ''
}

export async function POST(req: NextRequest) {
  const anthropicKey = process.env.GBL_ANTHROPIC_API_KEY
  if (!anthropicKey) {
    return NextResponse.json({ success: false, message: 'AI not configured — set GBL_ANTHROPIC_API_KEY' }, { status: 503 })
  }

  let transcript: string
  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File | null
    if (!audioFile) return NextResponse.json({ success: false, message: 'No audio file provided' }, { status: 400 })

    const audioBlob = new Blob([await audioFile.arrayBuffer()], { type: audioFile.type || 'audio/webm' })
    transcript = await transcribeWithWhisper(audioBlob, audioFile.name || 'callout.webm')
  } catch (err) {
    return NextResponse.json({ success: false, message: (err as Error).message }, { status: 502 })
  }

  if (!transcript.trim()) {
    return NextResponse.json({ success: false, message: 'No speech detected in audio' }, { status: 422 })
  }

  const client = new Anthropic({ apiKey: anthropicKey })
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Extract structured fields from this spoken field incident report from a BlackFire Solutions security officer at AECI Chempark, South Africa.

Return ONLY valid JSON with exactly these fields (use null for anything unclear):
{
  "service": "incident type / job type (string)",
  "location": "location on site (string)",
  "priority": "Normal | Urgent | Emergency",
  "description": "1-2 factual sentences summarising the incident",
  "actions_taken": "1 sentence on actions already taken by the officer"
}

Transcript: "${transcript}"`
    }],
  })

  let callout: Record<string, unknown> = {}
  try {
    const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const match = text.match(/\{[\s\S]*\}/)
    callout = match ? JSON.parse(match[0]) : {}
  } catch { callout = {} }

  return NextResponse.json({ success: true, transcript, callout })
}
