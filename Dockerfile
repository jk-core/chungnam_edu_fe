# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app

# yarn 은 corepack 이 package.json 의 `packageManager` 를 보고 받아온다.
#
# 전에는 `.yarn/releases` 를 복사했는데 그 디렉터리가 저장소에 없어 빌드가 그 줄에서 멈췄다
# (`"/.yarn/releases": not found`). `.gitignore` 에 `!.yarn/releases` 예외까지 걸려 있었지만
# 파일이 만들어진 적이 없으니 커밋된 것도 없었다.
#
# 내려받기 확인 프롬프트는 끈다 — CI 는 대화형이 아니라 물음이 뜨면 그대로 멎는다.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

COPY .yarnrc.yml package.json yarn.lock ./

# @jk-core/* private registry (npm.pkg.github.com) 인증 토큰
ARG NODE_AUTH_TOKEN
ENV NODE_AUTH_TOKEN=$NODE_AUTH_TOKEN
RUN yarn install --immutable

COPY . .

# Vite가 빌드 시 번들에 인라인하는 값 (브라우저가 호출할 BE 주소)
ARG VITE_APP_API_PATH
ARG VITE_KAKAO_MAP_KEY
ENV VITE_APP_API_PATH=$VITE_APP_API_PATH
ENV VITE_KAKAO_MAP_KEY=$VITE_KAKAO_MAP_KEY
RUN yarn build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 100
