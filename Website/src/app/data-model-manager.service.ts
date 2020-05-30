import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { JwtHelperService } from '@auth0/angular-jwt';

import { Observable, of } from "rxjs";
import { map, tap, catchError } from 'rxjs/operators';
import { LoginCredentials } from './login/login.component';
import { ResetCredentials } from './reset/reset.component';
import { ForgotPasswordCredentials } from './forgot-password/forgot-password.component';
import { mailCredentials } from './library/library.component'
import { notificationStruct } from './header/header.component'

import { Active, ReqresAccount, ReqresCanvas, ReqresAccountCollectionPackage, ReqresCanvasCollectionPackage, ReqresAccountSinglePackage, ReqresAccountCreateResponse, ReqresCanvasSinglePackage, ReqresCanvasCreateResponse } from "./data-model-classes";

@Injectable({ providedIn: 'root' })
export class AuthService {

    // Properties

    // Webservice API

    //private urlWebservice: string = "https://inkshare-webservice.herokuapp.com";

    // Local API
    private urlWebservice = "http://localhost:8080";
    
    private httpOptions = { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Source': 'InkShareHeaderOrigin'}) };

    // Initialization
    
    constructor(
        private http: HttpClient,
        private jwtHelper: JwtHelperService
    ) { }

    // Methods
    
    private handleError<T>(operation = 'operation', result?: T) {
        return (error: any): Observable<T> => {
            console.error(error.error);
            localStorage.setItem('error', error.error.error);
            return of(result as T);
        };
    }

    // Get one
    reqresAccountGetById(id: string): Observable<ReqresAccount> {
        return this.http.get<ReqresAccount>(`${this.urlWebservice}/accounts/${id}`, this.httpOptions);
    }

    reqresCanvasGetById(id: string): Observable<ReqresCanvas> {
        return this.http.get<ReqresCanvas>(`${this.urlWebservice}/canvases/${id}`, this.httpOptions);
    }

    // Get many
    reqresAccountGetAll(): Observable<ReqresAccount[]> {
        return this.http.get<ReqresAccount[]>(`${this.urlWebservice}/accounts`, this.httpOptions);
    }

    reqresCanvasGetAll(): Observable<ReqresCanvas[]> {
        return this.http.get<ReqresCanvas[]>(`${this.urlWebservice}/canvases`, this.httpOptions);
    }


    reqresAccountGetByFriendId(id: string): Observable<ReqresAccount[]> {
        return this.http.get<ReqresAccount[]>(`${this.urlWebservice}/accounts/friends/${id}`, this.httpOptions);
    }

    reqresAccountGetByCanvasId(id: string): Observable<ReqresAccount[]> {
        return this.http.get<ReqresAccount[]>(`${this.urlWebservice}/accounts/participates/${id}`, this.httpOptions);
    }

    reqresCanvasGetByParticipantId(id: string): Observable<ReqresCanvas[]> {
        return this.http.get<ReqresCanvas[]>(`${this.urlWebservice}/canvases/viewable/${id}`, this.httpOptions);
    }

    login(credentials: LoginCredentials): Observable<any> {
        return this.http.post<any>(this.urlWebservice + '/accounts/login', credentials, this.httpOptions).pipe(
            //Change this console log
            tap(() => console.log(`Login successful`)),
            catchError(this.handleError<any>('Failed to login'))
        );
    }

    createAccount(credentials: ReqresAccount): Observable<any> {
        return this.http.post<any>(this.urlWebservice + '/accounts/create', credentials, this.httpOptions).pipe(
            //Change this console log
            tap(() => console.log(`Creation successful`)),
            catchError(this.handleError<any>())
        );
    }

    createCanvas(canvas: ReqresCanvas): Observable<any> {
        return this.http.post<any>(this.urlWebservice + '/canvases/create', canvas, this.httpOptions).pipe(
            //Change this console log
            tap(() => console.log(`Creation successful`)),
            catchError(this.handleError<any>())
        );
    }

    updateAccount(account: ReqresAccount): Observable<any> {
        return this.http.put<any>(this.urlWebservice + '/accounts/update', account, this.httpOptions).pipe(
            //Change this console log
            tap(() => console.log(`Update successful`)),
            catchError(this.handleError<any>())
        );
    }

    updateCanvas(canvas: ReqresCanvas): Observable<any> {
        return this.http.put<any>(this.urlWebservice + '/canvases/update', canvas, this.httpOptions).pipe(
            //Change this console log
            tap(() => console.log(`Update successful`)),
            catchError(this.handleError<any>())
        );
    }

    deleteAccount(account: ReqresAccount): Observable<any> {
        return this.http.put<any>(this.urlWebservice + '/accounts/delete', account, this.httpOptions).pipe(
            //Change this console log
            tap(() => console.log(`Deletion successful`)),
            catchError(this.handleError<any>())
        );
    }

    deleteCanvas(canvas: ReqresCanvas): Observable<any> {
        return this.http.put<any>(this.urlWebservice + '/canvases/delete', canvas, this.httpOptions).pipe(
            //Change this console log
            tap(() => console.log(`Deletion successful`)),
            catchError(this.handleError<any>())
        );
    }

    changePassword(credentials: ResetCredentials): Observable<any> {
        return this.http.put<any>(this.urlWebservice + '/accounts/reset', credentials, this.httpOptions).pipe(
            //Change this console log
            tap(() => console.log('Password Change Successful')),
            catchError(this.handleError<any>('Password Change Failed'))
        );
    }

    requestNewPassword(credentials: ForgotPasswordCredentials): Observable<any> {
        return this.http.post<any>(this.urlWebservice + '/accounts/recovery', credentials, this.httpOptions).pipe(
            //Change this console log
            tap(() => console.log('Password Request Successful')),
            catchError(this.handleError<any>('Password Request Failed'))
        );
    }

    sendMail(mailObject: mailCredentials) : Observable<any> {
        return this.http.post<any>(this.urlWebservice + '/accounts/email', mailObject, this.httpOptions).pipe(
            tap(() => console.log('Email Delivery Successful')),
            catchError(this.handleError<any>('Email Delivery Failed'))
        );
    }

    pushNotification(id: string, title: string, content: string, link: string = "", originEmail: string = ""): Observable<any> {
        let notification = new notificationStruct(title, content, link, originEmail);
        return this.http.post<any>(`${this.urlWebservice}/accounts/notifications/${id}`, notification, this.httpOptions).pipe(
            tap(() => console.log('Notification successfully bound')),
            catchError(this.handleError<any>('Notification failed to bind'))
        );
    }

    popNotification(id: string, notification: { _id: string, date?: string, content?: string, link?: string}): Observable<any> {
        return this.http.put<any>(`${this.urlWebservice}/accounts/notifications/${id}`, notification, this.httpOptions).pipe(
            tap(() => console.log('Notification successfully unbound')),
            catchError(this.handleError<any>('Notification failed to unbind'))
        );
    }

    public getToken(): string { return localStorage.getItem('access_token'); }

    isAuthenticated(): boolean {
        const token = localStorage.getItem('access_token');
        if (token) {
            //console.log('Token provided');
            return true;
        } else {
            //console.log('No token provided');
            return false;
        }
    }
}