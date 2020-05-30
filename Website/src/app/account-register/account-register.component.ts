import { Component, OnInit } from '@angular/core';
import { AuthService } from '../data-model-manager.service';
import { ReqresAccount, ReqresCanvas } from '../data-model-classes'

import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { AbstractControl, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-account-register',
    templateUrl: './account-register.component.html',
    styleUrls: ['./account-register.component.css']
})
export class AccountRegisterComponent implements OnInit {

    // Properties

    private account: ReqresAccount;
    private accounts: ReqresAccount[];
    private canvas: ReqresCanvas;
    private creationError: string;
    private formGroup: FormGroup;
    private emailFormGroup: FormGroup;
    private userNameFormGroup: FormGroup;
    private passwordFormGroup: FormGroup;

    // Initialization

    get formArray(): AbstractControl | null { return this.formGroup.get('formArray'); }

    constructor(
        private router: Router,
        private authService: AuthService,
        private jwtHelper: JwtHelperService,
        private formBuilder: FormBuilder,
        private snackBar: MatSnackBar
    ) {
        this.account = new ReqresAccount();
        this.account.email = '';
        this.account.userName = '';
        this.account.password = '';
        this.account.passwordConfirm = '';
        this.account.isAdmin = false;
        this.creationError = '';
        this.accounts = undefined;
    }

    ngOnInit() {
        this.authService.reqresAccountGetAll().subscribe(data => {
            if (data)
                this.accounts = data;
        });

        this.emailFormGroup = this.formBuilder.group({
            emailFormCtrl: ['', [Validators.required, Validators.pattern("^[A-z0-9._%+-]+@[A-z0-9.-]+\.[A-z]{2,}$")]]
        });

        this.userNameFormGroup = this.formBuilder.group({
            userNameFormCtrl: ['', [Validators.required, Validators.maxLength(50)]]
        });

        this.passwordFormGroup = this.formBuilder.group({
            passwordFormCtrl: ['', Validators.required],
            passwordConfirmFormCtrl: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(50)]]
        });

        this.formGroup = this.formBuilder.group({
            formArray: this.formBuilder.array([
                this.emailFormGroup,
                this.userNameFormGroup,
                this.passwordFormGroup
            ])
        });
    }

    regTest(expression, test): boolean {
        return RegExp(expression).test(test);
    }

    existTest(email): boolean {
        try {
            let flag = false;
            this.accounts.forEach(element => {
                if (!flag && element.email == email)
                    flag = true;
            });
            return flag;
        } catch (error) {
            return true;
        }
    }

    onSubmit(): void {
        this.account.email = this.formGroup.get('formArray').value[0].emailFormCtrl;
        this.account.userName = this.formGroup.get('formArray').value[1].userNameFormCtrl;
        this.account.password = this.formGroup.get('formArray').value[2].passwordFormCtrl;
        this.account.passwordConfirm = this.formGroup.get('formArray').value[2].passwordConfirmFormCtrl;
        this.authService.createAccount(this.account).subscribe(data => {
            if (data) {
                this.snackBar.open(this.account.email + " created successfully, you can now log in!", "Thanks", {
                    duration: 8000,
                });
                this.router.navigate(['/login']);
            }
            else this.creationError = localStorage.getItem('error');
        });
    }

    reset(): void {
        this.router.navigate(['/forgotpass']);
    }
}