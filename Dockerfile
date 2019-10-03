FROM node:lts-alpine

RUN apk update && apk upgrade

WORKDIR /opt/test-runner

COPY ./run.sh ./bin/

ENTRYPOINT [ "sh", "/opt/test-runner/bin/run.sh" ]
