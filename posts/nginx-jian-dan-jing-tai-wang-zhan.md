---
title: 'Nginx简单静态网站'
date: 2020-01-21 13:46:21
tags: [docker,nginx,运维]
published: true
hideInList: false
feature: 
isTop: false
---
用docker起一个nginx挂静态网站非常简单，只需一个简单的配置，运行一个docker容器即可。
1. 创建配置
 `vim /srv/docker/nginx/html/nginx.conf`，填入以下内容。
```
user  nginx;
worker_processes  1;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    client_max_body_size 50M;
    client_body_buffer_size 10M;
    
    sendfile        on;
    #tcp_nopush     on;

    keepalive_timeout  65;

    #gzip  on;
    
    server {
    listen       80;
    server_name www.abc.com;
    root    /home/html/home;
    
    location / {
        index  index.html;
    }
    }
}

```

2. 启动nginx
```
docker run -d --name html-nginx \
-p 192.168.1.100:8080:80 \
-v /srv/docker/nginx/html/nginx.conf:/etc/nginx/nginx.conf:ro \
-v /srv/html/home/:/home/html/home \
--log-driver json-file --log-opt max-size=100M --log-opt max-file=1 \
nginx
```

