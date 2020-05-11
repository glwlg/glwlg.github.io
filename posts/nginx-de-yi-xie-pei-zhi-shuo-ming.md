---
title: 'Nginx的一些配置说明'
date: 2020-01-21 14:03:20
tags: [nginx]
published: true
hideInList: false
feature: 
isTop: false
---
## 配置说明

> nginx指定文件路径有两种方式root和alias，这两者的用法区别，使用方法总结了下，方便大家在应用过程中，快速响应。root与alias主要区别在于nginx如何解释location后面的uri，这会使两者分别以不同的方式将请求映射到服务器文件上。

[root]
语法：root path
默认值：root html
配置段：http、server、location、if

[alias]
语法：alias path
配置段：location

> root实例：
```
location ^~ /t/ {
     root /www/root/html/;
}
```
如果一个请求的URI是/t/a.html时，web服务器将会返回服务器上的/www/root/html/t/a.html的文件。

> alias实例：
```
location ^~ /t/ {
 alias /www/root/html/new_t/;
}
```
如果一个请求的URI是/t/a.html时，web服务器将会返回服务器上的/www/root/html/new_t/a.html的文件。注意这里是new_t，因为alias会把location后面配置的路径丢弃掉，把当前匹配到的目录指向到指定的目录。
