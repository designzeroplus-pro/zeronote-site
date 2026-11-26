// ZeroNote 사이트 스크립트: 기능 목록 전환, 운영체제 감지, GitHub Releases 연결
const REPO = 'designzeroplus-pro/zeronote-site'
const RELEASES = `https://github.com/${REPO}/releases`

// ---------- 익명 방문 통계 (PostHog) ----------
// 쿠키를 쓰지 않고(탭을 닫으면 사라지는 sessionStorage), 위치 추정·화면 녹화 없이 페이지 보기와 다운로드 클릭만 센다.
const POSTHOG_KEY = 'phc_D9QqCmx7hfYhWqnk7tPj5pwobUcrDXErDPGFa8UGpnJH' // phc_… (비어 있으면 아무것도 보내지 않음)
const POSTHOG_HOST = 'https://us.i.posthog.com'
const pending = []
function track(event, props) {
  if (!POSTHOG_KEY) return
  if (window.posthog && window.posthog.__loaded) window.posthog.capture(event, props)
  else pending.push([event, props])
}
if (POSTHOG_KEY) {
  const s = document.createElement('script')
  s.async = true
  s.src = POSTHOG_HOST.replace('.i.posthog.com', '-assets.i.posthog.com') + '/static/array.full.js'
  s.onload = () => {
    window.posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      persistence: 'sessionStorage',
      autocapture: false,
      capture_pageview: true,
      capture_pageleave: true,
      disable_session_recording: true,
      person_profiles: 'identified_only',
      property_denylist: ['$ip'],
      loaded: () => pending.splice(0).forEach(([e, p]) => window.posthog.capture(e, p))
    })
  }
  document.head.appendChild(s)
}
document.addEventListener('click', (e) => {
  const a = e.target.closest && e.target.closest('a[data-dl], a[data-asset], #primary-dl')
  if (!a) return
  const href = a.getAttribute('href') || ''
  track('download_clicked', {
    page: location.pathname.endsWith('download.html') ? 'download' : 'landing',
    button: a.dataset.dl || a.dataset.asset || 'primary',
    file: /\.dmg$/.test(href) ? (/x64/.test(href) ? 'mac-intel' : 'mac-arm64') : /\.exe$/.test(href) ? 'windows' : 'none'
  })
})

// ---------- 운영체제 감지 ----------
function detectOS() {
  const p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || ''
  const ua = navigator.userAgent
  if (/mac/i.test(p) || /Macintosh/.test(ua)) return 'mac'
  if (/win/i.test(p) || /Windows/.test(ua)) return 'windows'
  return null
}
const os = detectOS()

// 랜딩: 내 운영체제 버튼을 앞에
const primary = document.querySelector('[data-dl="primary"]')
const secondary = document.querySelector('[data-dl="secondary"]')
if (primary && secondary && os === 'windows') {
  primary.href = 'download.html#windows'
  primary.textContent = 'Windows용 무료 다운로드'
  secondary.href = 'download.html#mac'
  secondary.textContent = 'macOS용 무료 다운로드'
}

// ---------- 기능 목록 ↔ 미리보기 ----------
document.querySelectorAll('.bars').forEach((el) => {
  const replay = el.classList.contains('replay')
  const n = 44
  for (let i = 0; i < n; i++) {
    const v = 0.25 + 0.75 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.45))
    const b = document.createElement('i')
    b.style.height = `${Math.round(v * 100)}%`
    if (replay ? i < 30 : i > n - 10) b.className = 'on'
    el.appendChild(b)
  }
})

const features = document.querySelectorAll('.feature')
features.forEach((f) => {
  f.querySelector('button').addEventListener('click', () => {
    features.forEach((x) => {
      const on = x === f
      x.classList.toggle('open', on)
      x.querySelector('button').setAttribute('aria-expanded', String(on))
    })
    document.querySelectorAll('.mock').forEach((m) => m.classList.toggle('show', m.id === `mock-${f.dataset.feature}`))
  })
})

// ---------- 설치 안내 탭 ----------
const tabs = document.querySelectorAll('.tabs [role="tab"]')
function selectTab(id) {
  tabs.forEach((t) => {
    const on = t.id === id
    t.setAttribute('aria-selected', String(on))
    const panel = document.getElementById(t.getAttribute('aria-controls'))
    panel.hidden = !on
    panel.classList.toggle('show', on)
  })
}
tabs.forEach((t) => t.addEventListener('click', () => selectTab(t.id)))

// ---------- 다운로드 페이지 ----------
const status = document.getElementById('release-status')
if (status) {
  const target = location.hash === '#windows' ? 'windows' : location.hash === '#mac' ? 'mac' : os
  if (target === 'windows') selectTab('tab-win')
  const card = document.querySelector(`.platform[data-platform="${os}"]`)
  if (card) card.classList.add('detected')

  const primaryDl = document.getElementById('primary-dl')
  const links = { mac: document.querySelector('[data-asset="mac"]'), win: document.querySelector('[data-asset="win"]') }
  const names = { mac: document.querySelector('[data-asset-name="mac"]'), win: document.querySelector('[data-asset-name="win"]') }

  const showReleasePage = () => {
    status.textContent = '최신 설치 파일은 공식 배포 페이지에서 확인할 수 있습니다.'
    primaryDl.textContent = '설치 파일 보기'
    primaryDl.href = RELEASES + '/latest'
  }

  fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } })
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((rel) => {
      const assets = rel.assets || []
      const mac = assets.find((a) => /arm64.*\.dmg$/i.test(a.name)) || assets.find((a) => /\.dmg$/i.test(a.name))
      const intel = assets.find((a) => /x64.*\.dmg$/i.test(a.name))
      const intelLink = document.querySelector('[data-asset="mac-intel"]')
      if (intel && intelLink) {
        intelLink.href = intel.browser_download_url
        intelLink.textContent = `Intel Mac용 다운로드 · ${(intel.size / 1e6).toFixed(0)}MB`
        intelLink.hidden = false
      }
      const win = assets.find((a) => /\.exe$/i.test(a.name))
      if (!mac && !win) return showReleasePage()
      const date = new Date(rel.published_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
      status.textContent = `최신 버전 ${rel.tag_name} · ${date}`
      status.classList.add('live')
      for (const [k, a] of [['mac', mac], ['win', win]]) {
        if (a) {
          links[k].hidden = false
          links[k].href = a.browser_download_url
          names[k].textContent = `${a.name} · ${(a.size / 1e6).toFixed(0)}MB`
        } else {
          links[k].hidden = true
          names[k].textContent = '이 버전에는 설치 파일이 없습니다.'
        }
      }
      const mine = target === 'windows' ? win : target === 'mac' ? mac : null
      if (mine) {
        primaryDl.href = mine.browser_download_url
        primaryDl.textContent = target === 'windows' ? 'Windows용 다운로드' : 'macOS용 다운로드'
      }
    })
    .catch(showReleasePage)
}

// 움직임 줄이기 설정이면 소개 영상을 자동 재생하지 않는다
{
  const v = document.querySelector('.demo-frame video')
  if (v && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    v.removeAttribute('autoplay')
    v.pause()
    v.controls = true
  }
}
