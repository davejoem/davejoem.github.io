'use strict'

let agent = {}
  , args = agent.args = require('argparse')
  , bcrypt = agent.bcrypt = require('bcrypt-nodejs')
  , body_parser = agent.body_parser = require('body-parser')
  , compression = agent.compression = require('compression')
  // , cors = agent.cors = require('cors-express')
  , crypto = agent.crypto = require('crypto')
  , cp = agent.cp = require('child_process')
  , dns = agent.dns = require('dns')
  , ejs = agent.ejs = require('ejs')
  , express = agent.express = require('express')
  , extend = agent.extend = require('extend')
  , favicon = agent.favicon = require('serve-favicon')
  , fetch = agent.fetch = require('node-fetch')
  , fs = agent.fs = require('fs-extra')
  , http = agent.http = require('http')
  , https = agent.https = require('https')
  , socketio = agent.socketio = require('socket.io')
  , ss = agent.ss = require('socket.io-stream')
  , jwt = agent.jwt = require("jsonwebtoken")
  , lodash = agent.lodash = require('lodash')
  // , mikronode = agent.mikronode = require('mikronode-ng')
  , moment = agent.moment = require('moment')
  , mongoose = agent.mongoose = require('mongoose')
  , morgan = agent.morgan = require('morgan')
  , os = agent.os = require('os')
  , path = agent.path = require('path')
  , request = agent.request = require('request')
  , telegraf = agent.telegraf = require('telegraf')
  , url = agent.url = require('url')
  , shortId = require('shortid')
  , winston = agent.winston = require('winston')
  , config
  , ipaddress = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || `127.0.0.1`
  , port = process.env.PORT || process.env.C9_PORT || process.env.OPENSHIFT_NODEJS_PORT || 8081
  , status = agent.status = {
    online: false
    , version: 2
  }
  , getLaunchConfig = agent.getLaunchConfig = () => {
    return new Promise((resolve, reject) => {
      fs.readJSON(path.resolve(`./config.json`), (err, cfg) => {
        if (err) return reject(err)
        agent.config = cfg
        var ArgumentParser = args.ArgumentParser;
        var parser = new ArgumentParser({
          version: '1.0.0',
          addHelp: true,
          description: agent.config.appname
        });
        parser.addArgument(
          ['-V', '--Version'],
          {
            action: "store",
            type: "int",
            choices: [1, 2],
            help: 'Version of web client to run. Choose between 1 & 2'
          }
        );
        parser.addArgument(
          ['-n', '--appname'],
          {
            action: "store",
            type: "string",
            help: 'Name of the server. It contols the database to connect to and other settings.'
          }
        );
        parser.addArgument(
          ['-d', '--database'],
          {
            action: "store",
            type: "string",
            help: `
              Name of the server. It contols the MongoDB database to connect to.
              If the line ends with a slash, then option [-n,--appname] must be provided.`
          }
        );
        parser.addArgument(
          ['-u', '--dbuser'],
          {
            action: "store",
            type: "string",
            help: `user of the provided database`
          }
        );
        parser.addArgument(
          ['-l', '--log'],
          {
            action: "store",
            choices: [0, 1, 2, 3],
            type: "int",
            help: `verbose logging`
          }
        );
        parser.addArgument(
          ['-p', '--dbpass'],
          {
            action: "store",
            type: "string",
            help: `password of provided user`
          }
        );
        var arg = parser.parseArgs()
        Object.keys(arg).forEach(option => {
          if (option in agent.config) {
            if (option === `database` && arg[option] && arg[option].endsWith(`/`) && !arg.appname) {
              reject(`Invalid database path. When ending your database path with a slash you must provide an app name with [-n, --appname] option.\nExiting\n`)
            }
            if (arg[option]) agent.config[option] = arg[option]
          }
        })
        config = agent.config
        resolve(agent.config)
      })
    })
  }
  , checkOnlineStatus = agent.checkOnlineStatus = () => {
    return new Promise(resolve => {
      dns.resolve('google.com', function (err, array) {
        if (err) {
          // agent.utils.log({ log: `DNS check error`, error: err })
          status.online = agent.status.online = false
          resolve(false)
        } else {
          status.online = agent.status.online = true
          resolve(true);
        }
      })
    })
  }
  , getDbPath = agent.getDbPath = (status) => {
    agent.database = {
      conn: null
      , connect_interval: null
      , db: null
      , path: ``
    }
    return new Promise((resolve, reject) => {
      let prefix = `mongodb://`
      if (process.env.OPENSHIFT_MONGODB_DB_USERNAME && process.env.OPENSHIFT_MONGODB_DB_PASSWORD) {
        agent.database.path += prefix + process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" + process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@";
      }
      process.env.OPENSHIFT_MONGODB_DB_HOST
        ? agent.database.path += process.env.OPENSHIFT_MONGODB_DB_HOST + ":"
        : agent.database.path += "127.0.0.1:"
      process.env.OPENSHIFT_MONGODB_DB_PORT
        ? agent.database.path += process.env.OPENSHIFT_MONGODB_DB_PORT
        : agent.database.path += "27017"
      agent.database.path += `/${agent.config.appname}`
      status == true
        ? resolve(`${prefix}${agent.config.database.user}:${agent.config.database.pass}@${agent.config.database.path}/${agent.config.appname}`)
        // ? resolve(`${prefix}${agent.config.database.path}/${agent.config.appname}`)
        : resolve(`${prefix}${agent.database.path}`)
    })
  }
  , connectToDatabase = (database_pat, cb) => {
    mongoose.Promise = agent.mongoose.Promise = global.Promise
    return new Promise((resolve, reject) => {
      agent.database.connect_interval = setInterval(() => {
        agent.database.conn = mongoose.connect(database_pat, {
          useMongoClient: true
        })
        agent.database.conn.then(
          db => {
            process.stdout.write(`Database connected\n`)
            db.on('open', () => {
              process.stdout.write('database opened')
            })
            db.on('close', () => {
              process.stdout.write('database closed')
            })
            db.on('error', () => {
              process.stdout.write('database error')
            })
            clearInterval(agent.database.connect_interval)
            agent.database.db = db
            resolve()
          }
          , err => {
            console.log(err)
            process.stdout.write(`Couldn't connect database.\n`)
            reject(err)
          }
        )
      }, 3000)
    })
  }
  , modelDatabase = () => {
    return new Promise((resolve, reject) => {
      agent.models = {
        Service: require(path.resolve(__dirname, 'models/service'))(agent)
      }
      resolve()
    })
  }
  , loadUtilities = () => {
    return new Promise((resolve, reject) => {
      agent.auth = require(path.resolve(__dirname, 'utils/socket_auth'))
      agent.utils = {
        fn: require(path.resolve(__dirname, 'utils/fn'))(agent)
        , log: require(path.resolve(__dirname, 'utils/log'))(agent)
      }
      resolve()
    })
  }
  , setUpApp = () => {
    return new Promise((resolve, reject) => {
      agent.app = express()
      agent.server = http.createServer(agent.app)
      agent.io = socketio.listen(agent.server)
      resolve(agent)
    })
  }
  , connectSockets = () => {
    return new Promise((resolve, reject) => {
      agent.auth_events = require(path.resolve(__dirname, 'events/auth'))(agent)
      // agent.utils.fn.sock(agent)
      resolve()
    })
  }
  , initGet = () => {
    agent.get = new agent.utils.Get()
    return agent.get.init()
  }
  , initMovies = () => {
    agent.movies = new agent.utils.Movies()
    return agent.movies.init()
  }
  , setUpRoutes = (agent) => {
    return new Promise((resolve, reject) => {
      // app.set('view engine','ejs')
      // app.engine('html', ejs.renderFile);
      agent.app.use(morgan('dev'))
      // parse application/x-www-form-urlencoded
      agent.app.use(body_parser.urlencoded({ extended: true }))
      // parse application/json
      agent.app.use(body_parser.json())
      agent.app.use(compression({ threshold: 1024 }))
      agent.app.all('*', (req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
      })
      agent.app.use('/', express.static(path.join(__dirname, `client`, `www`), { maxAge: '30d' }))
      agent.service_routes = require(path.resolve(__dirname, 'routes/services'))(agent)
      agent.telegram_routes = require(path.resolve(__dirname, 'routes/telegram'))(agent)
      agent.general_routes = require(path.resolve(__dirname, 'routes/general'))(agent)
      resolve(agent)
    })
  }
  , startServer = (port) => {
    return new Promise((resolve, reject) => {
      agent.server.listen(port, function () {
        var addr = agent.server.address()
        resolve(`\n${agent.config.appname} running on ${addr.address}:${addr.port}\n`)
      }).on('error', (err) => {
        reject(err)
      })
    })
  }
getLaunchConfig().then(cfg =>
  checkOnlineStatus().then(stat =>
    getDbPath(stat).then(database_pat =>
      connectToDatabase(database_pat).then(() =>
        modelDatabase().then(() =>
          loadUtilities().then(() =>
            setUpApp().then(agent =>
              connectSockets().then(() =>
                setUpRoutes(agent).then(agent => {
                  startServer(port)
                    .then(info => agent.utils.log({ log: `\nServer started\n${info}`, info: info }))
                    .catch(err => {
                      agent.utils.log({ log: `\nCouldn't start server\n`, error: err })
                      if (err.code == 'EADDRINUSE') {
                        port++
                        startServer(port)
                      }
                    })
                }).catch(console.error)
              ).catch(console.error)
            ).catch(console.error)
          ).catch(console.error)
        ).catch(console.error)
      ).catch(console.error)
    ).catch(console.error)
  ).catch(console.error)
).catch(console.error)
//                 }).catch(err=>agent.utils.log({ log: "Couldn't set up routes", error: err }))
//               ).catch(err=>agent.utils.log({ log: "Couldn't connect socket", error: err }))
//             ).catch(err=>agent.utils.log({ log: "Couldn't set up app", error: err }))
//           ).catch(err=>agent.utils.log({ log: "Couldn't model database", error: err }))
//         ).catch(err=>agent.utils.log({ log: "Couldn't model database", error: err }))
//       ).catch(err=>agent.utils.log({ log: "Couldn't connect to database", error: err }))
//     ).catch(err=>agent.utils.log({ log: "Couldn't get database path", error: err }))
//   ).catch(err=>agent.utils.log({ log: "Couldn't get online status", error: err }))
