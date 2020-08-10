#########################################################
# DO NOT MODIFY THIS IS COPIED DIRECTLY FROM Dockerfile #
#########################################################
# v ~~~~~ Dockerfile ~~~~~ v
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
ENTRYPOINT [ "/opt/test-runner/bin/run.sh" ]
# ^ ~~~~~ Dockerfile ~~~~~ ^
#########################################################

# Below this point is the dev.Dockerfile

# Local tooling webserver wrapper for Node.js runner
#
# - first build our gem binaries
# - then copy them on top of our base test-runnner

#############
## Stage 1 ##
#############
FROM node:erbium-buster as gembuilder

# Install Ruby
RUN set -ex; \
    apt-get update; \
    apt-get install -y ruby2.5 ruby-dev;

# Install the gems for the Ruby webserver
RUN gem install -N --no-wrappers exercism-local-tooling-webserver

#############
## Stage 2 ##
#############
FROM runner

USER root

# Install Ruby
RUN set -ex; \
    apt-get update; \
    apt-get install -y ruby2.5; \
    rm -rf /var/lib/apt/lists/*

# Copy over the binary gem from the gembuilder
COPY --from=gembuilder /var/lib/gems /var/lib/gems
COPY --from=gembuilder /usr/local/bin/exercism_local_tooling_webserver /usr/local/bin/exercism_local_tooling_webserver

COPY hack/exercism_local_tooling_webserver /usr/local/bin/exercism_local_tooling_webserver
RUN chmod +x /usr/local/bin/exercism_local_tooling_webserver
USER appuser

ENTRYPOINT [ "exercism_local_tooling_webserver" ]