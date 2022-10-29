const testingRouter = require('express').Router()
import { Request, Response } from "express"
import Friend from '../models/friend'

testingRouter.post('/reset', async (_req : Request, res: Response) => {
  await Friend.deleteMany({})
  res.status(204).end()
})

export default testingRouter