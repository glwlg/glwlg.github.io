---
title: 'Docker on WSL'
date: 2020-01-21 10:05:32
tags: [docker,wsl]
published: true
hideInList: false
feature: 
isTop: false
---
## 一. 安装Ubuntu
卸载ubuntu  安装  Ubuntu for WSL 18.0.4 LTS  商店搜索 ubuntu  
> 修改root登录 `ubuntu1804.exe config --default-user root`  
以管理员身份运行cmd或者powerShell 然后运行ubuntu  
修改apt-get源`/etc/apt/sources.list`为下面内容  

```
deb http://mirrors.aliyun.com/ubuntu/ bionic main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ bionic main restricted universe multiverse

deb http://mirrors.aliyun.com/ubuntu/ bionic-security main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ bionic-security main restricted universe multiverse

deb http://mirrors.aliyun.com/ubuntu/ bionic-updates main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ bionic-updates main restricted universe multiverse

deb http://mirrors.aliyun.com/ubuntu/ bionic-proposed main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ bionic-proposed main restricted universe multiverse

deb http://mirrors.aliyun.com/ubuntu/ bionic-backports main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ bionic-backports main restricted universe multiverse
```
## 二. 安装docker
1. 更新源  
`sudo apt-get update`
2. 安装基础工具  
`sudo apt-get install apt-transport-https ca-certificates curl gnupg2 software-properties-common`
3. 添加docker源  
```
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
```
4. 更新源  
`sudo apt-get update`
5. 安装docker  
```
apt list -a docker-ce
sudo apt-get install docker-ce=17.09.0~ce-0~ubuntu
```
## 三. 配置
1. 修改docker配置，开启远程docker远程访问
> vim /etc/docker/daemon.json  
```
{
	"hosts": [
		"tcp://0.0.0.0:2375",
		"unix:///var/run/docker.sock"
	]
}
```
2. 添加用户到docker用户组  
`sudo usermod -aG docker $USER`
3. 编辑docker启动脚本  
`sudo vim /usr/local/sbin/start_docker.sh`
```
#!/usr/bin/env bash
sudo cgroupfs-mount
sudo service docker start
```
```
sudo chmod +x /usr/local/sbin/start_docker.sh
sudo chmod 755 /usr/local/sbin/start_docker.sh
```
4. 给予当前用户免密运行docker启动脚本  
`sudo vim /etc/sudoers`
```
# Enable docker services to start without sudo
<your username here> ALL=(ALL:ALL) NOPASSWD: /bin/sh /usr/local/sbin/start_docker.sh
```
5. 添加windows任务  
win+q搜索“任务计划”就可以看到任务计划程序，打开后创建一个任务
![](https://blog.duya.shop/post-images/1579573335157.png)
![](https://blog.duya.shop/post-images/1579573343357.png)
![](https://blog.duya.shop/post-images/1579573349128.png)
命令：`C:\Windows\System32\bash.exe`
参数：`-c "sudo /bin/sh /usr/local/sbin/start_docker.sh"`

6.  重启查看是否成功  

## 可能出现的问题
1. 容器内无法访问外网
解决：重建docker0网络
```
停止docker
iptables -t nat -F
ifconfig docker0 down
brctl delbr docker0
启动docker
```