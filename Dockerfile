# Etapa de construcción (build)
FROM docker.io/node:20-alpine AS build
WORKDIR /fedired

# Instalar herramientas necesarias y preparar el entorno
RUN apk update && apk add --no-cache build-base linux-headers curl ca-certificates python3 perl
RUN ln -s $(which gcc) /usr/bin/aarch64-linux-musl-gcc

# Instalar Rust
RUN curl --proto '=https' --tlsv1.2 --silent --show-error --fail https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Configurar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copiar el código y ejecutar la instalación de dependencias
COPY . ./
RUN pnpm install --frozen-lockfile
RUN NODE_ENV='production' NODE_OPTIONS='--max_old_space_size=3072' pnpm run build

# Limpiar dependencias de desarrollo y dejar solo las de producción
RUN find . -path '*/node_modules/*' -delete && pnpm install --prod --frozen-lockfile

# Etapa de producción (runtime)
FROM docker.io/node:20-alpine AS production
WORKDIR /fedired

# Instalar dependencias necesarias para la ejecución
RUN apk update && apk add --no-cache zip unzip tini ffmpeg curl

# Copiar archivos y dependencias desde la etapa de construcción
COPY --from=build /fedired/node_modules /fedired/node_modules
COPY --from=build /fedired/packages/backend/node_modules /fedired/packages/backend/node_modules
COPY --from=build /fedired/packages/fedired-js/node_modules /fedired/packages/fedired-js/node_modules

# Copiar artefactos generados en la construcción
COPY --from=build /fedired/built /fedired/built
COPY --from=build /fedired/packages/backend/built /fedired/packages/backend/built
COPY --from=build /fedired/packages/fedired-js/built /fedired/packages/fedired-js/built

# Configuración final y comandos de ejecución
RUN corepack enable && corepack prepare pnpm@latest --activate
ENV NODE_ENV=production
VOLUME "/fedired/files"
ENTRYPOINT [ "/sbin/tini", "--" ]
CMD [ "pnpm", "run", "start:container" ]
