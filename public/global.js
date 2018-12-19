
var Global = {
    io : { },
    userSockets : {},
    storeUserSocket: function(id,socket) {
        this.userSockets[id] = socket;
    },

    getUserSocket: function(id){
        return this.userSockets[id];
    }
};

module.exports = Global;