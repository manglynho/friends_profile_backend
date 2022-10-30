import { Request, Response, Router, RequestHandler } from "express";
import Friend from '../models/friend';
import mongoose from "mongoose";
import DjkGraph from 'node-dijkstra';
import { FriendEntry, FriendRequest } from '../types/friend_types';
import { friendFinder, secureFriend } from '../utils/middleware';
import friendSchema from "../schemas/friend.schema";

const friendsRouter = Router();

friendsRouter.get('/', (async (_req: Request, res: Response) => {
    const friendsList = await Friend.find({});
    if(friendsList) {
      res.json(friendsList);
    } else {
      res.status(404).end();
    }
}) as RequestHandler);

friendsRouter.get('/:id', friendFinder, (req : FriendRequest, res: Response) => { 
  if (req.friend) {
    res.json(req.friend);
  } else {
    res.status(404).end();
  }  
});

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
friendsRouter.get('/friendsList/:id', friendFinder, (req : FriendRequest, res : Response) => { 
  if (req.friend) {    
    res.json(req.friend.friends);
  } else {
    res.status(404).end();
  }  
});

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
friendsRouter.get('/shortestConnection/:idFrom/:idTo',( async (req :Request, res: Response) => { 
  
  if(!req.params.idFrom || !req.params.idTo){
    return res.status(404).end();
  }
  //going thru an aggregate graph lookup from mongodb to reduce and prepare my search domain
  let friendFrom: Array<FriendEntry> = [];
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
    ]);
  } catch( err ){ 
    if (err instanceof Error) {      
      return res.status(400).json({ error: err.message });
    } else {
      return res.status(400);
    } 
  }
  if(!friendFrom[0]){
    return res.status(400).json({error:'Friend not found or invalid'});
  }
  if(friendFrom[0].friends?.length === 0){
    return res.status(400).json({error: 'No friends found'});
  }
  //could be a direct friend so could save time/resoucers
  if( friendFrom[0].friends?.some((el: string) => el == req.params.idTo)){
    return res.json({result: 'Direct Friends'});
  }
  //in [fof] are all nodes of my search domain
  if(!friendFrom[0].fof?.some((el:FriendEntry) => el._id == req.params.idTo)){
    return res.status(400).json({error: 'No conection between friends'});
  }
  const friendsGraph = new DjkGraph();

  const firstNode: string = friendFrom[0]._id !== undefined ? friendFrom[0]._id.toString() : '';
  const firstNodeFriends: Array<string> = friendFrom[0].friends !== undefined ? friendFrom[0].friends : [];
  //starting node
  friendsGraph.addNode( firstNode, setFriendsToGraph(firstNodeFriends) );
  //other nodes in my graphlookup (no need of weight or circular reference)
  friendFrom[0].fof.forEach( (f: FriendEntry ) => {
      const nodeId: string = f._id !== undefined ? f._id.toString() : '';
      const nodeFriends: Array<string> = f.friends !== undefined ? f.friends : [];
      friendsGraph.addNode(nodeId, setFriendsToGraph(nodeFriends));
  });
 
  const result = friendsGraph.path(req.params.idFrom, req.params.idTo, {trim:true});
  return res.json({result});
}) as RequestHandler);

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
friendsRouter.post('/', (secureFriend(friendSchema)) as RequestHandler , ( async (req:Request, res: Response) => { 
  const newFriend = new Friend({
      ...req.body  
  });
  try{
    await newFriend.save();
    return res.json(newFriend);
  } catch(err){
    if (err instanceof Error) {      
      return res.status(400).json({ error: err.message });
    } else {
      return res.status(400);
    } 
  }
}) as RequestHandler );

friendsRouter.delete('/:id', friendFinder, ( async (req:FriendRequest, res: Response) => { 
  if(!req.friend){
    res.status(404).end();
  }
  await Friend.deleteOne({ _id: req.params.id });
  res.status(204).end(); 
}) as RequestHandler);

friendsRouter.put('/:id', friendFinder, ( async (req:FriendRequest, res: Response) => { 
  if(!req.friend){
    res.status(404).end();
  }
  //eslint-disable-next-line
  const updateFriend = {
      ...req.body  
  };
  //eslint-disable-next-line
  const updatedFriend = await Friend.findByIdAndUpdate(req.params.id, updateFriend, { new: true }).populate('friends');
  res.json(updatedFriend);
}) as RequestHandler );

function setFriendsToGraph(friendsArr: Array<string>){
  const vertexObj = friendsArr.reduce((a,v) => ({...a, [v]: 1}),{});
  return vertexObj;
}

export default friendsRouter;