FROM nginx:alpine

COPY . /usr/share/nginx/html

# Nginx конфиг для SPA — перенаправляет всё на index.html
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index sign-in.html; \
    location / { \
        try_files $uri $uri/ /sign-in.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
