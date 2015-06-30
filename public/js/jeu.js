var client;
var isServer = false;
var socket;

var inputsKeyCode = {
	up:38, 
	right:39,
	left:37,
	down:40,
	kick:13
};

var nextInput = null;

// names of known key codes (0-255)
var keyboardMap = ["","","","CANCEL","","","HELP","","BACK_SPACE","TAB","","","CLEAR","ENTER","RETURN","","SHIFT","CONTROL","ALT","PAUSE","CAPS_LOCK","KANA","EISU","JUNJA","FINAL","HANJA","","ESCAPE","CONVERT","NONCONVERT","ACCEPT","MODECHANGE","SPACE","PAGE_UP","PAGE_DOWN","END","HOME","LEFT","UP","RIGHT","DOWN","SELECT","PRINT","EXECUTE","PRINTSCREEN","INSERT","DELETE","","0","1","2","3","4","5","6","7","8","9","COLON","SEMICOLON","LESS_THAN","EQUALS","GREATER_THAN","QUESTION_MARK","AT","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","WIN","","CONTEXT_MENU","","SLEEP","NUMPAD0","NUMPAD1","NUMPAD2","NUMPAD3","NUMPAD4","NUMPAD5","NUMPAD6","NUMPAD7","NUMPAD8","NUMPAD9","MULTIPLY","ADD","SEPARATOR","SUBTRACT","DECIMAL","DIVIDE","F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12","F13","F14","F15","F16","F17","F18","F19","F20","F21","F22","F23","F24","","","","","","","","","NUM_LOCK","SCROLL_LOCK","WIN_OEM_FJ_JISHO","WIN_OEM_FJ_MASSHOU","WIN_OEM_FJ_TOUROKU","WIN_OEM_FJ_LOYA","WIN_OEM_FJ_ROYA","","","","","","","","","","CIRCUMFLEX","EXCLAMATION","DOUBLE_QUOTE","HASH","DOLLAR","PERCENT","AMPERSAND","UNDERSCORE","OPEN_PAREN","CLOSE_PAREN","ASTERISK","PLUS","PIPE","HYPHEN_MINUS","OPEN_CURLY_BRACKET","CLOSE_CURLY_BRACKET","TILDE","","","","","VOLUME_MUTE","VOLUME_DOWN","VOLUME_UP","","","SEMICOLON","EQUALS","COMMA","MINUS","PERIOD","SLASH","BACK_QUOTE","","","","","","","","","","","","","","","","","","","","","","","","","","","OPEN_BRACKET","BACK_SLASH","CLOSE_BRACKET","QUOTE","","META","ALTGR","","WIN_ICO_HELP","WIN_ICO_00","","WIN_ICO_CLEAR","","","WIN_OEM_RESET","WIN_OEM_JUMP","WIN_OEM_PA1","WIN_OEM_PA2","WIN_OEM_PA3","WIN_OEM_WSCTRL","WIN_OEM_CUSEL","WIN_OEM_ATTN","WIN_OEM_FINISH","WIN_OEM_COPY","WIN_OEM_AUTO","WIN_OEM_ENLW","WIN_OEM_BACKTAB","ATTN","CRSEL","EXSEL","EREOF","PLAY","ZOOM","","PA1","WIN_OEM_CLEAR",""];

$(function(){

	//Chargement des bonnes touches
	var inputsConfig = JSON.parse(localStorage.getItem("inputsConfig"));
	if(inputsConfig){
		for(var i in inputsConfig){
			inputsKeyCode[i] = inputsConfig[i];
		}
	}else{
		localStorage.setItem("inputsConfig", JSON.stringify(inputsKeyCode));
	}

	var imgs = {
		sprites:"public/img/sprites.png"
	}

	client = new Client();
	client.loadImages(imgs, function(){
		$("#loader").hide();
		client.display.initSprites();
	});

	socket = io();
	socket.on("login", function(data){
		$("#homePanel").show();
		client.pID = null;
		client.room = null;
	});

	socket.on("playerID", function(data){
		$("#homePanel").hide();
		client.pID = data;
	});

	socket.on("initRoom", function(data){
		client.initRoom(data);
		client.display.displayRoomPlayers();
	});

	socket.on("snapshot", function(data){
		client.snapshot(JSON.parse(data));
	});

	socket.on("tchat", function(data){
		for(var i in client.ignoredPlayers){
			if(client.ignoredPlayers[data.pseudo.toLowerCase()]){
				return;
			}
		}
		var date = new Date();
		var msgDiv = $("#messages");
		var html = "";
		data.pseudo = "<span class='pointer' onclick='profil("+data.pID+")'>"+data.pseudo+"</span>";
		if(data.type == "private"){
			if(data.from){
				html = "<li class='private'>["+date.getHours()+":"+date.getMinutes()+"] De "+data.pseudo+" : "+htmlEntities(data.message)+"</li>";
			}else{
				html = "<li class='private'>["+date.getHours()+":"+date.getMinutes()+"] A "+data.pseudo+" : "+htmlEntities(data.message)+"</li>";
			}
		}else{
			html = "<li class='"+data.type+"'>["+date.getHours()+":"+date.getMinutes()+"] "+data.pseudo+" : "+htmlEntities(data.message)+"</li>";
		}
		msgDiv.append(html);
		msgDiv.animate({scrollTop:$("#messages").prop('scrollHeight')}, 0);
	});

	socket.on("information", function(data){
		var date = new Date();
		var msgDiv = $("#messages");
		msgDiv.append("<li class='information'>["+date.getHours()+":"+date.getMinutes()+"] "+htmlEntities(data)+"</li>");
		msgDiv.animate({scrollTop:$("#messages").prop('scrollHeight')}, 0);
	});

	socket.on("newPlayer", function(data){
		client.room.addPlayer(new Player(data), data.team);
		client.display.displayRoomPlayers();
	});

	socket.on("deletePlayer", function(data){
		client.room.deletePlayer(data);
		client.display.displayRoomPlayers();
	});

	socket.on("nbPlayers", function(data){
		$("#nbPlayers").text(data);
	});

	socket.on("goal", function(data){
		$("#score"+data.team).text(data.score);
		client.display.particles.push(new Particle({sprite:new Sprite(client.display.sprites["marqueurgoal"+data.team]), x:125, y:225, w:300, h:100, life:60}));
	});

	socket.on("changeSide", function(data){
		client.room.changeSide();
		client.display.particles.push(new Particle({sprite:new Sprite(client.display.sprites["mitemps"]), x:125, y:350, w:300, h:100, life:120}));
	});

	socket.on("inProgressGames", function(data){
		if(client && client.display){
			client.display.inProgressGames(data);
		}
	});

	socket.on("gameCreation", function(data){
		if(client && client.display){
			client.display.gameCreation(data);
		}
	});

	socket.on("ranking", function(data){
		if(client && client.display){
			client.display.ranking(data);
		}
	});

	socket.on("profil", function(data){
		if(client && client.display){
			client.display.profil(data);
		}
	});

	socket.on("scoreboard", function(data){
		if(client && client.display){
			client.display.scoreboard(data);
		}
	});

	//PING
	setInterval(function(){
		socket.emit("ping", Date.now());
	}, 1000);

	socket.on("pong", function(data){
		client.ping = Date.now() - data;
	});

	//Interval client
	var lastTs = Date.now();
	setInterval(function step() {
		var ts = Date.now();
		var delta = 1000/FPS;
		while(ts - lastTs >= delta){
			client.update();
			lastTs += delta;
		}
	}, 1000/FPS)

	//Clavier
	document.body.addEventListener("keydown", function(e) {
		if($('input:focus').length == 0 ){
			//Choix changement input
			if(nextInput != null){
				inputsKeyCode[nextInput] = e.keyCode;
				localStorage.setItem("inputsConfig", JSON.stringify(inputsKeyCode));
				client.display.options();
				nextInput = null;
			}else{
				client.keys[e.keyCode] = true;
			}
		}
	});
	document.body.addEventListener("keyup", function(e) {
		client.keys[e.keyCode] = false;
	});

	//Gestion des formulaires
	$('#connectionPanel').submit(function(e){
		e.preventDefault();
		socket.emit("login", {login:$('#loginLoginForm').val(), password:$('#passwordLoginForm').val()});
	});

	$('#signinForm').submit(function(e){
		e.preventDefault();
		if($('#passwordSigninForm').val() == $('#passwordSigninFormConfirm').val()){
			socket.emit("signin", {login:$('#loginSigninForm').val(), password:$('#passwordSigninForm').val()});
		}
	});

	$('#tchatForm').submit(function(e){
		e.preventDefault();
		var text = $('#inputTchat').val();
		if(text.length > 0){
			if(text[0] && text[0] == "/"){
				var split = text.split(" ");
				switch(split[0]) {
					case "/ignore":
					if(client.ignoredPlayers[split[1].toLowerCase()]){
						delete client.ignoredPlayers[split[1].toLowerCase()];
						var msgDiv = $("#messages");
						msgDiv.append("<li class='information'>Vous n'ignorez plus "+split[1]+".</li>");
						msgDiv.animate({scrollTop:$("#messages").prop('scrollHeight')}, 0);
					}else{
						client.ignoredPlayers[split[1].toLowerCase()] = 1;
						var msgDiv = $("#messages");
						msgDiv.append("<li class='information'>Vous ignorez "+split[1]+".</li>");
						msgDiv.animate({scrollTop:$("#messages").prop('scrollHeight')}, 0);
					}
					break;
					default:
					socket.emit("tchat", text);
				}
			}else{
				socket.emit("tchat", text);
			}
		}
		$('#inputTchat').val("");
	});

	$("#closePopup").click(function(e){
		$("#popup").hide();
	});

	$("#leave").click(function(e){
		socket.emit("leave");
	});

	$('#canvas').on('mousewheel', function(event) {
		if(event.deltaY > 0){
			client.display.scale += 0.1;
		}else if(event.deltaY < 0 && client.display.scale > 0){
			client.display.scale -= 0.1;
		}
	});

	setScreenSize();
	$(window).resize(function(){
		setScreenSize();
	});
});

var setScreenSize = function(){
	var jeu = $("#jeu");
	var bW = 1024;
	var bH = 768;

	var sW = $(window).width();
	var sH = $(window).height();

	var rW = sW/bW;
	var rH = sH/bH;

	if(rW < rH){
		//on gere en fonction de la largeur
		var scale = sW/bW;
		jeu.css({
			'-webkit-transform' : 'scale(' + scale + ')',
			'-moz-transform'    : 'scale(' + scale + ')',
			'-ms-transform'     : 'scale(' + scale + ')',
			'-o-transform'      : 'scale(' + scale + ')',
			'transform'         : 'scale(' + scale + ')'
		});
	}else{
		//on gere en fonction de la hauteur
		var scale = sH/bH;
		jeu.css({
			'-webkit-transform' : 'scale(' + scale + ')',
			'-moz-transform'    : 'scale(' + scale + ')',
			'-ms-transform'     : 'scale(' + scale + ')',
			'-o-transform'      : 'scale(' + scale + ')',
			'transform'         : 'scale(' + scale + ')'
		});
	}
	jeu.css("top", (sH/2 - (bH/2)*scale)+"px");
	jeu.css("left", (sW/2 - (bW/2)*scale)+"px");

	client.scale = scale;
}

var menuOptions = function(nb){
	switch(nb) {
		case 'creation':
		socket.emit("gameCreation");
		break;
		case 'games':
		socket.emit("inProgressGames");
		break;
		case 'ranking':
		socket.emit("ranking");
		break;
		case 'options':
		client.display.options();
		break;
		case 'help':
		client.display.help();
		break;
	}
}

var spectate = function(id){
	socket.emit("spectate", {id:id});
	$("#popup").hide();
}

var createParty = function(){
	socket.emit("createFunGame", {name:document.getElementById("creation_nom").value, map:document.getElementById("creation_map").value, password:document.getElementById("creation_password").value});
	$("#popup").hide();
}

var matchmaking = function(){
	var checkedValue = null; 
	var maps = [];
	var inputElements = document.getElementsByClassName('mapChoice');
	for(var i=0; inputElements[i]; ++i){
		if(inputElements[i].checked){
			checkedValue = inputElements[i].value;
			maps.push(checkedValue);
		}
	}
	socket.emit("matchmaking", maps);
	$("#popup").hide();
}

var join = function(id){
	socket.emit("joinFunGame", {id:id, password:document.getElementById("password_"+id).value});
}

var changeInput = function(inp){
	nextInput = inp;
}

var profil = function(id){
	socket.emit("profil", id);
}