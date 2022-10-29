import mongoose from 'mongoose'
import supertest from 'supertest'
import connect from '../utils/connect'
import app from '../app'
import Friend from "../models/friend"
import initialFriends from '../data/initialFriends'
import test_helper from './test_helper'
import DjkGraph from 'node-dijkstra'

const api = supertest(app)

beforeAll(async()=>{
  await connect()
})

beforeEach(async() => {
  await Friend.deleteMany({})
  const friendObjects = initialFriends.map(friend => new Friend(friend))
  const promiseArray = friendObjects.map(friend => friend.save())
  await Promise.all(promiseArray)
})

describe('Basic test connect to endpoint and simple stuff', () => {
  test('connection is ok and friends are returned as json', async () =>{
    await api
    .get('/api/v1/friends')
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(200)
  })
  test('initial dataset has 6 elements', async () =>{
    const res = await api.get('/api/v1/friends')
    expect(res.body).toHaveLength(initialFriends.length)
  })
  test('a respose item has _id property defined :-) ', async () => {
    const res = await api.get('/api/v1/friends')
    expect(res.body[0]._id).toBeDefined()
  })
})

//test crud stuff like get by id , post , put and delete
describe('test a friend entry', () => {
  test('succeds with a valid id', async () =>{
    const friendsAtStart = await test_helper.friendsInDb()
    const friendToView = friendsAtStart[0]
    const resultFriend = await api
      .get(`/api/v1/friends/${friendToView._id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)    
    expect(resultFriend.body._id).toContain(friendToView._id?.toString())
  })
  test('return a list of friends(2) from dataset id => 5a422a851b54a676234d1899 ', async () => {
    const resultFriend = await api
      .get(`/api/v1/friends/friendsList/5a422a851b54a676234d1899`)
      .expect(200)
      .expect('Content-Type', /application\/json/)    
    expect(resultFriend.body).toHaveLength(2)
  })
  test('fails with 404 if friend does not exist', async () => {
    const validNonExistingId = await test_helper.nonExistingFriendId()
    await api
      .get(`/api/v1/friends/${validNonExistingId}`)
      .expect(404)
  })
  test('fails with statuscode 400 if id is invalid', async () => {
    const invalidId = '1a3d5da00000000a82aaaa4'
    await api
    .get(`/api/v1/friends/${invalidId}`)
    .expect(400)
  })
})

describe('addition tests', () => {
  test('New friend added ok', async () => {
    const newFriend = {
      img : "https://fakedetail.com/userface_image/male/male20161083966702087.png",
      first_name: "Ray",
      last_name: "Donovan",
      phone: "(825) 289-1987",
      address_1: "5190 Center Court Drive",
      city: "Spring",
      state: "TX",
      zipcode: 77370,
      bio: "I'm very choosy. I'm also very suspicious, and very irrational and I have a very short temper. I'm also extremely jealous and slow to forgive. Just so you know.",
      photos:[
        "https://picsum.photos/720/360",
        "https://picsum.photos/720/360",
        "https://picsum.photos/720/360"
      ],
      statuses: [
        "Developing something amazing",
        "This could be interesting....",
        "Man, life is so good",
        "There is nothing quite like a good friend",
        "Take a look around you, everything is awesome", "What is the point of all of this"
      ],
      available: true,
      friends: ["5a422a851b54a676234d1902","5a422a851b54a676234d1898"]
    }
    await api
      .post('/api/v1/friends')
      .send(newFriend)
      .expect(200)
      .expect('Content-Type', /application\/json/)
    const friendsAtEnd = await test_helper.friendsInDb()
    expect(friendsAtEnd).toHaveLength(initialFriends.length + 1)
    const friendName = friendsAtEnd.map(f => f.first_name)
    expect(friendName).toContain('Ray')
  }) 
  
   test('all zod schema required field should fail', async() => {
      const newFriend = {
        photos:[
          "https://picsum.photos/720/360",
          "https://picsum.photos/720/360",
          "https://picsum.photos/720/360"
        ],
        statuses: [
          "Developing something amazing",
          "This could be interesting....",
          "Man, life is so good",
          "There is nothing quite like a good friend",
          "Take a look around you, everything is awesome", "What is the point of all of this"
        ],
        available: true,
        friends: ["5a422a851b54a676234d1902","5a422a851b54a676234d1898"]
      }
      const result = await api
        .post('/api/v1/friends')
        .send(newFriend)
        .expect(400)
      expect(result.body.name).toContain('ZodError')
      expect(result.body.issues[0].message).toContain('first name is required')
      expect(result.body.issues[1].message).toContain('last name is required')
      expect(result.body.issues[2].message).toContain('profile pic is required')
      expect(result.body.issues[3].message).toContain('phone is required')
      expect(result.body.issues[4].message).toContain('address is required')
      expect(result.body.issues[5].message).toContain('city is required')
      expect(result.body.issues[6].message).toContain('state is required')
      expect(result.body.issues[7].message).toContain('zipcode is required')
      expect(result.body.issues[8].message).toContain('bio is required')
   })   
})

describe('Test friend deletion', () => {
  test('succeeds deleting a friend :-( ', async () => {
    const friendsAtStart = await test_helper.friendsInDb()
    const friendToDelete = friendsAtStart[0]
    await api
      .delete(`/api/v1/friends/${friendToDelete._id}`)
      .expect(204)
    const friendsAtEnd = await test_helper.friendsInDb()
    expect(friendsAtEnd).toHaveLength(initialFriends.length - 1)
    const contents = friendsAtEnd.map(f => f._id)
    expect(contents).not.toContain(friendToDelete._id)    
  })
})

describe('Test friend update', () => {
  test('Succesfull update', async() => {
    const friendsAtStart = await test_helper.friendsInDb()
    const friendToUpdate = friendsAtStart[0]
    const updateData = {
      first_name: 'Jose',
    }
    const resultFriend = await api
      .put(`/api/v1/friends/${friendToUpdate._id}`)
      .send(updateData)
      .expect(200)
      expect(resultFriend.body.first_name).toEqual('Jose')
  })
})

describe('Test algorithm requirement with dataset', () => {
  test('Fails without one of the params', async() => {
    await api
      .get('/api/v1/friends/shortestConnection/5a422a851b54a676234d1899')
      .expect(404)
  })
  test('Fails if id is good but no friend exist to search', async() => {
    const res = await api
      .get('/api/v1/friends/shortestConnection/5a422a851b54a676234d1897/5a422a851b54a676234d1899')
      .expect(400)
    expect(res.body.error).toContain('Friend not found or invalid')
  })
  test('Fails if no friends found', async() => {
    const res = await api
      .get('/api/v1/friends/shortestConnection/5a422a851b54a676234d1898/5a422a851b54a676234d1899')
      .expect(400)
    expect(res.body.error).toContain('No friends found')
  })
  test('Fails if no conections exist between friends', async() => {
    const res = await api
      .get('/api/v1/friends/shortestConnection/5a422a851b54a676234d1899/5a422a851b54a676234d1898')
      .expect(400)
    expect(res.body.error).toContain('No conection between friends')
  })
  test('Succeed but are direct friends', async() => {
    const res = await api
      .get('/api/v1/friends/shortestConnection/5a422a851b54a676234d1901/5a422a851b54a676234d1902')
      .expect(200)
    expect(res.body.result).toContain('Direct Friends')
  })
  test('Succeed with short conection list of ids', async() => {
    const res = await api
      .get('/api/v1/friends/shortestConnection/5a422a851b54a676234d1899/5a422a851b54a676234d1903')
      .expect(200)
    expect(res.body.result).toHaveLength(1)
  })
  test('Shortest path test using only the library', () => {
      const route = new DjkGraph()
      route.addNode('A', { B:1 })
      route.addNode('B', { A:1, C:2, D: 4 })
      route.addNode('C', { B:2, D:1 })
      route.addNode('D', { C:1, B:4 })
      const fullShortestPath = route.path('A', 'D')
      const ShortestPath = route.path('A', 'D', {trim:true})
      expect(fullShortestPath).toHaveLength(4)
      expect(ShortestPath).toHaveLength(2)
  })
})

//disconect to db
afterAll(async() => {
  mongoose.connection.close()
})
