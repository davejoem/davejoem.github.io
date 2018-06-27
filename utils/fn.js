module.exports = (agent) => {
  var Device = agent.models.Device;
  var Preference = agent.models.Preference;
  var State = agent.models.State;
  var User = agent.models.User;
  var auth = agent.auth
  var consts = agent.consts;
  var crypto = agent.crypto;
  var fs = agent.fs;
  var jwt = agent.jwt;
  var path = agent.path;
  var key = fs.readFileSync(path.resolve(__dirname, "../certs/key.pem"));
  var server = agent.server;
  var fn = {
    sock: (agent) => {
      auth(agent, {
        authenticate: (socket, data, callback) => {
          let err = function (message) {
            callback({
              message: {
                class: 'error',
                message: message
              }
            })
          }
          if (data) {
            if ('device' in data) {
              jwt.verify(data.device, agent.config.device, (error, payload) => {
                if (err) return err("Device verification error.")
                Device.findById(payload._id, (error, device) => {
                  if (err) return err("Device verification error.")
                  if (device) {
                    socket.device = device;
                    callback(null, true);
                  } else if (err) return err("Unrecognized device.")
                })
              })
            } else return err("Unrecognized device.")
          } else return err("Unidentified device.")
        }
        ,
        postAuthenticate: (socket, data, callback) => {
          let err = function (message) {
            callback({
              message: {
                class: 'error',
                message: message
              }
            })
          }
          if (data.user) {
            jwt.verify(data.user, agent.config.user, (error, usr) => {
              if (err) return err('User verification error.')
              User.findById(usr._id, (error, user) => {
                if (err) return err('User identification error.')
                if (user) {
                  socket.User = user;
                  agent.rquser(socket, (error, user) => {
                    if (err) return err('User sum error.')
                    if (user) {
                      callback(null, true)
                      socket.user = user
                      socket.join(user.accounts.local.username)
                      socket.to(user.accounts.local.username).emit('new device activated', {
                        socket: {
                          rooms: socket.rooms,
                          id: socket.id
                        },
                        device: socket.device
                      })
                      if (socket.User.devices.signedInOn.indexOf(socket.device._id) >= 0) {
                        socket.emit('user', agent.extend(true, user.toObject(), {
                          username: user.accounts.local.username,
                          email: user.accounts.local.email,
                          phone: user.details.phone
                        }));
                        if (socket.device.lock.locked) {
                          if (user._id == socket.device.lock.by) {
                            socket.emit('device locked')
                          }
                        }
                      } else {
                        socket.User.devices.signedOutOf.indexOf(socket.device._id) >= 0 ? socket.emit('user signed out') : socket.emit('device authenticated');
                      }
                    } else
                      callback(null, true);
                  })
                } else return err('User not found.')
              })
            })
          } else {
            callback(null, true)
            socket.emit('device:authenticated')
          }
        }
        ,
        timeout: 15000
      })
    },
    dev: (socket, next) => {
      var device_safe_events = ['register device', 'unlock device'];
      Device.findById(socket.device._id, (err, device) => {
        if (err)
          return socket.emit('error', {
            code: 500,
            message: err.message
          })
        socket.device = device;
        if (device.lock.locked) {
          if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, agent.config.user, (err, usr) => {
              if (err)
                return next(err);
              if (usr._id == device.lock.by) {
                return socket.emit('warning', {
                  code: 4011,
                  message: "This device is locked. Please unlock it first."
                })
              } else
                return next();
            }
            )
          } else
            return next();
        } else
          return next();
      }
      )
    }
    ,
    rquser: (socket, next) => {
      var Query = User.findById(socket.User._id);
      Query.exec((err, user) => {
        if (err)
          return next(err);
        if (user.devices.signedOutOf.indexOf(socket.device._id) != -1) {
          next(null, user);
          socket.emit('user:info', {
            message: {
              class: 'warning',
              message: "You were signed out of this device."
            }
          })
        } else {
          Query.populate({
            path: 'devices.signedInOn devices.signedOutOf',
            select: '-token -users -__v'
          }).populate({
            path: 'Collection.movies',
            select: '-__v',
            model: 'Movie'
          }).populate({
            path: 'Collection.shows',
            select: '-__v',
            model: 'Show'
          }).populate({
            path: 'Collection.seasons',
            select: '-__v',
            model: 'Season'
          }).populate({
            path: 'Collection.episodes',
            select: '-__v',
            model: 'Episode'
          }).populate({
            path: 'Collection.games',
            select: '-__v',
            model: 'Game'
          }).populate({
            path: 'interactions.calls',
            populate: {
              path: 'recipient participants',
              select: 'accounts.local.username',
              model: 'User'
            },
            model: 'Call'
          }).populate({
            path: 'interactions.chats',
            populate: {
              path: 'with',
              select: 'accounts.local.username',
              model: 'User'
            },
            model: 'Chat'
          }).populate({
            path: 'interactions.calls',
            model: 'Call'
          }).populate({
            path: 'notifications',
            model: 'Notification'
          }).populate({
            path: 'settings.apps',
            model: 'Preference'
          }).populate({
            path: 'social.friends social.followers social.following social.requests social.requested social.blocked social.blockers',
            select: 'accounts.local.username',
            model: 'User'
          }).populate({
            path: 'state',
            select: '',
            model: 'State'
          }).populate({
            path: 'finance.transactions',
            select: '-_id -__v',
            model: 'Transaction',
            populate: {
              path: 'by For',
              select: 'accounts.local.username',
              model: 'User'
            }
          }).exec((err, user) => {
            if (err) {
              return next(err);
            }
            // if there are any errors, return the error
            if (!user) {
              return next(new Error('Couldn\'t find user'));
            }
            // if no user is found, return the message
            socket.user = user;
            if (socket.device) {
              Preference.findOne({
                'device': socket.device._id,
                'user': user._id
              }, (err, preference) => {
                if (err)
                  return next(err);
                if (preference) {
                  socket.preference = preference;
                  fn.deleteObjectKey(preference.general.lockscreen, "pin", (lockscreen) => {
                    preference.general.lockscreen = lockscreen;
                    if (user.settings.general.settingsperdevice)
                      user.settings.apps = preference;
                  }
                  )
                }
                State.findOne({
                  'device': socket.device._id,
                  'user': user._id
                }, (err, state) => {
                  if (err)
                    return next(err);
                  if (state) {
                    socket.state = state;
                    if (user.settings.general.statesperdevice)
                      user.state = state;
                  }
                  return next(null, user);
                }
                )
              }
              )
            } else
              return next(null, user);
          }
            )
        }
      }
      )
    }
    ,
    admin: (socket) => {
      var query = User.findById(req.payload._id);
      query.exec((err, user) => {
        if (err)
          return res.json({
            message: {
              class: 'error',
              message: err.message
            }
          })
        // if there are any errors, return the error
        if (!user)
          return res.status(400).json({
            message: {
              class: 'error',
              message: 'Couldn\'t find user'
            }
          })
        // if no user is found, return the message
        if (user.details.accounttype !== "admin") {
          return res.status(403).json({
            message: {
              class: 'error',
              message: 'You are not an admin.'
            }
          })
          // if user is found but isn't an admin, return the message
        } else {
          req.user.admin = true;
          return socket
        }
      }
      )
    }
    ,
    cert: fs.readFile('./certs/cert.pem', (err, file) => {
      if (err) return err;
      return file;
    }
    ),
    link: (filePath, format, type, cb) => {
      //Creates a temporary link
      function write(pth) {
        var sid = crypto.createHash('md5').update(Math.random().toString()).digest('hex');
        // Generate a ranndom sid
        var linkFile = path.resolve(consts.linkFolder, sid + '.link');
        // Generate the link filename
        fs.writeFile(linkFile, filePath, (err) => {
          // Write the link of the file to the link file
          if (err)
            return cb(err);
          cb(null, sid);
          // If succeeded, return the new link's sid
        }
        )
      }
      fs.stat(consts.linkFolder, (err, stats) => {
        if (err) {
          return cb(new Error('Links directory does not exist'))
        }
        (type == 'download') ? write(filePath + '.' + format) : (type == 'play') ? (fs.stat(filePath + '.mp4', (err, stats) => {
          if (err) {
            fs.stat(filePath + '.ogg', (err, stats) => {
              if (err) {
                fs.stat(filePath + '.webm', (err, stats) => {
                  if (err)
                    return cb(new Error('not found'));
                  write(filePath + '.webm');
                }
                )
              }
              write(filePath + '.ogg')
            }
            )
          }
          write(filePath + '.mp4');
        }
        )) : null;
      }
      )
    }
    ,
    linkUp: (sid, cb) => {
      //Gets the download file path related to a download sid
      var linkFile = path.resolve(consts.linkFolder, sid + '.link');
      // Get the link-file name
      fs.stat(linkFile, (err, stats) => {
        if (err)
          return cb(new Error('Link does not exist'));
        // Link-file doesn't exists
        fs.readFile(linkFile, 'utf8', (err, data) => {
          // Get the file path
          if (err)
            return cb(err);
          cb(null, data);
          // Return the file path
        }
        )
      }
      )
    }
    ,
    unlink: (sid, cb) => {
      //Deletes a download session
      var linkFile = path.resolve(consts.linkFolder, sid + '.link');
      // Get the link-file name
      fs.stat(linkFile, (err, stats) => {
        if (err)
          return cb(new Error('Link does not exist'));
        // Link-file doesn't exists
        fs.unlink(linkFile, (err) => {
          // Delete the download session
          if (err)
            return cb(err);
          cb(null, true);
          // Return success (no error)
        }
        )
      }
      )
    }
    ,
    objectKeysToLowerCase: (obj) => {
      keys = Object.keys(obj);
      newObj = {};
      for (var i = 0; i < keys.length; i++) {
        key = keys[i].toLowerCase();
        newObj[key] = obj[keys[i]];
        if (i == keys.length - 1)
          return newObj;
      }
    }
    ,
    deleteObjectKey: (obj, key, cb) => {
      var O = obj.toObject();
      delete O[key];
      if (cb)
        cb(O);
      else
        return O;
    }
  }
  return fn;
}
