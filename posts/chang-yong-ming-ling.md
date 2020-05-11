---
title: '常用命令'
date: 2020-03-03 14:47:11
tags: []
published: true
hideInList: false
feature: 
isTop: true
---
# Docker
```
docker start $(docker ps -a|grep Exited|awk '{print $1}')

docker restart $(docker ps -a|grep Exited|awk '{print $1}')
docker pause $(docker ps -a|awk '{print $1}')
docker unpause $(docker ps -a|awk '{print $1}')


打出所有容器的日志文件
docker inspect $(docker ps -a|awk '{print $1}'|sed '1d;$d') | grep json.log |awk '{print $2}'|sed 's/"//g'|sed 's/,//g'
清空日志
docker inspect $(docker ps -a|awk '{print $1}'|sed '1d;$d') | grep json.log |awk '{print $2}'|sed 's/"//g'|sed 's/,//g'|xargs truncate -s 0


docker restart $(docker ps -a|grep service|awk '{print $1}')
docker restart $(docker ps -a|grep web|awk '{print $1}')
```
> 删除过期镜像
```
docker rmi $(docker images -a |grep $REGISTRY/$PROJECT|grep '<none>'|awk '{print $3}')
```


# Maven
## 单独的jar包入库
### install
```
mvn install:install-file -Dfile=./abc-0.10.0-jar.jar-DgroupId=com.xxxx -DartifactId=artifactid -Dversion=0.0.1-SNAPSHOT -Dpackaging=jar
mvn install:install-file -Dfile=D:/abc-0.10.0-sources.jar -DgroupId=net.spy -DartifactId=artifactid -Dversion=0.0.1-SNAPSHOT -Dpackaging=jar -Dclassifier=sources
```
### deploy
```
mvn deploy:deploy-file -DgroupId=com.xxxx -DartifactId=artifactid -Dversion=0.0.1-SNAPSHOT -Dpackaging=jar -Dfile=./jar-0.0.1-SNAPSHOT.jar -Durl=http://admin:password@ip:18000/nexus/content/repositories/snapshots
```


# firewalld

```
systemctl start firewalld
firewall-cmd --zone=public --add-port=31415/tcp --permanent
firewall-cmd --reload
firewall-cmd --permanent --add-rich-rule="rule family="ipv4" source address="172.18.5.246" port protocol="tcp" port="2375" accept"
firewall-cmd --permanent --add-rich-rule="rule family="ipv4" source address="172.18.5.0/24" port protocol="tcp" port="2377" accept"
firewall-cmd --permanent --remove-rich-rule="rule family="ipv4" destination address="172.18.5.0/24" port protocol="tcp" port="2375" reject"


systemctl start firewalld
firewall-cmd --zone=public --add-port=31415/tcp --permanent
firewall-cmd --reload
systemctl restart 

firewall-cmd --permanent --zone=public --add-rich-rule="rule family="ipv4" source address="192.168.10.0/24" service name="ssh" reject" 
firewall-cmd --permanent --zone=public --add-rich-rule="rule family="ipv4" source address="192.168.0.4/24" port protocol="tcp" port="8080" accept"
firewall-cmd --permanent --remove-rich-rule="rule family="ipv4" destination address="172.18.5.0/24" port protocol="tcp" port="2375" reject"
firewall-cmd --reload

iptables -L -n

firewall-cmd --permanent --zone=trusted --add-interface=docker0
firewall-cmd --permanent --zone=trusted --add-port=xxxx/tcp
firewall-cmd --permanent --zone=trusted --add-port=2377/tcp
firewall-cmd --reload

```

# iptables
```
在Chain INPUT添加禁止80端口的访问
iptables -I INPUT -p tcp --dport 80 -j DROP
允许172.18.5.70访问80
iptables -I INPUT -s 172.18.5.70 -p tcp --dport 80 -j ACCEPT

在Chain DOCKER添加禁止80端口的访问(docker打开的端口要用这个)
iptables -I DOCKER -p tcp --dport 80 -j DROP
iptables -D DOCKER -p tcp --dport 80 -j DROP

DROP是等着超时,REJECT是马上返回拒绝(现在用这个)
iptables -I DOCKER -p tcp --dport 80 -j REJECT --reject-with tcp-reset
iptables -D DOCKER -p tcp --dport 80 -j REJECT --reject-with tcp-reset
允许内网访问
iptables -D DOCKER -s 172.18.5.0/24 -p tcp --dport 80 -j ACCEPT
iptables -I DOCKER -s 172.18.5.0/24 -p tcp --dport 80 -j ACCEPT

```

```
重定向
iptables -t nat -A PREROUTING -p tcp -m multiport --dport 80,8080 -j DNAT --to 172.18.5.242:80

iptables -t nat -D PREROUTING -p tcp -m multiport --dport 80,8080 -j DNAT --to 172.18.5.242:80
```


#redis
停止所要删除的sentinel
发送一个SENTINEL RESET * 命令给所有其它的sentinel实例，如果你想要重置指定master上面的sentinel，只需要把*号改为特定的名字，注意，需要一个接一个发，每次发送的间隔不低于30秒。
检查一下所有的sentinels是否都有一致的当前sentinel数。使用SENTINEL MASTER mastername 来查询。

#yum_rpm
```
搜索已安装的
rpm -qa |grep kuber
搜索yum
yum list kubernetes-cni.x86_64  --showduplicates |sort -r
```

# 压力测试

```
#请求100次,每次10并发
ab -c 10 -n 100 -p fddata.txt -T application/json http://api.xxxx.com/api
```

# 邮件发送

```
wget http://caspian.dotconf.net/menu/Software/SendEmail/sendEmail-v1.56.tar.gz
tar -xf sendEmail-v1.56.tar.gz
mv sendEmail-v1.56/sendEmail /usr/local/bin/

sendEmail -s "smtp地址" -xu "发送人账号" -xp "密码" -f "来自XX" -t "收件人" -u "标题" -m "内容" -o message-content-type=text -o message-charset=gb2312
```