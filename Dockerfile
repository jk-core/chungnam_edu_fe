# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable

COPY .yarnrc.yml package.json yarn.lock ./
COPY .yarn/releases ./.yarn/releases

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
