'use strict'
module.exports = (agent) => {
  // Define a device schema
  const ServiceSchema = new agent.mongoose.Schema({
    name: String
    , key: String
    , active: Boolean
  })

  // methods ======================
  ServiceSchema.methods.generateToken = function (cb) {
    var token = agent.jwt.sign({
      id: this._id
    }, agent.config.device);
    this.token = token
    if (cb) return cb(null, token);
    return token;
  }
  ServiceSchema.methods.activate = function () {
    return Promise.resolve(() => {
      this.active = true
    })
  }
  ServiceSchema.methods.deactivate = function () {
    return Promise.resolve(() => {
      this.active = false
    })
  }
  // methods ======================
  // ALL METHODS MUST BE A FUNCTION IN THE FORMAT "function(){}" AND NOT "()=>{}"

  return agent.database.db.model("Service", ServiceSchema)
}