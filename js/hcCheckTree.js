/*
	hucong 2018-02-14
	带勾选框的树形目录

	默认全部折叠，未选中。默认显示勾选框。

	data 的数据结构如：
	var data = [
		{
			name:'行政部'
		},
		{
			name:'技术部',
			expanded:true,  // 为true表示展开，默认折叠
			children:[
				{
					name:'前端开发',
					checked:true // 为true表示选中，默认不选中
								 // 注意：只有该条目处于展开状态(即可见)时，选中才会有效
				},
				{
					name:'后台开发'
				}
			]
		}
	];

	var hcTree = new HcCheckTree({
		id:'tree-container',  //容器元素的id
		data:data,  // 数据结构见上
		//checkbox:false,  // false可关闭勾选框
		clickFn:function(event,label){  // 点击目录名的回调
			console.log('click',label);
		},
		checkFn:function(params){   // 选中勾选框的回调
			console.log('check it!',params)
		}
	});

	hcTree.collapseAll(); // 全部折叠
	hcTree.expandAll(); //全部展开
	hcTree.checkAll(); //全部选中
	hcTree.cancelAll(); //全部取消
	hcTree.getAllChecks(); //获取当前选中的所有条目集合
	hcTree.addChild(li,name); //给li添加子条目，条目名为name
	hcTree.remove(li); //移除该li
*/


/*
	该版本初始仅渲染第一级 html 结构，后面按需渲染
*/
(function(exports){


var domUtil = {
	children:function(elem,tagName){
		if(elem === undefined) return;
		var node = elem.firstChild;
		var children = [];
		for(;node;node=node.nextSibling){
			if(node.nodeType === 1){
				if(tagName){
					var tag = node.tagName.toLowerCase();
					if(tag === tagName){
						children.push(node);
					}
				}else{
					children.push(node);
				}
			}
		}
		return children;
	},
	next:function(el){
		while( (el = el.nextSibling) && el.nodeType != 1 ){};
		return el;
	},
	getLi:function(el){  // 根据展开折叠按钮、勾选框、名字获得对应的<li>
		var p = el.parentNode;
		if(p.tagName === 'LI'){
			return p;
		}
		return null;
	},
	getParentLi:function(li){  // 获得其父<li>
		/*var parentLi = null;
		var ul = null;
		if(li.parentNode && li.parentNode.tagName === 'UL'){
			ul = li.parentNode;
			if(ul.parentNode && ul.parentNode.tagName === 'LI'){
				parentLi = ul.parentNode;
			}
		}
		return parentLi;*/
		var parentLi = null;
		if(li.hcData.parent){
			parentLi = li.hcData.parent.elem;
		}
		return parentLi;
	},
	getChildrenLiList:function(li){  // 获得其子<li>的集合，数组
		/*var ul = domUtil.children(li,'ul')[0];
		var childrenLiList = domUtil.children(ul,'li')||null;
		return childrenLiList;*/
		var childrenLiList = [];
		if(li.hcData.children && li.hcData.children.length>0){
			for(var i=0,l=li.hcData.children.length;i<l;i++){
				var childLi = li.hcData.children[i].elem;
				if(childLi) childrenLiList.push(childLi);
			}
		}
		return childrenLiList;
	},
	getArrowByLi:function(li){ // 获得其arrow（展开/折叠按钮）元素
		var arrow = domUtil.children(li)[0]||null;
		return arrow;
	},
	getCheckboxByLi:function(li){ // 获得其checkbox（勾选框）元素
		var checkbox = domUtil.children(li)[1]||null;
		return checkbox;
	}
};

var HcCheckTree = exports.HcCheckTree = function(option){
	if(typeof option !== 'object') return;
	option = option || {};
	
	this._initOption(option);
	this._initData(option.data);
	this._preCheckedArr = [];
	
	this.container = document.getElementById(option.id);
	if(this.container){
		this.container.innerHTML = '';
		this._createHTML(this.container,this.data);
		this._initEvents();
		this.root = domUtil.children(this.container)[0]; //根<ul>元素
		this._initEnds(); // 一些收尾的操作，如若是设置了expanded:true则展开对应dom
	}else{
		console.log('Error:can not find element by id!')
	}
}

HcCheckTree.prototype._initOption = function(option){
	if(!option.id) throw new Erorr('element id error!');
	this.id = option.id || '';
	option.data = option.data || [];
	// 默认是有勾选框的
	if(option.checkbox === undefined){
		this.checkbox = true;	
	}else{
		this.checkbox = option.checkbox;	
	}
	this.clickFn = option.clickFn || function(){};
	this.checkFn = option.checkFn || function(){};
	this.cancelFn = option.cancelFn || function(){};
}
// 复制并处理data数据
/*
	目的：当数据含有 expanded 属性时，如：
	[
		{
			name:'技术部',
			children:[
				{
					name:'前端',
					expanded:true,  // here!
					children:[]
				}
			]
		},
		{...}
	]
	表明“前端”这一级要展开。那么自然“技术部”这一级也应该展开。
	源数据将会复制并处理成如下格式：
	[
		{
			name:'技术部',
			expanded:true,  // add this!
			check:false,
			elem:指向该<li>元素,
			parent:{...},
			children:[
				{
					name:'前端',
					expanded:true,  // here!
					check:false,
					elem:指向该<li>元素,
					children:[],
					parent:{...}
				}
			]
		},
		{...}
	]
	可见其父级也应该多一个属性 expanded:true
*/
HcCheckTree.prototype._initData = function(data){
	this.data = [];
	var expandedArr = [];
	createExpandedArr(data,this.data);
	// 将对象以及其父对象都添加 expanded:true 属性
	for(var i=0,l=expandedArr.length;i<l;i++){
		var item = expandedArr[i];
		for(;item!==undefined;item=item.parent){
			item.expanded = true;
		}
	}
	// 先找出含有 expanded:true 属性的对象，放入数组。
	//若一个树有多个expanded属性，那么取最近的（最父级的）一个
	function createExpandedArr(arr,copyArr,parent){
		for(var i=0,l=arr.length;i<l;i++){
			var node = arr[i];
			var obj = {};
			for(var p in node){
				obj[p] = node[p];
			}
			obj.parent = parent;
			obj.checked = node.checked||false;
			obj.expanded = node.expanded||false;
			copyArr.push(obj);
			if(obj.expanded){
				if(parent && parent.expanded){ // 若其父级已是展开状态，那么不做处理

				}else{ // 加入展开数组
					expandedArr.push(obj);
				}
			}
			if(obj.children && obj.children.length>0){
				obj.children = [];
				createExpandedArr(node.children,obj.children,obj);
			}
		}
	}
}

// 根据data（数组形式），渲染html结生成：<ul></ul>,并将其追加到container里
// checked:boolean值，true表示设为选中
HcCheckTree.prototype._createHTML = function(container,data,checked){
	var ul = document.createElement('ul');
	ul.className = 'hc-checktree';
	var arrowClass,checkboxClass;

	for(var i=0,l=data.length;i<l;i++){
		var li = document.createElement('li');
		var node = data[i];
		li.hcData = node;
		li.hcData.elem = li;

		if(node.checked){ //若设置了初始选中，则加入数组，最后处理
			this._preCheckedArr.push(li);
		}

		// 展开、折叠箭头的样式
		if(node.children && node.children.length>0){
			if(li.hcData.expanded){
				arrowClass = 'hc-expanded';
			}else{
				arrowClass = 'hc-collapsed';
			}
		}else{
			arrowClass = '';
		}

		// 勾选框的样式
		if(this.checkbox){
			if(checked){ 
				checkboxClass = 'hc-checkbox hc-checked';
				node.checked = true;
			}else{
				checkboxClass = 'hc-checkbox';
			}
		}else{
			checkboxClass = 'hc-checkbox hc-hide';
		}

		var html = '<div class="hc-arrow '+arrowClass+'"></div>'+
			'<div class="'+checkboxClass+'"></div>'+
			'<label class="hc-label">'+node.name+'</label>';
		li.innerHTML = html;

		if(li.hcData.expanded){ //若初始设置为展开
			this._expandLi(li);
		}

		ul.appendChild(li);
	}
	container.appendChild(ul);
}

//初始化点击事件
HcCheckTree.prototype._initEvents = function(){
	var self = this;
	this.container.onclick = function(event){
		var target = event.target;
		var className = event.target.className;

		// arrow 展开/收起按钮 
		if(className.indexOf('hc-arrow') !== -1){
			var li = domUtil.getLi(target);
			if(li !== null){
				if(className.indexOf('hc-collapsed') !== -1){ //收起的，应置为展开
					self._expandLi(li,target);
				}else if(className.indexOf('hc-expanded') !== -1){ // 展开的，应收起
					self._collapseLi(li,target);
				}
			}
		}

		// checkbox 选中按钮
		else if(className.indexOf('hc-checkbox') !== -1){
			var li = domUtil.getLi(target);
			if(li !== null){
				if(className.indexOf('hc-checked') === -1){ //未选中，应置为选中
					li.hcData.checked = true;
					target.className = 'hc-checkbox hc-checked';
					self._checkboxLink(target,true);
				}else{ // 选中的，应置为未选中
					li.hcData.checked = false;
					target.className = 'hc-checkbox';
					self._checkboxLink(target,false);
				}
				self.checkFn(li.hcData);
			}
		}

		// label 名称的点击事件
		else if(className.indexOf('hc-label') !== -1){
			var li = domUtil.getLi(target);
			if(li !== null){
				self.clickFn(event,li.hcData);
			}
		}

		return false;
	}
}
//选中选择框后，其子选择框、父选择框的联动响应
// check: true-选中，false-取消
// target:checkbox元素
HcCheckTree.prototype._checkboxLink = function(target,check){
	this._checkboxLinkDown(target,check);
	this._checkboxLinkUp(target);
}
//对其子选择框的联动
//check: true-选中，false-取消
HcCheckTree.prototype._checkboxLinkDown = function(target,check){
	//本 checkbox 的样式
	var className = check?'hc-checkbox hc-checked':'hc-checkbox';
	target.className = className;

	var li = domUtil.getLi(target);
	var childrenLiList = domUtil.getChildrenLiList(li);
	for(var i=0,l=childrenLiList.length;i<l;i++){
		//子<li>
		var childrenLi = childrenLiList[i];
		//子 checkbox 的样式
		var childrenCheckbox = domUtil.getCheckboxByLi(childrenLi);
		childrenCheckbox.className = className;
		//传入子 checkbox 递归
		this._checkboxLinkDown(childrenCheckbox,check);
	}
	//数据处理
	if(li.hcData.children && li.hcData.children.length>0){
		for(var j=0,len=li.hcData.children.length;j<len;j++){
			li.hcData.children[j].checked = check;
		}
	}
}
//对其父选择框的联动
HcCheckTree.prototype._checkboxLinkUp = function(target){
	var li = domUtil.getLi(target);
	var parentLi = domUtil.getParentLi(li);
	if(parentLi === null) return;

	var parentCheckbox = domUtil.getCheckboxByLi(parentLi);
	if(parentCheckbox === null) return;
	var liList = domUtil.getChildrenLiList(parentLi);  //获得同级的<li>
	if(liList === null) return;
	var checkboxes = []; //获得同级<li>的checkbox元素，放入数组
	for(var i=0,l=liList.length;i<l;i++){
		var _checkbox = domUtil.getCheckboxByLi(liList[i]);
		checkboxes.push(_checkbox); 
	}

	var result = this._checkboxesStatus(checkboxes);
	if(result === 0){ // 未选
		parentCheckbox.className = 'hc-checkbox';
		if(li!==null) parentLi.hcData.checked = false;
	}else if(result === 1){ //半选
		parentCheckbox.className = 'hc-checkbox hc-checked-half';
		if(li!==null) parentLi.hcData.checked = true;
	}else if(result === 2){ //已选
		parentCheckbox.className = 'hc-checkbox hc-checked';
		if(li!==null) parentLi.hcData.checked = true;
	}
	this._checkboxLinkUp(parentCheckbox);
}
// 返回勾选框的状态
// return: 0-全未选，1-部分选，2-全选; -1-报错
HcCheckTree.prototype._checkboxesStatus = function(checkboxes){
	var total = checkboxes.length;
	var num = 0, //选中的checkbox的数量
		num2 = 0; // 半选的（half check）checkbox的数量
	for(var i=0,l=total;i<l;i++){
		var className = checkboxes[i].className;
		if(className.indexOf('hc-checked-half') === -1 ){
			if(className.indexOf('hc-checked') !== -1){
				num++;
			}
		}else{
			num2++;
		}
	}

	if(num2>0){  // 只要有 half check 就直接返回 1
		return 1;
	}else{
		if(num === 0){
			return 0;
		}else if(num < total){
			return 1;
		}else if(num === total){
			return 2;
		}
	}
	return -1;
}
// 折叠<li>
HcCheckTree.prototype._collapseLi = function(li,arrow){
	li.hcData.expanded = false;
	arrow = arrow || domUtil.children(li)[0];

	arrow.className = 'hc-arrow hc-collapsed';

	var ul = domUtil.children(li,'ul')[0];
	ul.className = 'hc-checktree hc-hide';
}
// 展开<li>
HcCheckTree.prototype._expandLi = function(li,arrow){
	li.hcData.expanded = true;

	arrow = arrow || domUtil.children(li)[0];
	arrow.className = 'hc-arrow';
	
	if(li.isUpdated){ // 已渲染过，直接修改display展开
		arrow.className = 'hc-arrow hc-expanded';
		var ul = domUtil.children(li,'ul')[0];
		ul.className = 'hc-checktree';
	}else{ //未渲染过，需根据数据生成dom
		if(li.hcData.children && li.hcData.children.length>0){
			arrow.className = 'hc-arrow hc-expanded';
			this._createHTML(li,li.hcData.children,li.hcData.checked);
			li.isUpdated = true;
		}
	}
}
// 收尾操作，此时 dom 已渲染完毕，监听事件已设置完成。
// 如若是设置了 checked:true 则选中对应dom
HcCheckTree.prototype._initEnds = function(){
	//-------获得要选中的<li>------
	for(var i=0,l=this._preCheckedArr.length;i<l;i++){
		var li = this._preCheckedArr[i];
		var checkbox = domUtil.children(li)[1];
		// 模拟触发选中事件
		var clickEvent = document.createEvent('MouseEvents');
		clickEvent.initMouseEvent('click', true, true, document.defaultView, 
			0, 0, 0, 0, 0, false, false, false, false, 0, null);
		checkbox.dispatchEvent(clickEvent);
	}
}

// 获得当前选中的集合，数组形式
HcCheckTree.prototype.getAllChecks = function(){
	var collection = [];
	createCheckObj(this.root,collection);

	function createCheckObj(ul,collection){
		var liList = domUtil.children(ul,'li');
		for(var i=0;i<liList.length;i++){
			var li = liList[i];
			var checkbox = domUtil.children(li)[1];
			var className = checkbox.className;

			if(className.indexOf('hc-checked-half') !== -1){ //半选状态
				var name = domUtil.children(li)[2].textContent;
				//var obj = { name:name };
				var obj = li.hcData;
				var childUl = domUtil.children(li,'ul')[0];
				if(childUl){
					obj.children = [];
					createCheckObj(childUl,obj.children);
				}
				collection.push(obj);
			}else if(className.indexOf('hc-checked') !== -1){ //选中
				collection.push(li.hcData);
			}else{ //未选中

			}
		}
	}
	return collection;
}
//全选
HcCheckTree.prototype.checkAll = function(){
	var checkboxes = this.root.getElementsByClassName('hc-checkbox');
	for(var i=0;i<checkboxes.length;i++){
		checkboxes[i].className = 'hc-checkbox hc-checked';
		var li = domUtil.getLi(checkboxes[i]);
		li.hcData.checked = true;
	}
}
//取消全部
HcCheckTree.prototype.cancelAll = function(){
	var checkboxes = this.root.getElementsByClassName('hc-checkbox');
	for(var i=0;i<checkboxes.length;i++){
		checkboxes[i].className = 'hc-checkbox';
		var li = domUtil.getLi(checkboxes[i]);
		li.hcData.checked = false;
	}
}
// 展开全部
HcCheckTree.prototype.expandAll = function(){
	var self = this;
	var liList = domUtil.children(this.root,'li');
	expandByLiList(liList);

	function expandByLiList(liList){
		for(var i=0,l=liList.length;i<l;i++){
			var li = liList[i];
			if(li.hcData.children && li.hcData.children.length>0){
				if(!li.hcData.expanded){ // 未展开状态
					self._expandLi(li);
				}
				// 递归处理其子<li>
				var childUl = domUtil.children(li,'ul')[0];
				var childrenLiList = domUtil.children(childUl,'li');
				expandByLiList(childrenLiList);
			}else{
				continue;
			}
		}
	}
}
// 折叠全部
HcCheckTree.prototype.collapseAll = function(){
	var self = this;
	var liList = domUtil.children(this.root,'li');
	collapseByLiList(liList);

	function collapseByLiList(liList){
		if(!liList) return;
		for(var i=0,l=liList.length;i<l;i++){
			var li = liList[i];
			if(li.hcData.children && li.hcData.children.length>0){
				if(li.hcData.expanded){ // 未展开状态
					self._collapseLi(li);
				}
				// 递归处理其子<li>
				var childUl = domUtil.children(li,'ul')[0];
				var childrenLiList = domUtil.children(childUl,'li');
				collapseByLiList(childrenLiList);
			}else{
				continue;
			}
		}
	}
}
// 添加子条目
HcCheckTree.prototype.addChild = function(parentLi,name){
	this._expandLi(parentLi); //首先展开当前的父<li>

	//DOM添加
	//构建要添加的<li>
	var li = document.createElement('li');
	var checkboxClass = '';
	if(parentLi && parentLi.hcData.checked){
		checkboxClass = 'hc-checkbox hc-checked';
	}else{
		checkboxClass = 'hc-checkbox';
	}
	var html = '<div class="hc-arrow"></div>'+
		'<div class="'+checkboxClass+'"></div>'+
		'<label class="hc-label">'+name+'</label>';
	li.innerHTML = html;

	if(parentLi.hcData.children && parentLi.hcData.children.length>0){ //若已有子条目
		var ul = domUtil.children(parentLi,'ul')[0];
		if(ul){
			ul.appendChild(li);
		}
	}else{ //无子条目
		parentLi.hcData.children = [];

		var arrow = domUtil.getArrowByLi(parentLi);
		arrow.className = 'hc-arrow hc-expanded';

		var ul = document.createElement('ul');
		ul.className = 'hc-checktree';
		ul.appendChild(li);

		parentLi.appendChild(ul);
		parentLi.isUpdated = true;
	}

	//数据处理
	var obj = {
		name:name,
		checked:false,
		expanded:false,
		elem:li,
		parent:parentLi.hcData
	};
	if(parentLi && parentLi.hcData.checked){
		obj.checked = parentLi.hcData.checked;
	}
	li.hcData = obj;
	parentLi.hcData.children.push(obj);
}
// 删除条目
HcCheckTree.prototype.remove = function(li){
	// DOM移除
	li.parentNode.removeChild(li);

	//数据处理
	var parentLi = domUtil.getParentLi(li);
	if(parentLi){
		var children = parentLi.hcData.children;
		var index = 0;
		for(var i=0,l=children.length;i<l;i++){
			var node = children[i];
			if(node === li.hcData){
				index = i;
			}
		}
		children.splice(index,1);
		// parentLi的折叠按钮样式
		if(children.length === 0){
			var arrow = domUtil.getArrowByLi(parentLi);
			arrow.className = 'hc-arrow';
		}
	}
}



}(typeof exports === 'object' ? exports : window));