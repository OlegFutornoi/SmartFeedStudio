FROM node:22-alpine

WORKDIR /app

RUN mkdir -p /data

COPY . ./

ENV PORT=5001
ENV DB_PATH=/data/smartfeed-dev.db

EXPOSE 5001

HEALTHCHECK --interval=5s --timeout=3s --retries=5 \
  CMD wget --spider -q http://127.0.0.1:5001/health || exit 1

CMD ["node", "server.mjs"]
