FROM node:22-alpine

WORKDIR /app

COPY consul-service ./consul-service
COPY patient-service ./patient-service

WORKDIR /app/patient-service

RUN npm install --omit=dev

ENV NODE_ENV=production
ENV PORT=3003

EXPOSE 3003

CMD ["npm", "start"]