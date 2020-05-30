// Account
export class ReqresAccount {
    _id: string;
    userName: string;
    password: string;
    email: string;
    passwordConfirm: string;
    canvases: string[];
    friends: string[];
    isAdmin: boolean;
    avatar: string;
    theme: string;
    permissions?: string;
    notifications: [{ _id?: string, source: string, date: string, content: string, link: string, friendEmail: string}];
    marked?: boolean;
}

// Canvas
export class ReqresCanvas {
    _id: string;
    name: string;
    type: string;
    owner: string;
    modified: string;
    dimensions: { width: number, height: number }
    participants: [{_id: string, permissions: string}];
    image: {
        pixels: string, // A btoa() of the flyweight byte array of pixels, serailized for mongodb transport
        length: number, // Length of the pixels string, for debugging and comparison with mongoDB limitations
        width: number, // Width at time of canvas saving
        height: number // height at time of canvas saving
    };
}

// Package that delivers a collection of Accounts
export class ReqresAccountCollectionPackage {
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
    data: ReqresAccount[];
}

// Package that delivers a collection of Canvases
export class ReqresCanvasCollectionPackage {
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
    data: ReqresCanvas[];
}

// Package that delivers one Account
export class ReqresAccountSinglePackage {
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
    data: ReqresAccount;
}

// Response from "add/edit" POST/PUT request
export class ReqresAccountCreateResponse {
    id?: number;
    name: string;
    job: string;
    createdAt: string;  // ISO8601 date and time string
}

// Package that delivers one Canvas
export class ReqresCanvasSinglePackage {
    page?: number; //depriciate
    per_page?: number;//depriciate
    total?: number;//depriciate
    total_pages?: number;//depriciate
    data: ReqresAccount;
    _id: string;
    participants: string[];
    name: string;
    owner: string;
}

// Response from "add/edit" POST/PUT request
export class ReqresCanvasCreateResponse {
    id?: number;
    name: string;
    job: string;
    createdAt: string;  // ISO8601 date and time string
}

export class Active {
    isActive: boolean;
}