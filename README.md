# 💬 Sam 샘 — 1단계 (Samuel의 애칭)

원어민 AI와 상황별로 영어 대화를 하고, 틀린 문장은 대화 중에 바로 고쳐주는 나만의 영어 회화 앱.

## 폴더 구조
```
sam/
├─ index.html      ← 화면 (상황 선택 + 대화)
├─ api/chat.js     ← AI와 대화하는 서버 함수 (API 키를 숨겨줌)
└─ package.json
```

## 올리는 순서
1. **Gemini API 키 받기** — https://aistudio.google.com/apikey 에서 "API 키 만들기" (무료)
2. **GitHub** — 새 저장소(예: `sam-english`)를 만들고 위 3개 파일을 폴더 구조 그대로 업로드
3. **Vercel** — Add New → Project → 그 저장소 선택
4. 배포 전 **Environment Variables**에
   - Name: `GEMINI_API_KEY`
   - Value: 1번에서 받은 키
5. Deploy → 나온 주소로 휴대폰에서 접속

> 이미 배포한 뒤에 키를 넣었다면 Deployments → Redeploy 해야 적용돼요.
> API 키는 절대 index.html이나 GitHub에 직접 쓰지 마세요.

## 1단계에서 되는 것
- 상황 10개 + 날짜마다 바뀌는 "오늘의 추천"
- AI가 먼저 말을 걸고, 초보용 쉬운 영어(1~2문장)로 대화
- 내 문장이 어색하면 노란 카드로 바로 교정 (한국어로 써도 영어로 바꿔줌)
- 🔊 원어민 발음 듣기(자동 재생), 🇰🇷 뜻 보기

## 다음 단계
- 2단계: 🎤 말해서 입력하기
- 3단계: 교정받은 표현 복습 노트
- 4단계: 연속 학습 달력 🔥
- 5단계: APK
