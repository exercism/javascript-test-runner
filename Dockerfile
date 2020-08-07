FROM node:erbium-buster-slim as runner
# Node.js v12 LTS (Erbium)
# Debian Buster (v10.4)

# fetch latest security updates
RUN set -ex; \
    apt-get update; \
    apt-get upgrade -y; \
    rm -rf /var/lib/apt/lists/*

# add a non-root user to run our code as
RUN adduser --disabled-password --gecos "" appuser

# install our test runner to /opt
WORKDIR /opt/test-runner
COPY . .

# Build the test runner
RUN set -ex; \
  yarn install; \
  yarn build; \
  # install all the development modules (used for building)
  rm -rf node_modules; \
  # install only the node_modules we need for production
  yarn install --production; \
  # clean our yarn cache
  yarn cache clean;

USER appuser
ENTRYPOINT [ "bash", "/opt/test-runner/bin/run.sh" ]
