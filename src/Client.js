const Room = require("./Room.js");
require('node-json-color-stringify');
class Client extends EventEmitter {
    constructor(ws, req, server) {
        super();
        EventEmitter.call(this);
        this.user;
        this.connectionid = server.connectionid;
        this.server = server;
        this.participantId;
        this.channel;
        this.ws = ws;
        this.req = req;
        this.ip = (req.connection.remoteAddress).replace("::ffff:", "");
        this.destroied = false;
        this.bindEventListeners();
        require('./Message.js')(this);
    }
    isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }
    isConnecting() {
        return this.ws && this.ws.readyState === WebSocket.CONNECTING;
    }
    setChannel(_id, settings) {
        if (this.channel && this.channel._id == _id) return;
        if (this.server.rooms.get(_id)) {
            let channel = this.channel;
            if (channel) this.channel.emit("bye", this);
            if (channel) this.channel.updateCh();
            this.channel = this.server.rooms.get(_id);
            this.channel.join(this);
        } else {
            let room = new Room(this.server, _id, settings);
            this.server.rooms.set(_id, room);
            if (this.channel) this.channel.emit("bye", this);
            this.channel = this.server.rooms.get(_id);
            this.channel.join(this);
        }
    }
    sendArray(arr) {
        if (this.isConnected()) {
            console.log(`SEND: `, JSON.colorStringify(arr));
            this.ws.send(JSON.stringify(arr));
        }
    }
    destroy() {
        this.ws.close();
        if (this.channel) {
            this.channel.emit("bye", this)
        }
        this.user;
        this.participantId;
        this.channel;
        this.connectionid;
        this.server.connections.delete(this.connectionid);
        this.destroied = true;
        console.log(`Removed Connection ${this.connectionid}.`);
    }
    bindEventListeners() {
        this.ws.on("message", (evt) => {
            try {
                let transmission = JSON.parse(evt);
                for (let msg of transmission) {
                    if (!msg.hasOwnProperty("m")) return;
                    if (!this.server.legit_m.includes(msg.m)) return;
                    this.emit(msg.m, msg);
                    console.log(`RECIEVE: `, JSON.colorStringify(msg));
                }
            } catch (e) {
                console.log(e)
                this.destroy();
            }
        });
        this.ws.on("close", () => {
            if (!this.destroied)
            this.destroy();
        });
        this.ws.addEventListener("error", (err) => {
            console.error(err);
            if (!this.destroied)
            this.destroy();
        });
    }
}
module.exports = Client;