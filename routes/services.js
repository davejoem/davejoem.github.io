module.exports = (agent) => {
  agent.app.get('/service/create', (req, res, next) => {
    let service = new agent.models.Service()
    service.name = req.body.name
    service.key = req.body.key
    service.active = req.body.active
    service.save((err, service) => {
      if (err) return res.status(500).json({ message: `An error occurred. Please retry.` })
      res.status(200).json({ message: `Service ${service.name} created successfully.` })
    })
  })
  agent.app.get('/service/asd/', (req, res, next) => {
    agent.models.Service.findOne({ name: "asd" }, (err, asd) => {
      if (err) {
        res.status(500).json({ message: `An error occurred. Please retry.` })
        return
      }
      res.status(200).json({ launch: asd.active })
    })
  })
}