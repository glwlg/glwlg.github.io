---
title: 'Traefik--docker负载均衡神器'
date: 2020-01-21 14:06:14
tags: [docker,运维,traefik]
published: true
hideInList: false
feature: 
isTop: false
---
## Traefik 是什么
官方介绍：
> Træfɪk 是一个为了让部署微服务更加便捷而诞生的现代HTTP反向代理、负载均衡工具。 它支持多种后台 (Docker, Swarm, Kubernetes, Marathon, Mesos, Consul, Etcd, Zookeeper, BoltDB, Rest API, file…) 来自动化、动态的应用它的配置文件设置。
[官方文档](https://docs.traefik.io/)
> 有个中文文档，但是好像不更新了，建议直接看官方文档

个人想法：
负载均衡对于一个服务集群是必不可少的一环，而传统的服务器架构每个服务相对确定的运行在指定的机器上，服务的ip是确定的，这个时候只需要用nginx或者haproxy配置一次即可完成负载均衡。docker不一样的地方在于容器内ip的不确定性，这就导致了写死的配置可能无法正确路由到每个服务节点。这就需要我们根据容器的ip，实时动态的修改负载均衡组件的配置。
nginx提供了nginx plus可以支持这一点，但是收费。docker官方有个镜像`dockercloud/haproxy`也可以支持，后来由于不支持http/2和不再维护让我不得不寻找替代品，然后我发现了Traefik，支持http/2，支持acme（可以自动申请域名证书并自动续期），符合需求。


## docker运行

1. 构建
> 主要是修改一下时区
```
docker build -t my/traefik:1.7-alpine .

FROM traefik:1.7-alpine
ENV TZ=Asia/Shanghai
RUN apk add --no-cache tzdata && \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
```

2. 运行
> traefik.toml看下文
```
docker run -d \
-p 80:80 \
-p 443:443 \
-p 8580:8580 \
--name traefik \
--restart=always \
-v /srv/docker/traefik/traefik.toml:/etc/traefik/traefik.toml \
-v /srv/docker/traefik/acme:/etc/traefik/acme \
-v /srv/docker/traefik/certs:/etc/traefik/certs \
-v /var/run/docker.sock:/var/run/docker.sock \
--log-driver json-file --log-opt max-size=100M --log-opt max-file=1 \
my/traefik:1.7-alpine
docker logs -f traefik
```
1. 运行服务
```
docker run --name nginx-html \
--label traefik.enable=true \
--label traefik.basic.frontend.rule=Host:www.abc.com \
--label traefik.basic.port=80 \
--label traefik.basic.protocol=http \
-v /srv/docker/nginx/html/nginx.conf:/etc/nginx/nginx.conf:ro \
--log-driver json-file --log-opt max-size=100M --log-opt max-file=1 \
-v /srv/html/home/:/home/html/home \
-d nginx
```


## 配置

### 自动证书
> 使用acme自动获取`Let's Encrypt`证书
```
logLevel = "INFO"
defaultEntryPoints = ["http","https"]
[entryPoints]
  [entryPoints.traefik]
  address = ":8580"
  [entryPoints.http]
  address = ":80"
  compress = true
  [entryPoints.https]
  address = ":443"
  compress = true
    [entryPoints.https.tls]

[acme]
email = "abc@abc.com"
storage = "/etc/traefik/acme/acme.json"
entryPoint = "https"
acmeLogging = true
  [acme.httpChallenge]
    entryPoint = "http"
[[acme.domains]]
   main = "abc.com"
   sans = ["www.abc.com","dev.abc.com"]

[api]
  entryPoint = "traefik"
  dashboard = true
  debug = false
  [api.statistics]
    recentErrors = 10

[docker]
endpoint = "unix:///var/run/docker.sock"
domain = "abc.com"
watch = true
exposedByDefault = false
usebindportip = true
swarmMode = false

[accessLog]
format = "json"
  [accessLog.fields]
  defaultMode = "keep"
    [accessLog.fields.names]
    "ClientAddr" = "drop"
    "ClientPort" = "drop"
    "BackendURL" = "drop"
    "request_Cookie" = "drop"
    [accessLog.fields.headers]
    defaultMode = "keep"
      [accessLog.fields.headers.names]
      "Cookie" = "drop"
```

### 自带证书
> 自己有证书的情况
```
logLevel = "INFO"
defaultEntryPoints = ["http","https"]
[entryPoints]
  [entryPoints.http]
  address = ":80"
  [entryPoints.https]
  address = ":443"
    [entryPoints.https.tls]
      [[entryPoints.https.tls.certificates]]
      CertFile = "/etc/traefik/certs/xxx.crt"
      KeyFile = "/etc/traefik/certs/xxx.key"

[web]
address = ":8580"

[docker]
endpoint = "unix:///var/run/docker.sock"
domain = "abc.com"
watch = true
exposedByDefault = false
usebindportip = true
swarmMode = false
```

### http
> 只使用http，不推荐
```
logLevel = "INFO"
defaultEntryPoints = ["http"]
[entryPoints]
  [entryPoints.http]
  address = ":80"

[web]
address = ":8580"

[docker]
endpoint = "unix:///var/run/docker.sock"
domain = "abc.com"
watch = true
exposedByDefault = false
usebindportip = true
swarmMode = false
```


### 使用阿里云DNS

```
docker run -d \
-p 80:80 \
-p 443:443 \
-p 8580:8580 \
--name traefik-1.7.2 \
--restart=always \
-v /srv/docker/traefik/1.7.2/traefik.toml:/etc/traefik/traefik.toml \
-v /srv/docker/traefik/1.7.2/acme:/etc/traefik/acme \
-v /srv/docker/traefik/1.7.2/certs:/etc/traefik/certs \
-v /var/run/docker.sock:/var/run/docker.sock \
-e ALICLOUD_ACCESS_KEY='ALICLOUD_ACCESS_KEY' \
-e ALICLOUD_SECRET_KEY='ALICLOUD_SECRET_KEY' \
-e ALICLOUD_REGION_ID='cn-hangzhou' \
--log-driver json-file --log-opt max-size=100M --log-opt max-file=1 \
my/traefik:1.7.2-alpine
docker logs -f traefik
```
#### 配置
```
logLevel = "INFO"
defaultEntryPoints = ["http","https"]
[entryPoints]
  [entryPoints.traefik]
  address = ":8580"
  [entryPoints.http]
  address = ":80"
  compress = true
  [entryPoints.https]
  address = ":443"
  compress = true
    [entryPoints.https.tls]

[acme]
email = "abc@abc.com"
storage = "/etc/traefik/acme/acme.json"
entryPoint = "https"
acmeLogging = true
  [acme.dnsChallenge]
    provider = "alidns"
    delayBeforeCheck = 300
[[acme.domains]]
   main = "*.abc.com"
   sans = ["abc.com"]

[api]
  entryPoint = "traefik"
  dashboard = true
  debug = false
  [api.statistics]
    recentErrors = 10

[accessLog]
format = "json"
  [accessLog.fields]
  defaultMode = "keep"
    [accessLog.fields.names]
    "ClientAddr" = "drop"
    "ClientPort" = "drop"
    "BackendURL" = "drop"
    "request_Cookie" = "drop"
    [accessLog.fields.headers]
    defaultMode = "keep"
      [accessLog.fields.headers.names]
      "Cookie" = "drop"
```


