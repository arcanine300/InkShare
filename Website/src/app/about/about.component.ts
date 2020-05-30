import { Component } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ReqresAccount, ReqresCanvas } from '../data-model-classes';
import { AuthService } from '../data-model-manager.service';

@Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.css']
})
export class AboutComponent {

    // Properties

    private account: ReqresAccount;
    private canvas: string;
    private accountToken?: string;
    private accountTokenIssuedTimestamp: any;

    // Initialization

    constructor(
        private jwtHelper: JwtHelperService,
        private authService: AuthService
    ) {
        this.account = undefined;
        this.accountToken, 
            this.canvas,
            this.accountTokenIssuedTimestamp = "No Token";
        if (localStorage.getItem('access_token'))
            try {
                this.accountToken = localStorage.getItem('access_token')
                this.account = this.jwtHelper.decodeToken(this.accountToken);
                this.accountTokenIssuedTimestamp = new Date(this.jwtHelper.decodeToken(this.accountToken).iat * 1000);
                this.canvas = localStorage.getItem('canvas');

                this.authService.reqresAccountGetById(this.account._id).subscribe((data) => {
                    this.account = data;

                    /*this.authService.reqresCanvasGetByParticipantId(this.account._id).subscribe((data) => {
                        this.canvases = data;
                    });*/

                    /*this.authService.reqresAccountGetByFriendId(this.account._id).subscribe((data) => {
                        this.friends = data;
                    });*/
                });
            } catch (err) {
                console.log(err);
            }
    }

}
