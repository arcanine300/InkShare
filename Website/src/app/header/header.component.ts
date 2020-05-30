import { Component } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { AuthService } from '../data-model-manager.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ReqresAccount } from '../data-model-classes';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {

  private account: ReqresAccount;

  constructor(
    private router: Router,
    private authService: AuthService,
    private jwtHelper: JwtHelperService,
    public route: ActivatedRoute
  ) {
    this.router.events.subscribe((ev) => {
      if (ev instanceof NavigationEnd) { this.updateHeader(); } // Update the header if the user moves pages
    });
  }

  updateHeader(): void {
    let token = this.authService.getToken();
    if (token)
      try {
        // First attempt a cached load
        this.account = this.jwtHelper.decodeToken(localStorage.getItem('access_token'));
        // If there was a cache, we can use that while we load any applicable updated data.
        // If there was no cache, we'll just have to wait anyways.
        this.authService.reqresAccountGetById(this.account._id).subscribe((data) => {
          this.account = data;
        });
      } catch (err) {
        this.account = undefined;
        console.log(err);
      }
  }

  navigate(notification: any): void {
    this.router.navigate([notification.link]);
    this.authService.popNotification(this.account._id, notification).subscribe((data) => {
      this.updateHeader();
    });
  }

  dismissNotif(notification: any): void {
    if (notification == "all")
      for (let index = 0; this.account.notifications.length > index; index++) {
        this.authService.popNotification(this.account._id, { _id: this.account.notifications[index]._id}).subscribe((data) => {
          if (this.account.notifications.length - 1 == index)
            this.updateHeader();
        });
      }
    else
    this.authService.popNotification(this.account._id, notification).subscribe((data) => {
      this.updateHeader();
    });
  }

  logout(): void {
    localStorage.clear();
    this.account = undefined;
    this.router.navigate(['/login']);
  }
}

export class notificationStruct {
  _id: string;
  title: string;
  date: Date;
  content: string;
  link: string;
  originEmail: string;
  constructor(title: string, content: string, link: string = "", originEmail: string) {
    this.title = title;
    this.content = content;
    this.link = link;
    this.originEmail = originEmail;
  }
}