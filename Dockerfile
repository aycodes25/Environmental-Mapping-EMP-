FROM node:18-alpine 

WORKDIR /emp-typescript

COPY package*.json ./

# Copy all files first together with tsconfig
COPY . .

RUN npm install

RUN npm run build

# second copy potentially over writing dist? 
 COPY . . 

CMD npm run start
