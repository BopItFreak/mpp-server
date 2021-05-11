const config = require ('../config');

class RoomSettings {
    static allowedProperties = {
        color: {
            type: 'color',
            default: config.defaultRoomSettings.color,
            allowedChange: true,
            required: true
        },
        color2: {
            type: 'color2',
            default: config.defaultRoomSettings.color2,
            allowedChange: true,
            required: false
        },
        lobby: {
            type: 'boolean',
            allowedChange: false,
            required: false
        },
        visible: {
            type: 'boolean',
            default: true,
            allowedChange: true,
            required: true
        },
        chat: {
            type: 'boolean',
            default: true,
            allowedChange: true,
            required: true
        },
        owner_id: {
            type: 'string',
            allowedChange: false,
            required: false
        },
        crownsolo: {
            type: 'boolean',
            default: false,
            allowedChange: true,
            required: true
        },
        "no cussing": {
            type: 'boolean',
            allowedChange: true,
            required: false
        }
    }

    constructor (set, context) {
        Object.keys(RoomSettings.allowedProperties).forEach(key => {
            if (typeof(RoomSettings.allowedProperties[key].default) !== 'undefined') {
                if (this[key] !== RoomSettings.allowedProperties[key].default) {
                    this[key] = RoomSettings.allowedProperties[key].default;
                }
            }
        });

        Object.keys(RoomSettings.allowedProperties).forEach(key => {
            if (RoomSettings.allowedProperties[key].required == true) {
                if (typeof(this[key]) == 'undefined') {
                    this[key] = RoomSettings.allowedProperties[key].default;
                }
            }
        });

        if (typeof(set) !== 'undefined') {
            Object.keys(set).forEach(key => {
                if (typeof(set[key]) == 'undefined') return;
                if (Object.keys(RoomSettings.allowedProperties).indexOf(key) !== -1) {
                    if (typeof(context) == 'undefined') {
                        this[key] = this.verifyPropertyType(key, set[key], RoomSettings.allowedProperties[key].type);
                    } else {
                        if (context == 'user') {
                            if (RoomSettings.allowedProperties[key].allowedChange) {
                                this[key] = this.verifyPropertyType(key, set[key], RoomSettings.allowedProperties[key].type);
                            }
                        }
                    }
                }
            });
        }
    }

    verifyPropertyType(key, pr, type) {
        let ret;

        if (typeof(RoomSettings.allowedProperties[key]) !== 'object') return;

        switch (type) {
            case 'color':
                if (/^#[0-9a-f]{6}$/i.test(pr)) {
                    ret = pr;
                } else {
                    ret = RoomSettings.allowedProperties[key].default;
                }
                break;
            case 'color2': 
                if (/^#[0-9a-f]{6}$/i.test(pr)) {
                    ret = pr;
                } else {
                    ret = RoomSettings.allowedProperties[key].default;
                }
                break;
            default:
                if (typeof(pr) == type) {
                    ret = pr;
                } else if (typeof(RoomSettings.allowedProperties[key].default) !== 'undefined') {
                    ret = RoomSettings.allowedProperties[key].default;
                } else {
                    ret = undefined;
                }
                break;
        }

        return ret;
    }

    changeSettings(set) {
        Object.keys(set).forEach(key => {
            if (RoomSettings.allowedProperties[key].allowedChange) {
                this[key] = this.verifyPropertyType(key, set[key], RoomSettings.allowedProperties[key].type);
            }
        });
    }

    static changeSettings(set) {
        Object.keys(set).forEach(key => {
            if (RoomSettings.allowedProperties[key].allowedChange) {
                set[key] = RoomSettings.verifyPropertyType(key, set[key], RoomSettings.allowedProperties[key].type);
            }
        });
        return set;
    }

    static verifyPropertyType(key, pr, type) {
        let ret;

        if (typeof(RoomSettings.allowedProperties[key]) !== 'object') return;

        switch (type) {
            case 'color':
                if (/^#[0-9a-f]{6}$/i.test(pr)) {
                    ret = pr;
                } else {
                    ret = RoomSettings.allowedProperties[key].default;
                }
                break;
            case 'color2': 
                if (/^#[0-9a-f]{6}$/i.test(pr)) {
                    ret = pr;
                } else {
                    ret = RoomSettings.allowedProperties[key].default;
                }
                break;
            default:
                if (typeof(pr) == type) {
                    ret = pr;
                } else if (typeof(RoomSettings.allowedProperties[key].default) !== 'undefined') {
                    ret = RoomSettings.allowedProperties[key].default;
                } else {
                    ret = undefined;
                }
                break;
        }

        return ret;
    }
}

module.exports = RoomSettings;
