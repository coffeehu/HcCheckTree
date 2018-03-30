# hctree：树状目录插件

# 1、使用

- 项目结构下直接加入 hctree 目录;  
![image](https://github.com/coffeehu/hctree/blob/master/tmp/mulu.png)
- html 引入 hctree.js;
```
<script src="./lib/hctree/js/hctree.js"></script>

<body>
    <div id="mtree"></div>
</body>
```
- js 使用
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

- 效果  
![image](https://github.com/coffeehu/hctree/blob/master/tmp/1.png)

