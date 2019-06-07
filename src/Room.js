//array of rooms
//room class
//room deleter
//databases in Map

class Room extends EventEmitter {
    constructor(server, _id, settings) {
        super();
        EventEmitter.call(this);
        this._id = _id;
        this.server = server;
        this.crown = null;
        this.settings = {
            lobby: this.isLobby(_id),
            visible: settings.visible || true,
            crownsolo: settings.crownsolo || false,
            chat: settings.chat || true,
            color: this.verifyColor(settings.color) || this.getColor(_id),
            color2: this.verifyColor(settings.color) || this.getColor2(_id)
        }
        this.ppl = new Map();
        this.connections = [];
        this.bindEventListeners();
        this.server.rooms.set(_id, this);
    }
    join(cl) { //this stuff is complicated
    let otheruser = this.connections.find((a) => a.user._id == cl.user._id)
    if (!otheruser) {
        let participantId = createKeccakHash('keccak256').update((Math.random().toString() + cl.ip)).digest('hex').substr(0, 24);
        cl.user.id = participantId;
        cl.participantId = participantId;
        if (this.connections.length == 0 && Array.from(this.ppl.values()).length == 0) { //user that created the room, give them the crown.
            this.crown = {
                participantId: cl.participantId,
                userId: cl.user._id,
                time: Date.now(),
                startPos: {x: 50, y: 50},
                endPos: {x: this.getCrownX(), y: this.getCrownY()}
            }
        }
        this.ppl.set(participantId, cl);
        this.connections.push(cl);

        this.sendArray([{
            color: this.ppl.get(cl.participantId).user.color,
            id: this.ppl.get(cl.participantId).participantId,
            m: "p",
            name: this.ppl.get(cl.participantId).user.name,
            x: this.ppl.get(cl.participantId).x || 200,
            y: this.ppl.get(cl.participantId).y || 100,
            _id: cl.user._id
        }], cl)
        this.updateCh(cl);
    } else {
        cl.user.id = otheruser.participantId;
        cl.participantId = otheruser.participantId;
        this.connections.push(cl);
        this.updateCh(cl);
    }

}
remove(p) { //this is complicated too
    let otheruser = this.connections.filter((a) => a.user._id == p.user._id);
    if (!(otheruser.length > 1)) {
        this.ppl.delete(p.participantId);
        this.connections.splice(this.connections.findIndex((a) => a.connectionid == p.connectionid), 1);
        console.log(`Deleted client ${p.user.id}`);
        this.sendArray([{
            m: "bye",
            p: p.participantId
        }], p);
        this.updateCh();
    } else {
        this.connections.splice(this.connections.findIndex((a) => a.connectionid == p.connectionid), 1);
    }

}
updateCh(cl) { //update channel for all people in channel
    if (Array.from(this.ppl.values()).length <= 0) this.destroy();
    this.connections.forEach((usr) => {
        this.server.connections.get(usr.connectionid).sendArray([this.fetchData(usr, cl)])
    })
}
destroy() { //destroy room
    this._id;
    console.log(`Deleted room ${this._id}`);
    this.settings = {};
    this.ppl;
    this.connnections;
    this.server.rooms.delete(this._id);
}
sendArray(arr, not) {
    this.connections.forEach((usr) => {
        if (!not || usr.participantId != not.participantId) {
            try {
                this.server.connections.get(usr.connectionid).sendArray(arr)
            } catch (e) {
                console.log(e);
            }
        }
    })
}
fetchData(usr, cl) {
    let chppl = [];
    [...this.ppl.values()].forEach((a) => {
        chppl.push(a.user);
    })
    let data = {
        m: "ch",
        p: "ofo",
        ch: {
            count: chppl.length,
            crown: this.crown,
            settings: this.settings,
            _id: this._id
        },
        ppl: chppl
    }
    if (cl) {
        if (usr.user.id == cl.user.id) {
            data.p = cl.participantId;
        } else {
            delete data.p;
        }
    } else {
        delete data.p;
    }
    if (data.ch.crown == null) {
        delete data.ch.crown;
    }
    return data;
}
verifyColor(color) {
    return color; //TODO make this
}
getColor(_id) {
    if (this.isLobby(_id)) { 
        return this.server.defaultLobbyColor;
    } else {
        return this.server.defaultRoomColor;
    }
}
getColor2(_id) {
    if (this.isLobby(_id)) {
        return this.server.defaultLobbyColor2;
    } else {
        return;
        delete this.settings.color2;
    }
}
isLobby(_id) {
    if (_id.startsWith("lobby")) {
        if (_id == "lobby") {
            return true;
        } else if (parseFloat(_id.split("lobby")[1] % 1) === 0) {
            return true;
        } else {
            return false;
        }
    } else if (_id.startsWith("test/")) {
        if (_id == "test/") {
            return false;
        } else {
            return true;
        }
    } else {
        return false;
    }

}
getCrownY() {
    return 50 - 30;
}
getCrownX() {
    return 50;
}
setCords(p, x, y) {
    if (p.participantId)
    x ? this.ppl.get(p.participantId).x = x : {};
    y ? this.ppl.get(p.participantId).y = y : {};
    this.sendArray([{m: "m", id: p.participantId, x: this.ppl.get(p.participantId).x, y: this.ppl.get(p.participantId).y}], p);
}
bindEventListeners() {
    this.on("bye", participant => {
        this.remove(participant);
    })

    this.on("m", (participant, x, y) => {
        this.setCords(participant, x, y);
    })
}

}
module.exports = Room;