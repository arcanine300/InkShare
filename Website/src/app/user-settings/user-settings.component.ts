import { Component, Inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../data-model-manager.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { NgForm } from '@angular/forms';
import { ReqresAccount } from '../data-model-classes';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface DialogData {
    password: string
}

@Component({
    selector: 'app-user-settings',
    templateUrl: './user-settings.component.html',
    styleUrls: ['./user-settings.component.css']
})

export class UserSettingsComponent implements OnDestroy {

    // Properties

    private account: ReqresAccount;
    private newAccount: ReqresAccount;
    private friends: ReqresAccount[];
    private panelOpenState = false;
    private loginError: string;
    private displayedColumns: string[] = ['userName', 'email', 'numCanvases', 'options'];
    private themes: string[] = ["Light Blue", "Light Orange", "Dark Pink", "Dark Purple", "Dark Green"];
    private theme: string;
    private tempTheme: string;
    private dataSource;
    private deleteError: string;

    // Initialization

    constructor(
        private router: Router,
        private authService: AuthService,
        private jwtHelper: JwtHelperService,
        public dialog: MatDialog,
        private snackBar: MatSnackBar
    ) {
        if (localStorage.getItem('access_token').length > 50)
            try {
                this.account = this.jwtHelper.decodeToken(localStorage.getItem('access_token'));
                this.theme = this.account.theme;
                this.newAccount = this.account;
                this.newAccount.password = "";
                this.authService.reqresAccountGetById(this.account._id).subscribe((data1) => {
                    this.account = data1;
                    this.newAccount.friends = this.account.friends;
                    this.authService.reqresAccountGetByFriendId(this.account._id).subscribe((data2) => {
                        this.friends = data2;
                        this.dataSource = new MatTableDataSource(this.friends)
                    });
                });
            } catch (err) {
                console.error(err);
                this.router.navigate(['/login']); 
            }
        else { this.router.navigate(['/login']); }
        this.deleteError = '';
    }

    // Methods
    applyFilter(filterValue: string) {
        this.dataSource.filter = filterValue.trim().toLowerCase();
    }

    removeFriend(friend) {
        for (let index = 0; index < this.newAccount.friends.length; index++) {
            if (friend._id == this.newAccount.friends[index]) {
                this.newAccount.friends.splice(index, 1);
                this.friends[index].marked = true;
                this.dataSource = new MatTableDataSource(this.friends)
                break;
            }
        }
    }

    changeTheme(theme: string) {
        if (theme == "Light Blue") {
            //return "candy-theme";
            this.tempTheme = this.account.theme.replace(/\s+/g, '-').toLowerCase();
            this.tempTheme += "-theme";
            document.getElementById('theme').classList.remove(this.tempTheme);
            document.getElementById('theme').classList.add("light-blue-theme");
            this.account.theme = "Light Blue";
        }
        else if(theme == "Light Orange") {
            //return "purple-theme";
            this.tempTheme = this.account.theme.replace(/\s+/g, '-').toLowerCase();
            this.tempTheme += "-theme";
            document.getElementById('theme').classList.remove(this.tempTheme);
            document.getElementById('theme').classList.add("light-orange-theme");
            this.account.theme = "Light Orange";
        }
        else if (theme == "Dark Pink") {
            //return "dark-pink-theme";
            this.tempTheme = this.account.theme.replace(/\s+/g, '-').toLowerCase();
            this.tempTheme += "-theme";
            document.getElementById('theme').classList.remove(this.tempTheme);
            document.getElementById('theme').classList.add("dark-pink-theme");
            this.account.theme = "Dark Pink";
        }
        else if (theme == "Dark Purple") {
            //return "dark-purple-theme";
            this.tempTheme = this.account.theme.replace(/\s+/g, '-').toLowerCase();
            this.tempTheme += "-theme";
            document.getElementById('theme').classList.remove(this.tempTheme);
            document.getElementById('theme').classList.add("dark-purple-theme");
            this.account.theme = "Dark Purple";
        }
        else if (theme == "Dark Green") {
            //return "dark-purple-theme";
            this.tempTheme = this.account.theme.replace(/\s+/g, '-').toLowerCase();
            this.tempTheme += "-theme";
            document.getElementById('theme').classList.remove(this.tempTheme);
            document.getElementById('theme').classList.add("dark-green-theme");
            this.account.theme = "Dark Green";
        }
    }

    delete(): void {
        const dialogRef = this.dialog.open(DeleteAccountDialog, {
            height: '250px',
            width: '400px',
            data: { input: this.newAccount.password }
        });
        dialogRef.afterClosed().subscribe(password => {
            if (password)
                this.newAccount.password = password;
            else
                this.newAccount.password = undefined;
            this.loginError = undefined;
            if (this.newAccount.password)
                this.authService.deleteAccount(this.newAccount).subscribe(data => {
                    if (data) {
                        localStorage.clear();
                        this.account = undefined;
                        this.router.navigate(['/home']).then(() => {
                            this.snackBar.open("Your account has been removed", "Thanks", {
                                duration: 4000,
                            }); });
                    } else {
                        this.loginError = localStorage.getItem('error');
                    }
                });
            else {
                this.loginError = "You must enter your password to delete your account";
                this.newAccount.password = "";
            }
        });
    }

    ngOnDestroy(): void {
        if (this.account)
            this.changeTheme(this.theme);
    }

    onSubmit(): void {
        const dialogRef = this.dialog.open(PasswordDialog, {
            height: '250px',
            width: '400px',
            data: { input: this.newAccount.password }
        });
        dialogRef.afterClosed().subscribe(password => {
            this.applyFilter("")
            if (password)
                this.newAccount.password = password;
            else
                this.newAccount.password = undefined;
            this.loginError = undefined;
            this.theme = this.newAccount.theme;
            if (this.newAccount.password)
                this.authService.updateAccount(this.newAccount).subscribe(data1 => {
                    if (data1) {
                        localStorage.setItem('access_token', data1.token);
                        this.account = this.jwtHelper.decodeToken(data1.token);
                        this.snackBar.open("Settings updated successfully!", "Thanks", {
                            duration: 3000,
                        });
                        this.authService.reqresAccountGetByFriendId(this.account._id).subscribe((data2) => {
                            this.friends = data2;
                            this.dataSource = new MatTableDataSource(this.friends)
                        });
                    } else {
                        this.loginError = localStorage.getItem('error');
                        this.snackBar.open("Settings could not be updated:\n" + this.loginError, "Oops", {
                            duration: 6000,
                        });
                    }
                });
            else {
                this.loginError = "You must enter your password to save your settings";
                this.newAccount.password = "";
            }
        });
    }
}

// Email and password
export class LoginCredentials {
    email: string;
    userName: string;
    password: string;
}

@Component({
    selector: 'account-password.dialog',
    templateUrl: 'account-password.dialog.html',
})
export class PasswordDialog {

    constructor(
        public dialogRef: MatDialogRef<PasswordDialog>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData) { }

    onNoClick(): void {
        this.dialogRef.close();
    }
}

@Component({
    selector: 'account-delete.dialog',
    templateUrl: 'account-delete.dialog.html',
})
export class DeleteAccountDialog {

    constructor(
        public dialogRef: MatDialogRef<DeleteAccountDialog>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData) { }

    onNoClick(): void {
        this.dialogRef.close();
    }
}