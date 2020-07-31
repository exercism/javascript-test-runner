FROM node:lts-alpine as builder

# Install SSL ca certificates
RUN apk update && apk add ca-certificates
RUN apk upgrade

# Create appuser
RUN adduser -D -g '' appuser

WORKDIR /javascript-test-runner
COPY . .

# Build the reporter
RUN yarn install
RUN yarn build

# Only install the node_modules we need
RUN yarn install --production --modules-folder './production_node_modules'

# Build a minimal and secured container
FROM node:lts-alpine
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /javascript-test-runner/bin /opt/test-runner/bin
COPY --from=builder /javascript-test-runner/production_node_modules /opt/test-runner/node_modules
COPY --from=builder /javascript-test-runner/dist /opt/test-runner/dist
COPY --from=builder /javascript-test-runner/jest.config.js /opt/test-runner/jest.config.js
COPY --from=builder /javascript-test-runner/babel.config.js /opt/test-runner/babel.config.js

USER appuser
WORKDIR /opt/test-runner

COPY ./bin/run.sh ./bin/

ENTRYPOINT [ "sh", "/opt/test-runner/bin/run.sh" ]
