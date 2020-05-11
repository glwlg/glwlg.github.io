---
title: '网关与dubbo的测试'
date: 2020-03-03 10:09:10
tags: [dubbo,java]
published: true
hideInList: false
feature: 
isTop: false
---
gateway 线程大于 service 提供的线程数 其他消费者可以正常使用
actives 决定最大并发数量
connections 决定保持的连接数

actives 1    connections 10  不并发
actives 10   connections 1   并发
actives 10   connections 10  并发


1.service的线程打开就不会自动关掉
2.gateway每次订阅都会使service产生新的线程,直到达到设置的上限 (删掉zk上的订阅也没用,service重启也会马上打开累计数量的线程)
   (gateway和service都重启线程才会正常)
3.destroy旧订阅也会使线程增加(增加数为上次订阅的connections)
4.不destroy旧订阅,直接订阅新的不会产生新线程,但是新订阅也不会生效

5.如果gateway订阅的线程数小于service上限,并发的时候service会一直打开线程直到上限
也就是说dubbo会优先打开新线程,而非复用

6.如果gateway设置的actives小于service开启的线程,执行操作的线程不会超过actives



默认上限200


main方法中:
循环订阅并且destroy,内存不会上涨(connections大的时候会来不及回收,内存会轻微增加)
循环订阅不destroy,内存按连接数上涨
dubbo会留一些线程维持zk的连接(猜测)