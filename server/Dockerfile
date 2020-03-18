FROM node:13-alpine

WORKDIR /app

COPY ./package.json /app/package.json
COPY ./yarn.lock /app/yarn.lock

RUN apk add build-base autoconf automake zlib-dev
RUN yarn install

COPY . /app
RUN yarn build

EXPOSE 4000
CMD ["yarn", "start"]