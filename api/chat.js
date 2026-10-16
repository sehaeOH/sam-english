// Vercel 서버 함수: Gemini API 키를 숨기고 AI와 대화합니다.
// Vercel 환경변수에 GEMINI_API_KEY 를 넣어야 작동해요.

// Vercel 환경변수 GEMINI_MODEL 로 바꿀 수 있어요 (없으면 아래 이름 사용)
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
// 기본 모델이 붐비면 차례로 시도할 예비 모델 (구글의 '항상 최신' 별칭)
const BACKUP_MODELS = ['gemini-flash-latest', 'gemini-flash-lite-latest'];

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

  const body = JSON.stringify({
    system_instruction: { parts: [{ text: system }] },
    contents,
    generationConfig: { responseMimeType: 'application/json', temperature: 0.8 },
  });

  // 붐빌 때를 대비해: 같은 모델로 몇 번 다시 시도 → 그래도 안 되면 예비 모델로
  const models = [MODEL, ...BACKUP_MODELS.filter((m) => m !== MODEL)];
  let lastError = 'AI 응답 오류';

  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body }
        );
        const data = await r.json().catch(() => ({}));

        if (r.ok) {
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
          let out;
          try {
            out = JSON.parse(text);
          } catch {
            out = { reply: text, reply_ko: '', correction: null };
          }
          return res.status(200).json(out);
        }

        lastError = data.error?.message || `AI 응답 오류 (${r.status})`;
        // 붐빔(503)·요청 많음(429)·일시 오류(500)만 다시 시도, 나머지는 다음 모델로
        if (![429, 500, 503].includes(r.status)) break;
      } catch (e) {
        lastError = '연결 오류: ' + e.message;
      }
      await sleep(1000 * (attempt + 1)); // 1초, 2초, 3초 기다렸다가 다시
    }
  }

  return res.status(503).json({ error: 'busy', detail: lastError });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
