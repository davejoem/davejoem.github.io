var _ = require("lodash")
function forbidConnections(nsp) {
  nsp.on('connect', function(socket) {
    if (!socket.auth) {
      socket.emit('notauthenticated')
      delete nsp.connected[socket.id]
    }
  });
}
function restoreConnection(nsp, socket) {
  if (_.findWhere(nsp.sockets, {
    id: socket.id
  })) {
    nsp.connected[socket.id] = socket
  }
}
module.exports = (agent,config)=>{
  var io = agent.io
  var _ = agent.lodash || _
  var config = config || {}
  var timeout = config.timeout || 10000
  var authenticate = config.authenticate || _.noop
  var postAuthenticate = config.postAuthenticate || _.noop
  _.each(io.nsps, forbidConnections)
  io.on('connection', function(socket) {
    socket.auth = false
    socket.on('authentication', (data, fn)=>{
      console.log('auth data',data)
      authenticate(socket, data, (err, success)=>{
        if (err)
          return fn(err)
        socket.auth = true
        _.each(io.nsps, (nsp)=>{
          restoreConnection(nsp, socket)
        });
        postAuthenticate(socket, data, (err, success)=>{
          if (err)
            return fn(err)
          fn(null,success,{message: {class: 'info', message: 'Authorized.'}})        
        });
      });
    })
    if (timeout !== 'none') {
      setTimeout(()=>{
        if (!socket.auth) {
          socket.disconnect()
        }
      }, timeout)
    }
  })
}
