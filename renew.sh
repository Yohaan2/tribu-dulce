#!/bin/bash

set -e

cd "$(dirname "$0")"

echo "### Verificando y renovando certificados SSL con Certbot ..."
docker compose run --rm certbot renew --webroot -w /var/www/certbot

echo "### Recargando configuracion de Nginx ..."
docker compose exec -T nginx nginx -s reload

echo "### Proceso de renovacion completado."
