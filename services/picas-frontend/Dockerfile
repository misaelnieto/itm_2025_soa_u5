# Stage 1, based on Nginx, to have only the compiled app, ready for production with Nginx
FROM nginx:1

COPY index.html /usr/share/nginx/html/juegos/picas/ 
COPY script.js /usr/share/nginx/html/juegos/picas/
COPY styles.css /usr/share/nginx/html/juegos/picas/
COPY logo.png /usr/share/nginx/html/juegos/picas/
COPY favicon.ico /usr/share/nginx/html/juegos/picas/
COPY logo2.png /usr/share/nginx/html/juegos/picas/
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY loading.gif /usr/share/nginx/html/juegos/picas/
COPY leaderboard.html /usr/share/nginx/html/juegos/picas/
COPY leaderboard.js /usr/share/nginx/html/juegos/picas/
COPY leaderboard.css /usr/share/nginx/html/juegos/picas/