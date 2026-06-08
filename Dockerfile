# Sirve el dashboard estático con nginx (opcional, para desplegar en Railway).
# El dashboard es 100% frontend: no necesita Node ni build.
FROM nginx:alpine

# Copia los archivos estáticos
COPY index.html /usr/share/nginx/html/index.html
COPY css/   /usr/share/nginx/html/css/
COPY js/    /usr/share/nginx/html/js/

# Railway inyecta $PORT; nginx debe escuchar en ese puerto.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
ENV PORT=8080
EXPOSE 8080
