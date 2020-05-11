---
title: '服务器时间同步'
date: 2020-01-21 11:30:30
tags: [运维]
published: true
hideInList: false
feature: 
isTop: false
---
## 同步时间
> 部署一台服务器，最好先把时间同步一下，以免出现问题
1. 安装ntpdate
`yum install ntpdate`
2. 修改时区
`cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime`
3. 同步时间
`ntpdate 1.cn.pool.ntp.org`
4. 定时同步
可以把同步命令加到定时任务里，例如centos可以编辑`/etc/crontab`，添加如下文本：
`50  4  *  *  * root ntpdate 1.cn.pool.ntp.org`

## 内网同步
> 有些物理机房，内网机器无法直接访问外网，可以通过一台外网服务器做同步：
1. 外网机器安装ntp
`yum install ntp -y`
2. 修改ntp配置
`vim /etc/ntp.conf`
```
driftfile /var/lib/ntp/drift
restrict default nomodify notrap nopeer noquery
restrict 127.0.0.1 
restrict ::1
restrict 172.18.5.0 mask 255.255.0.0 nomodify
server 1.cn.pool.ntp.org
server 2.cn.pool.ntp.org
server 3.cn.pool.ntp.org
server 0.cn.pool.ntp.org
restrict 1.cn.pool.ntp.org nomodify notrap noquery  
restrict 2.cn.pool.ntp.org nomodify notrap noquery  
restrict 3.cn.pool.ntp.org nomodify notrap noquery  
restrict 0.cn.pool.ntp.org nomodify notrap noquery 
server 127.127.1.0
fudge  127.127.1.0 stratum 10
includefile /etc/ntp/crypto/pw
keys /etc/ntp/keys
```
3. 启动ntp
```
systemctl enable ntpd
systemctl start ntpd
```

4. 配置内网机器同步
> 这里`172.18.5.102`就是上面那台外网机的内网ip了
```
50  4  *  *  * root ntpdate 172.18.5.102
```
