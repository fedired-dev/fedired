# Instrucciones de actualización

## Para usuarios de systemd/pm2

1. Cambiar al usuario `fedired` y de ir al directorio Fedired antes de ejecutar el comando `git`:

```sh
sudo su --login fedired
cd ~/fedired
```

2. Primero, detenga el servicio Fedired y luego ejecute los siguientes comandos:
    ```sh
    git stash
    ```
3. Extraiga el código fuente más reciente y Estable
    ```sh
    git checkout -- packages/backend/assets
    git pull --ff origin main
    ```
4. Construir Fedired y aplicar cambios a la base de datos
    ```sh
    corepack prepare pnpm@latest --activate
    cargo update
    pnpm install --no-frozen-lockfile
    pnpm install --frozen-lockfile
    NODE_ENV='production' NODE_OPTIONS='--max_old_space_size=3072' pnpm run rebuild
    pnpm run migrate
    ```
5. Salga del usuario Fedired
     ```sh
    exit
    ```
		
7. Reiniciar el servidor
    ```sh
    sudo systemctl restart fedired
    ```