import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Observable } from 'rxjs';
import { returnData } from './canvas/canvas.component'

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {

  //node js / socket io server url to connect to
  //readonly url: string = "http://192.168.2.30:8000/"
  readonly url: string = "http://localhost:8000/"
  //readonly url: string = 'https://socketio-webservice.herokuapp.com/'

  constructor() {}

  socket: any;

  connect(){ this.socket = io(`${this.url}`); }

  setRoom(data: string) { this.socket.emit('setRoom', data); }

  leaveRoom(data: string) { this.socket.emit('leaveRoom', data); }

  listen(eventName: string) {
    return new Observable((user) => {
      this.socket.on(eventName, (data) => {
        user.next(data);
      })
    });
  }

  emit(eventName: string, data: any) { this.socket.emit(eventName, data); }
}
