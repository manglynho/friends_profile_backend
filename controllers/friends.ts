const friendsRouter = require('express').Router()
import { Request, Response } from "express"
import Friend from '../models/friend'
import mongoose from "mongoose"
import DjkGraph from 'node-dijkstra'
import { FriendRequest } from '../types/friend_types'
import { friendFinder, secureFriend } from '../utils/middleware'
import friendSchema from "../schemas/friend.schema"

friendsRouter.get('/', async (_req: Request, res: Response) => {
  //const friendsList =  await Friend.find({}).populate('friends')
  const friendsList =  await Friend.find({})
  if(friendsList) {
    res.json(friendsList)
  } else {
    res.status(404).end()
  }
})

friendsRouter.get('/:id', friendFinder, async (req : FriendRequest, res: Response) => { 
  if (req.friend) {
    res.json(req.friend)
  } else {
    res.status(404).end()
  }  
})

/**
 * @openapi
 * '/api/v1/friends/friendsList/{id}':
 *  get:
 *     tags:
 *     - Friend
 *     summary: Gets the list of friends
 *     parameters:
 *        - in: path
 *          name: id
 *          schema:
 *            type: string
 *            required: true
 *            description: The friend id
 *     responses:
 *      200:
 *        description: The list of friends
 *        content:
 *          application/json:
 *            schema: 
 *              $ref: '#/components/schemas/Friend'
 *      404:
 *        description: Friend not found
*/
friendsRouter.get('/friendsList/:id', friendFinder, async (req : FriendRequest, res : Response) => { 
  if (req.friend) {    
    res.json(req.friend.friends)
  } else {
    res.status(404).end()
  }  
})

/**
 * @openapi
 * '/api/v1/friends/shortestConnection/{idFrom}/{idTo}':
 *  get:
 *     tags:
 *     - Friend
 *     summary: Gets the shortest conecciont between two friends
 *     parameters:
 *        - in: path
 *          name: idFrom
 *          schema:
 *            type: string
 *            required: true
 *            description: The origin friend id
 *        - in: path
 *          name: idTo
 *          schema:
 *            type: string
 *            required: true
 *            description: The destination friend id
 *     responses:
 *      200:
 *        description: The list of friends id
 *        content:
 *          application/json:
 *            schema:
 *              type: 'array'
 *      404:
 *        description: Friend not found
 *      400:
 *        description: Friends not found or no connection
*/
friendsRouter.get('/shortestConnection/:idFrom/:idTo', async (req :Request, res: Response) => { 
  
  if(!req.params.idFrom || !req.params.idTo){
    return res.status(404).end()
  }
  //going thru an aggregate graph lookup from mongodb to reduce and prepare my search domain
  let friendFrom = []
  try{
    friendFrom = await Friend.aggregate([
      {
        $match: { _id : new mongoose.Types.ObjectId(req.params.idFrom) }
      },
      {
        $graphLookup:{
          from: "friends",
          startWith: "$friends",
          connectFromField: "friends",
          connectToField: "_id",
          as: "fof",
          depthField: 'fnodes'
        }
      }
    ])
  } catch(err: any){    
    return res.status(400).json({ error: err.message })
  }
  if(!friendFrom[0]){
    return res.status(400).json({error:'Friend not found or invalid'})
  }
  if(friendFrom[0].friends.length === 0){
    return res.status(400).json({error: 'No friends found'})
  }
  //could be a direct friend so could save time/resoucers
  if(friendFrom[0].friends.some((el: { _id: string; }) => el._id == req.params.idTo)){
    return res.json({result: 'Direct Friends'})
  }
  //in [fof] are all nodes of my search domain
  if(!friendFrom[0].fof.some((el: { _id: string; }) => el._id == req.params.idTo)){
    return res.status(400).json({error: 'No conection between friends'})
  }
  let friendsGraph = new DjkGraph();
  //starting node
  friendsGraph.addNode(friendFrom[0]._id.toString(), setFriendsToGraph(friendFrom[0].friends))
  //other nodes in my graphlookup (no need of weight or circular reference)
  friendFrom[0].fof.forEach((f: { _id: { toString: () => any; }; friends: any[]; }) => {
    friendsGraph.addNode(f._id.toString(), setFriendsToGraph(f.friends))
  })  
  const result = friendsGraph.path(req.params.idFrom, req.params.idTo, {trim:true})
  return res.json({result})
})

/**
 * @openapi
 * '/api/v1/friends':
 *  post:
 *     tags:
 *     - Friend
 *     summary: Create a friend
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *              $ref: '#/components/schemas/Friend'
 *     responses:
 *      200:
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Friend'
 *      404:
 *        description: Bad Input Data
 *      400:
 *        description: Operation error
*/
friendsRouter.post('/', secureFriend(friendSchema) ,  async (req:Request, res: Response) => { 
  const body = req.body
  const newFriend = new Friend({
      ...body  
  })
  try{
    await newFriend.save()
    return res.json(newFriend)
  } catch(e : any){
    return res.status(400).json({error:e.message})
  }
})

friendsRouter.delete('/:id', friendFinder, async (req:FriendRequest, res: Response) => { 
  if(!req.friend){
    res.status(404).end()
  }
  await Friend.deleteOne({ _id: req.params.id })
  res.status(204).end() 
})

friendsRouter.put('/:id', friendFinder, async (req:FriendRequest, res: Response) => { 
  if(!req.friend){
    res.status(404).end()
  }  
  const body = req.body
  const friend = {
    ...body
  }
  const updatedFriend = await Friend.findByIdAndUpdate(req.params.id, friend, { new: true }).populate('friends')
  res.json(updatedFriend)
})

function setFriendsToGraph(friendsArr: any[]){
  const vertexObj = friendsArr.reduce((a,v) => ({...a, [v]: 1}),{})
  return vertexObj
}

export default friendsRouter