/* eslint-disable node/no-missing-require */
import http from 'http'
import express, {
  Request as IRequest,
  Response as IResponse,
  NextFunction as INextFunction,
} from 'express'
import path from 'path'

require('module-alias')(path.join(__dirname, '../', 'package.json'))
require('dotenv').config({ path: path.join(__dirname, '.env') })

const socketIO = require('socket.io')
const { Telegraf, session } = require('telegraf')
const { withLabLogic, withStageSample } = require('./bot')

const isDev: boolean = process.env.NODE_ENV === 'development'
const PORT: number = process.env.PORT ? Number(process.env.PORT) : 3000
const { TG_BOT_TOKEN } = process.env

if (!TG_BOT_TOKEN)
  throw new Error('🚫 Check envs: TG_BOT_TOKEN must be provided!')

class App {
  private server: http.Server
  private port: number
  private bot: typeof Telegraf

  constructor(port: number) {
    this.port = port
    this.bot = new Telegraf(TG_BOT_TOKEN)
    const app = express()

    // app.use(express.static(path.join(__dirname, '../client')))
    // app.use('/build/three.module.js', express.static(path.join(__dirname, '../../node_modules/three/build/three.module.js')))
    app.use(
      (
        req: IRequest & { bot: typeof Telegraf },
        _res: IResponse,
        next: INextFunction
      ) => {
        req.bot = this.bot
        next()
      }
    )
    // app.use('/', router)

    this.server = new http.Server(app)
    if (isDev) new socketIO.Server(this.server)
  }

  private runBot() {
    const { bot } = this

    bot.use(session())

    withLabLogic(bot)
    withStageSample(bot)
    // Others...

    bot.launch()
  }

  public start() {
    this.server.listen(this.port, () => {
      console.log(`Server listening on http://localhost:${this.port}`)
    })
    this.runBot()
  }
}

new App(PORT).start()
