# 작업일: 2026-04-29
# Railway 배포용 Dockerfile
# better-sqlite3 네이티브 모듈 컴파일을 위해 python3/make/g++ 설치 필요

FROM node:20-alpine

# better-sqlite3 컴파일에 필요한 빌드 도구
RUN apk add --no-cache python3 make g++

WORKDIR /app

# 패키지 먼저 복사 → npm ci 레이어 캐시 (package.json 변경 없으면 스킵)
COPY package*.json ./
RUN --mount=type=cache,id=npm-cache,target=/root/.npm \
    npm ci

# 소스 전체 복사 후 빌드
COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

CMD ["npm", "start"]
