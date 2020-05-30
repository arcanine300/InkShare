import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CanvasComponent } from './canvas/canvas.component';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { GuardAuthService } from './guard-auth.service';
import { LoginComponent } from './login/login.component';
import { AccountRegisterComponent } from './account-register/account-register.component';
import { LibraryComponent } from './library/library.component';
import { UserSettingsComponent } from './user-settings/user-settings.component';
import { ResetComponent } from './reset/reset.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component'
import { InviteComponent } from './invite/invite.component'

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full'},
  { path: 'home', component: HomeComponent, data: { animation: 'home' } },
  { path: 'about', component: AboutComponent, data: { animation: 'about' } },
  { path: 'register', component: AccountRegisterComponent, data: { animation: 'register' } },
  { path: 'login', component: LoginComponent, data: { animation: 'login' } },
  { path: 'settings', component: UserSettingsComponent, canActivate: [GuardAuthService], data: { animation: 'settings' } },
  { path: 'library', component: LibraryComponent, canActivate: [GuardAuthService], data: { animation: 'library' } },
  { path: 'accept/:email', component: LibraryComponent, canActivate: [GuardAuthService], data: { animation: 'library' } },
  { path: 'library/view/:email', component: LibraryComponent, canActivate: [GuardAuthService], data: { animation: 'library' } },
  { path: 'library/sort/:email', component: LibraryComponent, canActivate: [GuardAuthService], data: { animation: 'library' } },
  { path: 'edit/:email/:canvas', component: CanvasComponent, canActivate: [GuardAuthService], data: { animation: 'library' } },
  { path: 'user/reset', component: ResetComponent, canActivate: [GuardAuthService], data: { animation: 'account' } },
  { path: 'forgotpass', component: ForgotPasswordComponent, data: { animation: 'account' } },
  { path: 'invite', component: InviteComponent, canActivate: [GuardAuthService], data: { animation: 'account' } },
  { path: 'invite/:email', component: InviteComponent, canActivate: [GuardAuthService], data: { animation: 'account' } }
];  

@NgModule({
  imports: [RouterModule.forRoot(routes, {onSameUrlNavigation: 'reload'})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
