
## Requisitos Previos

- **Servidor**: Se recomienda un servidor con al menos 1 CPU, 2GB de RAM y 20GB de espacio en disco.
- **Sistema Operativo**: Ubuntu Server (18.04 o superior).
- **Acceso a la Terminal**: Acceso root o sudo en el servidor.
- **Nombre de Dominio**: Un dominio válido que apunte a tu servidor.


### Runtime dependencies

- **[Node.js](https://nodejs.org/en/)** (above 20.4.x)
- **[PostgreSQL](https://www.postgresql.org/)** (above 15)
- **[Redis](https://redis.io/)**
- **[FFmpeg](https://www.ffmpeg.org/)**


#### Necesitas habilitar corepack.

```sh
sudo corepack enable
corepack prepare pnpm@latest --activate

# verificar version
pnpm --version
```
## Crear usuario de Linux

Fedired no debería ejecutarse con permiso de root, por lo que deberías crear un nuevo usuario.
Ubuntu por ejemplo:

sudo adduser --disabled-password fedired

## Instalar Fedired

```sh
git clone --branch=main https://github.com/fedired-dev/fedired.git

cd fedired
  ```

##  Ajustes
Copie el archivo de muestra de configuración `.config/example.yml` a `default.yml`.

  ```sh
cp .config/example.yml .config/default.yml

nano .config/default.yml
 ```
Y edite `default.yml` según el texto de ayuda del archivo.

## Construir e inicializar

El siguiente comando construirá Fedired e inicializará la base de datos.
Esto llevará algún tiempo.

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
pnpm install --frozen-lockfile
NODE_ENV=production NODE_OPTIONS='--max-old-space-size=3072' pnpm run build
pnpm run init
```
## Lanzamiento

Lo hiciste. Inicie Fedired con el siguiente comando.

```sh
NODE_ENV=production pnpm run start
```
Cree la configuración de servicios systemd.
`/etc/systemd/system/fedired.service`

  ```sh
    sudo nano /etc/systemd/system/fedired.service
  ```
Abra su editor y pegue el siguiente código:

  ```service
    [Unit]
    Description=Fedired daemon
    Requires=redis.service caddy.service postgresql.service
    After=redis.service caddy.service postgresql.service network-online.target

    [Service]
    Type=simple
    User=fedired
    Group=fedired
    UMask=0027
    ExecStart=/usr/bin/pnpm run start
    WorkingDirectory=/home/fedired/fedired
    Environment="NODE_ENV=production"
    Environment="npm_config_cache=/tmp"
    Environment="NODE_OPTIONS=--max-old-space-size=3072"
    # uncomment the following line if you use jemalloc (note that the path varies on different environments)
    # Environment="LD_PRELOAD=/usr/lib/x86_64-linux-gnu/libjemalloc.so.2"
    StandardOutput=journal
    StandardError=journal
    SyslogIdentifier=fedired
    TimeoutSec=60
    Restart=always

    CapabilityBoundingSet=
    DevicePolicy=closed
    NoNewPrivileges=true
    LockPersonality=true
    PrivateDevices=true
    PrivateIPC=true
    PrivateMounts=true
    PrivateUsers=true
    ProtectClock=true
    ProtectControlGroups=true
    ProtectHostname=true
    ProtectKernelTunables=true
    ProtectKernelModules=true
    ProtectKernelLogs=true
    ProtectProc=invisible
    RestrictNamespaces=true
    RestrictRealtime=true
    RestrictSUIDSGID=true
    SecureBits=noroot-locked
    SystemCallArchitectures=native
    SystemCallFilter=~@chown @clock @cpu-emulation @debug @ipc @keyring @memlock @module @mount @obsolete @privileged @raw-io @reboot @resources @setuid @swap
    SystemCallFilter=capset pipe pipe2 setpriority

    [Install]
    WantedBy=multi-user.target
  ```

Vuelva a cargar systemd y habilite el servicio Fedired.

```sh
sudo systemctl daemon-reload
sudo systemctl enable fedired
```
Lanzar el servicio Fedired
```sh
sudo systemctl start fedired
```
Puede verificar el estado del servicio mediante `systemctl status fedired`

## Actualizando Fedired

> Consulte la [nota de la versión](https://github.com/fedired-dev/fedired/CHANGELOG.md) antes de actualizar. Para comprender los cambios y hay que hacer algo (normalmente no hacer nada).

Extraiga la base de datos principal, instale, cree y migre.

```sh
git checkout master
git pull
git submodule update --init
NODE_ENV=production pnpm install --frozen-lockfile
NODE_ENV=production pnpm run build
pnpm run migrate
```

Puede llevar algún tiempo dependiendo del contenido de la actualización y del tamaño de la base de datos.

Después de la actualización, reinicie el proceso Fedired.

```sh
sudo systemctl restart fedired
```

Si hay errores durante la compilación o el inicio, intente con el siguiente comando:

- `pnpm run clean` o `pnpm run clean-all`
- `pnpm rebuild`
