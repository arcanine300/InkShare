import { Component } from '@angular/core';
import { AuthService } from '../data-model-manager.service';
import { ActivatedRoute } from "@angular/router";
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ReqresCanvas } from '../data-model-classes';

@Component({
  selector: 'app-invite',
  templateUrl: './invite.component.html',
  styleUrls: ['./invite.component.css']
})


export class InviteComponent {

  invite: CreateInvite;

    private tempRoom: string;  //temp room is used to store the input of
    private tokenDecoded;
    private canvases;
    private canvas1;
    private id: string;
    private email: string;
    private request: boolean;
    updateError: string;

    // Initialization
    
    constructor(
        private router: Router,
        private a: AuthService,
        private jwtHelper: JwtHelperService,
        private route: ActivatedRoute
    ) {
      this.invite = new CreateInvite();
      this.invite.email = "";
      this.invite.id = "";
      this.tokenDecoded = this.jwtHelper.decodeToken(localStorage.getItem('access_token'));
      this.email = this.route.snapshot.params['email'];
      this.id = this.route.snapshot.params['id'];
      if (!this.id)
        this.id = "";
      if (!this.email) {
        this.request = false;
        this.email = this.tokenDecoded.email;
      } else {
        this.request = true;
      }
      this.a.reqresCanvasGetById(this.tokenDecoded._id).subscribe(data => {
          if (data)
            this.canvases = data;
      });
    }

    onSubmit(): void {
      this.a.reqresCanvasGetById(this.invite.id).subscribe(data => {
        if (data){
          console.log(data);
          console.log(this.canvas1);
          this.canvas1 = data;
          console.log(this.canvas1);
          this.a.updateCanvas(this.canvas1).subscribe(data => {
              if (data) {
                  this.router.navigate(['/library']).then( () => { location.reload(); } );
              } else {
                  this.updateError = localStorage.getItem('error');
              }
          });
        }
    });
  }
}

export class CreateInvite {
  email: string;
  id: string;
}