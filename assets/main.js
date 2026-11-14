// ZeroNote 사이트 스크립트: 기능 목록 전환, 운영체제 감지, GitHub Releases 연결
const REPO = 'designzeroplus-pro/zeronote-site'
const RELEASES = `https://github.com/${REPO}/releases`

// ---------- 운영체제 감지 ----------
function detectOS() {
  const p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || ''
  const ua = navigator.userAgent
  if (/mac/i.test(p) || /Macintosh/.test(ua)) return 'mac'
  if (/win/i.test(p) || /Windows/.test(ua)) return 'windows'
  if (/linux/i.test(p)) return 'linux'
  return null
}
const os = detectOS()

// 랜딩: 내 운영체제 버튼을 앞에
const primary = document.querySelector('[data-dl="primary"]')
const secondary = document.querySelector('[data-dl="secondary"]')
if (primary && secondary && os === 'windows') {
  primary.textContent = 'Windows용 다운로드'
  primary.href = 'download.html#windows'
  secondary.textContent = 'macOS용 다운로드'
  secondary.href = 'download.html#mac'
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
  const card = document.querySelector(`.platform[data-platform="${target}"]`)
  if (card) card.classList.add('detected')

  const primaryDl = document.getElementById('primary-dl')
  const links = { mac: document.querySelector('[data-asset="mac"]'), win: document.querySelector('[data-asset="win"]') }
  const names = { mac: document.querySelector('[data-asset-name="mac"]'), win: document.querySelector('[data-asset-name="win"]') }

  const notYet = () => {
    status.textContent = '첫 베타 빌드를 준비하고 있어요. 공개되면 이 페이지에서 바로 받을 수 있습니다.'
    for (const k of ['mac', 'win']) {
      links[k].href = RELEASES
      links[k].textContent = '곧 공개됩니다'
      links[k].setAttribute('aria-disabled', 'true')
    }
    primaryDl.textContent = 'GitHub에서 공개 소식 받기'
    primaryDl.href = `https://github.com/${REPO}`
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
      if (!mac && !win) return notYet()
      const date = new Date(rel.published_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
      status.textContent = `최신 버전 ${rel.tag_name} · ${date}`
      status.classList.add('live')
      for (const [k, a] of [['mac', mac], ['win', win]]) {
        if (a) {
          links[k].href = a.browser_download_url
          names[k].textContent = `${a.name} · ${(a.size / 1e6).toFixed(0)}MB`
        } else {
          links[k].href = RELEASES
          links[k].textContent = '이번 버전에는 없어요'
          links[k].setAttribute('aria-disabled', 'true')
        }
      }
      const mine = target === 'windows' ? win : target === 'mac' ? mac : null
      if (mine) {
        primaryDl.href = mine.browser_download_url
        primaryDl.textContent = target === 'windows' ? 'Windows용 다운로드' : 'macOS용 다운로드'
      }
    })
    .catch(notYet)
}
