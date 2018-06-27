module.exports = (agent) => {
  const bot = agent.telegram_bot = new agent.telegraf(agent.config.telegram.TouticiAuthBot_token)
  bot.use(agent.telegraf.log())
  const { Extra, Markup } = agent.telegraf
  bot.startPolling()
}
