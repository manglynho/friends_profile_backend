import mongoose from 'mongoose'
import { FriendEntry } from '../types/friend_types'

const friendSchema = new mongoose.Schema({
  img: {
    type: String,
    required: [true, 'Profile pic required'],
  },
  first_name: {
    type: String,
    required: [true, 'First name required'],
  },
  last_name: {
    type: String,
    required: [true, 'Last name required'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number required'],
  },
  address_1: {
    type: String,
    required: [true, 'Address 1 required'],
  },
  city: {
    type: String,
    required: [true, 'City required'],
  },
  state: {
    type: String,
    required: [true, 'State required'],
  },
  zipcode: {
    type: Number,
    required: [true, 'Zipcode required'],
  },
  bio: {
    type: String,
    required: [true, 'Bio required'],
  },
  photos: {
    type: [ String ],
  },
  statuses: {
    type: [String],
  },
  available: {
    type: Boolean,
    default: false,
  },
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Friend',
    }
  ]
})

friendSchema.set('toJSON', {
  transform: (_document, returnedObject) => {
    delete returnedObject.__v
  }
})

const Friend = mongoose.model<FriendEntry>('Friend', friendSchema)

export default Friend
