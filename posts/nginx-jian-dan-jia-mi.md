---
title: 'Nginx简单加密'
date: 2020-01-21 14:04:17
tags: [nginx]
published: true
hideInList: false
feature: 
isTop: false
---
# 简单加密


1. 安装apache工具包

`apt-get install apache2-utils`  
或  
`yum  -y install httpd-tools`  

2. 生成密码文件
`htpasswd -c ./passwd test`


3. 配置nginx
```
server {
    listen       8080;
    server_name localhost;
  

    location / {
        proxy_pass  http://127.0.0.1:8080;
		auth_basic "Please input password"; 
        auth_basic_user_file /srv/nginx-1.10.3/passwd;
    }


}
```