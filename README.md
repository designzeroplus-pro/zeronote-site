# ZeroNote 웹사이트

ZeroNote 랜딩 페이지와 다운로드 페이지입니다. `main` 브랜치에 푸시하면 [Vercel](https://zeronote-app.vercel.app/)에 자동 배포됩니다.

- `index.html`: 랜딩 페이지
- `download.html`: 다운로드 페이지. 이 저장소의 최신 GitHub Release에 올라온 `.dmg`(macOS)와 `.exe`(Windows) 파일을 자동으로 연결합니다.

새 버전을 배포하려면 이 저장소에 Release를 만들고 설치 파일을 첨부하세요. 파일 이름에 `arm64`와 `.dmg`가 들어간 파일은 macOS 버튼에, `.exe` 파일은 Windows 버튼에 연결됩니다.

Vercel은 빌드할 때 공개 GitHub 릴리스로 변경 기록을 갱신합니다. 릴리스가 바뀌면 `Refresh release notes on Vercel` 워크플로가 `VERCEL_RELEASE_DEPLOY_HOOK` 저장소 시크릿으로 `main`을 다시 빌드합니다. 로컬에서는 `npm ci` 후 `npm run build`로 확인할 수 있습니다.

이전 Netlify 주소는 같은 페이지의 Vercel 주소로 이동합니다. 설치된 앱의 Slack 로그인 콜백은 기존 주소를 사용하며, 이전 주소의 규칙을 수정할 때만 `Update legacy Netlify routes`를 실행합니다.
