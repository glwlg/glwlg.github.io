---
title: 'Haproxy的安装与配置'
date: 2020-01-01 14:50:35
tags: [笔记,haproxy,docker]
published: true
hideInList: false
feature: 
isTop: false
---

## 简介
> HAProxy提供高可用性、负载均衡以及基于TCP和HTTP应用的代理，支持虚拟主机，它是免费、快速并且可靠的一种解决方案。HAProxy特别适用于那些负载特大的web站点，这些站点通常又需要会话保持或七层处理。HAProxy运行在时下的硬件上，完全可以支持数以万计的并发连接。并且它的运行模式使得它可以很简单安全的整合进您当前的架构中， 同时可以保护你的web服务器不被暴露到网络上。
HAProxy实现了一种事件驱动、单一进程模型，此模型支持非常大的并发连接数。多进程或多线程模型受内存限制 、系统调度器限制以及无处不在的锁限制，很少能处理数千并发连接。事件驱动模型因为在有更好的资源和时间管理的用户端(User-Space) 实现所有这些任务，所以没有这些问题。此模型的弊端是，在多核系统上，这些程序通常扩展性较差。这就是为什么他们必须进行优化以 使每个CPU时间片(Cycle)做更多的工作。

## yum安装
```
yum install haproxy -y
```

## docker安装
```
docker run -d \
--publish 443:443/tcp \
--publish 80:80/tcp \
--name haproxy \
-v /root/haproxy/haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg:ro \
-v /etc/ssl/certs:/etc/ssl/certs:ro \
haproxy:alpine
```

## 编译安装

> openssl
```
yum install -y make GCC Perl pcre-devel zlib-devel
apt-get install build-essential make g++ libssl-dev

wget -O /tmp/openssl.tgz https://www.openssl.org/source/openssl-1.0.2-latest.tar.gz
tar -zxf /tmp/openssl.tgz -C /tmp
cd /tmp/openssl-*
./config --prefix=/usr --openssldir=/etc/ssl --libdir=lib no-shared zlib-dynamic
make
make install_sw
openssl version
```

> haproxy

```
wget http://fossies.org/linux/misc/haproxy-1.6.9.tar.gz
tar -zxvf haproxy-1.6.9.tar.gz
cd haproxy-1.6.9
make TARGET=linux2628 ARCH=x86_64 PREFIX=/usr/local/haproxy USE_OPENSSL=yes
make install PREFIX=/usr/local/haproxy

#参数说明
TARGET=linux26 #内核版本，使用uname -r查看内核，如：2.6.18-371.el5，此时该参数就为linux26；kernel 大于2.6.28的用：TARGET=linux2628
ARCH=x86_64 #系统位数
PREFIX=/usr/local/haprpxy #/usr/local/haprpxy为haprpxy安装路径
```

## 配置说明
```
### 配置文件主要有：
global settings: 全局配置段
  主要用于定义haproxy进程自身的工作特性；
proxies: 代理配置段
  backend: 后端服务器组
  frontend: 定义面向客户的监听的地址和端口，以及关联到的后端服务器组；
  listen: 组合方式直接定义frontend及相关的backend的一种机制；
defaults: 定义默认配置
#################################################################################
gloab的默认选项：
log         127.0.0.1 local2  
# 记录日志，此时要借助于本机的rsyslod的日志服务，需要开启udp端口监听
chroot      /var/lib/haproxy
pidfile     /var/run/haproxy.pid
maxconn     4000
user        haproxy
group       haproxy
daemon
stats socket /var/lib/haproxy/stats
#################################################################################
defaults配置选项：
maxconn                 3000   # 最大并发连接数
mode http               #默认的模式mode { tcp|http|health }，tcp是4层，http是7层，health只会返回OK
retries 3               #两次连接失败就认为是服务器不可用，也可以通过后面设置
option redispatch       #当serverId对应的服务器挂掉后，强制定向到其他健康的服务器
option abortonclose     #当服务器负载很高的时候，自动结束掉当前队列处理比较久的链接
maxconn 51200           #默认的最大连接数
timeout connect 5000ms  #连接超时
timeout client 30000ms  #客户端超时
timeout server 30000ms  #服务器超时
timeout check 2000ms    #心跳检测超时
log global
option httplog
option dontlognull
option http-server-close
option forwardfor except 127.0.0.0/8
timeout http-request 10s
timeout queue 1m
timeout http-keep-alive 10s
##################################################################################
两种代理配置方式
1:
frontend http_frontend
    bind *:80
    mode http
    option httpclose
    option forwardfor
    acl role_1 hdr_beg(host) -i www.test.com
    use_backend backend_1 if role_1

backend backend_1
    mode http
    server node1 www.test.com

2: 
listen smtp 
bind 0.0.0.0:25  
mode tcp  
balance roundrobin  
server s1 smtp.mxhichina.com
```



