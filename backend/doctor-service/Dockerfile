FROM node:22-alpine

WORKDIR /app

COPY consul-service ./consul-service
COPY doctor-service ./doctor-service

WORKDIR /app/doctor-service

RUN npm install --omit=dev

ENV NODE_ENV=production
ENV PORT=3004

EXPOSE 3004

CMD ["npm", "start"]