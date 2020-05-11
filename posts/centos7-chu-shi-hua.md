---
title: 'centos7初始化'
date: 2020-03-03 14:59:53
tags: [运维]
published: true
hideInList: false
feature: 
isTop: false
---
# 替换yum源
```
yum install wget
#备份/etc/yum.repos.d/CentOS-Base.repo
mv /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.backup
#下载163的源
wget http://mirrors.163.com/.help/CentOS7-Base-163.repo
yum clean all
yum makecache
```

# 同步时间
时间不同步,各种报错!
## 时区修改
```
cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
```
## 安装ntpdate
```
yum install ntpdate -y
```
## 手动同步
```
ntpdate 1.cn.pool.ntp.org
```

## 自动同步
### 先手动同步一次
### 启用ntp服务
```
#安装
yum install ntp -y
#修改配置
vim /etc/ntp.conf

driftfile /var/lib/ntp/drift
restrict default nomodify notrap nopeer noquery
restrict 127.0.0.1 
restrict ::1
restrict 172.18.5.0 mask 255.255.0.0 nomodify  #允许指定网段的ip来同步时间
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

#开启服务
systemctl enable ntpd
systemctl start ntpd
```

### 定时任务
```
#其他服务器向一台服务器同步
vim /etc/crontab
50  4  *  *  * root ntpdate 172.18.5.102
```


# 升级内核
## yum更新
```
yum update -y
```
## 查看内核版本
```
cat /etc/redhat-release
#CentOS Linux release 7.3.1611 (Core)
```

## 安装
```
rpm --import https://www.elrepo.org/RPM-GPG-KEY-elrepo.org
rpm -Uvh http://www.elrepo.org/elrepo-release-7.0-2.el7.elrepo.noarch.rpm
yum --enablerepo=elrepo-kernel install kernel-ml -y
#查看内核是否安装成功
rpm -qa | grep kernel
```
更新 grub 系统引导文件并重启
```
egrep ^menuentry /etc/grub2.cfg | cut -f 2 -d \'
grub2-set-default 0  #default 0表示第一个内核设置为默认运行, 选择最新内核就对了
reboot
#开机后 uname -r 看看是不是内核4.9
```

