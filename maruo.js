//----- 世界に羽ばたく変数 -----

var tileW=32,tileH=32;	//自由に変更できるようにする予定だったけど
var tileX=20,tileY=15;	//今はこれをいじると高確率でバグる

var key=new Array(256);	//キー入力監視用配列
var LRflg=-1;

var stageWmax=999;
var enemyMax=128;
var maruoImg=makeImage("maruo.png");
var maruoDImg=makeImage("maruoDeath.png");

//----- 画像生成関数 -----
function makeImage(src){
	var tmp=new Image();
	tmp.src="images/"+src;
	return tmp;
}

//----- クリックの左右判定 -----
function LRcheck(){
	LRflg=(event.shiftKey)?1:0;
}

//----- eleで表示/非表示キリカエ -----
function $(ele,flg){
	ele.style.visibility=flg?"visible":"hidden";
}

//----- eleで移動 -----
function moveX(ele,x){ele.style.left=x+"px";}
function moveY(ele,y){ele.style.top=y+"px";}
function move(ele,x,y){moveX(ele,x);moveY(ele,y);}

//----- カラーコードかどうかを返す -----
function isColorCode(str){
	var c;
	for(var i=0;i<str.length;i++){
	 c=str.charCodeAt(i);
	 if(!((48<=c && c<=57)||(65<=c && c<=70)||(97<=c && c<=102))){break;}
	}
	return i==6;
}

//----- ワールドブロック座標からおぶじぇくと座標へ -----
function objxFromWbx(x,o){
	return x*tileW;
}
function objyFromWby(y,o){
	return (y+1)*tileH-o.h;
}

//----- BGM関係 ------
function createAudioWithVolume(src,volume){
	var a=new Audio(src);
	a.volume=volume;
	return a;
}
var bgm={
	audios:{
		living:createAudioWithVolume("./BGM/living.mp3",0.25),
		goal:createAudioWithVolume("./BGM/clear.mp3",0.8),
		miss:createAudioWithVolume("./BGM/miss.mp3",0.8),
	},
	playing:null,
	stop:function(){
		if(this.playing){
			this.playing.pause();
		}
	},
	play:function(a,loop){
		this.stop();
		this.playing=a;
		a.currentTime=0;
		a.loop=loop;
		a.play();
	},
	flgchange:function(){
		var a;
		for(a in this.audios){
			this.audios[a].muted=!document.BGMflg.check.checked;
		}
	}
};
// var BGM={
// 	ele:null,
// 	play:function(src,loop){
// 		this.ele.loop=loop;
// 		this.ele.src="BGM/"+src;
// 	},
// 	stop:function(src){
// 		this.ele.src="hoge.mp3";
// 	},
// 	flgchange:function(){
// 		if(document.BGMflg.check.checked){
// 		 this.ele.volume=0;
// 		}else{
// 		 this.ele.volume=-10000;
// 		}
// 	}
// }

//----- おぶじぇくと -----
function obj(ele){
	this.ele=ele;
	this.w=0;this.h=0;
	this.x=0;this.y=0;
	this.vx=0;this.vy=0;
	this.kaisu={	//ブロックとの当たり判定を行う回数
	 x:0,y:0
	};
	this.init=function(w,h,src){
		this.w=w;
		this.h=h;
		this.kaisu.x=Math.floor((w-1)/tileW)+1;
		this.kaisu.y=Math.floor((h-1)/tileH)+1;
		this.ele.src=src;
	};
	this.AI=null;
	this.isOnTheGround=function(){	//おぶじぇくとがブロックにのっているか調べる
		if((this.y+this.h)%tileH == 0){
		 var y=(this.y+this.h)/tileH;
		 if(0<=y && y<tileY){
		  var x=Math.floor(this.x/tileW);
		  for(var i=0;i<this.kaisu.x;i++){
		   if(0<=x+i && x+i<game.stage.w && blocks[game.stage.block[x+i][y]].top){return true;}
		  }
		  x=Math.floor((this.x+this.w-1)/tileW);
		  if(0<=x && x<game.stage.w && blocks[game.stage.block[x][y]].top){return true;}
		 }
		}
		return false;

	};
	
	//--- ブロックとおぶじぇくとの当たり判定 ---
	this.hitBlockT=function(hit){	//top
		if(0<this.vy){	//落下中
		 var y=Math.floor((this.y+this.h-1)/tileH);
		 if(0<=y && y<tileY && y!=Math.floor((this.y+this.h-1-this.vy)/tileH)){
		  var x=Math.floor(this.x/tileW);
		  for(var i=0;i<this.kaisu.x;i++){
		   if(0<=x+i && x+i<game.stage.w && blocks[game.stage.block[x+i][y]].top){hit(this,x,y);return;}
		  }
		  x=Math.floor((this.x+this.w-1)/tileW);
		  if(0<=x && x<game.stage.w && blocks[game.stage.block[x][y]].top){hit(this,x,y);return;}
		 }
		}
	};
	this.hitBlockB=function(hit){	//bottom
		if(this.vy<0){	//上昇中
		 var y=Math.floor(this.y/tileH);
		 if(0<=y && y<tileY && y!=Math.floor((this.y-this.vy)/tileH)){
		  var x=Math.floor(this.x/tileW);
		  for(var i=0;i<this.kaisu.x;i++){
		   if(0<=x+i && x+i<game.stage.w && blocks[game.stage.block[x+i][y]].bottom){hit(this,x,y);}
		  }
		  x=Math.floor((this.x+this.w-1)/tileW);
		  if(0<=x && x<game.stage.w && Math.floor(this.x/tileW)+this.kaisu-1!=x && blocks[game.stage.block[x][y]].bottom){hit(this,x,y);}
		 }
		}
	};
	this.hitBlockL=function(hit){	//left
		if(0<this.vx){	//右移動中
		 var x=Math.floor((this.x+this.w-1)/tileW);
		 if(0<=x && x<game.stage.w && x!=Math.floor((this.x+this.w-1-this.vx)/tileW)){
		  var y=Math.floor(this.y/tileH);
		  for(var i=0;i<this.kaisu.y;i++){
		   if(0<=y+i && y+i<tileY && blocks[game.stage.block[x][y+i]].left){hit(this,x,y);return;}
		  }
		  y=Math.floor((this.y+this.h-1)/tileH);
		  if(0<=y && y<tileY && blocks[game.stage.block[x][y]].left){hit(this,x,y);return;}
		 }
		}
	};
	this.hitBlockR=function(hit){	//right
		if(this.vx<0){	//左移動中
		 var x=Math.floor(this.x/tileW);
		 if(0<=x && x<game.stage.w && x!=Math.floor((this.x-this.vx)/tileW)){
		  var y=Math.floor(this.y/tileH);
		  for(var i=0;i<this.kaisu.y;i++){
		   if(0<=y+i && y+i<tileY && blocks[game.stage.block[x][y+i]].right){hit(this,x,y);return;}
		  }
		  y=Math.floor((this.y+this.h-1)/tileH);
		  if(0<=y && y<tileY && blocks[game.stage.block[x][y]].right){hit(this,x,y);return;}
		 }
		}
	};
	//--- おぶじぇくととの当たり判定 ---
	this.hit=function(o){
		return (this.x<o.x+o.w)&&(o.x<this.x+this.w)&&(this.y<o.y+o.h)&&(o.y<this.y+this.h);
	};
}

//----- おぶじぇくと関係 -----
var maruo;


//おぶじぇくと軍団(エフェクト、敵、リフトなど)
var objs={
	effect:{
		blockBreak:{
		 w:24,h:24,
		 z:4,	//z-index
		 image:makeImage("blockBreak.gif"),
		 AI:function(){
			this.x+=this.vx;this.y+=this.vy;	//移動はplay関数側が行ってくれる
			this.vy+=3;
			if(main.h<this.y){return true;}	//真を返すと、play関数側の処理で死ぬ
			return false;	//僕は死にましぇーん
		 },
		 make:function(x,y){	//エフェクト召喚(引数はワールドブロック座標)
			var wx=x*tileW,wy=y*tileH;
			objs.make(this,wx,wy,2-Math.random()*4,-10+Math.random()*5);
			objs.make(this,wx,wy,2-Math.random()*4,-10+Math.random()*5);
		 }
		},
		getCoin:{	//世の中金だあ
		 w:24,h:24,
		 z:4,
		 image:makeImage("coin.gif"),
		 AI:function(){
			this.y+=this.vy;
			this.vy+=3;
			if(10<this.vy){return true;}
			return false;
		 },
		 make:function(x,y){	//引数はワールドブロック座標
			var wx=x*tileW+(tileW-this.w)/2,wy=y*tileH-this.h;
			objs.make(this,wx,wy,0,-12);
		 }
		},
		zakoDeath:{
		 w:28,h:28,
		 z:1,
		 image:makeImage("zakoDeath.gif"),
		 AI:function(){
			if(5<=this.vy){return true;}
			this.vy+=1;
			return false;
		 },
		 make:function(x,y){
		 	objs.make(this,x,y,0,0);
		 }
		}
	},
	enemy:{
		zako:{	//ク●ボーっぽいもの
		 w:28,h:28,
		 z:1,
		 image:makeImage("zakobo.gif"),
		 AI:function(){
			var work;
			if(!this.isOnTheGround()){	//空中
			 this.vy+=2;
			 if(tileH<this.vy){this.vy=tileH;}
			 //ブロックとのめりこみ判定y
			 this.y+=this.vy;
			 this.hitBlockT(function(o,x,y){o.y=tileH*y-o.h;o.vy=0;});
			 this.hitBlockB(function(o,x,y){o.y=tileH*(y+1);o.vy=0;});
			}else{	//地上
			 //ブロックとのめりこみ判定x
			 this.x+=this.vx;
			 this.hitBlockL(function(o,x,y){o.x=tileW*x-o.w;o.vx=-o.vx;});
			 this.hitBlockR(function hit(o,x,y){o.x=tileW*(x+1);o.vx=-o.vx;});
			}
			
			if(this.hit(maruo)){
			 work=maruo.y+maruo.h-1;	//マルオの足元座標
			 if(this.vy-maruo.vy<0 && (this.y<=work && work<this.y+this.h)){	//踏まれた
			  maruo.enemyJump=true;
			  maruo.vy=-32;
			  maruo.y=this.y-maruo.h-1;
			  maruo.hitBlockB(function(o,x,y){o.y=tileH*(y+1);o.vy=0;blocks[game.stage.block[x][y]].hit(x,y);});
			  objs.effect.zakoDeath.make(this.x,this.y);
			  return true;
			 }else{	//返り討ち(=踏まれた)
			  game.miss();
			 }
			}
			
			if(main.h<this.y){return true;}
			return false;
		 },
		 make:function(x,y){
			objs.make(this,objxFromWbx(x,this),objyFromWby(y,this),-2,0);
		 }
		},
		goal:{	//ゴール。敵ではないが敵である。
		 w:32,h:32,
		 z:2,
		 image:makeImage("goal.gif"),
		 AI:function(i){
			if(game.flg==0 && this.hit(maruo)){
			 bgm.play(bgm.audios.goal,false);
			 game.moneyIndex=objs.index[i];
			 game.flg=4;
			}
			return false;
		 },
		 make:function(x,y){
			objs.make(this,objxFromWbx(x,this),objyFromWby(y,this),0,0);
		 }
		},
		ueToge:{	//上トゲ
		 w:32,h:32,
		 z:2,
		 image:makeImage("ueToge.gif"),
		 AI:function(){
		 	if(this.hit(maruo)){game.miss();}
			return false;
		 },
		 make:function(x,y){
			objs.make(this,objxFromWbx(x,this),objyFromWby(y,this),0,0);
		 }
		},
		lefToge:{	//左トゲ
		 w:32,h:32,
		 z:2,
		 image:makeImage("lefToge.gif"),
		 AI:function(){
		 	if(this.hit(maruo)){game.miss();}
			return false;
		 },
		 make:function(x,y){
			objs.make(this,objxFromWbx(x,this),objyFromWby(y,this),0,0);
		 }
		},
		upToge:{	//上発射トゲ
		 w:32,h:32,
		 z:4,
		 image:makeImage("ueToge.gif"),
		 AI:function(){
			if(this.y+this.h<0){return true;}
			if(this.vy==0){
			 if(Math.abs(this.x-maruo.x)<64 && this.y-maruo.y<240){this.vy=-10;}
			}else{
			 this.y+=this.vy;
			 this.vy-=15;
			 if(this.vy<-maruo.h){this.vy=-maruo.h;}
			}
			if(this.hit(maruo)){game.miss();}
			return false;
		 },
		 make:function(x,y){
			objs.make(this,objxFromWbx(x,this),objyFromWby(y,this),0,0);
		 }
		},
		fall:{	//落ちるすり抜け床(2ブロック)
		 w:64,h:32,
		 z:4,
		 image:makeImage("fall.gif"),
		 AI:function(){
			if(main.h<this.y){return true;}
		 	if(this.vy==0){
			 var work=this.y-maruo.y;
			 if(Math.abs(this.x+this.w/2-(maruo.x+maruo.w/2))<64 && work<128){this.vy=1;}
			}else{
			 this.y+=this.vy;
			 this.vy+=3;
			}
			return false;
		 },
		 make:function(x,y){
			objs.make(this,objxFromWbx(x,this),objyFromWby(y,this),0,0);
		 }
		}
	},
	make:function(temp,x,y,vx,vy){	//召喚(x,yはワールド座標)
		if(this.max<=this.n){return;}
		this.obj[this.index[this.n]].init(temp.w,temp.h,temp.image.src);
		this.obj[this.index[this.n]].AI=temp.AI;
		this.obj[this.index[this.n]].x=x;
		this.obj[this.index[this.n]].y=y;
		this.obj[this.index[this.n]].vx=vx || 0;
		this.obj[this.index[this.n]].vy=vy || 0;
		this.obj[this.index[this.n]].ele.style.zIndex=temp.z;
		$(this.obj[this.index[this.n]].ele,1);
		this.n++;
	},
	kill:function(i){	//抹消(iはindex)
		if(this.n<i){return;}
		$(this.obj[this.index[i]].ele,0);
		this.n--;
		var work=this.index[this.n];
		this.index[this.n]=this.index[i];
		this.index[i]=work;
	},
	max:1024,	//最大でmax匹まで。
	n:0,	//おぶじぇくとの数
	obj:null,	//おぶじぇくと格納
	index:null
};


//----- ブロッククラス -----
function block(name,index,srcE,srcG,top,bottom,left,right,hit){	//ブロックデータのクラス
	//index:並び順,srcE:エディットモードでの画像のパス,srcG:ゲームモードでの画像のパス
	//TBLR:上下左右の当たり判定の有無,hit:叩かれたときに発動する関数(x,yが引数に渡される)
	this.name=name;
	this.index=index;
	this.srcE=srcE;this.imageE=makeImage(srcE);
	this.srcG=srcG;this.imageG=makeImage(srcG);
	this.top=top;
	this.bottom=bottom;
	this.left=left;
	this.right=right;
	this.hit=hit || function(){};
}
var blocks=[
	new block("空",0,"hoge.gif","hoge.gif",0,0,0,0,null),
	new block("地面",1,"jimen.png","jimen.png",1,1,1,1,null),
	new block("草",2,"ww.png","ww.png",1,1,1,1,null),
	new block("固ブロック",10,"kata.png","kata.png",1,1,1,1,null),
	new block("叩かれた後",20,"suka.png","suka.png",1,1,1,1,null),
	new block("レンガブロック(スカ)",21,"renga.png","renga.png",1,1,1,1,function(x,y){
		game.stage.changeBlock(x,y,0);
		objs.effect.blockBreak.make(x,y);
	}),
	new block("レンガブロック(コイン)",22,"rengaM.png","renga.png",1,1,1,1,function(x,y){
		game.stage.changeBlock(x,y,4);
		objs.effect.getCoin.make(x,y);
	}),
	new block("隠しブロック",23,"hideo.gif","hoge.gif",0,1,0,0,function(x,y){
		game.stage.changeBlock(x,y,4);
		objs.effect.getCoin.make(x,y);
	}),
	new block("ハテナブロック(コイン)",24,"hatena.png","hatena.png",1,1,1,1,function(x,y){
		game.stage.changeBlock(x,y,4);
		objs.effect.getCoin.make(x,y);
	}),
	new block("すりぬけ床",11,"surinuke.gif","surinuke.gif",1,0,0,0,null),
	new block("POWブロック",30,"power.png","power.png",1,1,1,1,function(x,y){
		//全てのブロックを破壊する。つまりネタブロック
		var work=game.stage.blockL+tileX/2;
		var tmp;
		if(game.stage.blockL==-1){work=game.stage.w;}
		if(game.stage.w<work){work=game.stage.w;}
		for(var i=Math.floor(game.stage.camera/tileW);i<work;i++){
		 for(var j=0;j<tileY;j++){
		  tmp=game.stage.block[i][j];
		  if(tmp!=0 && !(x==i && y==j)){
		   if(blocks[tmp].srcG!="hoge.gif"){objs.effect.blockBreak.make(i,j);}
		   game.stage.changeBlock(i,j,0);
		  }
		 }
		}
	})
];

//----- BG関係 -----
var bg=new Array(2);
function bgMove(x){	//視点が移動するイメージ。BGは画面外に入った瞬間、反対側に移動する。
	var i;
	for(i=0;i<2;i++){
	 bg[i].x-=x%(main.w*2);
	 if(bg[i].x+main.w<=0){bg[i].x+=main.w*2;}
	 else if(main.w<=bg[i].x){bg[i].x-=main.w*2;}
	 moveX(bg[i].ele,bg[i].x);
	}
}
function bgMoveInit(){
	var i;
	for(i=0;i<2;i++){
	 bg[i].x=i*main.w;
	 moveX(bg[i].ele,bg[i].x);
	}
}

//----- メニューオブジェクト -----
var menu={
	now:"",
	open:function(id){	//展開
		if(this.now==id){return;}
		if(this.now!=""){this.close();}
		$(document.getElementById(id),1);
		this.now=id;
	},
	close:function(){	//抹消
		if(this.now==""){return;}
		$(document.getElementById(this.now),0);
		this.now="";
	},
	OpenClose:function(id){	//二回押したらOFFになるアレ
		if(this.now==id){this.close();return;}
		this.open(id);
	},
	title:{
	 timer:null,
	 init:function(){
		var i,j,k;
		bgMoveInit();
		$(maruo.ele,0);
		
		//背景のBG
		main.color("87cefa");
		for(i=0;i<2;i++){
		 for(j=0;j<tileX;j++){for(k=0;k<tileY;k++){bg[i].putG(j,k,0);}}	//全消去
		 for(j=0;j<tileX;j++){	//穴生成
		  if(!(i==0 && 14<=j && j<=17)&&!(i==1 && 8<=j && j<=9)){
		   bg[i].putG(j,tileY-1,1);
		   bg[i].putG(j,tileY-2,2);
		  }
		 }
		}
		for(i=0;i<=3;i++){	//階段生成
		 bg[1].putG(i+4,tileY-i-3,2);
		 for(j=0;j<=i;j++){
		  bg[1].putG(i+4,tileY-j-2,1);
		 }
		}
		for(i=0;i<=3;i++){
		 bg[1].putG(13-i,tileY-i-3,2);
		 for(j=0;j<=i;j++){
		  bg[1].putG(13-i,tileY-j-2,1);
		 }
		}
		var hatena=8,renga=5;
		for(i=4;i<=10;i++){bg[0].putG(i,10,renga);}	//レンガブロック生成
		for(i=6;i<=8;i++){bg[0].putG(i,7,renga);}
		bg[0].putG(5,10,hatena);bg[0].putG(7,10,hatena);	//ハテナブロック生成
		bg[0].putG(9,10,hatena);bg[0].putG(7,7,hatena);
		
		this.timer=setInterval(function(){bgMove(4);},100);
		menu.open("titleMenu");
	 },
	 end:function(){
		menu.close();
		clearInterval(this.timer);
	 }
	},
	jumon:{
	 init:function(){	//initとか言ってるけど終了もかねてるんですよコレ
		if(menu.now=="jumonMenu"){
		 menu.close();return;
		}else{
		 document.myform.jumon.value=pass.get(edit.stage);
		 menu.open("jumonMenu");
		}
	 }
	}
}

//----- メインスクリーンオブジェクト -----
var main={
	w:tileW*tileX,h:tileH*tileY,
	ele:null,
	color:function(c){
		main.ele.style.backgroundColor="#"+c;
	}
}

//----- 復活の呪文オブジェクト -----
var pass={
	get:function(stage){	//復活の呪文文字列を返す
		var x,y,i,j,cnt,b;
		var text="1";	//バージョンID
		text+="/"+stage.w+"/"+stage.x+"/"+stage.y+"/"+stage.color+"/"+stage.enemyN+"/";
		//敵データ
		for(j=0;j<stage.enemyN;j++){
		 if(j!=0){text+=",";}
		 i=stage.enemyI[j];
		 text+=stage.enemy[i].x+","+stage.enemy[i].y+","+stage.enemy[i].key;
		}
		//ブロックデータ取得＆圧縮
		text+="/";
		cnt=0;
		for(y=0;y<tileY;y++){
		 for(x=0;x<stage.w;x++){
		  if(cnt!=0){
		   if(b==stage.block[x][y] && cnt<94){cnt++;}else{
		    text+=String.fromCharCode(32+cnt);
		    cnt=0;
		   }
		  }
		  if(cnt==0){
		   b=stage.block[x][y];
		   text+=String.fromCharCode(33+b);
		   cnt=1;
		  }
		 }
		}
		if(cnt!=0){text+=String.fromCharCode(32+cnt);}
		return text;
	},
	set:function(text,stage){	//正常なら1、エラーなら0を返す
		//バージョンID抜き出し
		var index=text.indexOf("/");
		if(index<=0){return 0;}
		var V=text.substring(0,index);
		
		//バージョンで分岐
		var A,str,tmp,hoge,i,j,x,y,cnt;
		switch(V){
		 case "0":	//初代バージョン
		 //不正呪文はじき出し
		 A=text.split("/");
		 if(A.length<6){return 0;}
		 str=A[5];for(i=6;i<A.length;i++){str+=("/"+A[i]);}
		 for(i=1;i<=3;i++){A[i]-=0;}
		 if(isNaN(A[1]) || A[1]<0 || stageWmax<A[1]){debug.log(1);return 0;}
		 if(isNaN(A[2]) || A[2]<0 || A[1]<=A[2]){debug.log(2);return 0;}
		 if(isNaN(A[3]) || A[3]<0 || tileY<=A[3]){debug.log(3);return 0;}
		 if(!isColorCode(A[4])){return 0;}
		 //ブロックデータの判定
		 cnt=0;
		 for(i=0;i<str.length;i+=2){
		  tmp=str.charCodeAt(i)-33;
		  if(tmp<0 || blocks.length<=tmp){return 0;}
		  tmp=str.charCodeAt(i+1)-32;
		  if(tmp<1 || 94<tmp){return 0;}
		  cnt+=tmp;
		  if(A[1]*tileY==cnt){tmp=1;break;}
		  tmp=0;
		 }
		 if(!tmp){return 0;}
		 //stageオブジェクトに格納
		 stage.w=A[1];stage.x=A[2];stage.y=A[3];stage.color=A[4];
		 stage.enemyN=0;	//ver1で実装
		 cnt=A[1]*tileY;index=0;x=0;y=0;
		 while(cnt>0){
		  tmp=str.charCodeAt(index)-33;
		  hoge=str.charCodeAt(index+1)-32;
		  for(i=0;i<hoge;i++){
		   stage.block[x][y]=tmp;
		   x++;if(x==A[1]){x=0;y++;}
		   cnt--;
		  }
		  index+=2;
		 }
		 break;
		 
		 case "1":	//敵追加バージョン
		 //--- 不正呪文はじき出し ---
		 A=text.split("/");
		 if(A.length<8){return 0;}
		 str=A[7];for(i=8;i<A.length;i++){str+=("/"+A[i]);}
		 for(i=1;i<=3;i++){A[i]-=0;}
		 if(isNaN(A[1]) || A[1]<0 || stageWmax<A[1]){debug.log(1);return 0;}
		 if(isNaN(A[2]) || A[2]<0 || A[1]<=A[2]){debug.log(2);return 0;}
		 if(isNaN(A[3]) || A[3]<0 || tileY<=A[3]){debug.log(3);return 0;}
		 if(!isColorCode(A[4])){return 0;}
		 if(isNaN(A[5]) || A[5]<0 || enemyMax<A[5]){return 0;}
		 //敵データの判定
		 tmp=A[6].split(",");
		 if(tmp.length!=A[5]*3 && !(A[5]==0 && A[6]=="")){return 0;}
		 for(i=0;i<A[5];i++){
		  if(isNaN(tmp[i*3]) || tmp[i*3]<0 || A[1]<=tmp[i*3]){return 0;}
		  if(isNaN(tmp[i*3+1]) || tmp[i*3+1]<0 || tileY<=tmp[i*3+1]){return 0;}
		  if(!objs.enemy[tmp[i*3+2]]){return 0;}
		 }
		 //ブロックデータの判定
		 cnt=0;
		 for(i=0;i<str.length;i+=2){
		  tmp=str.charCodeAt(i)-33;
		  if(tmp<0 || blocks.length<=tmp){return 0;}
		  tmp=str.charCodeAt(i+1)-32;
		  if(tmp<1 || 94<tmp){return 0;}
		  cnt+=tmp;
		  if(A[1]*tileY==cnt){tmp=1;break;}
		  tmp=0;
		 }
		 if(!tmp){return 0;}
		 //--- stageオブジェクトに格納 ---
		 stage.w=A[1];stage.x=A[2];stage.y=A[3];stage.color=A[4];stage.enemyN=A[5];
		 //敵データ
		 tmp=A[6].split(",");
		 for(i=0;i<stage.enemyN;i++){
		  stage.enemy[i].x=tmp[i*3+0]-0;
		  stage.enemy[i].y=tmp[i*3+1]-0;
		  stage.enemy[i].key=tmp[i*3+2];
		 }
		 //ブロックデータ
		 cnt=A[1]*tileY;index=0;x=0;y=0;
		 while(cnt>0){
		  tmp=str.charCodeAt(index)-33;
		  hoge=str.charCodeAt(index+1)-32;
		  for(i=0;i<hoge;i++){
		   stage.block[x][y]=tmp;
		   x++;if(x==A[1]){x=0;y++;}
		   cnt--;
		  }
		  index+=2;
		 }
		 break;
		 
		 default:
		 return 0;
		}
		return 1;	//これでおわりだー
	}
}

//----- エディットオブジェクト -----
var edit={
	ele:null,flg:false,
	init:function(){	//エディット初期化
		var i,x,y,work;
		
		//キーイベントハンドラ
		document.body.onkeypress=function(){
			if(edit.form.focus){return;}	//なんかフォームに入力してたらやめる
			var kc=event.keyCode;
			//debug.log(kc);
			switch(kc){
			 case 97:edit.stage.scroll(-1);break;	//A
			 case 100:edit.stage.scroll(1);break;	//D
			 case 101:menu.OpenClose("blockMenu");break;	//E
			 case 113:menu.jumon.init();break;	//Q
			 case 116:edit.form.testPlay(true);break;	//T
			 case 119:menu.OpenClose("enemyMenu");break;	//W
			}
		}
		
		//BG
		for(i=0;i<2;i++){
		 bg[i].ele.style.zIndex=0;
		 for(x=0;x<tileX;x++){
		  for(y=0;y<tileY;y++){
		   bg[i].tile[x][y].style.cursor="crosshair";
		  }
		 }
		}
		
		//ステージ表示の初期化
		this.stage.scroll2();
		
		//敵関係
		for(j=0;j<this.stage.enemyN;j++){
		 i=this.stage.enemyI[j];work=this.stage.enemy[i].key;
		 objs.obj[i].ele.src=objs.enemy[work].image.src;
		 objs.obj[i].ele.style.zIndex=objs.enemy[work].z;
		 objs.obj[i].w=objs.enemy[work].w;
		 objs.obj[i].h=objs.enemy[work].h;
		 move(objs.obj[i].ele,objxFromWbx(edit.stage.enemy[i].x-edit.stage.camera,objs.obj[i]),objyFromWby(edit.stage.enemy[i].y,objs.obj[i]));
		 $(objs.obj[i].ele,1);
		}
		
		//フォームの復元的な
		document.myform.maruoX.value=edit.stage.x;
		document.myform.maruoY.value=edit.stage.y;
		document.myform.backColor.value=edit.stage.color;
		main.color(this.stage.color);
		document.myform.stageW.value=edit.stage.w;
		document.myform.enemyX.disabled=true;
		document.myform.enemyY.disabled=true;
		
		//マルオ
		moveY(maruo.ele,objyFromWby(edit.stage.y,maruo));
		$(maruo.ele,true);
		
		this.flg=true;
		$(edit.ele,true);
	},
	end:function(){
		this.flg=false;
		$(edit.ele,0);menu.close();
		//BG
		for(var i=0;i<2;i++){
		 bg[i].ele.style.zIndex=3;
		 for(var x=0;x<tileX;x++){
		  for(var y=0;y<tileY;y++){
		   bg[i].tile[x][y].style.cursor="default";
		  }
		 }
		}
		//敵を全部消す
		for(i=0;i<this.stage.enemyN;i++){
		 $(objs.obj[this.stage.enemyI[i]].ele,0);
		}
		document.body.onkeypress=null;
	},
	block:{
	 now:new Array(2),
	 change:function(LR,index){	//選択ブロック変更
		this.now[LR]=index;
		var tmp="edit"+(LR?"Right":"Left");
		document.getElementById(tmp+"Img").src=blocks[index].imageE.src;
		document.getElementById(tmp+"Text").innerHTML=blocks[index].name;
	 },
	 sel:function(index){
		LRcheck();var LR=LRflg;
		if(LR==-1){return;}
		this.change(LR,index);
	 },
	 put:function(i,x,y){	//クリック入力受け取り用
		if(!edit.flg){return;}
		var LR=LRflg;
		if(LR==-1){return;}
		if(menu.now!=""){
		 menu.close();
		 return;
		}
		edit.stage.put(i,x,y,this.now[LR]);
	 }
	},
	form:{
	 focus:false,
	 testPlay:function(first){
		if(first){edit.end();}
		game.init(pass.get(edit.stage),function(x){
			if(x==2){
			 edit.form.testPlay(false);
			}else{
			 edit.init();
			}
		});
	 },
	 enemyPut:function(key){	//敵追加
		if(enemyMax<=edit.stage.enemyN){alert("これ以上追加できません");return;}
		this.enemyNow=edit.stage.enemyI[edit.stage.enemyN];
		edit.stage.enemyN++;
		edit.stage.enemy[this.enemyNow].x=0;
		edit.stage.enemy[this.enemyNow].y=0;
		edit.stage.enemy[this.enemyNow].key=key;
		objs.obj[this.enemyNow].ele.src=objs.enemy[key].image.src;
		objs.obj[this.enemyNow].ele.style.zIndex=objs.enemy[key].z;
		objs.obj[this.enemyNow].w=objs.enemy[key].w;
		objs.obj[this.enemyNow].h=objs.enemy[key].h;
		move(objs.obj[this.enemyNow].ele,objxFromWbx(edit.stage.enemy[this.enemyNow].x-edit.stage.camera,objs.obj[this.enemyNow]),objyFromWby(edit.stage.enemy[this.enemyNow].y,objs.obj[this.enemyNow]));
		$(objs.obj[this.enemyNow].ele,1);
		document.myform.enemyX.value=edit.stage.enemy[this.enemyNow].x;
		document.myform.enemyY.value=edit.stage.enemy[this.enemyNow].y;
		document.myform.enemyX.disabled=false;
		document.myform.enemyY.disabled=false;
	 },
	 enemySel:function(index){
		if(!edit.flg){return;}
		LRcheck();
		if(LRflg){	//暗殺
		 document.myform.enemyX.disabled=true;
		 document.myform.enemyY.disabled=true;
		 $(objs.obj[index].ele,0);
		 var i=0;
		 while(index!=edit.stage.enemyI[i]){i++;}
		 edit.stage.enemyN--;
		 edit.stage.enemyI[i]=edit.stage.enemyI[edit.stage.enemyN];
		 edit.stage.enemyI[edit.stage.enemyN]=index;
		}else{	//選択
		 document.myform.enemyX.value=edit.stage.enemy[index].x;
		 document.myform.enemyY.value=edit.stage.enemy[index].y;
		 document.myform.enemyX.disabled=false;
		 document.myform.enemyY.disabled=false;
		 this.enemyNow=index;
		}
		LRflg=-1;
	 },
	 enemyNow:-1	//選択中の敵
	},
	stage:{
	 color:"87cefa",
	 x:0,y:13,	//マルオの座標
	 w:tileX,
	 block:new Array(stageWmax),
 	 camera:0,
	 enemyN:0,
	 enemy:new Array(enemyMax),
	 enemyI:new Array(enemyMax),	//Index
	 initialPass:"",	//初期のパスワード
	 put:function(i,x,y,index){	//BG座標を指定することでブロック配置
		this.block[this.camera+(bg[i].x/tileW)+x][y]=index;
		bg[i].putE(x,y,index);
	 },
	 scroll:function(x){
		var i,x,y;
		var move=0<x?1:-1;
		this.camera+=move;
		
		//これ以上スクロールできないっす
		if(this.camera<0){this.camera=0;return;}
		if(this.w-tileX < this.camera){this.camera=this.w-tileX;return;}
		
		//新しく読み込まれる部分をお絵かき
		if(move==1){
		 if(bg[0].x+main.w<=0){bg[0].x+=main.w*2;}
		 if(bg[1].x+main.w<=0){bg[1].x+=main.w*2;}
		 i=bg[0].x<=0?1:0;
		 x=tileX-(bg[i].x/tileW);
		 for(y=0;y<tileY;y++){
		  bg[i].putE(x,y,this.block[this.camera+tileX-1][y]);
		 }
		}else{
		 if(main.w<=bg[0].x){bg[0].x-=main.w*2;}
		 if(main.w<=bg[1].x){bg[1].x-=main.w*2;}
		 i=bg[0].x<=-tileW?0:1;
		 x=-1-(bg[i].x/tileW);
		 for(y=0;y<tileY;y++){
		  bg[i].putE(x,y,this.block[this.camera][y]);
		 }
		}
		
		for(j=0;j<this.enemyN;j++){
		 i=edit.stage.enemyI[j];
		 moveX(objs.obj[i].ele,objxFromWbx(this.enemy[i].x-this.camera,objs.obj[i]));
		}
		moveX(maruo.ele,objxFromWbx(edit.stage.x-edit.stage.camera,maruo));
		bgMove(tileW*move);
		document.myform.camera.value=this.camera;
	 },
	 scroll2:function(){	//カメラからBGを描画
	 	var tmp,i,j;
	 	for(var x=0;x<tileX;x++){
	 	 tmp=this.camera+x;
	 	 for(var y=0;y<tileY;y++){bg[0].putE(x,y,this.block[tmp][y]);}
	 	}
		for(j=0;j<this.enemyN;j++){
		 i=edit.stage.enemyI[j];
		 moveX(objs.obj[i].ele,objxFromWbx(this.enemy[i].x-this.camera,objs.obj[i]));
		}
		moveX(maruo.ele,objxFromWbx(edit.stage.x-edit.stage.camera,maruo));
	 	bgMoveInit();
		document.myform.camera.value=this.camera;
	 }
	}
};

//----- ゲームオブジェクト -----
var game={
	stage:{
	 w:0,x:0,y:0,color:"",
	 block:new Array(stageWmax),
	 blockL:0,	//次に読まれるブロックのX
	 camera:0,
	 enmeyN:0,
	 enemy:new Array(enemyMax),
	 drawBlock:function(x,y){	//ステージブロック座標を指定して、ブロックをBGに描画
		bg[Math.floor(x/tileX)%2].putG(x%tileX,y,this.block[x][y]);
	 },
	 changeBlock:function(x,y,index){	//ステージブロック座標を指定して、ブロックを変更
		this.block[x][y]=index;
		this.drawBlock(x,y);
	 }
	},
	init:function(p,end){
		//playを実行する前の処理。この関数は、playを自動的に呼び出す。
		//endには、play終了時に実行する関数を入れておく。
		if(pass.set(p,this.stage)){
 		 var i,x,y;
		 
		 bgm.play(bgm.audios.living,true);
		 
		 //BG初期化
		 x=this.stage.x-(tileX/2-1);
		 if(x<0){x=0;}
		 if(this.stage.w-tileX<x){x=this.stage.w-tileX;}
		 bgMoveInit();bgMove(x*tileW);
		 for(this.stage.blockL=x;this.stage.blockL<x+tileX;this.stage.blockL++){
		  for(y=0;y<tileY;y++){
		   this.stage.drawBlock(this.stage.blockL,y);
		  }
		 }
		 this.stage.camera=x*tileW;
		 
		 //おぶじぇくと軍団
		 objs.n=0;
		 
		 //敵召喚
		 for(i=0;i<this.stage.enemyN;i++){
		  if(x<=this.stage.enemy[i].x && this.stage.enemy[i].x<this.stage.blockL){
		   objs.enemy[this.stage.enemy[i].key].make(this.stage.enemy[i].x,this.stage.enemy[i].y);
		  }
		 }
		 
		 //背景色変更
		 main.color(this.stage.color);
		 
		 //丸男初期化
		 maruo.x=objxFromWbx(this.stage.x,maruo);
		 maruo.y=objyFromWby(this.stage.y,maruo);
		 maruo.vx=0;maruo.vy=0;
		 maruo.enemyJump=false;
		 $(maruo.ele,true);
		 
		 //時間表示
		 $(document.getElementById("time"),1);

		 //れっつぷれい
		 this.endU=end;
		 this.lastTime=0;
		 this.flg=0;
		 this.cnt=0;
		 this.goalCnt=0;
		 this.play();
		}else{
		 debug.log("ステージ受け渡しエラー");
		 end(0);
		}
	},
	play:function(){	//タイマー再帰により、開始からゴールまでを実行する。
		var nowTime=(new Date()).getTime();
		
		if(nowTime-this.lastTime >= 50){
			document.getElementById("time").innerHTML=this.totalCntAsTime()+" 秒";
			
			var i,j,x,y,work;
			
			switch(this.flg){
			//----- 冒険中 -----
			case 0: 
			//--- 丸男操作 ---
			if(maruo.isOnTheGround() && !maruo.enemyJump){
			 maruo.vy=0;
			 if(Math.abs(maruo.vx)<2){maruo.vx=0;}	//すべり
			 if(maruo.vx<0){maruo.vx+=2;}
			 if(0<maruo.vx){maruo.vx-=2;}
			 if(key[65]){maruo.vx-=4;}	//左移動
			 if(key[68]){maruo.vx+=4;}	//右移動
			 if(14<maruo.vx){maruo.vx=14;}	//X速度制限
			 if(maruo.vx<-14){maruo.vx=-14;}
			 if(key[87]){maruo.vy-=27;}	//ジャンプ
			}else{
			 if(key[65]){maruo.vx-=0.5;}
			 if(key[68]){maruo.vx+=0.5;}
			 if(maruo.vy<0){
			  maruo.vy+=4;
			  if(key[87]){maruo.vy-=1;}
			 }else{
			  maruo.vy+=5;
			 }
			 if(tileH<maruo.vy){maruo.vy=tileH;}	//すり抜け防止のための速度制限
			}
			maruo.enemyJump=false;
			
			if(tileW<maruo.vx){maruo.vx=tileW;}	//念のためx速度制限
			if(maruo.vx<-tileW){maruo.vx=-tileW;}
			
			maruo.x+=maruo.vx;	//x方向に移動
			//ブロックとのめりこみ判定x
			maruo.hitBlockL(function(o,x,y){o.x=tileW*x-o.w;o.vx=0;});
			maruo.hitBlockR(function hit(o,x,y){o.x=tileW*(x+1);o.vx=0;});
			maruo.y+=maruo.vy;
			//ブロックとのめりこみ判定y
			maruo.hitBlockT(function(o,x,y){o.y=tileH*y-o.h;});
			maruo.hitBlockB(function(o,x,y){o.y=tileH*(y+1);o.vy=0;blocks[game.stage.block[x][y]].hit(x,y);});
			
			//フィールドの端とのめりこみ判定
			if(maruo.x<this.stage.camera){maruo.x=this.stage.camera;maruo.vx=0;}	//後戻りは、もうできない
			if(this.stage.w*tileW<maruo.x+maruo.w){maruo.x=this.stage.w*tileW-maruo.w;maruo.vx=0;}	//限界突破もできない
			
			//--- スクロール ---
			if(this.stage.blockL!=-1 && tileW*(tileX-2)/2<maruo.x-this.stage.camera){
			 var scroll=maruo.x-this.stage.camera-(tileW*(tileX-2)/2);
			 if(this.stage.w*tileW<this.stage.camera+scroll+main.w){	//スクロールが限界に達したら
			  scroll=this.stage.w*tileW-this.stage.camera-main.w;
			  this.stage.blockL=-1;	//スクロール終了のフラグ
			 }
			 this.stage.camera+=scroll;
			 //ブロックよみこみ
			 if(Math.floor((this.stage.camera+main.w-1)/tileW)==this.stage.blockL){
			  for(y=0;y<tileY;y++){
			   this.stage.drawBlock(this.stage.blockL,y);
			  }
			  for(i=0;i<this.stage.enemyN;i++){	//ついでに敵も
			   if(this.stage.enemy[i].x==this.stage.blockL){
			    objs.enemy[this.stage.enemy[i].key].make(this.stage.enemy[i].x,this.stage.enemy[i].y);
			   }
			  }
			  this.stage.blockL+=1;
			 }
			 bgMove(scroll);
			}
			
			//--- おぶじぇくと軍団 ---
			for(i=0;i<objs.n;i++){
			 work=objs.obj[objs.index[i]];
			 if(work.AI(i) || work.x+work.w+main.w/2-this.stage.camera<0){	//死ぬ運命なら殺す
			  //debug.log("あべし");
			  objs.kill(i);i--;
			 }else{	//生きていたら動かす
			  move(work.ele,work.x-this.stage.camera,work.y);
			 }
			}
			
			//--- 丸男移動 ---
			move(maruo.ele,maruo.x-this.stage.camera,maruo.y);
			
			if(main.h<maruo.y){bgm.play(bgm.audios.miss,false);this.flg=2;}	//落ちたら死ぬ
			if(key[88]){this.miss();}	//Xで自滅
			this.cnt+=1;
			break;
			//----- 暗殺 -----
			case 1:
			maruo.y+=maruo.vy;maruo.vy+=2;
			moveY(maruo.ele,maruo.y);
			if(main.h<maruo.y){this.flg=2;}	//落下したら次へ
			break;
			//----- 奈落の底準備 -----
			case 2:
			$(document.getElementById("deathMenu"),1);
			key[82]=false;key[88]=false;
			this.flg=3;
			//----- 奈落の底 -----
			case 3:
			if(key[82]){this.end(2);return;}	//R:何度でも蘇るさ
			if(key[88]){this.end(3);return;}	//X:バルス
			break;
			//----- クリアモーション -----
			case 4:
			if(maruo.isOnTheGround()){
			 if(30<=this.goalCnt){maruo.x+=4;}
			}else{
			 maruo.vy+=5;if(tileH<maruo.vy){maruo.vy=tileH;}
			 maruo.y+=maruo.vy;
			 maruo.hitBlockT(function(o,x,y){o.y=tileH*y-o.h;o.vy=0;});
			 if(main.h+objs.enemy.goal.h<maruo.y){bgm.play(bgm.audios.miss,false);this.flg=2;}
			}
			//--- おぶじぇくと軍団 ---
			for(i=0;i<objs.n;i++){
			 if(objs.index[i]==this.moneyIndex){continue;}
			 work=objs.obj[objs.index[i]];
			 if(work.AI(i) || work.x+work.w+main.w/2-this.stage.camera<0){	//死ぬ運命なら殺す
			  //debug.log("あべし");
			  objs.kill(i);i--;
			 }else{	//生きていたら動かす
			  move(work.ele,work.x-this.stage.camera,work.y);
			 }
			}
			move(maruo.ele,maruo.x-this.stage.camera,maruo.y);
			move(objs.obj[this.moneyIndex].ele,maruo.x-this.stage.camera,maruo.y-objs.enemy.goal.h);
			if(this.stage.camera+main.w<=maruo.x){this.flg=5;}
			this.goalCnt+=1;
			break;
			//----- 入力待ち準備 -----
			case 5:
			$(document.getElementById("goalMenu"),1);
			key[82]=false;
			key[88]=false;
			this.flg=6;
			//----- 入力待ち -----
			case 6:
			if(key[82]){this.end(2);return;}
			if(key[88]){this.end(1);key[88]=false;return;}
			break;
			}
			
			//--- 再帰の準備 ---
			this.lastTime=nowTime;	//え？引数で渡した方がかっこいい？文句ならsetTimeoutに言ってくれ。
			// 2022.8.7追記:
			// たぶん game.play を無名関数でラップせずにタイマーに渡そうとして書いたコメントだと思う。
			// その渡し方だと this でバグって動かないので無名関数でラップするように変えたはずだが、
			// それによって play に引数を渡せることに当時の私は気付かなかったらしい。
		}
		setTimeout(function(){game.play();},10);
	},
	lastTime:0,
	flg:false,	//丸男の状態。0:冒険中 1:暗殺された 2,3:奈落の底 4,5,6:クリア
	moneyIndex:0,	//丸男の頭にくっついてくる金
	cnt:0,	//冒険中の経過コマ数
	goalCnt:0,	//金を略奪してからの経過コマ数
	totalCntAsTime:function(){
		return ((this.cnt+this.goalCnt)*0.05).toFixed(2);
	},
	miss:function(){	//丸男暗殺時に実行
	 bgm.play(bgm.audios.miss,false);
	 maruo.ele.src=maruoDImg.src;
	 this.flg=1;
	 maruo.vy=-18;
	},
	end:function(x){	//終了時に決まった処理を実行する。
		bgm.stop();
		//おぶじぇくと軍団全部消す
		for(var i=0;i<objs.n;i++){
		 $(objs.obj[objs.index[i]].ele,0);
		}
		maruo.ele.src=maruoImg.src;
		$(document.getElementById("deathMenu"),0);
		$(document.getElementById("goalMenu"),0);
		$(document.getElementById("time",0));
		this.endU(x);
	},
	endU:null	//終了時に実行する関数。エラーなら0、クリアなら1、ミスなら2、中断なら3が引数に渡される。
}

//----- ストーリーオブジェクト -----
//超・手抜き
var story={
	inoki:["気合","根気","何度でもよみがえるさ","たくさん","腐るほど","さざれ石の巌となりて苔のむすまで","infinity","無限","HAHAHA","星の数ほど"],
	jumon:"1/100/1/12/87cefa/20/9,12,zako,12,12,zako,24,9,zako,57,11,zako,66,9,zako,90,10,goal,94,11,fall,75,13,zako,79,4,zako,89,0,lefToge,89,1,lefToge,89,2,lefToge,89,3,lefToge,89,4,lefToge,76,14,ueToge,77,14,ueToge,78,14,ueToge,84,14,upToge,83,14,ueToge,85,14,ueToge/!z$!!~!%$!!~!%$!!~!%$!!o$!!3$!!M')!9*4$!!M')!-(\"!%$\"!7$!!-&!)!&!!=')!/$#!!$!!\"$!!6$!!M'$+!'$!+$\"!#$!!\"$!!\"$!!6$!!B$!!\"$!!2(!!#$#!!$!!\"$!!\"$!!\"$!!\"$!!C&!'#&!!((&!\"$\"!\"$\"!6$!!\"$!!\"$!!\"$!!#$\"!X$#!\"$#!5$!!\"$!!\"$!!!$#!:##*\"(\"*##!!6$$!\"$$!2$!!!$!!#$\"!?\"#!'\"!#-!$#)!\"#-*&!$$!!D#!\"#!'\".!$\")!\"\"-!<#'!##$!##\"\"$!!#$!\"\"!",
	// jumon:"1/20/16/11/87cefa/1/18,11,goal/!~!.\"!!2\"$!0\"!!\"\"\"!-\"\"!$\"!!-\"!!%\"!!,\"!!&\"!!!\"\"!)\"!!%\"\"!!\"#!'\"!!'\"#!!\"\"!%\"\"!,\"#!!\"#!/\"\"",
	isPlaying:false,
	play:function(){
		//残機表示(笑)
		$(document.getElementById("dark"),1);
		document.getElementById("inokiWord").innerHTML=story.inoki[Math.floor(Math.random()*story.inoki.length)];
		$(document.getElementById("inoki"),1);
		move(maruo.ele,240,240);
		maruo.ele.style.zIndex=5;
		$(document.getElementById("maruo"),1);
		
		//少し間をおいてゲームスタート
		setTimeout(function(){
			maruo.ele.style.zIndex=1;
			$(document.getElementById("inoki"),0);
			$(document.getElementById("dark"),0);
			story.isPlaying=true;
			
			game.init(story.jumon,function(x){
				story.isPlaying=false;
		 		switch(x){
				 case 2:	//復活
				 story.play();
				 break;
				 
				 case 1:
				 //  alert("Thank you for your playing!\n(和訳：時間がなくて、ここまでしかできてません。\n来年は完成品を発表するのでよろしく！)");
				 console.log("Thank you for playing!");

				 default:
				 menu.title.init();
				 break;
				}
			});
		},1500);
	}
}

//----- デバッグオブジェクト -----
var debug={
	log:function(msg){
		if(this.flg){
		 try{console.log(msg);}catch(e){}
		}
	},
	flg:true
};

//----- オンロード処理 -----
window.onload=function(){
	var i,j;
	var x,y;
	var tmp,ele;
	
	//クリックの左右判定
	document.onmouseup=function(){LRflg=-1;}
	
	//BGM
	// BGM.ele=document.getElementById("BGM");
	bgm.flgchange();
	
	//スクリーン全体
	document.getElementById("screenAll").style.height=main.h+"px";
	
	tmp=10;	//画面の左端からどれくらい隙間をあけるか
	//スクリーンの初期化：main
	main.ele=document.getElementById("main");
	main.ele.style.width=main.w+"px";
	main.ele.style.height=main.h+"px";
	main.ele.style.left=tmp+"px";
	$(main.ele,1);
	
	//カーテン
	ele=document.getElementById("dark")
	ele.style.width=main.w+"px";
	ele.style.height=main.h+"px";
	
	//スクリーンの初期化：edit
	edit.ele=document.getElementById("edit");
	edit.ele.style.height=main.h+"px";
	edit.ele.style.left=(main.w+1+tmp)+"px";
	
	//BGの初期化
	for(i=0;i<2;i++){
	 //bgオブジェクトの初期化
	 bg[i]={
	  x:0,
	  ele:document.getElementById("bg"+i),
	  tile:new Array(tileX),
	  putE:function(x,y,index){
		this.tile[x][y].src=blocks[index].imageE.src;
	  },
	  putG:function(x,y,index){
		this.tile[x][y].src=blocks[index].imageG.src;
	  }
	 }
	 
	 bg[i].ele.style.width=main.w+"px";
	 bg[i].ele.style.height=main.h+"px";
	 bg[i].ele.style.top=0+"px";
	 bg[i].ele.style.zIndex=3;
	 
	 //タイル初期化
	 ele=bg[i].ele.getElementsByTagName("Img");
	 for(x=0;x<tileX;x++){
	   bg[i].tile[x]=new Array(tileY);
	   for(y=0;y<tileY;y++){
	    bg[i].tile[x][y]=ele[x*tileY+y];	//タイルにアクセス
	    bg[i].tile[x][y].style.width=tileW+"px";	//大きさ、位置の設定
	    bg[i].tile[x][y].style.height=tileH+"px";
	    bg[i].tile[x][y].style.left=x*tileW+"px";
	    bg[i].tile[x][y].style.top=y*tileH+"px";
	    bg[i].tile[x][y].src=blocks[0].imageG.src;	//画像初期化
	  }
	 }
	}
	bgMoveInit();
	
	//stage.block形成
	for(i=0;i<edit.stage.block.length;i++){
	 edit.stage.block[i]=new Array(tileY);
	 game.stage.block[i]=new Array(tileY);
	 for(j=0;j<tileY;j++){
	  edit.stage.block[i][j]=0;
	  game.stage.block[i][j]=0;
	 }
	}
	//初期化呪文設定
	edit.stage.initialPass=pass.get(edit.stage);
	
	//ブロック選択の初期化
	edit.block.change(0,1);
	edit.block.change(1,0);
	
	//エディットモードのフォーム初期化
	document.myform.maruoX.onchange=function(){	//丸男x座標
		var x=this.value-0;
		if(!isNaN(x) && this.value.length){
		 x=parseInt(x);
		 if(x<0){edit.stage.x=0;}
		 else if(edit.stage.w<=x){edit.stage.x=edit.stage.w-1;}
		 else{edit.stage.x=x;}
		 moveX(maruo.ele,objxFromWbx(edit.stage.x-edit.stage.camera,maruo));
		}
		this.value=edit.stage.x;
	}
	document.myform.maruoY.onchange=function(){	//丸男y座標
		var y=this.value-0;
		if(!isNaN(y) && this.value.length){
		 y=parseInt(y);
		 if(y<0){edit.stage.y=0;}
		 else if(tileY<=y){edit.stage.y=tileY-1;}
		 else{edit.stage.y=y;}
		 moveY(maruo.ele,objyFromWby(edit.stage.y,maruo));
		}
		this.value=edit.stage.y;
	}
	document.myform.enemyX.onchange=function(){	//敵x座標
		var x=this.value-0;
		if(!isNaN(x) && this.value.length){
		 x=parseInt(x);
		 if(x<0){edit.stage.enemy[edit.form.enemyNow].x=0;}
		 else if(edit.stage.w<=x){edit.stage.enemy[edit.form.enemyNow].x=edit.stage.w-1;}
		 else{edit.stage.enemy[edit.form.enemyNow].x=x;}
		 moveX(objs.obj[edit.form.enemyNow].ele,objxFromWbx(edit.stage.enemy[edit.form.enemyNow].x-edit.stage.camera,objs.obj[edit.form.enemyNow]));
		}
		this.value=edit.stage.enemy[edit.form.enemyNow].x;
	}
	document.myform.enemyY.onchange=function(){	//敵y座標
		var y=this.value-0;
		if(!isNaN(y) && this.value.length){
		 y=parseInt(y);
		 if(y<0){edit.stage.enemy[edit.form.enemyNow].y=0;}
		 else if(tileY<=y){edit.stage.enemy[edit.form.enemyNow].y=tileY-1;}
		 else{edit.stage.enemy[edit.form.enemyNow].y=y;}
		 moveY(objs.obj[edit.form.enemyNow].ele,objyFromWby(edit.stage.enemy[edit.form.enemyNow].y,objs.obj[edit.form.enemyNow]));
		}
		this.value=edit.stage.enemy[edit.form.enemyNow].y;
	}
	document.myform.stageW.onchange=function(){	//ステージ幅
		var w=this.value-0;
		if(!isNaN(w) && this.value.length && tileX<=w && w<=stageWmax && edit.stage.x+maruo.w<=w*tileW){
		  edit.stage.w=parseInt(w);
		  //カメラ押し戻し
		  if(edit.stage.w-tileX<edit.stage.camera){edit.stage.camera=edit.stage.w-tileX;edit.stage.scroll2();}
		}
		this.value=edit.stage.w;
	}
	document.myform.backColor.onchange=function(){	//背景色
		if(isColorCode(this.value)){
		 edit.stage.color=this.value;
		 main.color(edit.stage.color);
		}else{
		 alert("6桁の16進数を半角で入力してください");
		 this.value=edit.stage.color;
		}
	}
	document.myform.camera.onchange=function(){	//カメラ位置
		var x=this.value-0;
		if(!isNaN(x) && this.value.length){
		 x=parseInt(x);
		 if(x<0){x=0;}
		 else if(edit.stage.w-tileX<x){x=edit.stage.w-tileX;}
		 if(x!=edit.stage.camera){edit.stage.camera=x;edit.stage.scroll2();}
		}
		this.value=edit.stage.camera;
	}
	document.myform.jumonLoad.onclick=function(){	//復活の呪文読み取り
		if(pass.set(document.myform.jumon.value,edit.stage)){
		 debug.log("正常");
		 edit.stage.camera=0;edit.stage.scroll2();
		 document.myform.stageW.value=edit.stage.w;
		 document.myform.maruoX.value=edit.stage.x;
		 document.myform.maruoY.value=edit.stage.y;
		 document.myform.backColor.value=edit.stage.color;
		 main.color(edit.stage.color);
		 moveY(maruo.ele,objyFromWby(edit.stage.y,maruo));
		 //敵を全部消す
		 for(var i=0;i<enemyMax;i++){
		  $(objs.obj[edit.stage.enemyI[i]].ele,0);
		 }
		 //敵召喚
		 var work;
		 for(var j=0;j<edit.stage.enemyN;j++){
		  i=edit.stage.enemyI[j];work=edit.stage.enemy[i].key;
		  objs.obj[i].ele.src=objs.enemy[work].image.src;
		  objs.obj[i].ele.style.zIndex=objs.enemy[work].z;
		  objs.obj[i].w=objs.enemy[work].w;
		  objs.obj[i].h=objs.enemy[work].h;
		  move(objs.obj[i].ele,objxFromWbx(edit.stage.enemy[i].x-edit.stage.camera,objs.obj[i]),objyFromWby(edit.stage.enemy[i].y,objs.obj[i]));
		  $(objs.obj[i].ele,1);
		 }
		}else{
		 alert("パスワードが間違っています");
		}
	}
	document.myform.jumonInit.onclick=function(){	//初期化呪文
		document.myform.jumon.value=edit.stage.initialPass;
	}
	
	//キー入力監視
	document.body.onkeydown=function(){
		var kc=event.keyCode;key[kc]=true;
		//debug.log(kc);
	};
	document.body.onkeyup=function(){
		key[event.keyCode]=false;
	}
	
	//丸男初期化
	maruo=new obj(document.getElementById("maruo"));
	maruo.init(32,48,maruoImg.src);
	
	//おぶじぇくと軍団初期化
	ele=document.getElementById("objs").getElementsByTagName("img");
	objs.obj=new Array(objs.max);
	objs.index=new Array(objs.max);
	for(i=0;i<objs.max;i++){
	 objs.index[i]=i;
	 objs.obj[i]=new obj(ele[i]);
	}
	
	for(i=0;i<enemyMax;i++){
	 edit.stage.enemyI[i]=i;
	 edit.stage.enemy[i]={x:0,y:0,key:""};
	 game.stage.enemy[i]={x:0,y:0,key:""};
	}
	
	//タイトル呼び出し
	$(main.ele,1);
	menu.title.init();
	
	//ツイート機能
	window.addEventListener("keyup",function(eve){
		var tweet=function(text){
			text=encodeURIComponent(text);
			var tag=encodeURIComponent("スーパー丸男");
			var url=encodeURIComponent(location.href);
			window.open("https://twitter.com/intent/tweet?text="+text+"&hashtags="+tag+"&url="+url);
		}
		if(story.isPlaying && (eve.key=="t" || eve.key=="T")){
			if(game.flg==3){
				//ミス
				tweet("丸男はX="+(maruo.x/tileW).toFixed(1)+"地点にて志半ばで倒れた。");
			}else if(game.flg==6){
				//クリア
				tweet("丸男は約"+game.totalCntAsTime()+"秒で志を果たした。");
			}
		}
	});
}