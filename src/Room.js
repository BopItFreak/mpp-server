//array of rooms
//room class
//room deleter
//databases in Map
const Quota = require("./Quota.js");
class Room extends EventEmitter {
    constructor(server, _id, settings) {
        super();
        EventEmitter.call(this);
        this._id = _id;
        this.server = server;
        this.crown = null;
        this.crowndropped = false;
        this.settings = this.verifySet(this._id, {
            set: settings
        });
        this.chatmsgs = [];
        this.ppl = new Map();
        this.connections = [];
        this.bindEventListeners();
        this.server.rooms.set(_id, this);
        this.bans = new Map();
    }
    join(cl) { //this stuff is complicated
        let otheruser = this.connections.find((a) => a.user._id == cl.user._id)
        if (!otheruser) {
            let participantId = createKeccakHash('keccak256').update((Math.random().toString() + cl.ip)).digest('hex').substr(0, 24);
            cl.user.id = participantId;
            cl.participantId = participantId;
            cl.initParticipantQuotas();
            if (((this.connections.length == 0 && Array.from(this.ppl.values()).length == 0) && !this.isLobby(this._id)) || this.crown && (this.crown.userId == cl.user._id)) { //user that created the room, give them the crown.
                //cl.quotas.a.setParams(Quota.PARAMS_A_CROWNED);
                this.crown = {
                    participantId: cl.participantId,
                    userId: cl.user._id,
                    time: Date.now(),
                    startPos: {
                        x: 50,
                        y: 50
                    },
                    endPos: {
                        x: this.getCrownX(),
                        y: this.getCrownY()
                    }
                }
                this.crowndropped = false;
            } else {
                //cl.quotas.a.setParams(Quota.PARAMS_A_NORMAL);
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
            }], cl, false)
            cl.sendArray([{
                m: "c",
                c: this.chatmsgs.slice(-1 * 32)
            }])
            this.updateCh(cl);
        } else {
            cl.user.id = otheruser.participantId;
            cl.participantId = otheruser.participantId;
            cl.quotas = otheruser.quotas;
            this.connections.push(cl);
            cl.sendArray([{
                m: "c",
                c: this.chatmsgs.slice(-1 * 32)
            }])
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
            }], p, false);
            if (this.crown)
                if (this.crown.userId == p.user._id && !this.crowndropped) {
                    this.chown();
                }
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
        this.server.updateRoom(this.fetchData());
    }
    updateParticipant(pid, options) {
        let p = null;
        Array.from(this.ppl).map(rpg => {
            if(e[1].user._id == pid) p = e[1];
        });
        if (p == null) return;
        options.name ? p.user.name = options.name : {};
        options._id ? p.user._id = options._id : {};
        options.color ? p.user.color = options.color : {};
        this.connections.filter((ofo) => ofo.participantId == p.participantId).forEach((usr) => {
            options.name ? usr.user.name = options.name : {};
            options._id ? usr.user._id = options._id : {};
            options.color ? usr.user.color = options.color : {};
        })
        this.sendArray([{
            color: p.user.color,
            id: p.participantId,
            m: "p",
            name: p.user.name,
            x: p.x || 200,
            y: p.y || 100,
            _id: p.user._id
        }])
    }
    destroy() { //destroy room
        this._id;
        console.log(`Deleted room ${this._id}`);
        this.settings = {};
        this.ppl;
        this.connnections;
        this.chatmsgs;
        this.server.rooms.delete(this._id);
    }
    sendArray(arr, not, onlythisparticipant) {
        this.connections.forEach((usr) => {
            if (!not || (usr.participantId != not.participantId && !onlythisparticipant) || (usr.connectionid != not.connectionid && onlythisparticipant)) {
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
            if (usr.connectionid == cl.connectionid) {
                data.p = cl.participantId;
            } else {
                delete data.p;
            }
        } else {
            delete data.p;
        }
        if (data.ch.crown == null) {
            delete data.ch.crown;
        } else {

        }
        return data;
    }
    verifyColor(strColor) {
        var test2 = /^#[0-9A-F]{6}$/i.test(strColor);
        if (test2 == true) {
            return strColor;
        } else {
            return false;
        }
    }
    isLobby(_id) {
        if (_id.startsWith("lobby")) {
            let lobbynum = _id.split("lobby")[1];
            if (_id == "lobby") {
                return true;
            }
            if (!(parseInt(lobbynum).toString() == lobbynum)) return false;
            for (let i in lobbynum) {
                if (parseInt(lobbynum[i]) >= 0) {
                    if (parseInt(i) + 1 == lobbynum.length) return true;

                } else {
                    return false;
                }
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
    chown(id) {
        let prsn = this.ppl.get(id);
        if (prsn) {
            this.crown = {
                participantId: prsn.participantId,
                userId: prsn.user._id,
                time: Date.now(),
                startPos: {
                    x: 50,
                    y: 50
                },
                endPos: {
                    x: this.getCrownX(),
                    y: this.getCrownY()
                },
            }
            this.crowndropped = false;
        } else {
            this.crown = {
                userId: this.crown.userId,
                time: Date.now(),
                startPos: {
                    x: 50,
                    y: 50
                },
                endPos: {
                    x: this.getCrownX(),
                    y: this.getCrownY()
                }
            }
            this.crowndropped = true;
        }
        this.updateCh();
    }
    setCords(p, x, y) {
        if (p.participantId && this.ppl.get(p.participantId)) {
            x ? this.ppl.get(p.participantId).x = x : {};
            y ? this.ppl.get(p.participantId).y = y : {};
            this.sendArray([{
                m: "m",
                id: p.participantId,
                x: this.ppl.get(p.participantId).x,
                y: this.ppl.get(p.participantId).y
            }], p, false);
        }
    }
    chat(p, msg) {
        if (msg.message.length > 512) return;
        let filter = ["AMIGHTYWIND"];
        let regexp = new RegExp("\\b(" + filter.join("|") + ")\\b", "i");
        if (regexp.test(msg.message)) return;
        let prsn = this.ppl.get(p.participantId);
        if (prsn) {
            let message = {};
            message.m = "a";
            message.a = msg.message;
            message.p = {
                color: p.user.color,
                id: p.participantId,
                name: p.user.name,
                _id: p.user._id
            };
            message.t = Date.now();
            this.sendArray([message]);
            this.chatmsgs.push(message);
        }
    }
    playNote(cl, note) {
        this.sendArray([{
            m: "n",
            n: note.n,
            p: cl.participantId,
            t: note.t
        }], cl, true);
    }
    kickban(_id, ms) {
        ms = parseInt(ms);
        if (ms >= (1000 * 60 * 60 - 500)) return;
        if (ms < 0) return;
        ms = Math.round(ms / 1000) * 1000;
        let user = this.connections.find((usr) => usr.user._id == _id);
        if (!user) return;
        let asd = true;
        let tonc = true;
        let pthatbanned = this.ppl.get(this.crown.participantId);
        this.connections.filter((usr) => usr.participantId == user.participantId).forEach((u) => {
            user.bantime = Math.floor(Math.floor(ms / 1000) / 60);
            user.bannedtime = Date.now();
            user.msbanned = ms;
            this.bans.set(user.user._id, user);
            if (this.crown && (this.crown.userId)) {
                u.setChannel("test/awkward", {});
                if (asd)
                    this.Notification(user.user._id,
                        "Notice",
                        `Banned from \"${this._id}\" for ${Math.floor(Math.floor(ms / 1000) / 60)} minutes.`,
                        "",
                        7000,
                        "#room",
                        "short"
                    )
                if (asd)
                    this.Notification("room",
                        "Notice",
                        `${pthatbanned.user.name} banned ${user.user.name} from the channel for ${Math.floor(Math.floor(ms / 1000) / 60)} minutes.`,
                        "",
                        7000,
                        "#room",
                        "short"
                    )
                if (this.crown && (this.crown.userId == _id) && tonc) {
                    this.Notification("room",
                        "Certificate of Award",
                        `Let it be known that ${user.user.name} kickbanned him/her self.`,
                        "",
                        7000,
                        "#room"
                    );
                    tonc = false;
                }

            }

        })
    }
    Notification(who, title, text, html, duration, target, klass, id) {
        let obj = {
            m: "notification",
            title: title,
            text: text,
            html: html,
            target: target,
            duration: duration,
            class: klass,
            id: id
        };
        if (!id) delete obj.id;
        if (!title) delete obj.title;
        if (!text) delete obj.text;
        if (!html) delete obj.html;
        if (!target) delete obj.target;
        if (!duration) delete obj.duration;
        if (!klass) delete obj.class;
        switch (who) {
            case "all": {
                for (let con of Array.from(this.server.connections.values())) {
                    con.sendArray([obj]);
                }
                break;
            }
            case "room": {
                for (let con of this.connections) {
                    con.sendArray([obj]);
                }
                break;
            }
            default: {
                Array.from(this.server.connections.values()).filter((usr) => usr.user._id == who).forEach((p) => {
                    p.sendArray([obj]);
                });
            }
        }
    }
    bindEventListeners() {
        this.on("bye", participant => {
            this.remove(participant);
        })

        this.on("m", (participant, x, y) => {
            this.setCords(participant, x, y);
        })

        this.on("a", (participant, msg) => {
            this.chat(participant, msg);
        })
    }
    verifySet(_id,msg){
        if(!isObj(msg.set)) msg.set = {visible:true,color:this.server.defaultRoomColor,chat:true,crownsolo:false};
        if(isBool(msg.set.lobby)){
            if(!this.isLobby(_id)) delete msg.set.lobby; // keep it nice and clean
        }else{
            if(this.isLobby(_id)) msg.set = {visible:true,color:this.server.defaultLobbyColor,color2:this.server.defaultLobbyColor2,chat:true,crownsolo:false,lobby:true};
        }
        if(!isBool(msg.set.visible)){
            if(msg.set.visible == undefined) msg.set.visible = (!isObj(this.settings) ? true : this.settings.visible);
            else msg.set.visible = true;
        };
        if(!isBool(msg.set.chat)){
            if(msg.set.chat == undefined) msg.set.chat = (!isObj(this.settings) ? true : this.settings.chat);
            else msg.set.chat = true;
        };
        if(!isBool(msg.set.crownsolo)){
            if(msg.set.crownsolo == undefined) msg.set.crownsolo = (!isObj(this.settings) ? false : this.settings.crownsolo);
            else msg.set.crownsolo = false;
        };
        if(!isString(msg.set.color) || !/^#[0-9a-f]{6}$/i.test(msg.set.color)) msg.set.color = (!isObj(this.settings) ? this.server.defaultRoomColor : this.settings.color);
        if(isString(msg.set.color2)){
            if(!/^#[0-9a-f]{6}$/i.test(msg.set.color2)){
                if(this.settings){
                    if(this.settings.color2) msg.set.color2 = this.settings.color2;
                    else delete msg.set.color2; // keep it nice and clean
                }
            }
        };
        return msg.set;
    }

}
module.exports = Room;
