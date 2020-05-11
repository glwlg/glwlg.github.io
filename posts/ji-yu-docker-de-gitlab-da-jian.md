---
title: '基于docker的gitlab搭建'
date: 2020-03-03 10:20:39
tags: [docker,gitlab]
published: true
hideInList: false
feature: 
isTop: false
---
> postgresql
```
docker run --name gitlab-postgresql -d \
--env 'DB_NAME=gitlabhq_production' \
--env 'DB_USER=gitlab' --env 'DB_PASS=password' \
--env 'DB_EXTENSION=pg_trgm' \
--volume /srv/docker/gitlab/postgresql:/var/lib/postgresql \
--log-driver json-file --log-opt max-size=100M --log-opt max-file=1 \
--restart always \
sameersbn/postgresql:9.6-2
```
> redis
```
docker run --name gitlab-redis -d \
--volume /srv/docker/gitlab/redis:/var/lib/redis \
--log-driver json-file --log-opt max-size=100M --log-opt max-file=1 \
--restart always \
sameersbn/redis:latest
```

> env-file
```
GITLAB_PORT=80
GITLAB_SSH_PORT=22
GITLAB_SECRETS_DB_KEY_BASE=xxxxxxxxxxxxxxxxxxxxxxxx
GITLAB_SECRETS_SECRET_KEY_BASE=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITLAB_SECRETS_OTP_KEY_BASE=xxxxxxxxxxxxxxxxxxxxxxxx
GITLAB_HOST=git.xxxx.com
SMTP_ENABLED=true
SMTP_DOMAIN=smtp.mxhichina.com
SMTP_HOST=smtp.mxhichina.com
SMTP_PORT=25
SMTP_USER=devops@xxxx.com
SMTP_PASS=xxxxx
SMTP_AUTHENTICATION=login
SMTP_STARTTLS=true
SMTP_TLS=false
TZ=Asia/Shanghai
GITLAB_TIMEZONE=Beijing
```
> gitlab
```
docker run --name gitlab -d \
--link gitlab-postgresql:postgresql --link gitlab-redis:redisio \
--publish 22:22/tcp --publish 80:80/tcp \
--env-file /srv/docker/gitlab/env-file \
--volume /srv/docker/gitlab/gitlab:/home/git/data \
--log-driver json-file --log-opt max-size=100M --log-opt max-file=1 \
--restart always \
--memory 3g \
--memory-swap 3g \
sameersbn/gitlab:11.8.0
```

> 备份
```
#!/bin/bash
#defined
NAME=git-bak`date +%Y%m%d%H%M%S`

cd /srv/docker/
rm bak-gitlab/* -rf
cp -R gitlab/. bak-gitlab/
tar -czf $NAME.tar.gz  bak-gitlab/
scp -P 31415 $NAME.tar.gz root@172.18.5.229:/srv/docker/gitlab/
rm $NAME.tar.gz -rf
```

> gitlab-ci-multi-runner
```
gitlab-ci-multi-runner register \
	--url "http://git.xxxx.com/ci" \
	--registration-token "yWxaTf982qBqjnDU8ZiB" \
	--description "centos-228" \
	--executor "shell" \
	--env "M2_HOME=/home/gitlab-runner/maven/apache-maven-3.3.9"
```