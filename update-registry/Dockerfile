FROM node:20-alpine
WORKDIR /registry
COPY package.json server.mjs ./
COPY data ./data
RUN addgroup -S registry && adduser -S registry -G registry && chown -R registry:registry /registry
USER registry
ENV NODE_ENV=production
EXPOSE 4580
CMD ["node","server.mjs"]
