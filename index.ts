import app from './app'
import { PORT } from './utils/config'
import logger from './utils/logger'
import connect from "./utils/connect"

app.listen( PORT, async  () => {
  logger.info(`Server running on port ${PORT}`)
  await connect();
})