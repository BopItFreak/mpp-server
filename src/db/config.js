module.exports = Object.seal({
    "port": "3000",
    "motd": "You agree to read this message.",
    "_id_PrivateKey": "boppity",
    "defaultUsername": "Anonymous",
    "defaultRoomColor": "#3b5054",
    "defaultLobbyColor": "#19b4b9",
    "defaultLobbyColor2": "#801014",
    "adminpass": "adminpass",
    "quotas":{
        "chat":{
            "amount": 4,
            "time": 4000
        },
        "name":{
            "amount": 30,
            "time": 30 * 60000
        },
        "room":{
            "time": 500
        },
        "cursor":{
            "time": 16
        },
        "kickban":{
            "amount": 2,
            "time": 1000
        },
        "crowned_chat":{
            "amount": 10,
            "time": 4000
        }
    }
})
