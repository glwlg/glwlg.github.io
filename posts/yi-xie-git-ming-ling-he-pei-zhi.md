---
title: '一些Git命令和配置'
date: 2020-01-21 11:26:09
tags: [git]
published: true
hideInList: false
feature: 
isTop: false
---
## 设置代理
```
git config --global https.proxy http://127.0.0.1:1081
git config --global http.proxy http://127.0.0.1:1081

取消代理
git config --global --unset http.proxy 
git config --global --unset https.proxy
```

## 批量替换提交人

1. 拉取代码
`git clone --bare http://abc@git.xxx.com/abcd/abcde.git`  
2. 替换
```
git filter-branch -f --env-filter '
OLD_EMAIL="qwe@xxx.com"
CORRECT_NAME="abc"
CORRECT_EMAIL="abc@xxx.com"
if [ "$GIT_COMMITTER_EMAIL" = "$OLD_EMAIL" ]
then
    export GIT_COMMITTER_NAME="$CORRECT_NAME"
    export GIT_COMMITTER_EMAIL="$CORRECT_EMAIL"
fi
if [ "$GIT_AUTHOR_EMAIL" = "$OLD_EMAIL" ]
then
    export GIT_AUTHOR_NAME="$CORRECT_NAME"
    export GIT_AUTHOR_EMAIL="$CORRECT_EMAIL"
fi
' --tag-name-filter cat -- --branches --tags



git filter-branch -f --env-filter '
OLD_EMAIL="qwe@xxx.com"
CORRECT_NAME="abc"
CORRECT_EMAIL="abc@xxx.com"
if [[ "a5a8cddde2b671e2ac3fe424d13aa76b7c923f59" =~ "$GIT_COMMIT" ]]
then
    export GIT_COMMITTER_NAME="$CORRECT_NAME"
    export GIT_COMMITTER_EMAIL="$CORRECT_EMAIL"
fi
if [[ "a5a8cddde2b671e2ac3fe424d13aa76b7c923f59" =~ "$GIT_COMMIT" ]]
then
    export GIT_AUTHOR_NAME="$CORRECT_NAME"
    export GIT_AUTHOR_EMAIL="$CORRECT_EMAIL"
fi
' --tag-name-filter cat -- --branches --tags
```
3. push
` git push --force --tags origin 'refs/heads/*'` 