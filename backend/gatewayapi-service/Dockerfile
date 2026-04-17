FROM node:22-alpine

WORKDIR /app

COPY consul-service ./consul-service
COPY gatewayapi-service ./gatewayapi-service

WORKDIR /app/gatewayapi-service

RUN npm install --omit=dev

ENV NODE_ENV=production
ENV PORT=3002

EXPOSE 3002

CMD ["npm", "start"]