# hctree：树状目录插件


# 使用

### 1、项目结构下直接加入 hctree 目录; 
![image](https://github.com/coffeehu/hctree/blob/master/tmp/mulu.png)

### 2、html 引入 hctree.js;
```
<script src="./lib/hctree/js/hctree.js"></script>

<body>
    <div id="mtree"></div>
</body>
```

### 3、js 使用
```
var data = [
    {
        name:'小吃',
        children:[]
    },
    {
        name:'主食',
        children:[
            {
            name:'面食',
                children:[
                    {name:'豚骨拉面'},
                    {name:'牛肉米粉'}
                ]
            },
            {
                name:'肉类'
            }
        ]
    },
    {
        name:'饮品',
        children:[
            {name:'咖啡'},
            {name:'杨枝甘露'}
        ]
    }
];

var hcTree = new Hctree({
	id:'mtree',
	data:data
});
```

### 4、效果
![image](https://github.com/coffeehu/hctree/blob/master/tmp/1.png)

### 5、说明
树状目录为按需渲染，默认只渲染第一层。



# 展开/折叠
默认全部折叠。
### 1、为特定层设置展开状态：expanded
指定层中添加字段 expanded:true
```
{
    name:'主食',
    expanded:true, // add this!
    children:[
        {
        	name:'面食',
        	children:[
        		{name:'豚骨拉面'},
        		{name:'牛肉米粉'}
        	]
        },
        {
        	name:'肉类'
        }
    ]
    }
```
![image](https://github.com/coffeehu/hctree/blob/master/tmp/expand.png)

### 2、全部展开：expandAll()
```
hcTree.expandAll();
```

### 3、全部折叠：collapseAll()
```
hcTree.collapseAll();
```

### 4、状态
两种状态：
- 展开，expanded:true
- 折叠，expanded:false


# 勾选
默认有勾选框，默认未勾选。  
**注意：勾选必须要先展开才能生效。**

### 1、为特定层设置为勾选：checked
指定层中添加字段 checked:true
```
{
    name:'主食',
    expanded:true, // add this!
    children:[
        {
        	name:'面食',
        	checked:true, // add this!
        	children:[
        		{name:'豚骨拉面'},
        		{name:'牛肉米粉'}
        	]
        },
        {
        	name:'肉类'
        }
    ]
}
```

![image](https://github.com/coffeehu/hctree/blob/master/tmp/check.png)

### 2、全选：checkAll()
```
hcTree.checkAll();
```

### 3、取消全选：cancelAll()
```
hcTree.cancelAll();
```

### 4、获得勾选的值：getChecks()
```
var result = hcTree.getChecks();
```
返回的是一个数组。

### 5、状态
视觉上有三个状态：未勾选、勾选、半选（指子层级部分勾选）。  

数据上只有两个状态：
- 未勾选，checked:false
- 勾选/半选，checked:true

### 6、关闭勾选框 checkbox:false
```
var hcTree = new Hctree({
	id:'mtree',
	data:data,
	checkbox:false
});
```
![image](https://github.com/coffeehu/hctree/blob/master/tmp/checkboxfalse.png)

