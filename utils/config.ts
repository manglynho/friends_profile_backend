
require('dotenv').config()

export const PORT : number = process.env.PORT ?  Number(process.env.PORT) : 3001
export let MONGODB_URI : string = process.env.MONGODB_URI ? process.env.MONGODB_URI : ''

if (process.env.NODE_ENV === 'test') {
  MONGODB_URI = process.env.TEST_MONGODB_URI ? process.env.TEST_MONGODB_URI : ''
}

