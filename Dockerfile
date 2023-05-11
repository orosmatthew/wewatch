FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV PORT=3000
ENV SOCKET_PORT=3001
EXPOSE 3000
EXPOSE 3001
RUN npm run build
RUN chmod +x ./docker/start.sh
CMD ["./docker/start.sh"]