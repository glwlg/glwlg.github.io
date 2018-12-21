# nginx-rewrite


## flag
```
last : 相当于Apache的[L]标记，表示完成rewrite
break : 停止执行当前虚拟主机的后续rewrite指令集
redirect : 返回302临时重定向，地址栏会显示跳转后的地址
permanent : 返回301永久重定向，地址栏会显示跳转后的地址
```

## 普通匹配
```
rewrite '^/(\w+).html$'  /html/$1.html last;

rewrite '^/(\w+).html$'  /qqq/$1-1.html last;
```

## 入参匹配
```
# ~ 影响优先级
location ~ /viewthread.php {
    if ($args ~* "tid=(.*)&page=(.*)$") {
       set $key $1;
       set $page $2;
       rewrite '^/viewthread.php(.*)$' /thread-$key-$page-1.html break;
    }
    root   D:/html;
    index  index.html index.htm;
}

```

* 参考 https://segmentfault.com/a/1190000002797606