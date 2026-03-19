# QuickPick Backend

QuickPick 앱의 백엔드 서버. Google Places API를 통해 주변 음식점 데이터를 제공하고 사진 프록시를 담당.

## 기술 스택

- Node.js + Express
- TypeScript
- Google Places API (New)

## 시작하기

```bash
npm install
```

`.env` 파일 생성:

```
GOOGLE_MAPS_API_KEY=your_api_key_here
```

개발 서버 실행:

```bash
npm run dev
```

## API

### `GET /api/restaurants`

주변 음식점 목록 반환.

| 파라미터 | 설명 |
|---|---|
| `lat` | 위도 |
| `lng` | 경도 |
| `radius` | 반경 (미터) |

### `GET /api/photos/:photoName`

Google Places 사진 프록시. 사진 URL을 직접 노출하지 않고 서버에서 redirect.

## 배포

Railway 또는 Render에 배포 권장.

빌드 후 실행:

```bash
npm run build
npm start
```

## 관련 레포

- [quickpick](https://github.com/taejin5314/quickpick) — React Native 앱
