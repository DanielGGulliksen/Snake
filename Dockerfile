# container based on node image
FROM node:14-slim

# Internal directory
WORKDIR /app

# npm config file
COPY package.json /app

RUN npm install

# Copies all root contents
COPY . /app

# npm 'start command'
CMD ["npm", "start"]