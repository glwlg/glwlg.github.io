---
title: 'haproxy做https代理'
date: 2020-03-03 10:13:07
tags: [haproxy,https,sni]
published: true
hideInList: false
feature: 
isTop: false
---
   
由于服务运行在内网,无法直接访问外网（机房问题）,需要调用外网接口的域名需要通过haproxy代理
之前代理的几个地址都是http协议,这次一个服务需要访问几个https的域名.
按照之前一样的配置发现无法连通,因为haproxy的http模式是不支持https的.
查找之后知道要用tcp模式来代理https,可行.
http模式的时候可以直接根据域名来判定代理指向哪里,而tcp无法直接获取域名来判断,
这样只能每个需要代理的域名都占用一台外网机器(因为代理的是相同的端口),临时方案.
最后找到一个haproxy的配置,可以通过req_ssl_sni来判断https的域名,结束