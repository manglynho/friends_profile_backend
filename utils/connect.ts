import mongoose from "mongoose";
import dotenv  from "dotenv";
dotenv.config();
import { MONGODB_URI } from './config';
import initialFriends from '../data/initialFriends';
import Friend from '../models/friend';
import logger from "./logger";

const connect = () => {
    logger.info('connecting to', MONGODB_URI);    
    mongoose.connect( MONGODB_URI )
    .then((connection) => {
    logger.info('connected to MongoDB');
    return connection.connection.db.listCollections({name: 'friends'}).toArray();
    })
    .then( async (collections) => {  
        if( process.env.NODE_ENV !== 'test'){
            const obj = collections.find(data => data.name === 'friends');
            if ( !obj ) {
            const friendsObjects = initialFriends.map(friend => new Friend(friend));
            const promiseArray = friendsObjects.map(friend => friend.save());
            await Promise.all(promiseArray);
            } 
        }           
    })
    .catch((error: any) => {
    logger.error('error connecting to MongoDB:', error.message);
    });
};

export default connect;