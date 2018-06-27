module.exports = (agent) => {
  agent.app.get('/', (req, res, next) => {
    res.sendFile(agent.path.resolve(__dirname, `..`, `client`, `www`, `index.html`))
  })
  agent.app.get('/ip', (req, res, next) => {
    res.status(200).send(JSON.stringify({ ip: req.headers['x-forwarded-for'] }))
  })
  agent.app.get('/*', (req, res, next) => {
    res.redirect('//' + req.headers.host)
  })
}