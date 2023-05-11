# ![WeWatch logo](https://raw.githubusercontent.com/orosmatthew/wewatch/master/github/logo.png)

<div>
<img src="https://raw.githubusercontent.com/orosmatthew/wewatch/master/github/made-with-svelte.svg">
<img src="https://raw.githubusercontent.com/orosmatthew/wewatch/master/github/open-source.svg">
</div>

WeWatch allows watching videos together in sync

## [Try it here!](https://wewatch.pixeled.site)

![Screenshot](https://raw.githubusercontent.com/orosmatthew/wewatch/master/github/screenshot.png)

## Features

 - 📽️ Watch YouTube videos in sync
 - 💬 Send messages
 - 👷 Able to be self-hosted
 - 🐳 Docker image

## Tech Stack

 - 🏗️ SvelteKit framework
 - 🕸️ Websockets via [socket.io](https://socket.io/)
 - 📺 [VimeJS](https://vimejs.com/) video player
 - 📝 [Prisma](https://www.prisma.io/) ORM

## Get Started

### Docker (recommended)

Create `docker-compose.yml`
```yml
version: '3'
services:
  db:
    image: postgres
    environment:
      POSTGRES_USER: wewatch_user
      # Recommended: Change this
      POSTGRES_PASSWORD: password123
      POSTGRES_DB: wewatch_db
  wewatch:
    image: orosmatthew/wewatch
    depends_on:
      - db
    environment:
      - DATABASE_URL=postgres://wewatch_user:password123@db:5432/wewatch_db
      # Change according to domain name hosted on
      - ORIGIN=http://localhost:3000
      # Change according to domain name websockets hosted on
      - SOCKET_URL=http://localhost:3001
    ports:
      # Main web port
      - '3000:3000'
      # Websockets port
      - '3001:3001'
```
Run command to start

```console
$ docker-compose up -d --build
```

### Manually

First create a `.env` file according to `.env.example`

```console
$ git clone https://github.com/orosmatthew/wewatch
$ cd wewatch
$ npm install
$ npx prisma db push
$ npm run build
$ node build
```

### Development

Create a `.env` file according to `.env.example`

```console
$ git clone https://github.com/orosmatthew/wewatch
$ cd wewatch
$ npm install
$ npx prisma db push
$ npx prisma generate
$ npm run dev
```