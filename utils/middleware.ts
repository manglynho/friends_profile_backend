import logger from './logger';
import { Request, Response, NextFunction, RequestHandler } from "express";
import { FriendRequest } from "../types/friend_types";
import Friend from '../models/friend';
import { AnyZodObject } from "zod";

const requestLogger = ( req : Request, _res : Response, next : NextFunction ) => {
  logger.info('Method:', req.method);
  logger.info('Path:  ', req.path);
  logger.info('Body:  ', req.body);
  logger.info('---');
  next();
};

const unknownEndpoint = (_req : Request, res : Response) => {
  res.status(404).send({ error: 'unknown endpoint' });
};

const errorHandler = ( error: { message: any; name: string; }, _req : Request, res : Response, next : NextFunction ) => {
  logger.error(error.message);
  if (error.name === 'CastError') {
    return res.status(400).send({ error: 'malformatted id' });
  } else if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message });
  }
  next(error);
};

export const friendFinder = ( async (req : FriendRequest, _res : Response, next : NextFunction) => {
  req.friend = await Friend.findById(req.params.id).populate("friends");
  next();
}) as RequestHandler ;


export const secureFriend = (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      return res.status(400).json(error);
    }
};

export default {
  requestLogger,
  unknownEndpoint,
  errorHandler  
};