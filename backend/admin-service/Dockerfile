FROM node:22-alpine

WORKDIR /app

COPY consul-service ./consul-service
COPY admin-service ./admin-service

WORKDIR /app/admin-service

RUN npm install --omit=dev

ENV NODE_ENV=production
ENV PORT=3008

EXPOSE 3008

CMD ["npm", "start"]