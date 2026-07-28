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

# Preparar parámetros TLS recomendados y DH params
mkdir -p "$data_path/conf"

if [ ! -s "$data_path/conf/options-ssl-nginx.conf" ] || grep -q "404" "$data_path/conf/options-ssl-nginx.conf" 2>/dev/null; then
  echo "### Creating recommended TLS options (options-ssl-nginx.conf) ..."
  cat << 'EOF' > "$data_path/conf/options-ssl-nginx.conf"
ssl_session_cache shared:le_nginx_SSL:1m;
ssl_session_timeout 1440m;
ssl_session_tickets off;

ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;

ssl_ciphers "ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384";
EOF
  echo
fi

if [ ! -s "$data_path/conf/ssl-dhparams.pem" ] || grep -q "404" "$data_path/conf/ssl-dhparams.pem" 2>/dev/null; then
  echo "### Generating DH parameters (ssl-dhparams.pem) ..."
  docker compose run --rm --entrypoint "openssl" certbot dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
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
