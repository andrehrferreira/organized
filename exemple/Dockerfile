FROM node:latest
RUN mkdir -p /home/app
ENV HOME=/home/app
COPY package.json $HOME
WORKDIR $HOME
RUN npm update --progress=false
COPY . $HOME

CMD ["npm", "start"]