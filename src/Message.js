const Quota = require('./Quota');
const User = require("./User.js");
const Room = require("./Room.js");
module.exports = (cl) => {
    cl.once("hi", () => {
        let user = new User(cl);
        user.getUserData().then((data) => {
            let msg = {};
            msg.m = "hi";
            msg.motd = cl.server.welcome_motd;
            msg.t = Date.now();
            msg.u = data;
            msg.v = "Beta";
            cl.sendArray([msg])
            cl.user = data;
        })
    })
    cl.on("t", msg => {
        if (msg.hasOwnProperty("e") && !isNaN(msg.e))
            cl.sendArray([{
                m: "t",
                t: Date.now(),
                e: msg.e
            }])
    })
    cl.on("ch", msg => {
        if (!msg.hasOwnProperty("set") || !msg.set) msg.set = {};
        if (msg.hasOwnProperty("_id") && typeof msg._id == "string") {
            if (msg._id.length > 512) return;
            if (!cl.staticQuotas.room.attempt()) return;
            cl.setChannel(msg._id, msg.set);
            let param;
            if (cl.channel.isLobby(cl.channel._id)) {
                param =  Quota.N_PARAMS_LOBBY;
                param.m = "nq";
                cl.sendArray([param])
            } else {
                if (!(cl.user._id == cl.channel.crown.userId)) {
                    param =  Quota.N_PARAMS_NORMAL;
                    param.m = "nq";
                    cl.sendArray([param])
                } else {
                    param =  Quota.N_PARAMS_RIDICULOUS;
                    param.m = "nq";
                    cl.sendArray([param])
                }
            }
        }
    })
    cl.on("m", (msg, admin) => {
        if (!cl.quotas.cursor.attempt() && !admin) return;
        if (!(cl.channel && cl.participantId)) return;
        if (!msg.hasOwnProperty("x")) msg.x = null;
        if (!msg.hasOwnProperty("y")) msg.y = null;
        if (parseInt(msg.x) == NaN) msg.x = null;
        if (parseInt(msg.y) == NaN) msg.y = null;
        cl.channel.emit("m", cl, msg.x, msg.y)

    })
    cl.on("chown", (msg, admin) => {
        if (!cl.quotas.chown.attempt() && !admin) return;
        if (!(cl.channel && cl.participantId)) return;
        //console.log((Date.now() - cl.channel.crown.time))
        //console.log(!(cl.channel.crown.userId != cl.user._id), !((Date.now() - cl.channel.crown.time) > 15000));
        if (!(cl.channel.crown.userId == cl.user._id) && !((Date.now() - cl.channel.crown.time) > 15000)) return;
        if (msg.hasOwnProperty("id")) {
            // console.log(cl.channel.crown)
            if (cl.user._id == cl.channel.crown.userId || cl.channel.crowndropped)
                cl.channel.chown(msg.id);
                if (msg.id == cl.user.id) {
                    param =  Quota.N_PARAMS_RIDICULOUS;
                    param.m = "nq";
                    cl.sendArray([param])
                }
        } else {
            if (cl.user._id == cl.channel.crown.userId || cl.channel.crowndropped)
                cl.channel.chown();
                param =  Quota.N_PARAMS_NORMAL;
                param.m = "nq";
                cl.sendArray([param])
        }
    })
    cl.on("chset", msg => {
        if (!(cl.channel && cl.participantId)) return;
        if (!(cl.user._id == cl.channel.crown.userId)) return;
        if (!msg.hasOwnProperty("set") || !msg.set) msg.set = cl.channel.verifySet(cl.channel._id,{});
        cl.channel.settings = msg.set;
        cl.channel.updateCh();
    })
    cl.on("a", (msg, admin) => {
        if (!(cl.channel && cl.participantId)) return;
        if (!msg.hasOwnProperty('message')) return;
        if (cl.channel.settings.chat) {
            if (cl.channel.isLobby(cl.channel._id)) {
                if (!cl.quotas.chat.lobby.attempt() && !admin) return;
            } else {
                if (!(cl.user._id == cl.channel.crown.userId)) {
                    if (!cl.quotas.chat.normal.attempt() && !admin) return;
                } else {
                    if (!cl.quotas.chat.insane.attempt() && !admin) return;
                }
            }
            cl.channel.emit('a', cl, msg);
        }
    })
    cl.on('n', msg => {
        if (!(cl.channel && cl.participantId)) return;
        if (!msg.hasOwnProperty('t') || !msg.hasOwnProperty('n')) return;
        if (typeof msg.t != 'number' || typeof msg.n != 'object') return;
        if (cl.channel.settings.crownsolo) {
            if ((cl.channel.crown.userId == cl.user._id) && !cl.channel.crowndropped) {
                cl.channel.playNote(cl, msg);
            }
        } else {
            cl.channel.playNote(cl, msg);
        }
    })
    cl.on('+ls', msg => {
        if (!(cl.channel && cl.participantId)) return;
        cl.server.roomlisteners.set(cl.connectionid, cl);
        let rooms = [];
        for (let room of Array.from(cl.server.rooms.values())) {
            let data = room.fetchData().ch;
            if (room.bans.get(cl.user._id)) {
                data.banned = true;
            }
            if (room.settings.visible) rooms.push(data);
        }
        cl.sendArray([{
            "m": "ls",
            "c": true,
            "u": rooms
        }])
    })
    cl.on('-ls', msg => {
        if (!(cl.channel && cl.participantId)) return;
        cl.server.roomlisteners.delete(cl.connectionid);
    })
    cl.on("userset", msg => {
        if (!(cl.channel && cl.participantId)) return;
        if (!msg.hasOwnProperty("set") || !msg.set) msg.set = {};
        if (msg.set.hasOwnProperty('name') && typeof msg.set.name == "string") {
            if (msg.set.name.length > 40) return;
            if (!cl.quotas.name.attempt()) return;
            cl.user.name = msg.set.name;
            let user = new User(cl);
            user.getUserData().then((usr) => {
                let dbentry = user.userdb.get(cl.user._id);
                if (!dbentry) return;
                dbentry.name = msg.set.name;
                user.updatedb();
                cl.server.rooms.forEach((room) => {
                    room.updateParticipant(cl.participantId, {
                        name: msg.set.name
                    });
                })
            })

        }
    })
    cl.on('kickban', msg => {
        if (!(cl.channel && cl.participantId)) return;
        if (!(cl.user._id == cl.channel.crown.userId)) return;
        if (msg.hasOwnProperty('_id') && typeof msg._id == "string") {
            if (!cl.quotas.kickban.attempt() && !admin) return;
            let _id = msg._id;
            let ms = msg.ms || 0;
            cl.channel.kickban(_id, ms);
        }
    })
    cl.on("bye", msg => {
        cl.destroy();
    })
    cl.on("admin message", msg => {
        if (!(cl.channel && cl.participantId)) return;
        if (!msg.hasOwnProperty('password') || !msg.hasOwnProperty('msg')) return;
        if (typeof msg.msg != 'object') return;
        if (msg.password !== cl.server.adminpass) return;
        cl.ws.emit("message", JSON.stringify([msg.msg]), true);
    })
    //admin only stuff
    cl.on('color', (msg, admin) => {
        if (!admin) return;
        if (typeof cl.channel.verifyColor(msg.color) != 'string') return;
        if (!msg.hasOwnProperty('id') && !msg.hasOwnProperty('_id')) return;
        cl.server.connections.forEach((usr) => {
            if ((usr.channel && usr.participantId && usr.user) && (usr.user._id == msg._id || (usr.participantId == msg.id))) {
                let user = new User(usr);
                user.cl.user.color = msg.color;
                user.getUserData().then((uSr) => {
                    if (!uSr._id) return;
                    let dbentry = user.userdb.get(uSr._id);
                    if (!dbentry) return;
                    dbentry.color = msg.color;
                    user.updatedb();
                    cl.server.rooms.forEach((room) => {
                        room.updateParticipant(usr.participantId, {
                            color: msg.color
                        });
                    })
                })
            }
        })

    })

}
