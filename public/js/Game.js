var Game = function(){
	this.players = {};
	this.rooms = [];
	this.maps = [];
	this.matchmaking = new Matchmaking(this);

}

Game.prototype.update = function(){
	for(var i in this.rooms){
		this.rooms[i].update();
	}
}

Game.prototype.updateSnapshot = function(){
	for(var i in this.rooms){
		this.rooms[i].sendSnapshot();
	}
}

Game.prototype.addPlayer = function(player){
	this.players[player.socket] = player;
}

Game.prototype.deletePlayer = function(socket){
	delete this.players[socket];
}

Game.prototype.newRoom = function(){
	var room = new Room({id:nbRooms});
	room.map = this.maps[0];
	room.start();
	nbRooms++;
	this.rooms.push(room);
	return room;
}

Game.prototype.deleteRoom = function(roomId){
	for(var i in this.rooms){
		if(this.rooms[i].id == roomId){
			this.rooms.splice(i, 1);
		}
	}
}

Game.prototype.addMatch = function(p1, p2){
	
}

Game.prototype.getPlayerBySocket = function(socket){
	if(this.players[socket]){
		return this.players[socket];
	}
	return null;
}

Game.prototype.getRoom = function(id){
	for(var i in this.rooms){
		if(this.rooms[i].id == id){
			return this.rooms[i];
		}
	}
	return null;
}

Game.prototype.getNbPlayers = function(){
	return Object.keys(this.players).length;
}