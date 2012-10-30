﻿/**
* @Class
* @description 手机文本编辑器，支持多实例，所见即所得，兼容手机、PC浏览器
* @author yh
* @version 1.0  2012.10.26
*/
(function ($) {
    var touchEvent = 'ontouchend' in document?'touchend':'click';
    //构造函数
    var TouchEditor = function (opts) {
        var _this = this;
        //合并参数
        _this.opts = $.extend({}, defualts, opts);
        //文章容器
        _this.$contenter = null;
        _this.content = '';
        //面板
        _this.pan = {
            $editor : null
            ,$textarea:null
            ,$toolbar : null
            ,$btnShowToolBar:null
            ,$menuFont:null
            ,$menuColor:null
            ,$menuFontSize:null
        };
        //当前编辑的段落
        _this.currP = null;
        //当前段落样式
        _this.currStyle = {
            'font-size':''
            ,'font-weight':''
            ,'font-family':''
            ,'text-decoration':''
            ,'font-style':''//normal|italic|oblique
            ,'color':''
        };
        //编辑器关闭
        _this.isClose = true;
        _this.init();
    };
    //方法
    var fn = {
        init: function () {
            var _this = this;
            var $c = $(_this.opts.contentorSelector);
            if ($c.length == 0) {
                return;
            }
            _this.$contenter = $c;
            _this.content = _this.opts.content!=null?_this.opts.content:$c.html();
            _this.content = Tools.parseHtml(_this.content);  
            _this.$contenter.html(_this.content);
            //初始化编辑器
            _this.initEditorBox();
            //初始化文本区域事件
            _this.initConenterAction();
        }
        //文本区域事件
        , initConenterAction:function(e){
            var _this = this;
            _this.$contenter.bind(touchEvent,function(e){
                if(_this.$currP){
                    _this.save();
                }

                 _this.$currP = $(e.target);
                if(_this.$currP.children().length>0){
                    _this.closeEditor(); 
                    _this.$currP = null;              
                    return;
                }
                _this.isClose = false;
                //获取初始样式
                for(var key in _this.currStyle){
                    _this.currStyle[key] = _this.$currP.css(key);
                    _this.pan.$textarea.css(key,_this.currStyle[key]);
                }
                //font-weight规范
                if(!isNaN(_this.currStyle['font-weight'])){
                    _this.currStyle['font-weight'] = _this.currStyle['font-weight']>400?'bold':'normal';
                }
                 //文本赋值
                _this.pan.$textarea.val($.trim(_this.$currP.html())).css('height',_this.currStyle['font-size']||14);
                setTimeout(function(){
                     _this.pan.$textarea.focus();
                },100);
                //_this.pan.$textarea.css('height',|12).focus();
                _this.pan.$editor.show().css('top',_this.$currP.offset().top);
                _this.closeToolBar();
                return false;
            });

            $(window.document).bind(touchEvent,function(){
                 _this.closeEditor();
            })
        }
        //初始化编辑器
        , initEditorBox: function () {
            var _this = this;
            var h = Html.getEditor();
            _this.pan.$editor = $(h).appendTo($('body'));
            _this.pan.$textarea = _this.pan.$editor.find('textarea');
            _this.initToolBar();
            _this.initAction();

        }
        //初始化工具栏
        , initToolBar: function () {
            var _this = this;
            //编辑器开关事件
            _this.pan.$btnShowToolBar = _this.pan.$editor.find('.editor-toolbar-open').bind(touchEvent,function(){
                if(!_this.pan.$toolbar){
                    _this.pan.$toolbar = $(Html.getToolBar()).appendTo(_this.pan.$editor);                    
                }
                _this.pan.$toolbar.show();
                _this.pan.$btnShowToolBar.hide();
                //字体工具栏
                var $a = _this.pan.$toolbar.find('.editor-font-style');
                if(_this.currStyle['font-style']!='italic'){                       
                    $a.removeClass('on');
                }else{                        
                    $a.addClass('on');
                }                
                //下划线
                $a = _this.pan.$toolbar.find('.editor-text-decoration');
                if(_this.currStyle['text-decoration']!='underline'){                     
                    $a.removeClass('on');
                }else{                   
                    $a.addClass('on');
                }              
                //加粗
                $a = _this.pan.$toolbar.find('.editor-font-weight');
                if(_this.currStyle['font-weight']!='bold'){                     
                    $a.removeClass('on');
                }else{                     
                    $a.addClass('on');
                }         
                return false;
            });
        }
        //基本事件
        , initAction:function(){
            var _this = this;
            //点击事件
            _this.pan.$editor.bind(touchEvent,function(e){
                if(e.target.tagName!='A'){
                    return false;
                }
                _this.touchEventAction($(e.target));                
                return false;  
            });
            //文本框事件
            _this.pan.$textarea.bind('input focus',function(){
                //自适应高度
                if(_this.pan.$textarea[0].scrollHeight>1){
                    _this.pan.$textarea.css('height',_this.pan.$textarea[0].scrollHeight);
                }
            }).bind('blur',function(){
                _this.save();
            });

        }
        //填充文本
        ,setContent:function(html){
            var _this = this;
            //补齐游离状文本
            _this.content = Tools.parseHtml(html);
            _this.$contenter.html(_this.content);
        }
        //编辑器点击事件
        ,touchEventAction:function($a){
            var _this = this;
            switch($a.attr('data-action')){
                case 'closeToolBar':
                    _this.closeToolBar();
                    break;
                case 'showFontFamilyMenu':
                    _this.showFontFamilyMenu($a);
                    break;
                case 'showFontSizeMenu':
                    _this.showFontSizeMenu($a);
                    break;
                case 'showFontColorMenu':
                    _this.showFontColorMenu($a);
                    break;
                case 'setStyle':
                    _this.setStyle($a.attr('data-stylename'),$a.attr('data-stylevalue')||'');
                    break;
            }
        }
        //隐藏打开的菜单
        ,hideMenu:function(){
             var _this = this;
            _this.pan.$editor.find('.editor-menu').hide();
            _this.pan.$toolbar.find('.editor-menu-btn.on').removeClass('on');
        }
        ,closeEditor:function(){
            var _this = this;
            if(!_this.isClose){
                _this.isClose = true;                
                _this.closeToolBar();
                _this.pan.$editor.hide();
            }
        }
        //从编辑器保存到文本节点
        ,save:function(){
            var _this = this;
            _this.$currP.html(_this.pan.$textarea.val());            
        }
        ,showFontFamilyMenu : function($a){
            var _this = this;
            if($a.hasClass('on')){
                $a.removeClass('on');
                _this.pan.$menuFont.hide();
                return;
            }
            _this.hideMenu();
            $a.addClass('on');
            //动态生成菜单
            if(!_this.pan.$menuFont){
                var h = Html.getMenu('font-family',_this.opts.fontFamily);
                _this.pan.$menuFont = $(h).appendTo(_this.pan.$editor);
            }
            _this.pan.$menuFont.show();

        }
        ,showFontSizeMenu:function($a){
            var _this = this;
            if($a.hasClass('on')){
                $a.removeClass('on');
                _this.pan.$menuFontSize.hide();
                return;
            }
            _this.hideMenu();
            $a.addClass('on');
            //动态生成菜单
            if(!_this.pan.$menuFontSize){
                var h = Html.getMenu('font-size',_this.opts.fontSize);
                _this.pan.$menuFontSize = $(h).appendTo(_this.pan.$editor);
            }
            _this.pan.$menuFontSize.show();
        }
        ,showFontColorMenu:function($a){
            var _this = this;
            if($a.hasClass('on')){
                $a.removeClass('on');
                _this.pan.$menuColor.hide();
                return;
            }
            _this.hideMenu();
            $a.addClass('on');
            //动态生成菜单
            if(!_this.pan.$menuColor){
                var h = Html.getMenu('color',_this.opts.fontColor);
                _this.pan.$menuColor = $(h).appendTo(_this.pan.$editor);
            }
            _this.pan.$menuColor.show();
        }
        //设置文本样式
        ,setStyle:function(styleName,styleValue){
            var _this = this;
            if(!styleValue){
                var $a = null;
                //斜体
                if(styleName=='font-style'){
                    $a = _this.pan.$toolbar.find('.editor-font-style');
                    if(_this.currStyle[styleName]=='italic'){
                        styleValue = 'normal';
                        $a.removeClass('on');
                    }else{
                        styleValue = 'italic';
                        $a.addClass('on');
                    }                
                }else if(styleName == 'text-decoration'){
                    $a = _this.pan.$toolbar.find('.editor-text-decoration');
                    if(_this.currStyle[styleName]=='underline'){
                        styleValue = 'none';
                        $a.removeClass('on');
                    }else{
                        styleValue = 'underline';
                        $a.addClass('on');
                    }
                }else if(styleName == 'font-weight'){
                    $a = _this.pan.$toolbar.find('.editor-font-weight');
                    if(_this.currStyle[styleName]=='bold'){
                        styleValue = 'normal';
                        $a.removeClass('on');
                    }else{
                        styleValue = 'bold';
                        $a.addClass('on');
                    }
                }      
                //同步保存          
                _this.currStyle[styleName] = styleValue;
            }
            //同步更新文本框样式
            _this.pan.$textarea.css(styleName,styleValue).focus();
            if(_this.$currP){
                //同步更新到节点
                _this.$currP.css(styleName,styleValue);
            }
            _this.hideMenu();
        }
        ,closeToolBar:function(){
            var _this = this;
            if(_this.pan.$toolbar){
                _this.pan.$toolbar.hide();
                _this.pan.$btnShowToolBar.show();
                _this.hideMenu();
            }
        }       
    };
    TouchEditor.prototype = fn;
    //html模板
    var Html = {
        //编辑器外层结构
        getEditor:function(){
            var h = '<div class="editor-wrap">';
            h += '<textarea>aaa</textarea>';
            h += '<a href="#" class="editor-toolbar-open">字</a>';
            h += '</div>';
            return h;
        }
        //工具栏
        ,getToolBar:function(){
            var h = '<div class="editor-toolbar">';
            h += '<a href="#" data-action="showFontFamilyMenu" class="editor-font-family editor-menu-btn">字体</a>';
            h += '<a href="#" data-action="showFontSizeMenu"  class="editor-font-size editor-menu-btn">字号</a>';
            h += '<a href="#" data-action="showFontColorMenu"  class="editor-color editor-menu-btn">字色</a>';
            h += '<a href="#" data-action="setStyle" data-stylename="font-weight" class="editor-font-weight">加粗</a>';
            h += '<a href="#" data-action="setStyle" data-stylename="font-style" class="editor-font-style">斜体</a>';
            h += '<a href="#" data-action="setStyle" data-stylename="text-decoration" class="editor-text-decoration">下划线</a>';
            h += '<a href="#" data-action="closeToolBar" class="editor-toolbar-close">></a>';
            h += '</div>';
            return h;
        }
        //生成菜单
        ,getMenu:function(styleName,list){         
            var h = '<ul class="editor-menu editor-menu-'+styleName+'">';
            $(list).each(function(i,item){
                h += '<li><a href="#" data-action="setStyle" data-stylename="'+styleName+'" data-stylevalue="'+item.v+'" style="'+styleName+': '+item.v+'">'+item.t+'</a></li>';
            });
            h += '</ul>';
            return h;
        }    
    };
 
    //工具类
    var Tools = {
        //格式化文本，给游离的文本补上span标签
        parseHtml:function(html){
            return $.trim(html)
                    .replace('< /','</').replace(/\n/g,'')
                    .replace(/>([^<]+)<([^/])/g,'><span>'+'$1</span><$2')
                    .replace(/<\/([\w]+)>([^<]+)<\//g,'</$1><span>$2</span></');
        }
    };
    //默认配置
    var defualts = {
        //默认需要编辑的文本区域
        contentorSelector: '#divContent'
        //默认填充文本，null表示从文本区域中自动获取
        , content: null
        , fontSize:[
            {t:'10px',v:'10px'}
            ,{t:'12px',v:'12px'}
            ,{t:'14px',v:'14px'}
            ,{t:'18px',v:'18px'}
            ,{t:'24px',v:'24px'}
            ,{t:'30px',v:'30px'}
        ]
        , fontColor:[
            {t:'默认',v:'inherit'}
            ,{t:'黑色',v:'black'}
            ,{t:'红色',v:'red'}
            ,{t:'绿色',v:'green'}
            ,{t:'蓝色',v:'blue'}
            ,{t:'黄色',v:'yellow'}
        ]
        , fontFamily:[
            {t:'宋体',v:'宋体'}
            ,{t:'楷体',v:'楷体'}
            ,{t:'隶书',v:'隶书'}
            ,{t:'幼圆',v:'幼圆'}
            ,{t:'黑体',v:'黑体'}
            ,{t:'雅黑',v:'微软雅黑'}
            ,{t:'Arial',v:'Arial'}
        ]
    };
    //注册到jq
    $.TouchEditor = TouchEditor;
})(jQuery);