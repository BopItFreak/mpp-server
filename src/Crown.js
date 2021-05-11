module.exports = class Crown {
    constructor (id, _id) {
        this.participantId = id;
        this.userId = _id;
        this.time = Date.now();
        this.startPos = {
            x: 50,
            y: 50
        }
        this.endPos = {
            x: Crown.generateRandomPos(),
            y: Crown.generateRandomPos()
        }
    }

    static generateRandomPos() {
        return Math.floor(Math.random() * 10000) / 100;
    }
}
