FROM node:22-alpine
RUN apk add --no-cache tini
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package*.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --prod
COPY . .
EXPOSE 3005
ENV NODE_ENV=production
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "index.js"]
