FROM node:22-alpine

WORKDIR /app

COPY consul-service ./consul-service
COPY payment-service ./payment-service

WORKDIR /app/payment-service

RUN npm install --omit=dev

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["npm", "start"]