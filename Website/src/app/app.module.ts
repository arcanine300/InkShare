import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from "@angular/common/http";
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { JwtModule } from "@auth0/angular-jwt";
import { ColorPickerModule } from 'ngx-color-picker';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { FlexLayoutModule } from '@angular/flex-layout';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { HeaderComponent } from './header/header.component';
import { CanvasComponent, SettingsDialog } from './canvas/canvas.component';
import { LoginComponent } from './login/login.component';
import { AboutComponent } from './about/about.component';
import { AuthService } from './data-model-manager.service';
import { GuardAuthService } from './guard-auth.service';
import { InterceptTokenService } from "./intercept-token.service";
import { AccountRegisterComponent } from './account-register/account-register.component';
import { LibraryComponent, CreateDialog, DeleteDialog, AddFriendDialog, AddParticipantDialog } from './library/library.component';
import { UserSettingsComponent, PasswordDialog, DeleteAccountDialog } from './user-settings/user-settings.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ResetComponent } from './reset/reset.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { InviteComponent } from './invite/invite.component';
import { AngularMaterials } from './angular-materials';
import {MatExpansionModule} from '@angular/material/expansion';

export function tokenGetter() { return localStorage.getItem('access_token'); }

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    HeaderComponent,
    CanvasComponent,
    LoginComponent,
    AccountRegisterComponent,
    LibraryComponent,
    AboutComponent,
    UserSettingsComponent,
    ResetComponent,
    ForgotPasswordComponent,
    InviteComponent,
    PasswordDialog,
    CreateDialog,
    DeleteDialog,
    DeleteAccountDialog,
    SettingsDialog,
    AddFriendDialog,
    AddParticipantDialog
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    HttpClientModule,
    ColorPickerModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatExpansionModule,
    BrowserModule,
    FlexLayoutModule,
    AngularMaterials,
    ReactiveFormsModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: tokenGetter,
        authScheme: 'JWT'
      }
    }),
    BrowserAnimationsModule
  ],
  exports: [
    PasswordDialog,
    CreateDialog,
    DeleteDialog,
    DeleteAccountDialog,
    SettingsDialog,
    AddFriendDialog,
    AddParticipantDialog
  ],
  providers:[
    AuthService,
    GuardAuthService,
    LoginComponent,
    {
        provide: HTTP_INTERCEPTORS,
        useClass: InterceptTokenService,
        multi: true
    }
],
  bootstrap: [AppComponent],
  entryComponents: [
    PasswordDialog,
    CreateDialog,
    DeleteDialog,
    DeleteAccountDialog,
    SettingsDialog,
    AddFriendDialog,
    AddParticipantDialog
  ]
})
export class AppModule { }
