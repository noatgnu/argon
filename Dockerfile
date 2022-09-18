FROM node:18-bullseye-slim
LABEL maintainer="tphung@somoch.com"

ARG API_HOST=localhost:8000
LABEL \
      org.label-schema.name="dQng" \
      org.label-schema.description="Docker container for Argon Controller" \
      org.label-schema.version="$DOCKER_IMAGE_VERSION" \
      org.label-schema.vcs-url="https://github.com/noatgnu/argon" \
      org.label-schema.schema-version="1.0"

WORKDIR /usr/local/app
RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get -y install git

RUN git clone https://github.com/noatgnu/argon.git
WORKDIR /usr/local/app/dQng
RUN sed -i -r "s|localhost:8000|${API_HOST}|" ./src/environments/environment.prod.ts
#RUN sed -i 's/localhost:8000/'"${API_HOST}"'/g' ./src/environments/environment.ts
RUN npm -g config set user root
RUN npm install --quiet --no-progress -g @angular/cli@13
RUN npm install
RUN node_modules/.bin/ng build
FROM nginx:latest

COPY --from=0 /usr/local/app/dQng/dist /usr/share/nginx/html

EXPOSE 80
