const quotas = require('../Quotas');
const User = require("./User.js");
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
        if (!cl.quotas.room.attempt()) return;
        if (!msg.hasOwnProperty("set") || !msg.set) msg.set = {};
        if (msg.hasOwnProperty("_id") && typeof msg._id == "string") {
            if (msg._id.length > 512) return;
            cl.setChannel(msg._id, msg.set);
            if (cl.channel.isLobby(cl.channel._id)) {
                cl.sendArray([{m: 'nq', allowance: quotas.note.lobby.allowance, max: quotas.note.lobby.max, maxHistLen: quotas.note.lobby.maxHistLen}])
            } else {
                if (!(cl.user._id == cl.channel.crown.userId)) {
                    cl.sendArray([{m: 'nq', allowance: quotas.note.normal.allowance, max: quotas.note.normal.max, maxHistLen: quotas.note.normal.maxHistLen}])
                } else {
                    cl.sendArray([{m: 'nq', allowance: quotas.note.insane.allowance, max: quotas.note.insane.max, maxHistLen: quotas.note.insane.maxHistLen}])
                }
            }
        }
    })
    cl.on("m", msg => {
        if (!cl.quotas.cursor.attempt()) return;
        if (!(cl.channel && cl.participantId)) return;
        if (!msg.hasOwnProperty("x")) msg.x = null;
        if (!msg.hasOwnProperty("y")) msg.y = null;
        if (parseInt(msg.x) == NaN) msg.x = null;
        if (parseInt(msg.y) == NaN) msg.y = null;
        cl.channel.emit("m", cl, msg.x, msg.y)

    })
    cl.on("chown", msg => {
        if (!cl.quotas.chown.attempt()) return;
        if (!(cl.channel && cl.participantId)) return;
        //console.log((Date.now() - cl.channel.crown.time))
        //console.log(!(cl.channel.crown.userId != cl.user._id), !((Date.now() - cl.channel.crown.time) > 15000));
        if (!(cl.channel.crown.userId == cl.user._id) && !((Date.now() - cl.channel.crown.time) > 15000)) return;
        if (msg.hasOwnProperty("id")) {
            // console.log(cl.channel.crown)
            if (cl.user._id == cl.channel.crown.userId || cl.channel.crowndropped)
                cl.channel.chown(msg.id);
        } else {
            if (cl.user._id == cl.channel.crown.userId || cl.channel.crowndropped)
                cl.channel.chown();
        }
    })
    cl.on("chset", msg => {
        if (!(cl.channel && cl.participantId)) return;
        if (!(cl.user._id == cl.channel.crown.userId)) return;
        if (!msg.hasOwnProperty("set") || !msg.set) msg.set = cl.channel.verifySet(cl.channel._id,{});
        cl.channel.settings = msg.set;
        cl.channel.updateCh();
    })
    cl.on("a", msg => {
        if (cl.channel.isLobby(cl.channel._id)) {
            if (!cl.quotas.chat.lobby.attempt()) return;
        } else {
            if (!(cl.user._id == cl.channel.crown.userId)) {
                if (!cl.quotas.chat.normal.attempt()) return;
            } else {
                if (!cl.quotas.chat.insane.attempt()) return;
            }
        }
        if (!(cl.channel && cl.participantId)) return;
        if (!msg.hasOwnProperty('message')) return;
        if (cl.channel.settings.chat) {
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
        if (!cl.quotas.name.attempt()) return;
        if (!(cl.channel && cl.participantId)) return;
        if (!msg.hasOwnProperty("set") || !msg.set) msg.set = {};
        if (msg.set.hasOwnProperty('name') && typeof msg.set.name == "string") {
            if (msg.set.name.length > 40) return;
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
        if (!cl.quotas.kickban.attempt()) return;
        if (!(cl.channel && cl.participantId)) return;
        if (!(cl.user._id == cl.channel.crown.userId)) return;
        if (msg.hasOwnProperty('_id') && typeof msg._id == "string") {
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
    /* 
    
    List of admin only stuff
    1. admin_color
    2. admin_noteColor
    3. admin_chown
    4. admin_kickban
    5. admin_chset
    
    */
    cl.on('admin_color', (msg, admin) => {
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
                    dbentry.noteColor = msg.color;
                    //user.updatedb();
                    cl.server.rooms.forEach((room) => {
                        room.updateParticipant(usr.participantId, {
                            color: msg.color,
                            noteColor: msg.color
                        });
                    })
                })
            }
        })

    })
    cl.on('admin_noteColor', (msg, admin) => {
        if (!admin) return;
        if (typeof cl.channel.verifyColor(msg.color) != 'string') return;
        if (!msg.hasOwnProperty('id') && !msg.hasOwnProperty('_id')) return;
        cl.server.connections.forEach((usr) => {
            if ((usr.channel && usr.participantId && usr.user) && (usr.user._id == msg._id || (usr.participantId == msg.id))) {
                let user = new User(usr);
                //user.getUserData().then((uSr) => {
                    //if (!uSr._id) return;
                    //let dbentry = user.userdb.get(uSr._id);
                    //if (!dbentry) return;
                    //dbentry.color = msg.color;
                    //user.updatedb();
                    cl.server.rooms.forEach((room) => {
                        room.updateParticipant(usr.participantId, {
                            noteColor: msg.color
                        });
                    })
                //})
            }
        })

    })
    cl.on("admin_chown", (msg, admin) => {
        if (!admin) return;
        if (msg.hasOwnProperty("id")) {
                cl.channel.chown(msg.id);
                console.log(msg.id);
        } else {
                cl.channel.chown();
        }
    })
    cl.on('admin_kickban', (msg, admin) => {
        if (!admin) return;
        if (msg.hasOwnProperty('_id') && typeof msg._id == "string") {
            let _id = msg._id;
            let ms = msg.ms || 0;
            cl.channel.kickban(_id, ms);
        }
    })
    cl.on("admin_chset", (msg, admin) => {
        if (!admin) return;
        if (!msg.hasOwnProperty("set") || !msg.set) msg.set = cl.channel.verifySet(cl.channel._id,{});
        cl.channel.settings = msg.set;
        cl.channel.updateCh();
    })
    cl.on("admin_notification", (msg, admin) => {
        if (!admin) return;
        cl.channel.Notification(msg.content);
        console.log(msg.content);
    })
}
