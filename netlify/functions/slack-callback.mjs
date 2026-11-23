// Slack "로그인으로 연결" 콜백.
// 앱이 브라우저로 Slack 승인 화면을 열면, Slack이 여기로 code를 보낸다.
// 비밀키로 code를 웹훅 주소로 바꾼 뒤 사용자의 앱(127.0.0.1:<port>)으로 넘겨준다.
// 아무것도 저장하지 않는다.
// 필요한 환경변수: SLACK_CLIENT_ID, SLACK_CLIENT_SECRET

export const config = { path: '/oauth/slack/callback' }

const REDIRECT_URI = 'https://zeronote-app.netlify.app/oauth/slack/callback'

export default async (req) => {
  const u = new URL(req.url)
  const state = u.searchParams.get('state') || ''
  const m = /^(\d{2,5})-([a-f0-9]{32})$/.exec(state)
  const port = m ? Number(m[1]) : 0
  if (!m || port < 1024 || port > 65535) {
    return html(400, '잘못된 요청입니다', 'ZeroNote 설정 › 연동에서 다시 시도해 주세요.')
  }
  const back = (params) =>
    new Response(null, {
      status: 302,
      headers: { Location: `http://127.0.0.1:${port}/slack?${new URLSearchParams({ state, ...params })}`, 'Cache-Control': 'no-store' }
    })

  const code = u.searchParams.get('code')
  if (!code) return back({ error: u.searchParams.get('error') || 'no_code' })

  try {
    const res = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        redirect_uri: REDIRECT_URI,
        client_id: process.env.SLACK_CLIENT_ID || '',
        client_secret: process.env.SLACK_CLIENT_SECRET || ''
      })
    })
    const data = await res.json()
    const hook = data.ok && data.incoming_webhook
    if (!hook || !hook.url) return back({ error: data.error || 'exchange_failed' })
    return back({ webhook: hook.url, channel: hook.channel || '', team: (data.team && data.team.name) || '' })
  } catch {
    return back({ error: 'exchange_failed' })
  }
}

function html(status, title, body) {
  return new Response(
    `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ZeroNote</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo',sans-serif}main{text-align:center;padding:24px}h1{font-size:24px;margin:0 0 10px}p{margin:0;color:rgba(0,0,0,.55)}</style></head><body><main><h1>${title}</h1><p>${body}</p></main></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }
  )
}
