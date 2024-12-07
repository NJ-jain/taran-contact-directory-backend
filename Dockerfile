FROM node:alpine
EXPOSE 7072 
WORKDIR /app
RUN npm install i npm@latest -g
RUN npm install dotenv-cli -g
COPY package.json package-log*.json ,/
RUN npm install 
COPY . /app
CMD ["npm", "run" , "start"]