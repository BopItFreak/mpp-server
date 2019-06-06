//array of rooms
//room class
//room deleter
//databases in Map

class Room extends EventEmitter { //clean?
    constructor(server, _id, settings) {
        super();
        EventEmitter.call(this);
        this._id = _id;
        this.server = server;
        this.settings = {
            lobby: true,
            visible: settings.visible || true,
            crownsolo: settings.crownsolo || false,
            chat: settings.chat || true,
            color: this.verifyColor(settings.color) || this.server.defaultRoomColor,
            color2: this.verifyColor(settings.color) || this.defaultLobbyColor2
        }
        this.ppl = new Map();
        this.bindEventListeners();
        this.server.rooms.set(_id, this);
    }
    join(cl) {
        let participantId = createKeccakHash('keccak256').update((Math.random().toString() + cl.ip)).digest('hex').substr(0, 24);
        cl.user.id = participantId;
        cl.participantId = participantId;
        this.ppl.set(participantId, cl);
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
    }
    remove(p) {
        //this.participants.splice(this.participants.findIndex((cl) => cl.participantId == p.participantId), 1);
        this.ppl.delete(p.participantId);
        this.sendArray([{
            m: "bye",
            p: p.participantId
        }]);
        this.updateCh();

    }
    updateCh(cl) {
        if (this.ppl.keys().next().value.length <= 0) this.destroy();
        this.ppl.forEach((usr) => {
            this.server.connections.get(usr.connectionid).sendArray([this.fetchData(usr, cl)])
        })
    }
    destroy() {
        this._id;
        console.log(`Deleted room ${this._id}`);
        this.settings = {};
        this.ppl;
        this.server.rooms.delete(_id);    
    }
    sendArray(arr, not) {
        this.ppl.forEach((usr) => {
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
            ch: {
                count: chppl.length,
                settings: this.settings,
                _id: this._id
            },
            ppl: chppl
        }
        if (cl) {
            if (usr.user.id == cl.user.id) {
                data.p = cl.participantId;
            }
        }
        return data;
    }
    verifyColor(color) {
        return color; //TODO make this
    }
    bindEventListeners() {
        this.on("bye", participant => {
            this.remove(participant);
        })
    }

}
module.exports = Room;