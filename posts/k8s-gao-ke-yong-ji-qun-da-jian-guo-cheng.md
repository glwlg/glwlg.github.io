---
title: 'k8s高可用集群搭建过程'
date: 2020-01-17 16:03:51
tags: [docker,kubernetes,k8s]
published: true
hideInList: false
feature: 
isTop: false
---
# 一.基础环境搭建
## 1.1系统配置

* 在安装之前，需要先做如下准备。两台CentOS 7.3主机如下：
```
cat /etc/hosts
192.168.4.113 node1
192.168.4.8 node2
192.168.4.64 node2
```
* 如果各个主机启用了防火墙，需要开放Kubernetes各个组件所需要的端口，可以查看[Installing kubeadm](https://kubernetes.io/docs/setup/independent/install-kubeadm/)中的”Check required ports”一节。 这里简单起见在各节点禁用防火墙：
```
systemctl stop firewalld
systemctl disable firewalld
```
* 创建/etc/sysctl.d/k8s.conf文件，添加如下内容：
```
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
```
* 执行sysctl -p /etc/sysctl.d/k8s.conf使修改生效。

* 禁用SELINUX：
```
setenforce 0
```
```
vim /etc/selinux/config
SELINUX=disabled
```
* Kubernetes 1.8开始要求关闭系统的Swap，如果不关闭，默认配置下kubelet将无法启动。可以通过kubelet的启动参数–fail-swap-on=false更改这个限制。 我们这里关闭系统的Swap:
```
swapoff -a
```
* 修改 /etc/fstab 文件，注释掉 SWAP 的自动挂载，使用free -m确认swap已经关闭。

* swappiness参数调整，修改/etc/sysctl.d/k8s.conf添加下面一行：
```
vm.swappiness=0
```
* 执行sysctl -p /etc/sysctl.d/k8s.conf使修改生效。

## 1.2安装Docker
```
yum install -y yum-utils device-mapper-persistent-data lvm2
yum-config-manager \
    --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo
```
* 查看当前的Docker版本：
```
yum list docker-ce.x86_64  --showduplicates |sort -r
docker-ce.x86_64            17.03.2.ce-1.el7.centos             docker-ce-stable
docker-ce.x86_64            17.03.1.ce-1.el7.centos             docker-ce-stable
docker-ce.x86_64            17.03.0.ce-1.el7.centos             docker-ce-stable
```
* Kubernetes 1.8已经针对Docker的1.11.2, 1.12.6, 1.13.1和17.03.2等版本做了验证。 因为我们这里在各节点安装docker的17.03.2版本。
```
yum makecache fast
yum install -y --setopt=obsoletes=0 \
  docker-ce-17.03.2.ce-1.el7.centos \
  docker-ce-selinux-17.03.2.ce-1.el7.centos
```
```
systemctl start docker
systemctl enable docker
```
* Docker从1.13版本开始调整了默认的防火墙规则，禁用了iptables filter表中FOWARD链，这样会引起Kubernetes集群中跨Node的Pod无法通信，在各个Docker节点执行下面的命令
```
iptables -P FORWARD ACCEPT
```
* 可在docker的systemd unit文件中以ExecStartPost加入上面的命令：
```
ExecStartPost=/usr/sbin/iptables -P FORWARD ACCEPT
```
```
systemctl daemon-reload
systemctl restart docker
```

## 2.安装kubeadm和kubelet

* 下面在各节点安装kubeadm和kubelet：
```
cat <<EOF > /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://packages.cloud.google.com/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://packages.cloud.google.com/yum/doc/yum-key.gpg
        https://packages.cloud.google.com/yum/doc/rpm-package-key.gpg
EOF
```
* 这里要加代理
```
curl https://packages.cloud.google.com/yum/repos/kubernetes-el7-x86_64
yum makecache fast
yum install -y kubelet kubeadm kubectl

... 
Installed:
  kubeadm.x86_64 0:1.8.0-0     kubectl.x86_64 0:1.8.0-0    kubelet.x86_64 0:1.8.0-0

Dependency Installed:
  kubernetes-cni.x86_64 0:0.5.1-0             socat.x86_64 0:1.7.3.2-2.el7
```


* 修改各节点docker的cgroup driver使其和kubelet一致，即修改或创建/etc/docker/daemon.json，加入下面的内容：
```
{
  "exec-opts": ["native.cgroupdriver=systemd"]
}
```
* 重启docker:
```
systemctl restart docker
systemctl status docker
```
* 在各节点开机启动kubelet服务：
```
systemctl enable kubelet.service
```

# 二.集群初始化

## 2.1 etcd集群
* 在三个主节点用docker启动etcd
```
docker stop etcd && docker rm etcd
rm -rf /var/lib/etcd-cluster
mkdir -p /var/lib/etcd-cluster
docker run -d \
--restart always \
-v /etc/ssl/certs:/etc/ssl/certs \
-v /var/lib/etcd-cluster:/var/lib/etcd \
-p 4001:4001 \
-p 2380:2380 \
-p 2379:2379 \
--name etcd \
gcr.io/google_containers/etcd-amd64:3.0.17 \
etcd --name=etcd0 \
--advertise-client-urls=http://192.168.4.113:2379,http://192.168.4.113:4001 \
--listen-client-urls=http://0.0.0.0:2379,http://0.0.0.0:4001 \
--initial-advertise-peer-urls=http://192.168.4.113:2380 \
--listen-peer-urls=http://0.0.0.0:2380 \
--initial-cluster-token=3965193498ef91bf92d78922e31be707 \
--initial-cluster=etcd0=http://192.168.4.113:2380,etcd1=http://192.168.4.8:2380,etcd2=http://192.168.4.64:2380 \
--initial-cluster-state=new \
--auto-tls \
--peer-auto-tls \
--data-dir=/var/lib/etcd
```
```
docker stop etcd && docker rm etcd
rm -rf /var/lib/etcd-cluster
mkdir -p /var/lib/etcd-cluster
docker run -d \
--restart always \
-v /etc/ssl/certs:/etc/ssl/certs \
-v /var/lib/etcd-cluster:/var/lib/etcd \
-p 4001:4001 \
-p 2380:2380 \
-p 2379:2379 \
--name etcd \
gcr.io/google_containers/etcd-amd64:3.0.17 \
etcd --name=etcd1 \
--advertise-client-urls=http://192.168.4.8:2379,http://192.168.4.8:4001 \
--listen-client-urls=http://0.0.0.0:2379,http://0.0.0.0:4001 \
--initial-advertise-peer-urls=http://192.168.4.8:2380 \
--listen-peer-urls=http://0.0.0.0:2380 \
--initial-cluster-token=3965193498ef91bf92d78922e31be707 \
--initial-cluster=etcd0=http://192.168.4.113:2380,etcd1=http://192.168.4.8:2380,etcd2=http://192.168.4.64:2380 \
--initial-cluster-state=new \
--auto-tls \
--peer-auto-tls \
--data-dir=/var/lib/etcd
```
```
docker stop etcd && docker rm etcd
rm -rf /var/lib/etcd-cluster
mkdir -p /var/lib/etcd-cluster
docker run -d \
--restart always \
-v /etc/ssl/certs:/etc/ssl/certs \
-v /var/lib/etcd-cluster:/var/lib/etcd \
-p 4001:4001 \
-p 2380:2380 \
-p 2379:2379 \
--name etcd \
gcr.io/google_containers/etcd-amd64:3.0.17 \
etcd --name=etcd2 \
--advertise-client-urls=http://192.168.4.64:2379,http://192.168.4.64:4001 \
--listen-client-urls=http://0.0.0.0:2379,http://0.0.0.0:4001 \
--initial-advertise-peer-urls=http://192.168.4.64:2380 \
--listen-peer-urls=http://0.0.0.0:2380 \
--initial-cluster-token=3965193498ef91bf92d78922e31be707 \
--initial-cluster=etcd0=http://192.168.4.113:2380,etcd1=http://192.168.4.8:2380,etcd2=http://192.168.4.64:2380 \
--initial-cluster-state=new \
--auto-tls \
--peer-auto-tls \
--data-dir=/var/lib/etcd
```

## 2.2 kubeadm初始化
* 在node1运行
```
kubeadm init --config=/root/kubeadm-ha/kubeadm-init-v1.8.1.yaml
```
* kubeadm-init-v1.8.1.yaml
```
apiVersion: kubeadm.k8s.io/v1alpha1
kind: MasterConfiguration
api:
  advertiseAddress: 192.168.4.113
kubernetesVersion: v1.8.1
networking:
  podSubnet: 10.244.0.0/16
apiServerCertSANs:
- node1
- node2
- node3
- 192.168.4.113
- 192.168.4.8
- 192.168.4.64
- 192.168.4.2
etcd:
  endpoints:
  - http://192.168.4.113:2379
  - http://192.168.4.8:2379
  - http://192.168.4.64:2379
```
* 修改admission-control配置
```
vim /etc/kubernetes/manifests/kube-apiserver.yaml
#    - --admission-control=Initializers,NamespaceLifecycle,LimitRanger,ServiceAccount,PersistentVolumeLabel,DefaultStorageClass,DefaultTolerationSeconds,NodeRestriction,ResourceQuota
    - --admission-control=NamespaceLifecycle,LimitRanger,ServiceAccount,PersistentVolumeLabel,DefaultStorageClass,ResourceQuota,DefaultTolerationSeconds
```
* 重启服务
```
systemctl restart docker kubelet
```
```
vim ~/.bashrc
export KUBECONFIG=/etc/kubernetes/admin.conf
source ~/.bashrc
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

## 2.3 flannel网络组件安装
### rbac配置
* step1-kube-flannel-rbac-v0.9.0.yml
```
# Create the clusterrole and clusterrolebinding:
# $ kubectl create -f kube-flannel-rbac.yml
# Create the pod using the same namespace used by the flannel serviceaccount:
# $ kubectl create --namespace kube-system -f kube-flannel.yml
---
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: flannel
rules:
  - apiGroups:
      - ""
    resources:
      - pods
    verbs:
      - get
  - apiGroups:
      - ""
    resources:
      - nodes
    verbs:
      - list
      - watch
  - apiGroups:
      - ""
    resources:
      - nodes/status
    verbs:
      - patch
---
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: flannel
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: flannel
subjects:
- kind: ServiceAccount
  name: flannel
  namespace: kube-system
```
### flannel配置
* step2-kube-flannel-v0.9.0.yml
```
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: flannel
  namespace: kube-system
---
kind: ConfigMap
apiVersion: v1
metadata:
  name: kube-flannel-cfg
  namespace: kube-system
  labels:
    tier: node
    app: flannel
data:
  cni-conf.json: |
    {
      "name": "cbr0",
      "type": "flannel",
      "delegate": {
        "isDefaultGateway": true
      }
    }
  net-conf.json: |
    {
      "Network": "10.244.0.0/16",
      "Backend": {
        "Type": "vxlan"
      }
    }
---
apiVersion: extensions/v1beta1
kind: DaemonSet
metadata:
  name: kube-flannel-ds
  namespace: kube-system
  labels:
    tier: node
    app: flannel
spec:
  template:
    metadata:
      labels:
        tier: node
        app: flannel
    spec:
      hostNetwork: true
      nodeSelector:
        beta.kubernetes.io/arch: amd64
      tolerations:
      - key: node-role.kubernetes.io/master
        operator: Exists
        effect: NoSchedule
      serviceAccountName: flannel
      containers:
      - name: kube-flannel
        image: quay.io/coreos/flannel:v0.9.0-amd64
        command: [ "/opt/bin/flanneld", "--ip-masq", "--kube-subnet-mgr" , "--iface-regex=enp0s8|wlp3s0"]
        securityContext:
          privileged: true
        env:
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        volumeMounts:
        - name: run
          mountPath: /run
        - name: flannel-cfg
          mountPath: /etc/kube-flannel/
      - name: install-cni
        image: quay.io/coreos/flannel:v0.9.0-amd64
        command: [ "/bin/sh", "-c", "set -e -x; cp -f /etc/kube-flannel/cni-conf.json /etc/cni/net.d/10-flannel.conf; while true; do sleep 3600; done" ]
        volumeMounts:
        - name: cni
          mountPath: /etc/cni/net.d
        - name: flannel-cfg
          mountPath: /etc/kube-flannel/
      volumes:
        - name: run
          hostPath:
            path: /run
        - name: cni
          hostPath:
            path: /etc/cni/net.d
        - name: flannel-cfg
          configMap:
            name: kube-flannel-cfg

```
* 确认都启动之后再进行下一步
```
kubectl get pods --all-namespaces -o wide
```

## 2.4 dashboard
### rbac配置
kubernetes-dashboard-admin.rbac.yaml
```
---
apiVersion: v1
kind: ServiceAccount
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard-admin
  namespace: kube-system
  
---
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: ClusterRoleBinding
metadata:
  name: kubernetes-dashboard-admin
  labels:
    k8s-app: kubernetes-dashboard
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: kubernetes-dashboard-admin
  namespace: kube-system
```

### dashboard配置
kubernetes-dashboard.yaml
```
# Copyright 2017 The Kubernetes Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Configuration to deploy release version of the Dashboard UI compatible with
# Kubernetes 1.7.
#
# Example usage: kubectl create -f <this_file>

# ------------------- Dashboard Secret ------------------- #

apiVersion: v1
kind: Secret
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard-certs
  namespace: kube-system
type: Opaque

---
# ------------------- Dashboard Service Account ------------------- #

apiVersion: v1
kind: ServiceAccount
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard
  namespace: kube-system

---
# ------------------- Dashboard Role & Role Binding ------------------- #

kind: Role
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: kubernetes-dashboard-minimal
  namespace: kube-system
rules:
  # Allow Dashboard to create and watch for changes of 'kubernetes-dashboard-key-holder' secret.
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["create", "watch"]
- apiGroups: [""]
  resources: ["secrets"]
  # Allow Dashboard to get, update and delete 'kubernetes-dashboard-key-holder' secret.
  resourceNames: ["kubernetes-dashboard-key-holder", "kubernetes-dashboard-certs"]
  verbs: ["get", "update", "delete"]
  # Allow Dashboard to get metrics from heapster.
- apiGroups: [""]
  resources: ["services"]
  resourceNames: ["heapster"]
  verbs: ["proxy"]

---
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: RoleBinding
metadata:
  name: kubernetes-dashboard-minimal
  namespace: kube-system
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: kubernetes-dashboard-minimal
subjects:
- kind: ServiceAccount
  name: kubernetes-dashboard
  namespace: kube-system

---
# ------------------- Dashboard Deployment ------------------- #

kind: Deployment
apiVersion: extensions/v1beta1
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard
  namespace: kube-system
spec:
  replicas: 3
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      k8s-app: kubernetes-dashboard
  template:
    metadata:
      labels:
        k8s-app: kubernetes-dashboard
    spec:
      initContainers:
      - name: kubernetes-dashboard-init
        image: gcr.io/google_containers/kubernetes-dashboard-init-amd64:v1.0.1
        volumeMounts:
        - name: kubernetes-dashboard-certs
          mountPath: /certs
      containers:
      - name: kubernetes-dashboard
        image: gcr.io/google_containers/kubernetes-dashboard-amd64:v1.7.1
        ports:
        - containerPort: 9443
          protocol: TCP
        args:
           - --authentication-mode=token
           - --port=9443
           - --tls-key-file=/certs/dashboard.key
           - --tls-cert-file=/certs/dashboard.crt
          # Uncomment the following line to manually specify Kubernetes API server Host
          # If not specified, Dashboard will attempt to auto discover the API server and connect
          # to it. Uncomment only if the default does not work.
          # - --apiserver-host=http://my-address:port
        volumeMounts:
        - name: kubernetes-dashboard-certs
          mountPath: /certs
          readOnly: true
          # Create on-disk volume to store exec logs
        - mountPath: /tmp
          name: tmp-volume
        livenessProbe:
          httpGet:
            scheme: HTTPS
            path: /
            port: 9443
          initialDelaySeconds: 30
          timeoutSeconds: 30
      volumes:
      - name: kubernetes-dashboard-certs
        secret:
          secretName: kubernetes-dashboard-certs
      - name: tmp-volume
        emptyDir: {}
      serviceAccountName: kubernetes-dashboard
      # Comment the following tolerations if Dashboard must not be deployed on master
      tolerations:
      - key: node-role.kubernetes.io/master
        effect: NoSchedule
      nodeSelector:
        role: master

---
# ------------------- Dashboard Service ------------------- #

kind: Service
apiVersion: v1
metadata:
  labels:
    k8s-app: kubernetes-dashboard
  name: kubernetes-dashboard
  namespace: kube-system
spec:
  ports:
    - port: 443
      targetPort: 9443
      nodePort: 30000
      protocol: TCP
  selector:
    k8s-app: kubernetes-dashboard
  type: NodePort
```
* 获取token
```
kubectl -n kube-system get secret | grep kubernetes-dashboard-admin
kubectl describe -n kube-system secret/kubernetes-dashboard-admin-token-pfss5
```
访问192.168.4.113:30000验证

### heapster组件安装
* 在k8s-master1上允许在master上部署pod，否则heapster会无法部署
```
kubectl taint nodes --all node-role.kubernetes.io/master-
```
* 在k8s-master1上安装heapster组件，监控性能
```
kubectl create -f /root/kubeadm-ha/kube-heapster
```
* 重启服务
```
systemctl restart docker kubelet
```


# 三.master集群高可用设置

## 3.1 修改配置
* 在node1上把/etc/kubernetes/复制node2、node3
```
scp -r /etc/kubernetes/ k8s-master2:/etc/
scp -r /etc/kubernetes/ k8s-master3:/etc/
```
* 在node2 ,node3上重启kubelet服务，并检查kubelet服务状态为active (running)
```
systemctl daemon-reload && systemctl restart kubelet
```
```
vim ~/.bashrc
export KUBECONFIG=/etc/kubernetes/admin.conf
source ~/.bashrc
```
* 在node2 ,node3检测节点状态，这个时候只能看到node1,因为配置还没改
```
kubectl get nodes -o wide
```
* 修改node2,node3的以下文件,改ip为本机ip
```
vim /etc/kubernetes/manifests/kube-apiserver.yaml
vim /etc/kubernetes/kubelet.conf
vim /etc/kubernetes/admin.conf
vim /etc/kubernetes/controller-manager.conf
vim /etc/kubernetes/scheduler.conf
```
* 重启所有节点服务
```
systemctl daemon-reload && systemctl restart docker kubelet
```

## 3.2 验证

* 这个时候应该有3个节点了
```
kubectl get nodes -o wide
kubectl get pod --all-namespaces -o wide | grep node2
```
* 修改插件容器数量
```
kubectl scale --replicas=3 -n kube-system deployment/kube-dns
kubectl scale --replicas=3 -n kube-system deployment/kubernetes-dashboard
kubectl scale --replicas=3 -n kube-system deployment/heapster
kubectl scale --replicas=3 -n kube-system deployment/monitoring-grafana
kubectl scale --replicas=3 -n kube-system deployment/monitoring-influxdb

kubectl get pods --all-namespaces -o wide| grep kube-dns
kubectl get pods --all-namespaces -o wide| grep kubernetes-dashboard
kubectl get pods --all-namespaces -o wide| grep heapster
kubectl get pods --all-namespaces -o wide| grep monitoring-grafana
kubectl get pods --all-namespaces -o wide| grep monitoring-influxdb
```

## 3.3 keepalived安装配置

* 下面操作在三个节点进行
```
 yum install -y keepalived

systemctl enable keepalived && systemctl restart keepalived
```
* 备份原配置
```
 mv /etc/keepalived/keepalived.conf /etc/keepalived/keepalived.conf.bak
```
* check_apiserver.sh
```
vim /etc/keepalived/check_apiserver.sh

#!/bin/bash
err=0
for k in $( seq 1 10 )
do
    check_code=$(ps -ef|grep kube-apiserver | wc -l)
    if [ "$check_code" = "1" ]; then
        err=$(expr $err + 1)
        sleep 5
        continue
    else
        err=0
        break
    fi
done
if [ "$err" != "0" ]; then
    echo "systemctl stop keepalived"
    /usr/bin/systemctl stop keepalived
    exit 1
else
    exit 0
fi

chmod a+x /etc/keepalived/check_apiserver.sh
```

* 修改配置
* keepalived.conf
```
! Configuration File for keepalived
global_defs {
    router_id LVS_DEVEL
}
vrrp_script chk_apiserver {
    script "/etc/keepalived/check_apiserver.sh"
    interval 2
    weight -5
    fall 3  
    rise 2
}
vrrp_instance VI_1 {
    state MASTER
    interface enp0s8
    mcast_src_ip 192.168.4.113
    virtual_router_id 51
    priority 102
    advert_int 2
    authentication {
        auth_type PASS
        auth_pass 4be37dc3b4c90194d1600c483e10ad1d
    }
    virtual_ipaddress {
        192.168.4.2
    }
    track_script {
       chk_apiserver
    }
}
```
* 重启服务
```
systemctl restart keepalived
```

## 3.4 nginx负载均衡配置
* nginx-default.conf
```
vim /root/kubeadm-ha/nginx-default.conf

user  nginx;
worker_processes  1;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;


events {
    worker_connections  1024;
}


http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile        on;
    #tcp_nopush     on;

    keepalive_timeout  65;

    #gzip  on;

    include /etc/nginx/conf.d/*.conf;
}

stream {
	upstream apiserver {
	    server 192.168.4.113:6443 weight=5 max_fails=3 fail_timeout=30s;
	    server 192.168.4.8:6443 weight=5 max_fails=3 fail_timeout=30s;
	    server 192.168.4.64:6443 weight=5 max_fails=3 fail_timeout=30s;
	}

    server {
        listen 8443;
        proxy_connect_timeout 1s;
        proxy_timeout 3s;
        proxy_pass apiserver;
    }
}
```
* 运行nginx
```
docker run -d -p 8443:8443 \
--name nginx-lb \
--restart always \
-v /root/kubeadm-ha/nginx-default.conf:/etc/nginx/nginx.conf \
nginx
```
## 3.5 kube-proxy配置
* 在k8s-master1上修改configmap/kube-proxy的server指向keepalived的虚拟IP地址
```
kubectl edit -n kube-system configmap/kube-proxy
server: https://192.168.4.2:8443
```
* 在k8s-master1上查看configmap/kube-proxy设置情况
```
kubectl get -n kube-system configmap/kube-proxy -o yaml
```
* 在k8s-master1上删除所有kube-proxy的pod，让proxy重建
```
kubectl get pods --all-namespaces -o wide | grep proxy
```
* 在k8s-master1、k8s-master2、k8s-master3上重启docker kubelet keepalived服务
```
systemctl restart docker kubelet keepalived
```

# 四. node节点加入高可用集群设置

* kubeadm加入高可用集群
* 在k8s-master1上禁止在所有master节点上发布应用
```
kubectl patch node node1 -p '{"spec":{"unschedulable":true}}'
kubectl patch node node2 -p '{"spec":{"unschedulable":true}}'
kubectl patch node node3 -p '{"spec":{"unschedulable":true}}'
```
* 在k8s-master1上查看集群的token
```
kubeadm token list
kubeadm join --token ${TOKEN} ${VIRTUAL_IP}:8443
```
* 默认的token24小时过期,可以重新创建一个
```
kubeadm token create
```