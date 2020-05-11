---
title: '记一次木马来源发现过程'
date: 2020-03-03 10:01:35
tags: [jenkins,运维]
published: true
hideInList: false
feature: 
isTop: false
---
发现一台服务器cpu使用过高，怀疑中毒

因为不是面向用户的服务器，所以首先排除已知ip
`netstat -net |awk '{print $5}' | grep -v 14.18.242. | grep -v 172.18.5`

发现未知ip:52.202.51.185

打出pid
netstat -net -p | grep 52.202.51.185

找出运行来源
ps -ef | grep 645

发现来自Jenkins，是一个挖坑木马利用了Jenkins的漏洞

定位到木马所在位置，杀掉进程，删除木马文件，关闭Jenkins，关闭Jenkins外网端口，改为通过VPN访问内网端口。

修改jenkins为内网
vim  /etc/init.d/jenkins
```
JAVA_CMD="$JENKINS_JAVA_CMD $JENKINS_JAVA_OPTIONS -DJENKINS_HOME=$JENKINS_HOME -jar $JENKINS_WAR --httpListenAddress=172.18.5.228"
```
`systemctl daemon-reload`