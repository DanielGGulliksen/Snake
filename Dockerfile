FROM node:14-slim
RUN npm install

WORKDIR /app

COPY node_modules/ ./node_modules/
COPY app.js .
COPY package-lock.json .
COPY package.json .

CMD ["npm", "start"]