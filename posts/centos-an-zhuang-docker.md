---
title: 'centos安装docker'
date: 2020-03-03 10:32:45
tags: []
published: true
hideInList: false
feature: 
isTop: false
---
# step 1: 安装必要的一些系统工具
`sudo yum install -y yum-utils device-mapper-persistent-data lvm2`
# Step 2: 添加软件源信息
`sudo yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo`
# Step 3: 更新并安装 Docker-CE
```
sudo yum makecache fast
yum list docker-ce.x86_64 --showduplicates | sort -r
sudo yum -y install docker-ce-17.03.2.ce-1.el7.centos
```

## 如果报错selinux
```
yum install https://download.docker.com/linux/centos/7/x86_64/stable/Packages/docker-ce-selinux-17.03.2.ce-1.el7.centos.noarch.rpm 
```

## docker配置 /etc/docker/daemon.json
```
{
	"hosts": [
		"tcp://172.16.124.69:2375",
		"unix:///var/run/docker.sock"
	],
    "registry-mirrors": [
	"https://xxxxx.mirror.aliyuncs.com"
	]
, "live-restore": true
}
```
registry-mirrors：配置一个国内镜像，这里用的是阿里云的地址，每个帐号都有自己的专属地址，免费的
[live-restore说明](/post/docker-pei-zhi/)
