window.onload=function(){
	//パスワードを文字列リテラルにするツール
	document.form20150904.pass.onfocus=function(){this.select();};
	document.form20150904.pass.onchange=function(){document.form20150904.go.disabled=false;};
	document.form20150904.go.onclick=function(){
		this.disabled=true;
		var work=document.form20150904.pass.value.split("\\");
		var str=work[0];
		for(var i=1;i<work.length;i++){
		 str+="\\\\"+work[i];
		}
		work=str.split('"');
		str=work[0];
		for(var i=1;i<work.length;i++){
		 str+='\\"'+work[i];
		}
		document.form20150904.pass.value='"'+str+'"';
	};
};