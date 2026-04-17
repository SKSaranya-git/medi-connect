FROM node:22-alpine

WORKDIR /app

COPY consul-service ./consul-service
COPY telemedicine-service ./telemedicine-service

WORKDIR /app/telemedicine-service

RUN npm install --omit=dev

ENV NODE_ENV=production
ENV PORT=3005

EXPOSE 3005

CMD ["npm", "start"]