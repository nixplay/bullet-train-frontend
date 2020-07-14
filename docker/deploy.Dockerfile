FROM node:10-alpine

ARG ENVIRONMENT="prod"
ENV ENV="${ENVIRONMENT}"

# Create app directory
WORKDIR /usr/src/app

# Bundle app source
COPY . .

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm i
RUN npm run env
RUN npm run bundle
