'use strict';

module.exports = (agent) => {
  return (log) => {
    process.stdout.write(`\nLog: ${ log.log }\n`)
    return new Promise((resolve,reject)=>{
      if (log.success) {
        agent.fs.appendFile(agent.config.logFile, "\n["+Date.now()+"] [SUCCESS] "+log.log, (err) => {
          if (err) return reject(err);
          resolve('Logged!');
        });
      }
      if (log.info) {
        agent.fs.ensureFile(agent.path.resolve(__dirname, `..`, `fs`,'logs','info.log'), (err) => {
          if (err) return reject(err);
          agent.fs.appendFile(agent.path.resolve(__dirname, `..`, `fs`,'logs','info.log'), "\n["+Date.now()+"] [INFO] "+log.log, (err) => {
            if (err) return reject(err);
            resolve('Logged!');
          });
        })
      }
      if (log.warn) {
        agent.fs.ensureFile(agent.path.resolve(__dirname, `..`, `fs`,'logs','warnings.log'), (err) => {
          if (err) return reject(err);
          agent.fs.appendFile(agent.path.resolve(__dirname, `..`, `fs`,'logs','warnings.log'), "\n["+Date.now()+"] [WARNING] "+log.log, (err) => {
            if (err) return reject(err);
            resolve('Logged!');
          });
        })
      }
      if (log.error) {
        agent.fs.ensureFile(agent.path.resolve(__dirname, `..`, `fs`,'logs','errors.log'), (err) => {
          if (err) return reject(err);
          agent.fs.appendFile(agent.path.resolve(__dirname, `..`, `fs`,'logs','errors.log'), "\n["+Date.now()+"] [ERROR] "+log.log, (err) => {
            if (err) return reject(err);
            resolve('Logged!');
          });
        })
      }
    })
  }    
}