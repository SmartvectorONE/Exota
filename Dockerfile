# Gebruik de lichtgewicht, stabiele Nginx-image gebaseerd op Alpine Linux
FROM nginx:stable-alpine

# Kopieer de aangepaste Nginx configuratie
# Dit bestand (nginx.conf) moet naast je Dockerfile liggen
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Kopieer al je statische applicatiebestanden (HTML, CSS, JS, afbeeldingen)
# naar de standaard Nginx webroot directory in de container.
# De '.' staat voor de huidige map waar de Dockerfile in ligt.
COPY . /usr/share/nginx/html

# Exposeer poort 80, de standaard HTTP-poort waar Nginx op luistert.
# Coolify zal verkeer naar deze poort doorsturen.
EXPOSE 80

# Dit is de standaard command voor Nginx om te starten.
# Je kunt deze weglaten, het is het ENTRYPOINT van de base image.
CMD ["nginx", "-g", "daemon off;"]
