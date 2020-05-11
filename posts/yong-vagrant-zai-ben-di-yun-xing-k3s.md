---
title: '用Vagrant搭建虚拟集群'
date: 2020-05-09 16:09:10
tags: [docker,虚拟机]
published: true
hideInList: false
feature: 
isTop: false
---
# 什么是Vagrant？
<a href="https://www.vagrantup.com/intro/index.html" target="_blank">Vagrant</a> 是一种管理虚拟机环境的工具。

拿VirtualBox举例，VirtualBox会开放一个创建虚拟机的接口，Vagrant会利用这个接口创建虚拟机，并且通过Vagrant来管理，配置和自动安装虚拟机。


# 安装虚拟机
## VirtualBox
VirtualBox
Vagrant本身不提供虚拟机功能，所以需要安装一个，Vagrant支持多种虚拟机（VirtualBox, Hyper-V, VMware ），这里我选择了VirtualBox，<a href="https://www.virtualbox.org/wiki/Downloads" target="_blank">下载地址</a>

因为使用Vagrant进行虚拟机的管理，所以不需要对VirtualBox进行什么配置，默认安装即可。
我这里只修改了虚拟机的存储位置（默认在C盘），安装好之后打开VirtualBox->管理->全局设定->常规->默认虚拟电脑位置，改成自己喜欢的位置即可，保存之后关闭窗口，后面基本不会再用到了


## Vagrant
配置完VirtualBox之后就可以安装Vagrant了，<a href="https://www.vagrantup.com/downloads.html" target="_blank">下载地址</a>
这里我选择windows 64位版，安装过程也很简单，安装完成之后需要重启一次计算机，重启之前可以设置一个环境变量，在命令行运行`setx.exe VAGRANT_HOME "D:/dev/vbox/boxes"`，（双引号中路径可以换成自己喜欢的），否则Vagrant会把镜像下载在C盘。

# 运行虚拟机
重启电脑之后就可以开始准备运行环境了
先打开命令行运行`vagrant box add centos/7`下载centos7的镜像

下载可能比较慢，先放着，然后找个自己喜欢的地方创建一个文件夹，在里面新建一个`Vagrantfile`文件，打开编辑，输入以下内容：
```
#定义三个虚拟机作为一个集群，分别是c1，c2，c3
Vagrant.configure("2") do |config|
#定义一个c1虚拟机
  config.vm.define "c1" do |c1|
    #定义c1虚拟机的hostname
    c1.vm.hostname = "centos-1"
    #使用centos/7这个镜像
    c1.vm.box = "centos/7"
    #定义网络配置，bridge后填写的是网卡名，具体可以看自己的网络配置
    c1.vm.network "public_network", bridge: "Intel(R) Wi-Fi 6 AX200 160MHz"
    c1.vm.provider "virtualbox" do |vb|
    #配置虚拟机的参数
      vb.memory = "2048"
      vb.cpus = 2
      vb.name = "k3s-1"
    end
  end
  config.vm.define "c2" do |c2|
    c2.vm.hostname = "centos-2"
    c2.vm.box = "centos/7"
    c2.vm.network "public_network", bridge: "Intel(R) Wi-Fi 6 AX200 160MHz"
    c2.vm.provider "virtualbox" do |vb|
      vb.memory = "2048"
      vb.cpus = 2
      vb.name = "k3s-2"
    end
  end
  config.vm.define "c3" do |c3|
    c3.vm.hostname = "centos-3"
    c3.vm.box = "centos/7"
    c3.vm.network "public_network", bridge: "Intel(R) Wi-Fi 6 AX200 160MHz"
    c3.vm.provider "virtualbox" do |vb|
      vb.memory = "2048"
      vb.cpus = 2
      vb.name = "k3s-3"
    end
  end
end
 ```
 这里只配置了我需要的，其他配置项可以查看<a href="https://www.vagrantup.com/docs/index.html" target="_blank">官方文档</a>

等镜像下载完成之后，在命令行把路径切换到Vagrantfile所在的路径
运行`vagrant up`
vagrant会按顺序启动三个虚拟机，如果端口没被其他程序占用的话，三个虚拟机的ssh端口应该分别是2222，2200，2201，
可以对照屏幕输出日志，其中有一句`SSH address: 127.0.0.1:2200`

正常情况应该是三个虚拟机都成功启动，然而我就遇到了非正常情况：
日志卡在`SSH auth method: private key`这一句几分钟之后提示超时，问题不大，比如我在启动c2的时候卡住，只需按顺序运行`vagrant halt c2` `vagrant destroy c2` `vagrant up c2` 来重新创建虚拟机即可，如果c3还没启动，那最后再运行一下`vagrant up`或者`vagrant up c3`。

启动成功之后，可以运行`vagrant ssh c1` `vagrant ssh c2``vagrant ssh c3`来分别连接三台虚拟机，这里我对三个虚拟机分别进行了免密登录的配置之后就转到xshell进行操作了。

这样我们就有了一个三台服务器的集群，如果配置够高，可以多加几台。
虚拟机自然是可以随便折腾的，只要Vagrantfile在，一个命令`vagrant up`即可重建。





