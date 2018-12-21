# nginx代理

* 用nginx代理可以通配,避免haproxy的每个域名都要写到配置里,但是nginx这里不支持https,所以https部分还是用haproxy
## 运行
```
docker stop nginx-proxy-80
docker rm nginx-proxy-80
docker run -d --restart always \
-p 80:80 \
--name nginx-proxy-80 \
--log-driver json-file \
--log-opt max-size=100M \
--log-opt max-file=1 \
-v /srv/docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro \
nginx
docker logs -f nginx-proxy-80
```
## 配置
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
    resolver 119.29.29.29;  
    resolver_timeout 5s;  
    listen 0.0.0.0:80;  
   
   
    location / {  
        proxy_pass $scheme://$http_host$request_uri;  
        proxy_set_header Host $http_host;  
   
        proxy_buffers 256 4k;  
        proxy_max_temp_file_size 0;  
   
        proxy_connect_timeout 60;  
   
        proxy_cache_valid 200 302 10m;  
        proxy_cache_valid 301 1h;  
        proxy_cache_valid any 1m;  

    }  
}  
}
```
> resolver是dns,不要用阿里的,有些解析不了,119.29.29.29是腾讯的Public DNS+

## 防火墙(必须)
* 不加防火墙会被人当代理用
```
//禁止80端口
iptables -I DOCKER -p tcp --dport 80 -j REJECT --reject-with tcp-reset
//允许内网访问80
iptables -I DOCKER -s 172.18.5.0/24 -p tcp --dport 80 -j ACCEPT


iptables -D DOCKER -s 172.18.5.0/24 -p tcp --dport 80 -j ACCEPT
iptables -D DOCKER -p tcp --dport 80 -j REJECT --reject-with tcp-reset
iptables -I DOCKER -p tcp --dport 80 -j REJECT --reject-with tcp-reset
iptables -I DOCKER -s 172.18.5.0/24 -p tcp --dport 80 -j ACCEPT
```