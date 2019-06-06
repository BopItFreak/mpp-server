const ColorEncoder = require("./ColorEncoder.js");
class User {
    constructor(cl) {
        this.cl = cl;
        this.userdb;
        this.server = this.cl.server;
        this.default_db = {}
    }
    async getUserData() {
        if (!this.userdb) {
            this.setUpDb();
        }
        let _id = createKeccakHash('keccak256').update((this.cl.server._id_Private_Key + this.cl.ip)).digest('hex').substr(0, 24);
        if (!this.userdb.get(_id)) {
            this.userdb.set(_id, {
                "color": `#${ColorEncoder.intToRGB(ColorEncoder.hashCode(_id)).toLowerCase()}`,
                "name": this.server.defaultUsername,
                "_id": _id,
                "ip": this.cl.ip
            });
            this.updatedb();
        }
        let user = this.userdb.get(_id);
        return {
            "color": user.color,
            "name": user.name,
            "_id": user._id,
        }
    }
    updatedb() {
        fs.writeFileSync('src/db/users.json', JSON.stringify(this.strMapToObj(this.userdb), null, 2), (err) => {
            if (err) {
                throw err;
            }
        });
    }
    strMapToObj(strMap) {
        let obj = Object.create(null);
        for (let [k, v] of strMap) {
            obj[k] = v;
        }
        return obj;
    }
    setUpDb() {
        let files = fs.readdirSync("src/db/");
        if (!files.includes("users.json")) {
            fs.writeFileSync('src/db/users.json', JSON.stringify(this.default_db, null, 2), (err) => {
                if (err) {
                    throw err;
                }
            });
            this.userdb = new Map(Object.entries(require("./db/users.json")));
        } else {
            this.userdb = new Map(Object.entries(require("./db/users.json")));
        }
    }
}
module.exports = User;