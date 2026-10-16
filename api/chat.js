// Vercel 서버 함수: Gemini API 키를 숨기고 AI와 대화합니다.
// Vercel 환경변수에 GEMINI_API_KEY 를 넣어야 작동해요.

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash'; // 오류가 나면 최신 flash 모델 이름으로 바꾸세요

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST만 가능해요' });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'Vercel에 GEMINI_API_KEY가 설정되지 않았어요' });
  }

  const { situation, history = [] } = req.body || {};

  const system = `
Your name is Sam. You are a friendly native English speaker helping a Korean BEGINNER practice conversation.
Role-play situation: "${situation}". You play the other person in this situation (e.g. barista, officer, coworker). If it fits naturally, introduce yourself as Sam.

Rules:
- Use very easy English (A1-A2). Keep each reply to 1-2 short sentences, under 15 words total.
- Ask only ONE simple question at a time so the learner knows what to say.
- Stay in character and keep the conversation moving naturally.
- Check the learner's LAST message. If it has a grammar mistake or sounds unnatural,
  give a correction. If it is fine, correction must be null. Do not correct tiny things like capital letters or a missing period.
- If the learner writes in Korean, show them how to say it in English in the correction.

Respond ONLY in this JSON format:
{
  "reply": "your English reply in character",
  "reply_ko": "Korean translation of your reply",
  "correction": null or {
    "original": "what the learner wrote",
    "better": "natural native-speaker version",
    "tip_ko": "아주 짧은 한국어 설명 (한 문장)"
  }
}`;

  // 대화 기록을 Gemini 형식으로 변환
  let contents = history.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }],
  }));

  // 첫 시작이면 AI가 먼저 인사하도록
  if (contents.length === 0) {
    contents = [{ role: 'user', parts: [{ text: '(Start the role-play now with a short, friendly opening line. correction is null.)' }] }];
  }

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents,
          generationConfig: { responseMimeType: 'application/json', temperature: 0.8 },
        }),
      }
    );

    const data = await r.json();
    if (!r.ok) {
      return res.status(500).json({ error: data.error?.message || 'AI 응답 오류' });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    let out;
    try {
      out = JSON.parse(text);
    } catch {
      out = { reply: text, reply_ko: '', correction: null };
    }
    return res.status(200).json(out);
  } catch (e) {
    return res.status(500).json({ error: '연결 오류: ' + e.message });
  }
}
