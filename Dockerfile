FROM node:20-bookworm-slim AS runner
# Node.js 20 (curently LTS)
# Debian bookwork

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
  adduser --disabled-password --gecos "" appuser;

# install our test runner to /opt
WORKDIR /opt/test-runner
COPY . .

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
  # chmod 444 /root/.cache/node/corepack/lastKnownGood.json; \
  # chmod 555 /root/.cache/node/corepack/corepack; \
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

# Execute everything as the appuser
USER appuser
ENTRYPOINT [ "/opt/test-runner/bin/run.sh" ]
