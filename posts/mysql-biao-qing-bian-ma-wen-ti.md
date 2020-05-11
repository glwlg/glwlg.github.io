---
title: 'mysql表情编码问题'
date: 2020-01-21 15:31:36
tags: [mysql]
published: true
hideInList: false
feature: 
isTop: false
---
### emoji
* 有表情的字段,需要将表编码改成utf8mb4的
* java数据源data-source.xml里的bean "dataSource"加一个属性  
`<property name="connectionInitSqls" value="set names utf8mb4;"/>`
springboot：`spring.datasource.druid.connection-init-sqls=set names utf8mb4;`

如果表里已经有数据了要先把就数据转一下,删表导入是没用的,一定要这样
```
ALTER TABLE table_name CONVERT TO CHARACTER SET utf8mb4 collate utf8mb4_unicode_ci
```
