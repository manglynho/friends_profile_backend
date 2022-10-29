import express from 'express'
require('express-async-errors')
const app = express()
import cors from 'cors'
import friendsRouter from './controllers/friends'
import testingRouter from './controllers/testing'
import middleware from './utils/middleware'

import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

app.use(cors())
app.use(express.static('build'))
app.use(express.json())
app.use(middleware.requestLogger)

app.use('/api/v1/friends', friendsRouter)

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Friends API docs",
      version: "0.1.0",
      description:
        "This is a Friend api documented with Swagger"      
    }
  },  
  apis: ["./controllers/*.ts", "./schemas/*.ts"],
};

const specs = swaggerJsdoc(options);
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs)
);

// eslint-disable-next-line no-undef
if (process.env.NODE_ENV === 'test') {  
  app.use('/api/v1/testing', testingRouter)
}

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

export default app