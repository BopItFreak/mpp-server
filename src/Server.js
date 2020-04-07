const Client = require("./Client.js");
const banned = require('../banned.json');

class Server extends EventEmitter {
    constructor(config) {
        super();
        EventEmitter.call(this);
        this.wss = new WebSocket.Server({
            port: config.port,
            backlog: 100,
            verifyClient: (info) => {
                if (banned.includes((info.req.connection.remoteAddress).replace("::ffff:", ""))) return false;
                return true;
            }
        });
        this.connectionid = 0;
        this.connections = new Map();
        this.roomlisteners = new Map();
        this.rooms = new Map();
        this.wss.on('connection', (ws, req) => {
            this.connections.set(++this.connectionid, new Client(ws, req, this));
        });
        this.legit_m = [
            "a",
            "bye",
            "hi",
            "ch",
            "+ls",
            "-ls",
            "m",
            "n",
            "devices",
            "t",
            "chset",
            "userset",
            "chown",
            "kickban",
          
            "admin message",
            "admin_color",
            "admin_noteColor",
            "admin_chset",
            "admin_chown",
            "admin_kickban",
            "admin_notification"
        ];
        this.welcome_motd = config.motd || "You agree to read this message.";   
        this._id_Private_Key = config._id_PrivateKey || "boppity";
        this.defaultUsername = config.defaultUsername || "Anonymous";
        this.defaultRoomColor = config.defaultRoomColor || "#3b5054";
        this.defaultLobbyColor = config.defaultLobbyColor || "#19b4b9";
        this.defaultLobbyColor2 = config.defaultLobbyColor2 || "#801014";
        this.adminpass = config.adminpass || "Bop It";
    };
    updateRoom(data) {
        if (!data.ch.settings.visible) return;
        for (let cl of Array.from(this.roomlisteners.values())) {
            cl.sendArray([{
                "m": "ls",
                "c": false,
                "u": [data.ch]
            }])
        }
    }
}

module.exports = Server;