FROM node:erbium-buster-slim as runner
# Node.js v12 LTS (Erbium)
# Debian Buster (v10.4)

# fetch latest security updates
RUN set -ex; \
    apt-get update; \
    apt-get upgrade -y; \
    # curl is required to fetch our webhook from github
    # unzip is required for unzipping payloads in development
    apt-get install curl unzip -y; \
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

# static binary used for webhook when running in dev mode
ARG webhook_version=0.5.0
RUN curl -L -o /usr/local/bin/exercism_local_tooling_webserver \
  https://github.com/exercism/local-tooling-webserver/releases/download/${webhook_version}/exercism_local_tooling_webserver
RUN chmod +x /usr/local/bin/exercism_local_tooling_webserver

USER appuser
ENTRYPOINT [ "/opt/test-runner/bin/run.sh" ]
