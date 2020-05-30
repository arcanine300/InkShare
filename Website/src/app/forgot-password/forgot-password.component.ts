import { Component } from '@angular/core';
import { AuthService } from '../data-model-manager.service';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {

  // Properties
  credentials: ForgotPasswordCredentials;
  forgotPassError: string;

  // Initialization

  constructor(
    private router: Router,
    private authService: AuthService,
    private jwtHelper: JwtHelperService
  ) {
    this.credentials = new ForgotPasswordCredentials();
    this.credentials.email = '';
    this.forgotPassError = '';
  }

  // Methods
  onSubmit(): void {
    this.authService.requestNewPassword(this.credentials).subscribe(data => {
      if (data) {
        this.router.navigate(['/login']);
      }
      else {
        this.forgotPassError = localStorage.getItem('error');
      }
    })
  }


}


export class ForgotPasswordCredentials {
  email: string;
}