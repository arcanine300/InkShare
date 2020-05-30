import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';

import { AuthService } from './data-model-manager.service';
import { Observable } from 'rxjs';

@Injectable()
export class InterceptTokenService implements HttpInterceptor {

    // Initialization
    
    constructor(private a: AuthService) { }

    // Methods
    
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        request = request.clone({
            setHeaders: {
                Authorization: `JWT ${this.a.getToken()}`
            }
        });
        return next.handle(request);
    }
}