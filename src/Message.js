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
            cl.setChannel(msg._id, msg.set);
        }
    })
    cl.on("m", msg => {
        if (!(cl.channel && cl.participantId)) return;
        if (!msg.hasOwnProperty("x")) msg.x = null;
        if (!msg.hasOwnProperty("y")) msg.y = null;
        if (parseInt(msg.x) == NaN) msg.x = null;
        if (parseInt(msg.y) == NaN) msg.y = null;
        cl.channel.emit("m", cl, msg.x, msg.y)

    })
    cl.on("chown", msg => {
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
        if (!msg.hasOwnProperty("set") || !msg.set) msg.set = {};
        let settings = {};
        settings.lobby = cl.channel.isLobby(cl.channel._id);
        settings.visible = !!msg.set.visible;
        settings.crownsolo = !!msg.set.crownsolo;
        settings.chat = !!msg.set.chat;
        settings.color = cl.channel.verifyColor(msg.set.color) || cl.channel.settings.color;
        settings.color2 = cl.channel.verifyColor(msg.set.color2) || cl.channel.settings.color2;
        cl.channel.settings = settings;
        cl.channel.updateCh();
    })
    cl.on("a", msg => {
        if (!(cl.channel && cl.participantId)) return;
        if (!msg.hasOwnProperty('message')) return;
        cl.channel.emit('a', cl, msg);
    })
    cl.on('n', msg => {
        if (!(cl.channel && cl.participantId)) return;
        if (!msg.hasOwnProperty('t') || !msg.hasOwnProperty('n')) return;
        if (typeof msg.t != 'number' || typeof msg.n != 'object') return;
        cl.channel.playNote(cl, msg);
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
            rooms.push(data);
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
            cl.user.name = msg.set.name;
            let user = new User(cl);
            user.getUserData().then((usr) => {
                let dbentry = user.userdb.get(cl.user._id);
                if (!dbentry) return;
                dbentry.name = msg.set.name;
                user.updatedb();
                console.log("Updateing user ", usr.name, msg.set.name);
                cl.server.rooms.forEach((room) => {
                    room.updateParticipant(cl.participantId, msg.set.name);
                })               
            })
            
        }
    })
    cl.on('kickban', msg => {
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

}