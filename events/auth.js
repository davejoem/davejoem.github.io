module.exports = (agent) => {
  function sendError(err, message, cb) {
    cb({
      err: err
      , message: {
        class: "error",
        message: message.message || message
      }
      , status: message.status
    })
  }
  agent.io.on('connection', socket => {
    process.stdout.write(`User connected\n`)
    // let code = 111111, num
    // setInterval(()=>{
    //   code ++
    //   let number = function() {
    //     num = `+2547` + Math.round(Math.random()*100000000)
    //     return num
    //   }
    //   socket.emit('activation code', {number: number(), code: code})
    //   process.stdout.write(`Sent activation code: ${code} to ${num}\n`)
    // }, 5000)
    socket.on('auth:user:check', (data, cb) => {
      process.stdout.write(`Check data: ${JSON.stringify(data)}\n`)
      if (!data.phonenumber) return sendError(null, { status: "failed", error: "Please enter a phonenumber" }, cb)
      agent.models.User.findOne({ "accounts.local.phonenumber": data.phonenumber }).exec().then(
        user => {
          if (user && user != null) {
            if (user.accounts.local.activation.activated)
              cb(null, { status: 'active', user: user })
            else
              cb(null, { status: 'inactive', user: user })
          }
          else cb(null, { status: '!exist' })
        }
        , err => sendError(err, { status: 'error', message: err.message }, cb)
      )
    })
    socket.on('auth:user:activate', (data, cb) => {
      process.stdout.write(`${JSON.stringify(data)}\n`)
      if (!data.phonenumber) return sendError(null, { status: "failed", error: "Please enter a phonenumber." }, cb)
      if (!data.activationcode) return sendError(null, `Please enter an activation code.`, cb)
      agent.models.User.findOne({ "accounts.local.phonenumber": data.phonenumber }).exec().then(
        user => {
          if (user && user != null) {
            user.activate(data.activationcode).then(
              usr =>
                usr.save().then(
                  us => cb(null, { status: "success", user: us })
                  , err => sendError(err, { status: 'error', message: `An error occured. Please try again.` }, cb)
                )
              , err => sendError(err, { status: 'error', message: err.message }, cb)
            )
          }
          else
            sendError(null, { status: 'error', message: `User not found.` }, cb)
        }
        , err => sendError(err, { status: 'error', message: `An error occured. Please try again.` }, cb)
      )
    })
    socket.on('auth:user:verify', (data, cb) => {
      process.stdout.write(`${JSON.stringify(data)}\n`)
      if (!data.phonenumber) return sendError(null, { status: "failed", error: "Please enter a phonenumber." }, cb)
      if (!data.code) return sendError(null, { status: "failed", error: "Please enter a verification code." }, cb)
      agent.models.User.findOne({ "accounts.local.phonenumber": data.phonenumber }).exec().then(
        user => {
          if (user && user != null)
            user.activate(data.code).then(
              usr =>
                usr.save().then(
                  us => cb(null, { status: "success", user: us })
                  , err => sendError(err, { status: 'error', message: err.message }, cb)
                )
              , err => sendError(err, { status: 'error', message: err.message }, cb)
            )
          else
            sendError(null, { status: 'error', message: `User not found` }, cb)
        }
        , err => sendError(err, { status: 'error', message: `An error occured. Please try again.` }, cb)
      )
    })
    socket.on('auth:user:refresh', (data, cb) => {
      process.stdout.write(`${JSON.stringify(data)}\n`)
      if (!data.phonenumber) return sendError(null, { status: "failed", error: "Please enter a phonenumber" }, cb)
      agent.models.User.findOne({ "accounts.local.phonenumber": data.phonenumber }).exec().then(
        user => {
          if (user && user != null)
            cb(null, { status: "success", user: user })
          else
            sendError(null, { status: 'error', message: `User not found` }, cb)
        }
        , err => sendError(err, { status: 'error', message: `An error occured. Please try again` }, cb)
      )
    })
    socket.on('auth:user:newcode', (data, cb) => {
      process.stdout.write(`${JSON.stringify(data)}\n`)
      if (!data.phonenumber) return sendError(null, { status: "failed", error: "Please enter a phonenumber" }, cb)
      agent.models.User.findOne({ "accounts.local.phonenumber": data.phonenumber }).exec().then(
        user => {
          if (user && user != null)
            user.sendActivationCode('phone').then(
              user =>
                user.save().then(
                  usr => {
                    process.stdout.write(`Acttivation code: ${usr.accounts.local.activation.activationcode}\n`)
                    cb(null, { status: "success", user: usr })
                  }
                  , err => sendError(err, { status: 'error', message: `An error occured. Please try again.` }, cb)
                )
              , err => sendError(err, { status: 'error', message: `An error occured. Please try again.` }, cb)
            )
          else
            sendError(null, { status: 'error', message: `User not found` }, cb)
        }
        , err => sendError(err, { status: 'error', message: `An error occured. Please try again.` }, cb)
      )
    })
    socket.on('auth:user:signup', (data, cb) => {
      process.stdout.write(`Sign up data: ${JSON.stringify(data)}\n`)
      if (!data.phonenumber) return sendError(null, { status: "failed", error: "Please enter a phonenumber" }, cb)
      let num = ``
      if (data.phonenumber.startsWith('254') || data.phonenumber.startsWith('+254')) {
        if (data.phonenumber.startsWith('254'))
          data.phonenumber = `+` + data.phonenumber
        num = parseInt(data.phonenumber.split('+254')[1])
      } else if (data.phonenumber.startsWith('0')) {
        num = parseInt(data.phonenumber)
      } else if (data.phonenumber.startsWith('7') && data.phonenumber.length == 9)
	num = data.phonenumber

      let newUser = new agent.models.User()
      newUser.accounts.local.phonenumber = num
      newUser.sendActivationCode('phone').then(
        user => {
	  user.accounts.local.phonenumber = num
          user.save().then(
            usr =>cb(null, { status: "success" })
            , err => sendError(err, { status: 'error', message: `An error occured. Please try again` }, cb)
          )
        }        
	, err => {
          console.log("Error sending code", err)
          sendError(err, { status: 'error', message: `An error occured. Please try again` }, cb)
        }
      )
    })
  })
}
