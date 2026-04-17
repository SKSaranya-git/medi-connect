FROM node:22-alpine

WORKDIR /app

COPY consul-service ./consul-service
COPY ai-symptom-service ./ai-symptom-service

WORKDIR /app/ai-symptom-service

RUN npm install --omit=dev

ENV NODE_ENV=production
ENV PORT=3007

EXPOSE 3007

CMD ["npm", "start"]