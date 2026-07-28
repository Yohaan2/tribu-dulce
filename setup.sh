#!/bin/bash

# Dominio para el que se generará el certificado SSL
domains=(tribu-dulce.shop)

# Parámetros de Certbot
rsa_key_size=4096
data_path="./certbot"
email="garciayohan57@gmail.com"  # Cambia esto si usas otro correo
staging=0  # Cambia a 1 para probar contra el entorno de staging de Let's Encrypt

# Si ya existen certificados, preguntar antes de sobrescribir
if [ -d "$data_path/conf/live/$domains" ]; then
  read -p "Existing data found for $domains. Continue and replace existing certificate? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit
  fi
fi

# Descargar parámetros TLS recomendados si no existen
if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
  echo "### Downloading recommended TLS parameters ..."
  mkdir -p "$data_path/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
  echo
fi

# Crear certificado dummy para que nginx pueda iniciar
path="/etc/letsencrypt/live/$domains"
mkdir -p "$data_path/conf/live/$domains"

echo "### Creating dummy certificate for $domains ..."
docker compose run --rm --entrypoint "/bin/sh" certbot -c "
  openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1 \
    -keyout '$path/privkey.pem' \
    -out '$path/fullchain.pem' \
    -subj '/CN=localhost'"
echo

# Iniciar nginx con el certificado dummy
echo "### Starting nginx ..."
docker compose up --force-recreate -d nginx
echo

# Eliminar certificado dummy
echo "### Deleting dummy certificate for $domains ..."
docker compose run --rm --entrypoint "/bin/sh" certbot -c "
  rm -Rf /etc/letsencrypt/live/$domains && \
  rm -Rf /etc/letsencrypt/archive/$domains && \
  rm -Rf /etc/letsencrypt/renewal/$domains.conf"
echo

# Solicitar certificado real a Let's Encrypt
echo "### Requesting Let's Encrypt certificate for $domains ..."
domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"
done

case "$email" in
  "") email_arg="--register-unsafely-without-email" ;;
  *) email_arg="--email $email" ;;
esac

if [ $staging != "0" ]; then staging_arg="--staging"; fi

docker compose run --rm --entrypoint "/bin/sh" certbot -c "
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $email_arg \
    $domain_args \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --force-renewal"
echo

# Recargar nginx con el certificado real
echo "### Reloading nginx ..."
docker compose exec nginx nginx -s reload
