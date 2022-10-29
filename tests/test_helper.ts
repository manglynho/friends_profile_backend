import Friend from '../models/friend'

const nonExistingFriendId = async () => {
  const friend = new Friend({
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
  })
  await friend.save()
  await friend.remove()
  return friend._id.toString()
}

const friendsInDb = async () => {
  const friends = await Friend.find({})
  return friends.map(friend => friend.toJSON())
}

export default{
  friendsInDb,
  nonExistingFriendId
}



