import { Component, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../data-model-manager.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { NgForm } from '@angular/forms';
import { ReqresCanvas, ReqresAccount } from '../data-model-classes';
import { NgLocalization } from '@angular/common';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {

    // Properties
    private account: ReqresAccount;
    private credentials: LoginCredentials;
    private loginError: string;

    // Initialization
    
    constructor(
        private router: Router,
        private authService: AuthService,
        private jwtHelper: JwtHelperService
    ) {
        if (localStorage.getItem('access_token'))
            try {
                this.account = new ReqresAccount();
                this.account = this.jwtHelper.decodeToken(localStorage.getItem('access_token'));
            } catch (err) { console.log(err); }
        this.credentials = new LoginCredentials();
        this.credentials.email = '';
        this.credentials.password = '';
        this.loginError = '';
    }

    // Methods
    onSubmit(): void {
        localStorage.clear();
        this.authService.login(this.credentials).subscribe(data => {
            if (data) {
                localStorage.setItem('access_token', data.token);
                this.account = this.jwtHelper.decodeToken(data.token);
                document.getElementById('theme').classList.remove("dark-pink-theme");
                document.getElementById('theme').classList.add(this.account.theme.replace(/\s+/g, '-').toLowerCase() + "-theme");
                this.router.navigate(['/library']);
            } else
                this.loginError = localStorage.getItem('error');
        });
    }

    reset(): void {
        this.router.navigate(['/forgotpass']);
    }

    logout(): void {
        document.getElementById('theme').classList.remove(this.account.theme.replace(/\s+/g, '-').toLowerCase() + "-theme");
        localStorage.clear();
        document.getElementById('theme').classList.add("dark-pink-theme");
        this.router.navigate(['/home']);
    }
}

// Email and password
export class LoginCredentials {
    email: string;
    password: string;
}