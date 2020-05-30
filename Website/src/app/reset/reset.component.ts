import { Component} from '@angular/core';
import { AuthService } from '../data-model-manager.service';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-reset',
  templateUrl: './reset.component.html',
  styleUrls: ['./reset.component.css']
})
export class ResetComponent {

  // Properties
  
  credentials: ResetCredentials;
  resetError: string;

  // Initialization

  constructor(
    private router: Router,
    private a: AuthService,
    private jwtHelper: JwtHelperService
  ) { 
    this.credentials = new ResetCredentials();
    this.credentials.email = '';
    this.credentials.password = '';
    this.credentials.newPassword = '';
    this.credentials.newPasswordConfirm = '';
    this.resetError = '';
  }

  // Methods
  onSubmit(): void {
    if(this.credentials.newPassword != this.credentials.newPasswordConfirm)
      this.resetError = "Error - New Passwords do not match";
    else {
      this.a.changePassword(this.credentials).subscribe(data => {
        if (data)
          this.router.navigate(['/home']);
        else
          this.resetError = localStorage.getItem('error');
      })
    }
  }
}

export class ResetCredentials {
  email: string;
  password: string;
  newPassword: string;
  newPasswordConfirm: string;
}