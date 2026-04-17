FROM node:22-alpine

WORKDIR /app

COPY consul-service ./consul-service
COPY appointment-service ./appointment-service

WORKDIR /app/appointment-service

RUN npm install --omit=dev

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]