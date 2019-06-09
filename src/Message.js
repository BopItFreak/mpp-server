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
            msg.v = "1.0 Alpha";
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
        console.log((Date.now() - cl.channel.crown.time))
        console.log(!(cl.channel.crown.userId != cl.user._id), !((Date.now() - cl.channel.crown.time) > 15000));
        if (!(cl.channel.crown.userId == cl.user._id) && !((Date.now() - cl.channel.crown.time) > 15000)) return;
        if (msg.hasOwnProperty("id")) {
            console.log(cl.channel.crown)
                if (cl.user._id == cl.channel.crown.userId || cl.channel.crown.dropped)
                cl.channel.chown(msg.id);   
        } else {
            if (cl.user._id == cl.channel.crown.userId || cl.channel.crown.dropped)
            cl.channel.chown();
        }
    })
}