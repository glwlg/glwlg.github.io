---
title: 'JQuery表格排序'
date: 2020-01-21 11:23:29
tags: [jquery]
published: true
hideInList: false
feature: 
isTop: false
---
# tablesorter.js
[github](https://github.com/Mottie/tablesorter)
[文档地址](https://mottie.github.io/tablesorter/docs/index.html)
##css
```   
<link rel="stylesheet" href="/admin/media/js/plugins/tablesorter/css/theme.blue.css">
```
##js
```
<script src="$baseLink/admin/media/js/plugins/tablesorter/js/jquery.tablesorter.js"></script>
<script src="$baseLink/admin/media/js/plugins/tablesorter/js/jquery.tablesorter.widgets.min.js"></script>
<script src="$baseLink/admin/media/js/plugins/tablesorter/js/extras/jquery.tablesorter.pager.min.js"></script>
```
## 排序功能
排序功能是这个插件的主要功能

```
$(".orderTable").tablesorter({
        theme: 'blue',
        widthFixed: true,
        sortList: [[0, 1], [1, 0]]
    });
```
>说明:
sortList:初始化的默认排序,第一位数字是第几列,第二位数字是排序方式(正序,倒序)


##搜索
```
<input type="text" class="form-control input-sm m-b-xs search" data-column="all" placeholder="搜索...">

$(".orderTable").tablesorter({
        widgets: ["filter"],
        widgetOptions: {
            filter_external: '.search',
            filter_columnFilters: false
        }
    });
    
如果搜索没有过滤,添加样式
<style>
        .filtered{
            display: none;
        }
</style>
```
>说明:
data-column:指定可搜索的列
widgets:插件,这里只用了filter插件
filter_external:绑定input元素到filter插件
filter_columnFilters:是否在每一列上面添加搜索框

##分页
```
<div id="pager" class="pager btn-group">
    <button type="button" class="btn btn-white first">
        <i class="fa fa-fast-backward"></i>
    </button>
    <button type="button" class="btn btn-white prev">
        <i class="fa fa-chevron-left"></i>
    </button>
    <select class="form-control gotoPage" style="width: 70px;display: unset;float: left;">
        <option selected="selected" value="1">1</option>
    </select>
    <button type="button" class="btn btn-white next">
        <i class="fa fa-chevron-right"></i>
    </button>
    <button type="button" class="btn btn-white last">
        <i class="fa fa-fast-forward"></i>
    </button>
    <select class="form-control pagesize" style="width: 70px;display: unset;float: left;">
        <option selected="selected" value="10">10</option>
        <option value="20">25</option>
        <option value="30">50</option>
        <option value="40">100</option>
    </select>
</div>

pagerOptions = {
        container: $(".pager"),
        savePages: true
    };

$(".orderTable").tablesorter({
        theme: 'blue'
    }).tablesorterPager(pagerOptions);
```
>说明:
savePages:保存分页选择