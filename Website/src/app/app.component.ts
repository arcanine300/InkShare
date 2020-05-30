// Library imports
import { Component, HostBinding, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { transition } from '@angular/animations'
import { AuthService } from './data-model-manager.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ReqresAccount, ReqresCanvasCollectionPackage, ReqresAccountCollectionPackage } from './data-model-classes';
import {UserSettingsComponent} from './user-settings/user-settings.component'

// Component imports
import { animations } from './animations';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: animations
})
export class AppComponent implements OnInit {

  private account: ReqresAccount
  private tempTheme: string;
  
  constructor(
    private authService: AuthService,
    private jwtHelper: JwtHelperService,
  ) {
    let token = this.authService.getToken();
    try {
      if (token) {
        this.account = this.jwtHelper.decodeToken(token);
        this.authService.reqresAccountGetById(this.account._id).subscribe((data) => {
          this.account = data;
        });
      }
    } catch (err) {
      localStorage.clear()
      console.log(err);
    }
  }
  ngOnInit() {
    if (this.account)
      this.tempTheme = this.account.theme.replace(/\s+/g, '-').toLowerCase();
    else 
      this.tempTheme = "dark-pink";
    this.tempTheme += "-theme";
    document.getElementById('theme').classList.add(this.tempTheme);
  }

  @HostBinding('@pageAnimations')
  public animatePage = true;
  public title = 'Inkshare';

  getAnimationData(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
  }
}