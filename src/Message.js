const User = require("./User.js");
const Room = require("./Room.js");
module.exports = (cl)  => {
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
    if (!msg.hasOwnProperty("set")) msg.set = {};
    if (msg.hasOwnProperty("_id") && typeof msg._id == "string") {
        if (msg._id.length > 512) return;
            cl.setChannel(msg._id, msg.set);    
    }
})
}