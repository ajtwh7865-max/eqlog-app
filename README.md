# 기기가동 기록서 - Netlify + Google Sheets 배포 가이드

## 1. 구글 서비스 계정 만들기 (사람이 로그인하는 방식이 아니라, 서버가 조용히 시트에 접근하는 전용 계정)

1. https://console.cloud.google.com 접속 → 새 프로젝트 생성 (예: `eqlog-backend`)
2. 왼쪽 메뉴 "API 및 서비스 → 라이브러리" → **Google Sheets API** 검색 → 사용 설정
3. "API 및 서비스 → 사용자 인증정보 → +사용자 인증정보 만들기 → 서비스 계정"
   - 이름: 아무거나 (예: `eqlog-sheets-bot`)
   - 역할 지정은 건너뛰어도 됩니다
4. 생성된 서비스 계정 클릭 → "키" 탭 → "키 추가 → 새 키 만들기 → JSON" → 다운로드
   - JSON 파일 안에 `client_email` 과 `private_key` 값이 있습니다. 이 두 값을 나중에 씁니다.
5. JSON 안의 `client_email` 값 (예: `eqlog-sheets-bot@xxx.iam.gserviceaccount.com`) 을 복사해두세요.

## 2. 저장용 구글 스프레드시트 준비

1. 구글 드라이브에서 새 스프레드시트 생성 (예: "기기가동기록서-DB")
2. 오른쪽 위 "공유" 클릭 → 1번에서 복사한 **서비스 계정 이메일**을 "편집자"로 추가
3. 주소창 URL에서 스프레드시트 ID를 복사
   `https://docs.google.com/spreadsheets/d/여기부분이_ID/edit`

시트 안의 탭/헤더는 코드가 처음 실행될 때 자동으로 만듭니다. 직접 만들 필요 없어요.

## 3. 프로젝트를 Git 저장소로 올리기

이 폴더(`eqlog-netlify/`) 전체를 GitHub(또는 GitLab) 저장소에 올리세요.

```bash
cd eqlog-netlify
git init
git add .
git commit -m "init"
git remote add origin <본인의 저장소 주소>
git push -u origin main
```

## 4. Netlify에 사이트 연결

1. https://app.netlify.com → "Add new site → Import an existing project"
2. 방금 만든 GitHub 저장소 선택
3. Build settings: 별도 빌드 명령 없음 (publish directory `.` 로 자동 인식됨 — `netlify.toml`에 이미 설정됨)
4. "Site settings → Environment variables" 에서 아래 3개 추가:

   | Key | Value |
   |---|---|
   | `GOOGLE_SERVICE_ACCOUNT_EMAIL` | 1번에서 복사한 `client_email` |
   | `GOOGLE_PRIVATE_KEY` | JSON의 `private_key` 값 전체 (줄바꿈 포함해서 그대로 붙여넣기) |
   | `GOOGLE_SHEET_ID` | 2번에서 복사한 스프레드시트 ID |

5. "Deploy site" 클릭

배포가 끝나면 `https://무작위이름.netlify.app` 주소가 생기고, 그 주소로 회사 직원들이 각자 브라우저에서 접속하면 **같은 구글 스프레드시트**를 백엔드로 공유하게 됩니다.

## 5. 동작 확인

1. 배포된 주소로 접속 → 로그인 화면이 뜨는지 확인
2. 브라우저 개발자 도구 콘솔에 `[기기가동 기록서] 회사 공유망 서버 연결됨.` 로그가 뜨면 정상 (=서버 모드로 붙었다는 뜻)
3. 기록 하나 저장해보고 → 구글 스프레드시트의 `KV` 탭에 `sheet:...` 같은 key row 가 생기는지 확인

## 참고 / 주의사항

- **동시 편집 정책**: 이 앱은 원래 코드 설계상 "한 번에 1명만 편집, 나머지는 읽기 전용"으로 동작합니다 (25초 세션 잠금). 여러 명이 동시에 **접속**은 가능하지만 **동시에 입력**은 막혀 있습니다. 이 정책을 없애고 싶다면 알려주세요 — `global-session` 관련 로직을 걷어내야 합니다.
- **Google Sheets API 사용량 제한**: 편집 중인 사람은 10초마다 하트비트 요청을 보냅니다. 기본 할당량(분당 요청 수)은 소규모 사내 사용(수 명~수십 명)에는 충분합니다.
- **구글드라이브 저장 버튼**은 이번 작업과는 별개 기능입니다 (엑셀 파일을 개인 구글드라이브에 백업하는 기능). 쓰시려면 이전에 안내드린 `GOOGLE_CLIENT_ID` OAuth 설정을 별도로 해주셔야 합니다.
- `GOOGLE_PRIVATE_KEY`를 Netlify 환경변수에 붙여넣을 때 줄바꿈이 깨지는 경우가 있는데, 코드에서 `\n` 문자열을 실제 줄바꿈으로 자동 변환하니 JSON 파일에 있는 그대로 (따옴표 포함 없이 값만) 붙여넣으면 됩니다.
