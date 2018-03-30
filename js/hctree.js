/*
	hucong 2018-02-14
	带勾选框的树形目录
	
	默认仅渲染第一级 html 结构，后面按需渲染
	默认全部折叠，未选中。默认显示勾选框。
*/
(function(exports){

var hcLabelName = 'name';
var cName = 'children';

var domUtil = {
	addcss:function(){
		var id = 'hc-tree-css';
		if(document.getElementById(id)) return;
		var head = document.getElementsByTagName('head')[0];
		var link = document.createElement('link');
		var path = this.getPath();
		link.rel = 'stylesheet';
		link.href = path + '../css/hctree.css';
		link.id = id;
		head.appendChild(link);
	},
	getPath:function(){
		// IE9下，document.currentScript 为 null
		var jsPath = document.currentScript ? document.currentScript.src : function(){
			var js = document.scripts
			,last = js.length - 1
			,src;
			for(var i = last; i > 0; i--){
				if(js[i].readyState === 'interactive'){
				  src = js[i].src;
				  break;
				}
			}
			return src || js[last].src;
	    }();
		return jsPath.substring(0,jsPath.lastIndexOf('/')+1);
	},
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
	addClass:function(el,value){
		var classes = this._classesToArray(value),
		curValue,cur,j,clazz,finalValue;

		if(classes.length>0){
			curValue = el.getAttribute && el.getAttribute('class') || '';
			cur = ' '+this._stripAndCollapse(curValue)+' ';

			if(cur){
				var j=0;
				while( (clazz = classes[j++]) ){
					if ( cur.indexOf( ' ' + clazz + ' ' ) < 0 ) {
						cur += clazz + ' ';
					}
				}

				finalValue = this._stripAndCollapse(cur);
				if(curValue !== finalValue){
					el.setAttribute('class',finalValue);
				}
			}
		}
	},
	removeClass:function(el,value){
		var classes = this._classesToArray(value),
		curValue,cur,j,clazz,finalValue;

		if(classes.length>0){
			curValue = el.getAttribute && el.getAttribute('class') || '';
			cur = ' '+this._stripAndCollapse(curValue)+' ';

			if(cur){
				var j=0;
				while( (clazz = classes[j++]) ){
					if ( cur.indexOf( ' ' + clazz + ' ' ) > -1 ) {
						cur = cur.replace(' '+clazz+' ' ,' ');
					}
				}

				finalValue = this._stripAndCollapse(cur);
				if(curValue !== finalValue){
					el.setAttribute('class',finalValue);
				}
			}
		}
	},
	hasClass:function(el,value){
		var className = ' '+value+' ';
		var curValue = el.getAttribute && el.getAttribute('class') || '';
		var cur = ' '+this._stripAndCollapse(curValue)+' ';

		if(cur.indexOf(className) > -1){
			return true;
		}
		return false;
	},
	_stripAndCollapse:function(value){
		//var htmlwhite = ( /[^\x20\t\r\n\f]+/g );
		var htmlwhite = ( /[^\s]+/g );
		var arr = value.match(htmlwhite)||[];
		return arr.join(' ');
	},
	_classesToArray:function(value){
		if ( Array.isArray( value ) ) {
			return value;
		}
		if ( typeof value === "string" ) {
			//var htmlwhite = ( /[^\x20\t\r\n\f]+/g );
			var htmlwhite = ( /[^\s]+/g );
			return value.match( htmlwhite ) || [];
		}
		return [];
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
		if(li.hcData[cName] && li.hcData[cName].length>0){
			for(var i=0,l=li.hcData[cName].length;i<l;i++){
				var childLi = li.hcData[cName][i].elem;
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

domUtil.addcss();

var Hctree = exports.Hctree = function(option){
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

Hctree.prototype._initOption = function(option){
	if(!option.id) throw new Erorr('element id error!');
	this.id = option.id || '';
	hcLabelName = option.name || 'name';
	cName = option.cName || 'children';
	option.data = option.data || [];
	this.icon = option.icon;
	this.ricon = option.ricon;
	// 默认是有勾选框的
	if(option.checkbox === undefined){
		this.checkbox = true;	
	}else{
		this.checkbox = option.checkbox;	
	}
	this.clickFn = option.clickFn || function(){};
	this.checkFn = option.checkFn || function(){};
	this.cancelFn = option.cancelFn || function(){};
	this.iconClickFn = option.iconClickFn || function(){};
	this.riconClickFn = option.riconClickFn || function(){};
	this.deep = option.deep;
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
Hctree.prototype._initData = function(data){
	this.data = [];
	var expandedArr = [];
	if(this.deep !== undefined && !this.deep){ // option 里设置了 deep:false
		createExpandedArr2(data);
		this.data = data;
	}else{
		createExpandedArr(data,this.data);
	}
	
	// 将对象以及其父对象都添加 expanded:true 属性
	for(var i=0,l=expandedArr.length;i<l;i++){
		var item = expandedArr[i];
		for(;item!==undefined;item=item.parent){
			item.expanded = true;
		}
	}

	/*
		深复制源数据
		先找出含有 expanded:true 属性的对象，放入数组。
		若一个树有多个expanded属性，那么取最近的（最父级的）一个
	*/
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
			//设置层级
			if(parent === undefined){ 
				obj.zIndex = 0;
			}else{
				obj.zIndex = parent.zIndex+1;
			}
			// 图标
			if(parent){
				if(parent.childIcon !== undefined){
					obj.childIcon = parent.childIcon;
					if(node.icon === undefined){  // 若无 icon 字段，则使用 parent.childIcon
						obj.icon = parent.childIcon;
					}
				}

				//右图标
				if(parent.childRicon !== undefined){
					obj.childRicon = parent.childRicon;
					if(node.ricon === undefined){ 
						obj.ricon = parent.childRicon;
					}
				}
			}
			copyArr.push(obj);
			if(obj.expanded){
				if(parent && parent.expanded){ // 若其父级已是展开状态，那么不做处理

				}else{ // 加入展开数组
					expandedArr.push(obj);
				}
			}
			if(obj[cName] && obj[cName].length>0){
				obj[cName] = [];
				createExpandedArr(node[cName],obj[cName],obj);
			}
		}
	}

	// 同上处理，但不复制源数据
	function createExpandedArr2(arr,parent){
		for(var i=0,l=arr.length;i<l;i++){
			var node = arr[i];
			node.parent = parent;
			node.checked = node.checked||false;
			node.expanded = node.expanded||false;
			if(parent === undefined){
				node.zIndex = 0;
			}else{
				node.zIndex = parent.zIndex+1;
			}
			// 图标
			if(parent){
				if(parent.childIcon !== undefined){
					node.childIcon = parent.childIcon;
					if(node.icon === undefined){  // 若无 icon 字段，则使用 parent.childIcon
						node.icon = parent.childIcon;
					}
				}

				//右图标
				if(parent.childRicon !== undefined){
					node.childRicon = parent.childRicon;
					if(node.ricon === undefined){ 
						node.ricon = parent.childRicon;
					}
				}
			}
			if(node.expanded){
				if(parent && parent.expanded){ // 若其父级已是展开状态，那么不做处理

				}else{ // 加入展开数组
					expandedArr.push(node);
				}
			}
			if(node[cName] && node[cName].length>0){
				createExpandedArr2(node[cName],node);
			}
		}
	}

}

// 根据data（数组形式），渲染html结生成：<ul></ul>,并将其追加到container里
// checked:boolean值，true表示设为选中
Hctree.prototype._createHTML = function(container,data,checked){
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
		if(node[cName] && node[cName].length>0){
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

		// 左图标（option中设置的，全局，优先级小于单独设置的）
		var iconHtml = '';
		if(typeof this.icon === 'string'){
			iconHtml = this.icon? '<img class="hc-icon" src="'+this.icon+'">' : '';
		}else if(Array.isArray(this.icon)){
			iconHtml = this.icon[node.zIndex]? '<img class="hc-icon" src="'+this.icon[node.zIndex]+'">' : '';
		}
		if(node.icon !== undefined){ // 若是node单独设置了icon
			iconHtml = node.icon ? '<img class="hc-icon" src="'+node.icon+'">' : '';
		}

		// 右图标（option中设置的，全局，优先级小于单独设置的）
		var riconHtml = '';
		if(typeof this.ricon === 'string'){
			riconHtml = this.ricon? '<img class="hc-ricon" src="'+this.ricon+'">' : '';
		}else if(Array.isArray(this.ricon)){
			riconHtml = this.ricon[node.zIndex]? '<img class="hc-ricon" src="'+this.ricon[node.zIndex]+'">' : '';
		}
		if(node.ricon !== undefined){
			riconHtml = node.ricon ? '<img class="hc-ricon" src="'+node.ricon+'">' : '';
		}

		var html = '<div class="hc-arrow '+arrowClass+'"></div>'+
			'<div class="'+checkboxClass+'"></div>'+
			iconHtml+
			'<label class="hc-label">'+node[hcLabelName]+'</label>'+
			riconHtml;
		li.innerHTML = html;

		if(li.hcData.expanded){ //若初始设置为展开
			this._expandLi(li);
		}

		ul.appendChild(li);
	}
	container.appendChild(ul);
}

//初始化点击事件
Hctree.prototype._initEvents = function(){
	var self = this;
	this.container.onclick = function(event){
		var target = event.target;

		// arrow 展开/收起按钮 
		if(domUtil.hasClass(target,'hc-arrow')){
			var li = domUtil.getLi(target);
			if(li !== null){
				if(domUtil.hasClass(target,'hc-collapsed')){ //收起的，应置为展开
					self._expandLi(li,target);
				}else if(domUtil.hasClass(target,'hc-expanded')){ // 展开的，应收起
					self._collapseLi(li,target);
				}
			}
		}

		// checkbox 选中按钮
		else if( domUtil.hasClass(target,'hc-checkbox') ){
			var li = domUtil.getLi(target);
			if(li !== null){
				if( domUtil.hasClass(target,'hc-checked') || domUtil.hasClass(target,'hc-checked-half') ){ // 选中的，应置为未选中
					li.hcData.checked = false;
					domUtil.removeClass(target,'hc-checked hc-checked-half');
					self._checkboxLink(target,false);
				}else{ //未选中，应置为选中
					li.hcData.checked = true;
					domUtil.removeClass(target,'hc-checked-half');
					domUtil.addClass(target,'hc-checked');
					self._checkboxLink(target,true);
				}
				self.checkFn(li.hcData);
			}
		}

		// label 名称的点击事件
		else if( domUtil.hasClass(target,'hc-label') ){
			var li = domUtil.getLi(target);
			if(li !== null){
				self.clickFn(li.hcData);
			}
		}

		// icon 的点击事件
		else if( domUtil.hasClass(target,'hc-icon') ){
			var li = domUtil.getLi(target);
			if(li !== null){
				self.iconClickFn(li.hcData);
			}
		}

		// ricon（右图标）的点击事件
		else if( domUtil.hasClass(target,'hc-ricon') ){
			var li = domUtil.getLi(target);
			if(li !== null){
				self.riconClickFn(li.hcData);
			}
		}

		return false;
	}
}
//选中选择框后，其子选择框、父选择框的联动响应
// check: true-选中，false-取消
// target:checkbox元素
Hctree.prototype._checkboxLink = function(target,check){
	this._checkboxLinkDown(target,check);
	this._checkboxLinkUp(target);
}
//对其子选择框的联动
//check: true-选中，false-取消
Hctree.prototype._checkboxLinkDown = function(target,check){
	//本 checkbox 的样式
	if(check){
		domUtil.addClass(target,'hc-checked');
	}else{
		domUtil.removeClass(target,'hc-checked hc-checked-half');
	}

	var li = domUtil.getLi(target);
	var childrenLiList = domUtil.getChildrenLiList(li);
	for(var i=0,l=childrenLiList.length;i<l;i++){
		//子<li>
		var childrenLi = childrenLiList[i];
		//子 checkbox 的样式
		var childrenCheckbox = domUtil.getCheckboxByLi(childrenLi);
		if(check){
			domUtil.addClass(childrenCheckbox,'hc-checked');
		}else{
			domUtil.removeClass(childrenCheckbox,'hc-checked hc-checked-half');
		}
		//传入子 checkbox 递归
		this._checkboxLinkDown(childrenCheckbox,check);
	}
	//数据处理
	if(li.hcData[cName] && li.hcData[cName].length>0){
		for(var j=0,len=li.hcData[cName].length;j<len;j++){
			li.hcData[cName][j].checked = check;
		}
	}
}
//对其父选择框的联动
Hctree.prototype._checkboxLinkUp = function(target){
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
		domUtil.removeClass(parentCheckbox,'hc-checked hc-checked-half');
		if(li!==null) parentLi.hcData.checked = false;
	}else if(result === 1){ //半选
		domUtil.removeClass(parentCheckbox,'hc-checked');
		domUtil.addClass(parentCheckbox,'hc-checked-half');
		if(li!==null) parentLi.hcData.checked = true;
	}else if(result === 2){ //已选
		domUtil.removeClass(parentCheckbox,'hc-checked-half');
		domUtil.addClass(parentCheckbox,'hc-checked');
		if(li!==null) parentLi.hcData.checked = true;
	}
	this._checkboxLinkUp(parentCheckbox);
}
// 返回勾选框的状态
// return: 0-全未选，1-部分选，2-全选; -1-报错
Hctree.prototype._checkboxesStatus = function(checkboxes){
	var total = checkboxes.length;
	var num = 0, //选中的checkbox的数量
		num2 = 0; // 半选的（half check）checkbox的数量
	for(var i=0,l=total;i<l;i++){
		if( !domUtil.hasClass(checkboxes[i],'hc-checked-half') ){
			if( domUtil.hasClass(checkboxes[i],'hc-checked') ){
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
Hctree.prototype._collapseLi = function(li,arrow){
	li.hcData.expanded = false;
	arrow = arrow || domUtil.children(li)[0];

	domUtil.removeClass(arrow,'hc-expanded');
	domUtil.addClass(arrow,'hc-collapsed');

	var ul = domUtil.children(li,'ul')[0];
	domUtil.addClass(ul,'hc-hide');
}
// 展开<li>
Hctree.prototype._expandLi = function(li,arrow){
	li.hcData.expanded = true;

	arrow = arrow || domUtil.children(li)[0];
	domUtil.removeClass(arrow,'hc-collapsed');
	domUtil.addClass(arrow,'hc-expanded');
	
	if(li.isUpdated){ // 已渲染过，直接修改display展开
		var ul = domUtil.children(li,'ul')[0];
		domUtil.removeClass(ul,'hc-hide');
	}else{ //未渲染过，需根据数据生成dom
		if(li.hcData[cName] && li.hcData[cName].length>0){
			this._createHTML(li,li.hcData[cName],li.hcData.checked);
			li.isUpdated = true;
		}
	}
}
// 收尾操作，此时 dom 已渲染完毕，监听事件已设置完成。
// 如若是设置了 checked:true 则选中对应dom
Hctree.prototype._initEnds = function(){
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

// 获得当前选中的集合
Hctree.prototype.getChecks = function(){
	var collection = [];
	createCheckObj(this.data,collection);

	function createCheckObj(data,collection){
		for(var i=0,l=data.length;i<l;i++){
			var node = data[i];
			if(node.checked){
				collection.push(node);
				if(node[cName] && node[cName].length>0){
					var tmp = node[cName];
					node[cName] = [];
					createCheckObj(tmp,node[cName]);
				}
			}
		}
	}

	return collection;
}
//全选
Hctree.prototype.checkAll = function(){
	var checkboxes = this.root.getElementsByClassName('hc-checkbox');
	for(var i=0;i<checkboxes.length;i++){
		domUtil.removeClass(checkboxes[i],'hc-checked-half');
		domUtil.addClass(checkboxes[i],'hc-checked');
		var li = domUtil.getLi(checkboxes[i]);
		li.hcData.checked = true;
	}
}
//取消全部
Hctree.prototype.cancelAll = function(){
	var checkboxes = this.root.getElementsByClassName('hc-checkbox');
	for(var i=0;i<checkboxes.length;i++){
		domUtil.removeClass(checkboxes[i],'hc-checked hc-checked-half');
		var li = domUtil.getLi(checkboxes[i]);
		li.hcData.checked = false;
	}
}
// 展开全部
Hctree.prototype.expandAll = function(){
	var self = this;
	var liList = domUtil.children(this.root,'li');
	expandByLiList(liList);

	function expandByLiList(liList){
		for(var i=0,l=liList.length;i<l;i++){
			var li = liList[i];
			if(li.hcData[cName] && li.hcData[cName].length>0){
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
Hctree.prototype.collapseAll = function(){
	var self = this;
	var liList = domUtil.children(this.root,'li');
	collapseByLiList(liList);

	function collapseByLiList(liList){
		if(!liList) return;
		for(var i=0,l=liList.length;i<l;i++){
			var li = liList[i];
			if(li.hcData[cName] && li.hcData[cName].length>0){
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
Hctree.prototype.addChild = function(parentLi,name){
	this._expandLi(parentLi); //首先展开当前的父<li>

	//DOM添加
	//构建要添加的<li>
	var li = document.createElement('li');


	// 勾选框的样式
	var checkboxClass = '';
	if(this.checkbox){
		if(parentLi && parentLi.hcData.checked){
			checkboxClass = 'hc-checkbox hc-checked';
		}else{
			checkboxClass = 'hc-checkbox';
		}
	}else{
		checkboxClass = 'hc-checkbox hc-hide';
	}

	// 图标样式
	var iconHtml = this.icon? '<img class="hc-icon" src="'+this.icon+'">' : '';
	if(parentLi&&parentLi.hcData.childIcon){
		iconHtml = '<img class="hc-icon" src="'+parentLi.hcData.childIcon+'">';
	}
	// 右图标样式
	var riconHtml = this.ricon? '<img class="hc-ricon" src="'+this.ricon+'">' : '';
	if(parentLi&&parentLi.hcData.childRicon){
		riconHtml = '<img class="hc-ricon" src="'+parentLi.hcData.childRicon+'">';
	}

	var html = '<div class="hc-arrow"></div>'+
		'<div class="'+checkboxClass+'"></div>'+
		iconHtml+
		'<label class="hc-label">'+name+'</label>'+
		riconHtml;
	li.innerHTML = html;

	if(parentLi.hcData[cName] && parentLi.hcData[cName].length>0){ //若已有子条目
		var ul = domUtil.children(parentLi,'ul')[0];
		if(ul){
			ul.appendChild(li);
		}
	}else{ //无子条目
		parentLi.hcData[cName] = [];

		var arrow = domUtil.getArrowByLi(parentLi);
		domUtil.addClass(arrow,'hc-expanded');
		domUtil.removeClass(arrow,'hc-collapsed');

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
	if(parent&&parent.childIcon){
		obj.childIcon = parent.childIcon;
		obj.icon = parent.childIcon;
		if(parent.childRicon){
			obj.childRicon = parent.childRicon;
			obj.icon = parent.childRicon;
		}
	}
	li.hcData = obj;
	parentLi.hcData[cName].push(obj);
}
// 删除条目
Hctree.prototype.remove = function(li){
	// DOM移除
	li.parentNode.removeChild(li);

	//数据处理
	var parentLi = domUtil.getParentLi(li);
	if(parentLi){
		var children = parentLi.hcData[cName];
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
Hctree.prototype.setData = function(data){
	this._initData(data);
	this._preCheckedArr = [];
	this.container.innerHTML = '';
	this._createHTML(this.container,this.data);
	//必须要重新设置 this.root，否则 this.root 依旧指向老的 HTMLElement！
	this.root = domUtil.children(this.container)[0]; 
	this._initEnds(); // 一些收尾的操作，如若是设置了expanded:true则展开对应dom
}



}(typeof exports === 'object' ? exports : window));