module.exports = Object.seal({
    "note": {
        "lobby": {
            "allowance": 200,
            "max": 600,
            "maxHistLen": 3
        },
        "normal": {
            "allowance": 400,
            "max": 1200,
            "maxHistLen": 3
        },
        "insane": {
            "allowance": 600,
            "max": 1800,
            "maxHistLen": 3
        }
    },
    "chat": {
        "lobby": {
            "amount": 4,
            "time": 4000
        },
        "normal": {
            "amount": 4,
            "time": 4000
        },
        "insane": {
            "amount": 10,
            "time": 4000
        }
    },
    "chown": {
        "amount": 10,
        "time": 5000
    },
    "name": {
        "amount": 30,
        "time": 30 * 60000
    },
    "room": {
        "time": 500
    },
    "cursor": {
        "time": 16
    },
    "kickban": {
        "amount": 2,
        "time": 1000
    }
})