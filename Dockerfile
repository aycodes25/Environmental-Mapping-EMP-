FROM node:18-alpine 

WORKDIR /emp-typescript

COPY package*.json ./

RUN npm install

RUN npm run build

COPY . .

CMD npm run start