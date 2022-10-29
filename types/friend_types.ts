import { Request } from "express";


export interface FriendRequest extends Request {
    friend?: any;
}

export interface FriendEntry {
    _id?: string;
    img: string;
    first_name: string;
    last_name: string;
    phone: string;
    address_1: string;
    city: string;
    state: string;
    zipcode: number;
    bio: string;
    photos?: Array<string>;
    statuses?: Array<String>;
    available?: Boolean;
    friends?: Array<String>;
    __v?:number;
}
