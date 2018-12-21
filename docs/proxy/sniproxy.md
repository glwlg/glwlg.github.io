# sniproxy

##运行
```
docker run -d \
--name sniproxy \
-p 443:443 \
steamcache/sniproxy:latest
```

* 支持https,用这个


* 防火墙
```
iptables -D DOCKER -s 172.18.5.0/24 -p tcp --dport 80 -j ACCEPT
iptables -D DOCKER -p tcp --dport 80 -j REJECT --reject-with tcp-reset
iptables -D DOCKER -s 172.18.5.0/24 -p tcp --dport 443 -j ACCEPT
iptables -D DOCKER -p tcp --dport 443 -j REJECT --reject-with tcp-reset
iptables -I DOCKER -p tcp --dport 80 -j REJECT --reject-with tcp-reset
iptables -I DOCKER -s 172.18.5.0/24 -p tcp --dport 80 -j ACCEPT
iptables -I DOCKER -p tcp --dport 443 -j REJECT --reject-with tcp-reset
iptables -I DOCKER -s 172.18.5.0/24 -p tcp --dport 443 -j ACCEPT
```