//call new Server
global.WebSocket = require('ws');
global.EventEmitter = require('events').EventEmitter;
global.fs = require('fs');
global.createKeccakHash = require('keccak');
const AsyncConsole = require('asyncconsole')

let Server = require("./src/Server.js");
global.SERVER = new Server({
    port: 8080
});
let console = new AsyncConsole("", input => {
    try {
        console.log(JSON.stringify(eval(input)));
    } catch(e) {
        console.log(e.toString());
    }
})
