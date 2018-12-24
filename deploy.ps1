

npm run docs:build

Set-Location docs/.vuepress/dist

git init
git add -A
git commit -m 'deploy'

git push -f git@github.com:glwlg/glwlg.github.io.git master

Set-Location ..
Remove-Item dist/.git -Force  -recurse
