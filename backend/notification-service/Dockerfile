FROM node:22-alpine

WORKDIR /app

COPY consul-service ./consul-service
COPY notification-service ./notification-service

WORKDIR /app/notification-service

RUN npm install --omit=dev

ENV NODE_ENV=production
ENV PORT=3006

EXPOSE 3006

CMD ["npm", "start"]