/*
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
		},
		cancelFn:function(params){ // 取消勾选框的回调
			console.log('cancel it',params)
		}
	});

	hcTree.collapseAll(); // 全部折叠
	hcTree.expandAll(); //全部展开
	hcTree.checkAll(); //全部选中
	hcTree.cancelAll(); //全部取消
	hcTree.getAllChecks(); //获取当前选中的所有条目集合
*/


/*
	该版本初始化会将完整的 html 结构渲染出来
*/
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
	}
};

function HcCheckTree(option){
	if(typeof option !== 'object') return;
	option = option || {};
	
	this._initOption(option);

	this.container = document.getElementById(option.id);
	if(this.container){
		this.container.innerHTML = this._createHTML(option.data);
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
	this.data = option.data || [];
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

// 返回 html
HcCheckTree.prototype._createHTML = function(data){
	var html = '<ul class="hc-checktree hc-hide">',
		arrowClass,checkboxClass;
	for(var i=0,l=data.length;i<l;i++){
		var node = data[i];

		// 展开、折叠箭头的样式
		if(node.children && node.children.length>0){
			arrowClass = 'hc-collapsed';
		}else{
			arrowClass = '';
		}

		// 是否展开的标识
		var signClass = '';
		if(node.expanded){
			signClass = 'hc-sign-li-expanded ';
		}
		// 是否选中的标识
		if(node.checked){
			signClass += 'hc-sign-li-checked';
		}
		var liClassMsg = '';
		if(signClass !== ''){
			liClassMsg = 'class="'+signClass+'"';
		}
		checkboxClass = this.checkbox ? 'hc-checkbox' : 'hc-checkbox hc-hide';
		html += '<li '+liClassMsg+'><div class="hc-arrow '+arrowClass+'"></div>'+
		'<div class="'+checkboxClass+'"></div>'+
		'<label class="hc-label">'+node.name+'</label>';

		if(node.children && node.children.length>0){
			var cHtml = this._createHTML(node.children);
			html += cHtml+'</li>';
		}else{
			html += '</li>';
		}
	}
	return html+'</ul>';
}

//初始化点击事件
HcCheckTree.prototype._initEvents = function(){
	var self = this;
	this.container.onclick = function(event){
		var target = event.target;
		var className = event.target.className;
		if(className.indexOf('hc-nochildren') !== -1) return;

		// arrow 展开/收起按钮 
		if(className.indexOf('hc-arrow') !== -1){
			var ul = target.parentNode.getElementsByTagName('ul')[0];
			if(className.indexOf('hc-collapsed') !== -1){ //收起的，应置为展开
				target.className = 'hc-arrow hc-expanded';
				ul.className = 'hc-checktree';
			}else if(className.indexOf('hc-expanded') !== -1){ // 展开的，应收起
				target.className = 'hc-arrow hc-collapsed';
				ul.className = 'hc-checktree hc-hide';
			}
		}

		// checkbox 选中按钮
		else if(className.indexOf('hc-checkbox') !== -1){
			if(className.indexOf('hc-checked') === -1){ //未选中，应置为选中
				self._checkboxLink(target,true);
				var params = self._getChecks();
				self.checkFn(params);
			}else{ // 选中的，应置为未选中
				self._checkboxLink(target,false);
				var params = self._getChecks();
				self.cancelFn(params);
			}
		}

		// label 名称的点击事件
		else if(className.indexOf('hc-label') !== -1){
			var labelName = target.textContent;
			self.clickFn(event,labelName);
		}

		return false;
	}
}
//选中选择框后，其子选择框、父选择框的联动响应
// check: true-选中，false-取消
HcCheckTree.prototype._checkboxLink = function(target,check){
	this._checkboxLinkDown(target,check);
	this._checkboxLinkUp(target);
}
//对其子选择框的联动
//check: true-选中，false-取消
//parent: 用于构造选中的集合对象
HcCheckTree.prototype._checkboxLinkDown = function(target,check,parent){
	var childrenCheckboxes = this._getChildrenCheckbox(target);
	var className = check?'hc-checkbox hc-checked':'hc-checkbox';
	target.className = className;

	//----构造当前选中的集合对象: this.currentCheck----
	var name = domUtil.next(target).textContent;
	if(!parent){
		parent = {
			name:name
		};
		this.currentCheck = parent;
	}
	if(childrenCheckboxes.length>0){
		parent.children = [];
	}
	//---------end-----------
	
	for(var i=0,l=childrenCheckboxes.length;i<l;i++){
		var checkbox = childrenCheckboxes[i];
		checkbox.className = className;

		//----构造当前选中的集合对象: this.currentCheck----
		var name = domUtil.next(checkbox).textContent;
		var o = {
			name:name
		};
		parent.children.push(o);

		this._checkboxLinkDown(checkbox,check,o);
	}
}
//对其父选择框的联动
HcCheckTree.prototype._checkboxLinkUp = function(target){
	var parentCheckbox = this._getParentCheckbox(target);
	if(parentCheckbox !== null){
		var checkboxes = this._getChildrenCheckbox(parentCheckbox);
		var result = this._checkboxesStatus(checkboxes);
		if(result === 0){
			parentCheckbox.className = 'hc-checkbox';
		}else if(result === 1){
			parentCheckbox.className = 'hc-checkbox hc-checked-half';
		}else if(result === 2){
			parentCheckbox.className = 'hc-checkbox hc-checked';
		}
		this._checkboxLinkUp(parentCheckbox);
	}
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
// 根据选中的checkbox，获取其子checkbox元素（仅一级）
HcCheckTree.prototype._getChildrenCheckbox = function(checkbox){
	var matched = [];
	var ul = domUtil.children(checkbox.parentNode,'ul')[0];
	var liList = domUtil.children(ul,'li')||[];
	for(var i=0;i<liList.length;i++){
		var li = liList[i];
		var checkbox = domUtil.children(li,'div')[1];
		matched.push(checkbox);
	}
	return matched;
}
// 获取其父checkbox元素（仅一级）
HcCheckTree.prototype._getParentCheckbox = function(checkbox){
	var ul = checkbox.parentNode.parentNode;
	if(ul.tagName === 'UL' && ul.className === 'hc-checktree'){
		var p = ul.parentNode;
		if(p.tagName === 'LI'){
			var checkbox = domUtil.children(p,'div')[1];
			return checkbox;
		}
	}
	return null;
}
// 获得当前选中的对象，格式如：
// { name:'商务部', children:[] }
HcCheckTree.prototype._getChecks = function(){
	return this.currentCheck;
}
// 收尾操作
// 如若是设置了expanded:true 则展开对应dom
// 若是设置了 checked:true 则选中对应dom
HcCheckTree.prototype._initEnds = function(){
	//-------获得要展开的<li>------
	var li = this.root.getElementsByClassName('hc-sign-li-expanded')[0];
	li.className = '';
	if(li){
		expandLi(li); //展开这个<li>

		// 遍历父<li>并且展开 
		var parentLi = li.parentNode.parentNode;
		for(;parentLi.tagName === 'LI' && parentLi.parentNode.className.indexOf('hc-checktree')!==-1;
			parentLi = parentLi.parentNode.parentNode){
			expandLi(parentLi);
		}
	}

	function expandLi(li){
		var ul = domUtil.children(li,'ul')[0];
		if(ul){
			// 箭头
			var arrow = domUtil.children(li)[0];
			arrow.className = 'hc-arrow hc-expanded';
			ul.className = 'hc-checktree';
		}
	}

	//-------获得要选中的<li>------
	var li = this.root.getElementsByClassName('hc-sign-li-checked')[0];
	li.className = '';
	if(li){
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

			if(className.indexOf('hc-checked') !== -1){ //说明是选中、半选状态
				var name = domUtil.children(li)[2].textContent;
				var obj = { name:name };
				var childUl = domUtil.children(li,'ul')[0];
				if(childUl){
					obj.children = [];
					createCheckObj(childUl,obj.children);
				}
				collection.push(obj);
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
	}
}
//取消全部
HcCheckTree.prototype.cancelAll = function(){
	var checkboxes = this.root.getElementsByClassName('hc-checkbox');
	for(var i=0;i<checkboxes.length;i++){
		checkboxes[i].className = 'hc-checkbox';
	}
}
// 展开全部
HcCheckTree.prototype.expandAll = function(){
	var ulList = this.root.getElementsByClassName('hc-checktree');
	for(var i=0;i<ulList.length;i++){
		var ul = ulList[i];
		var arrow = domUtil.children(ul.parentNode)[0];
		arrow.className = 'hc-arrow hc-expanded';
		ul.className = 'hc-checktree';
	}
}
// 折叠全部
HcCheckTree.prototype.collapseAll = function(){
	var ulList = this.root.getElementsByClassName('hc-checktree');
	for(var i=0;i<ulList.length;i++){
		var ul = ulList[i];
		var arrow = domUtil.children(ul.parentNode)[0];
		arrow.className = 'hc-arrow hc-collapsed';
		ul.className = 'hc-checktree hc-hide';
	}
}