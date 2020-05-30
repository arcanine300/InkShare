import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';

import { AuthService } from './data-model-manager.service';

@Injectable()
export class GuardAuthService implements CanActivate {
    
    // Initialization

    constructor(
        private auth: AuthService,
        private router: Router
    ) { }

    // Methods

    canActivate(): boolean {
        if (!this.auth.isAuthenticated()) {
            this.router.navigate(['/login']);
            return false;
        }
        return true;
    }
}