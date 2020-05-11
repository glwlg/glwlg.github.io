---
title: 'docker配置'
date: 2020-03-03 10:30:54
tags: [docker]
published: true
hideInList: false
feature: 
isTop: false
---
## 重启docker而不重启容器

在`/etc/docker/daemon.json`中添加`"live-restore": true`选项  
确保`/usr/lib/systemd/system/docker.service`中有`KillMode=process`
> ps:和swarm冲突