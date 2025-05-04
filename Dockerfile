# Install dev and compilation dependencies, build files
FROM docker.io/node:20-alpine AS build
WORKDIR /fedired

# Install build tools and work around the linker name issue
RUN apk update && apk add --no-cache build-base linux-headers curl ca-certificates python3 perl
RUN ln -s $(which gcc) /usr/bin/aarch64-linux-musl-gcc

# Install Rust toolchain
RUN curl --proto '=https' --tlsv1.2 --silent --show-error --fail https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Configure pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Build
COPY . ./
RUN cargo update
RUN pnpm install --no-frozen-lockfile
RUN pnpm install --frozen-lockfile
RUN NODE_ENV='production' NODE_OPTIONS='--max_old_space_size=4096' pnpm run build

# Trim down the dependencies to only those for production
RUN find . -path '*/node_modules/*' -delete && pnpm install --prod --frozen-lockfile

# Runtime container
FROM docker.io/node:20-alpine AS production
WORKDIR /fedired

# Install runtime dependencies
RUN apk update && apk add --no-cache zip unzip tini ffmpeg curl

COPY . ./

# Copy node modules
COPY --from=build /fedired/node_modules /fedired/node_modules
COPY --from=build /fedired/packages/backend/node_modules /fedired/packages/backend/node_modules
# COPY --from=build /fedired/packages/sw/node_modules /fedired/packages/sw/node_modules
# COPY --from=build /fedired/packages/client/node_modules /fedired/packages/client/node_modules
COPY --from=build /fedired/packages/fedired-js/node_modules /fedired/packages/fedired-js/node_modules

# Copy the build artifacts
COPY --from=build /fedired/built /fedired/built
COPY --from=build /fedired/packages/backend/built /fedired/packages/backend/built
COPY --from=build /fedired/packages/backend/assets/instance.css /fedired/packages/backend/assets/instance.css
COPY --from=build /fedired/packages/backend-rs/built /fedired/packages/backend-rs/built
COPY --from=build /fedired/packages/fedired-js/built /fedired/packages/fedired-js/built

RUN corepack enable && corepack prepare pnpm@latest --activate
ENV NODE_ENV=production
VOLUME "/fedired/files"
ENTRYPOINT [ "/sbin/tini", "--" ]
CMD [ "pnpm", "run", "start:container" ]
