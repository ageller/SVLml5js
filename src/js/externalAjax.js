function flyWWT(url){
	//try with Ajax
	var http = new XMLHttpRequest();
	http.open("GET", url);
	http.send();
	http.onreadystatechange = function(){
		if (this.readyState == 4 && this.status == 200){
			console.log('finished flying to WWT location')
		}
	}

	// var popup = window.open(url,"WWT", "width=200,height=100");
	// setTimeout(function() {popup.close();}, 1000); //I want to make this fire onload, but it won't let me
	// //popup.blur(); //doesn't work
	// //window.focus();
}
function launchVLC3D(movie){
	//testing for now

	//try with Ajax

	//clear the playlist
	var url1 = "http://SVL3DTV.adlerplanetarium.org:8080/requests/status.xml?command=pl_empty";
	
	//add a movie to playlist
	var url2 = "http://SVL3DTV.adlerplanetarium.org:8080/requests/status.xml?command=in_enqueue&input=/Users/svladler/AstroConversationMedia/Movies3D_TopBottom/Stars/Sun/EUVI_171_Angstroms-TB2.mov";
	
	//play the playlist
	var url3 = "http://SVL3DTV.adlerplanetarium.org:8080/requests/status.xml?command=pl_play";
	
	//go to fullscreen
	var url4 = "http://SVL3DTV.adlerplanetarium.org:8080/requests/status.xml?command=fullscreen"
	
	var http1 = new XMLHttpRequest();
	http1.open("GET", url1);
	http1.send();
	http1.onreadystatechange = function(){
		if (this.readyState == 4 && this.status == 200){
			var http2 = new XMLHttpRequest();
			http2.open("GET", url2);
			http2.send();
			http2.onreadystatechange = function(){
				if (this.readyState == 4 && this.status == 200){
					var http3 = new XMLHttpRequest();
					http3.open("GET", url3);
					http3.send();
					http3.onreadystatechange = function(){
						if (this.readyState == 4 && this.status == 200){
							var http4 = new XMLHttpRequest();
							http4.open("GET", url4);
							http4.send();
							http4.onreadystatechange = function(){
								if (this.readyState == 4 && this.status == 200){
									console.log('playing VLC 3D movie')
								}
							}
						}
					}
				}
			}
		}
	}

	// var popup = window.open("http://SVL3DTV.adlerplanetarium.org:8080/requests/status.xml?command=pl_empty","VLC3D", "width=200,height=100");
	// setTimeout(function() {
	// 	popup.location.replace("http://SVL3DTV.adlerplanetarium.org:8080/requests/status.xml?command=in_enqueue&input=/Users/svladler/AstroConversationMedia/Movies3D_TopBottom/Stars/Sun/EUVI_171_Angstroms-TB2.mov")},
	// 	200);
	// setTimeout(function() {
	// 	popup.location.replace("http://SVL3DTV.adlerplanetarium.org:8080/requests/status.xml?command=pl_play")},
	// 	400);
	// setTimeout(function() {
	// 	popup.location.replace("http://SVL3DTV.adlerplanetarium.org:8080/requests/status.xml?command=fullscreen")},
	// 	600);
	// //setTimeout(function() {popup.close();}, 1000); //I want to make this fire onload, but it won't let me
	// console.log("showing video")

}



