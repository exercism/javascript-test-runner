FROM node:lts-slim@sha256:cb4e8f7c443347358b7875e717c29e27bf9befc8f5a26cf18af3c3dec80e58c5 AS runner
# lts-slim == 24.18.0-bookworm-slim

# fetch latest security updates
RUN set -ex; \
  apt-get update; \
  apt-get upgrade -y; \
  # curl is required to fetch our webhook from github
  # unzip is required for unzipping payloads in development
  apt-get install curl unzip jq -y; \
  rm -rf /var/lib/apt/lists/*; \
  #
  # add a non-root user to run our code as
  adduser --disabled-password --gecos "" appuser; \
  mkdir /somewhere/.cache/node/corepack/v1 -p; \
  chmod 555 /somewhere/.cache/node/corepack/v1; \
  chown -R appuser /somewhere/.cache/node;

# install our test runner to /opt
WORKDIR /opt/test-runner
COPY . .

ENV COREPACK_HOME=/somewhere/.cache/node \
    COREPACK_DEFAULT_TO_LATEST=0;

RUN set -ex; \
  corepack enable pnpm; \
  # corepack pack -o ./corepack.tgz; \
  # COREPACK_ENABLE_NETWORK=0 corepack install -g ./corepack.tgz;
  #
  # https://github.com/nodejs/corepack/pull/446#issue-2218976611
  corepack install; \
  corepack pnpm --version; \
  #
  # https://github.com/nodejs/corepack/issues/414#issuecomment-2096218732
  # https://github.com/nodejs/corepack/blob/bc13d40037d0b1bfd386e260ae741f55505b5c7c/sources/folderUtils.ts#L26-L31
  # chmod 444 /somewhere/.cache/node/corepack/lastKnownGood.json; \
  # chmod 555 /somewhere/.cache/node/corepack/corepack; \
  #
  # Build the test runner
  # RUN set -ex; \
  # install all the development modules (used for building)
  # corepack pnpm store prune; \
  corepack pnpm install; \
  corepack pnpm build; \
  corepack pnpm prune --prod;

# Disable network for corepack
ENV COREPACK_ENABLE_NETWORK=0 \
    COREPACK_ENABLE_STRICT=0 \
    #
    # Mark this as a docker run so we don't try to execute things in /tmp
    TMP_MAY_BE_NON_EXEC=1;

# Node saves the compiled code of each module it loads in this folder, and
# reuses it in later runs. bin/warm-up.sh runs the test runner once to fill
# it, so each run skips compiling Jest, the transformer and the reporter.
# Node keeps a separate cache for each user ID, so the warm-up runs as
# appuser. Root then owns the cache, so runs only read it.
ENV NODE_COMPILE_CACHE=/opt/test-runner/.node-compile-cache
RUN mkdir .node-compile-cache && chown appuser .node-compile-cache
USER appuser
RUN set -ex; \
  bin/warm-up.sh; \
  # remove Jest's cache from the warm-up, so runs start with an empty one
  rm -rf /tmp/jest_*
USER root
# Node writes the cache files readable by their owner only
RUN chown -R root:root .node-compile-cache && chmod -R a+rX .node-compile-cache

# Execute everything as the appuser
USER appuser
ENTRYPOINT [ "/opt/test-runner/bin/run.sh" ]

# Record the files read by a run. A separate stage keeps strace out of the
# final image.
FROM runner AS prefetch-list
USER root
RUN set -ex; \
  apt-get update; \
  apt-get install strace -y
# Record as appuser, so the list has the files a real run reads from
# appuser's home folder.
USER appuser
RUN bin/record-prefetch-list.sh /tmp/prefetch-list

FROM runner
COPY --from=prefetch-list /tmp/prefetch-list /opt/test-runner/.prefetch-list
