FROM node:20-alpine
RUN apk add --no-cache docker-cli docker-cli-compose curl
WORKDIR /agent
COPY package.json server.mjs ./
ENV NODE_ENV=production
EXPOSE 4577
CMD ["node","server.mjs"]
