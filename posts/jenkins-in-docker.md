---
title: 'jenkins in docker'
date: 2020-01-15 11:24:37
tags: [docker,jenkins]
published: true
hideInList: false
feature: 
isTop: false
---
# jenkins-docker

* 让jenkins运行在容器里
  

## 构建jenkins镜像
* Dockerfile
```
FROM jenkins/jenkins:2.183

USER root
RUN echo '' > /etc/apt/sources.list.d/jessie-backports.list \
  && echo "deb http://mirrors.aliyun.com/debian jessie main contrib non-free" > /etc/apt/sources.list \
  && echo "deb http://mirrors.aliyun.com/debian jessie-updates main contrib non-free" >> /etc/apt/sources.list \
  && echo "deb http://mirrors.aliyun.com/debian-security jessie/updates main contrib non-free" >> /etc/apt/sources.list
RUN apt-get update && apt-get install -y libltdl7 && apt-get clean

##根据实际情况修改docker组号 cat /etc/group
ARG dockerGid=994

RUN echo "docker:x:${dockerGid}:jenkins" >> /etc/group 
RUN mkdir /home/deploy && chown 1000 /home/deploy && chgrp 1000 /home/deploy

ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

USER jenkins
```
* build  
`docker build -t jenkins:dind .`
>原生jenkins镜像缺少libltdl7,无法正常运行docker

## 运行

```
docker run -d --name jenkins \
-p 172.16.96.146:8080:8080 \
-p 172.16.96.146:50000:50000 \
-v /etc/timezone:/etc/timezone \
-v /etc/localtime:/etc/localtime \
-v /srv/docker/jenkins/jenkins_home:/var/jenkins_home \
-v /srv/docker/jenkins/settings:/var/settings \
-v /var/run/docker.sock:/var/run/docker.sock \
-v $(which docker):/usr/bin/docker \
jenkins:dind
```

## maven

```
docker run -t --rm \
-v $PWD:/usr/src/mymaven \
-v /home/deploy/.m2/repository6:/home/deploy/.m2/repository6 \
-v /home/deploy/conf:/home/deploy/conf \
-v $PWD/target:/usr/src/mymaven/target \
-v /usr/local/maven/apache-maven-3.3.9/settings.xml:/usr/share/maven/conf/settings.xml \
-w /usr/src/mymaven \
maven:3-jdk-8 mvn package -P json-log -P prod -Dmaven.test.skip=true
```