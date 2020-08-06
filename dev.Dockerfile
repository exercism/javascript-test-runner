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
FROM exercism/javascript-test-runner-base

USER root

# Install Ruby
RUN set -ex; \
    apt-get update; \
    apt-get install -y ruby2.5; \
    rm -rf /var/lib/apt/lists/*

# Copy over the binary gem from the gembuilder
COPY --from=gembuilder /var/lib/gems /var/lib/gems
COPY --from=gembuilder /usr/local/bin/exercism_local_tooling_webserver /usr/local/bin/exercism_local_tooling_webserver
USER appuser

ENTRYPOINT [ "exercism_local_tooling_webserver" ]