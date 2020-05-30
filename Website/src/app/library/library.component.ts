import { Component, Inject, OnInit } from '@angular/core';
import { AuthService } from '../data-model-manager.service';
import { ActivatedRoute } from "@angular/router";
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { SettingsDialog } from './../canvas/canvas.component';
import { Validators } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { NgForm } from '@angular/forms';
import { stringToKeyValue } from '@angular/flex-layout/extended/typings/style/style-transforms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { ReqresCanvas, ReqresAccount } from '../data-model-classes';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

export interface DialogData {
    canvasName: string;
    canvasParticipants: string[];
}

export interface ParticipantElement {
    userName: string;
    email: string;
    permissions: string;
}

@Component({
    selector: 'app-library',
    templateUrl: './library.component.html',
    styleUrls: ['./library.component.css']
})

export class LibraryComponent implements OnInit {

    // Properties

    private account: ReqresAccount;
    private accounts: ReqresAccount[];
    private canvas: ReqresCanvas;
    private canvases: ReqresCanvas[];
    private library: String;
    private options: string[];
    private selected: any;
    private participants: ReqresAccount[];
    private friends: ReqresAccount[];
    private displayedColumns: string[] = ['name', 'email', 'permissions', 'options'];
    private dataSource;
    private mail: mailCredentials;

    myControl = new FormControl('', [
        Validators.required,
        Validators.minLength(6),
        Validators.email
    ]);
    filteredOptions: Observable<string[]>;

    // Initialization

    constructor(
        private router: Router,
        private authService: AuthService,
        private jwtHelper: JwtHelperService,
        private route: ActivatedRoute,
        public dialog: MatDialog,
        private snackBar: MatSnackBar
    ) { 
        let token = this.authService.getToken();
        if (token)
            try {
                if (!this.jwtHelper.isTokenExpired(token))
                    this.account = this.jwtHelper.decodeToken(token);
                else throw "Login token has expired";
                this.library = this.route.snapshot.params['email'];
                if (!this.library)
                    this.router.navigate(['/library/view', this.account.email]);
            } catch (err) {
                console.log(err);
                this.router.navigate(['/login']);
            }
    }

    ngOnInit() {
        let token = this.authService.getToken();
        try {
            if (token)
                this.canvases = [];
            else { this.router.navigate(['/login']); }
            this.canvas = new ReqresCanvas();
            this.canvas.participants = [{ _id: "", permissions: "" }];
            this.account = this.jwtHelper.decodeToken(token);
            this.authService.reqresAccountGetById(this.account._id).subscribe((data1) => {
                this.account = data1;
                this.authService.reqresCanvasGetByParticipantId(this.account._id).subscribe((data2) => {
                    this.canvases = data2;
                    this.authService.reqresAccountGetAll().subscribe((data2) => {
                        this.accounts = data2;
                        if (this.library != this.account.email)
                            this.process(this.library);
                    });
                });   

                this.authService.reqresAccountGetByFriendId(this.account._id).subscribe((data2) => {
                    this.friends = data2;
                });
            });
        } catch (err) {
            console.log(err);
            this.router.navigate(['/login']);
        }
        

        this.mail = new mailCredentials();
        this.mail.id = '';
        this.mail.subject = '';
        this.mail.content = '';
        this.filteredOptions = this.myControl.valueChanges.pipe(
            startWith(''),
            map(value => this._filter(value))
        );
    }

    private _filter(value: string): string[] {
        const filterValue = value.toLowerCase();
        return this.options.filter(option => option.toLowerCase().indexOf(filterValue) === 0);
    }

    process(email: String) {
        if (!this.accounts) {
            this.snackBar.open("Unknown error", "Oops", {
                duration: 2500,
            });
            return;
        }
        this.accounts.forEach(account => {
            if (account.email == email) {
                let found = false;
                this.account.friends.forEach(friend => {
                    if (friend == account._id)
                        found = true;
                    // TODO: Add check to see if there's actually a request, or if we're being spoofed
                })
                this.authService.reqresAccountGetById(account._id).subscribe((data1) => {
                    account = data1;
                    if (this.router.url == `/accept/${this.library}` && !found) {
                        this.account.friends.push(account._id);
                        let response = this.authService.updateAccount(this.account).subscribe((data2) => {
                            account.friends.push(this.account._id);
                            response = this.authService.updateAccount(account).subscribe((data3) => {
                                console.log(6)
                                this.snackBar.open(`You and ${account.userName} are now friends!`, "Thanks", {
                                    duration: 4000,
                                });
                                this.router.navigate(['/library/view', account.email]);
                            });
                        });
                    } else if (this.router.url == `/library/sort/${this.library}`) {
                        for (let index = 0; index < this.canvases.length; index++) {
                            if (this.canvases[index].owner != account._id) {
                                this.canvases.splice(index, 1);
                                index--;
                            }
                        }
                    } else if (this.router.url == `/accept/${this.library}`) {
                        this.snackBar.open(account.userName + " is already your friend!", "Oops", {
                            duration: 4000,
                        });
                        this.router.navigate(['/library']);
                    } else
                        this.router.navigate(['/library']);
                });
            }
        })
    }

    addFriend() {
        this.options = [];
        this.accounts.forEach(account => {
            this.options.push(account.email);
        });
        const dialogRef = this.dialog.open(AddFriendDialog, {
            height: '250px',
            width: '400px',
            data: {
                account: this.account,
                accounts: this.accounts,
                myControl: this.myControl,
                filteredOptions: this.filteredOptions
            }
        });
        dialogRef.afterClosed().subscribe(data => {
            if (data) {
                if (data.myControl)
                    if (data.myControl.value != this.account.email) {
                        this.accounts.forEach(account => {
                            if (account.email == data.myControl.value) {
                                let found = false;
                                this.account.friends.forEach(friend => {
                                    if (friend == account._id)
                                        found = true;
                                });
                                if (!found) {
                                    let response = this.authService.updateAccount(this.account).subscribe((data1) => {

                                        this.authService.pushNotification(account._id, "Friend Request", `${this.account.email} has requested to add you as their friend.`, `/accept/${this.account.email}`, this.account.email).subscribe((data) => {
                                            console.info(data)
                                        });
    
                                        this.mail.id = account._id;
                                        this.mail.subject = 'You have a friend request!';
                                        this.mail.content = `
                                        <p>Hey there, just letting you know that ${this.account.email} has requested to add you as a friend.<p>
                                        <p><a href="https://inkshare-frontend.herokuapp.com/library/${data.myControl.value}">Add them back!</a></p>
                                        `;
                                        this.authService.sendMail(this.mail).subscribe((data2) => {
                                            this.snackBar.open(account.email + " has been added as a friend, and an email has been sent!", "Thanks", {
                                                duration: 4000,
                                            });
                                        });
                                    });
                                    this.authService.reqresAccountGetById(this.account._id).subscribe((data1) => {
                                        this.account = data1;
                                    });
                                }
                                else {
                                    this.snackBar.open("Sorry, you already appear to be friends!", "Oops", {
                                        duration: 4200,
                                    });
                                    this.addFriend();
                                }
                            }
                        });
                    }
                    else if (data.myControl.value == this.account.email) {
                        this.snackBar.open("You can't add yourself as a friend!", "Oops", {
                            duration: 5000,
                        });
                        this.addFriend();
                    } else {
                        this.snackBar.open("Sorry, something went wrong and we couldn't add your friend.", "Oops", {
                            duration: 5000,
                        });
                        this.addFriend();
                    }
                else {
                    this.snackBar.open("Sorry, something went wrong and we couldn't add your friend.", "Oops", {
                        duration: 5000,
                    });
                    this.addFriend();
                }
            }
        });
    }

    /*friendMail(email: string, content: string) {
        this.mail.email = email;
        this.mail.subject = "You have a new friend!";
        this.mail.content = "<p> Hey there, just letting you know that " + content + " has added you as a friend <p>"
        this.authService.sendMail(this.mail).subscribe(data => {
            if (data) {

            }
        })
    }*/

    setSelected(canvas) {
        this.selected = canvas;
    }

    newCanvas() {
        let typesArray = [
            { value: 'Private' },
            { value: 'Public' },
            { value: 'Locked' }
        ];
        if (this.account.isAdmin)
            typesArray.push({ value: 'Featured' });
        const dialogRef = this.dialog.open(CreateDialog, {
            height: '300px',
            width: '400px',
            data: {
                type: "Private",
                canvasName: this.account.userName + "'s Canvas",
                canvasParticipants: [],
                canvasDimensions: {
                    width: 700,
                    height: 500
                },
                types: typesArray
            }
        });
        dialogRef.afterClosed().subscribe(data => {
            console.log(data)
            if (data) {
                if (data.canvasName) {
                    this.canvas.name = data.canvasName;
                    this.canvas.dimensions = data.canvasDimensions;
                    this.canvas.type = data.type;
                    this.canvas.participants[0] = { _id: this.account._id, permissions: "Owner" };
                    for (let index = 0; index < data.canvasParticipants.length; index = index + 1)
                        this.canvas.participants.push(data.canvasParticipants[index]);
                    let dupeFlag = false;
                    this.canvas.owner = this.account._id;
                    this.canvases.forEach(canvas => {
                        if (canvas.owner == this.account._id && canvas.name == this.canvas.name) {
                            dupeFlag = true;
                            return;
                        }
                    });
                    if (dupeFlag) {
                        this.snackBar.open("Sorry, " + this.canvas.name + " already exists on your account!", "Oops", {
                            duration: 3200,
                        });
                        this.newCanvas();
                        return;
                    } else {
                        let response = this.authService.createCanvas(this.canvas).subscribe((data1) => {
                            this.authService.reqresCanvasGetByParticipantId(this.account._id).subscribe((data2) => {
                                this.canvases = data2;
                                this.snackBar.open("Success, " + this.canvas.name + " was created!", "Thanks", {
                                    duration: 3200,
                                });
                            });
                        });
                    }
                } else
                    this.canvas.name = undefined;
            } else
                this.canvas.name = undefined;
        });
    }

    applyFilter(filterValue: string) {
        this.dataSource.filter = filterValue.trim().toLowerCase();
    }

    test() {
        this.authService.pushNotification(this.account._id, "Friend Request", `CrazyContraptionMC@gmail.com has requested to add you as their friend.`, `/accept/CrazyContraptionMC@gmail.com`, "CrazyContraptionMC@gmail.com").subscribe((data) => {
            console.info(data)
        });
    }

    editCanvas(canvas) {
        localStorage.setItem('canvas', canvas._id); // insecure?
        localStorage.setItem('width', canvas.dimensions.width);
        localStorage.setItem('height', canvas.dimensions.height);
        this.authService.reqresAccountGetById(canvas.owner).subscribe((data) => {
            this.router.navigate([`/edit/${data.email}/${canvas.name}`]);
        });
    }

    shareCanvas(canvas) {
        this.options = [];
        this.friends.forEach(friend => {
            this.options.push(friend.email);
        });
        this.dataSource = new MatTableDataSource(this.friends)
        const dialogRef = this.dialog.open(AddParticipantDialog, {
            height: '300px',
            width: '400px',
            data: {
                account: this.account,
                friends: this.dataSource,
                myControl: this.myControl,
                permissions: [
                    { value: 'Collaborator' },
                    { value: 'Moderator' },
                    { value: 'Visitor' }
                ],
                permission: "",
                filteredOptions: this.filteredOptions
            }
        });
        dialogRef.afterClosed().subscribe(data => {
            if (data)
                if (data.myControl)
                    if (data.myControl.value) {
                        let dupeFlag = true;
                        if (data.myControl.value == this.account.email) {
                            this.snackBar.open("Sorry, You can't add yourself to a canvas you're already in.", "Oops", {
                                duration: 4500,
                            });
                            this.shareCanvas(canvas);
                            return;
                        } else {
                            this.accounts.forEach(account => {
                                if (account.email == data.myControl.value) {
                                    dupeFlag = false;
                                    canvas.participants.forEach(participant => {
                                        if (account._id == participant._id) {
                                            dupeFlag = true;
                                            this.snackBar.open("Sorry, That user is already a participant.", "Oops", {
                                                duration: 3500
                                            });
                                            return;
                                        }
                                    });
                                    if (!dupeFlag) {
                                        // TODO: Allow for different perms from dropdown
                                        console.log(account)
                                        canvas.participants[canvas.participants.length] = { _id: account._id, permissions: data.permission };
                                        let response = this.authService.updateCanvas(canvas).subscribe((data1) => {
                                            this.mail.id = account._id;
                                            this.mail.subject = 'A canvas was shared with you.';
                                            this.mail.content = `
                                            <p>Hey there, just letting you know that ${this.account.userName} has invited you to participate in their ${this.canvas.name} canvas.<p>
                                            <p><a href="https://inkshare-frontend.herokuapp.com/library/${data.myControl.value}">View it here!</a></p>
                                            `;
                                            this.authService.sendMail(this.mail).subscribe((data2) => {
                                                this.snackBar.open("Success, " + data.myControl.value + " was invited to be a " + "participant" + "!", "Thanks", {
                                                    duration: 3200
                                                });
                                            });
                                        });
                                    } else return;
                                }
                            });
                        }
                    }
        });
    }

    canvasSettings(canvas) {
        if (canvas.owner != this.account._id) {
            this.snackBar.open("Sorry, you can't modify what you don't own this! Moderators must join the canvas and edit settings directly.", "Oops", {
                duration: 6000
            });
            return;
        }
        let typesArray = [
            { value: 'Private' },
            { value: 'Public' },
            { value: 'Locked' }
        ];
        if (this.account.isAdmin)
            typesArray.push({ value: 'Featured' });
        this.authService.reqresAccountGetByCanvasId(canvas._id).subscribe((data3) => {
            this.participants = data3;
            this.dataSource = new MatTableDataSource(this.participants);
            const dialogRef = this.dialog.open(SettingsDialog, {
                height: '550px',
                width: '900px',
                data: {
                    displayedColumns: this.displayedColumns,
                    canvas: canvas,
                    type: canvas.type,
                    types: typesArray,
                    participants: this.participants,
                    dataSource: this.dataSource,
                    owner: this.account
                },
            });
            dialogRef.afterClosed().subscribe(data => {
                if (data) {
                    if (data.participants) {
                        let dupeFlag = false;
                        this.canvases.forEach(data1 => {
                            if (data1.owner == this.account._id && data1.name == data.canvas.name)
                                if (data1._id != this.canvas._id) {
                                    dupeFlag = true;
                                    return;
                                }
                        });
                        if (dupeFlag) {
                            this.authService.reqresCanvasGetById(canvas._id).subscribe((data1) => {
                                this.canvas = data1;
                                this.snackBar.open("Sorry, " + data.canvas.name + " already exists on your account!", "Oops", {
                                    duration: 3200
                                });
                            });
                            return;
                        } else {
                            if (data.canvas.name)
                                this.canvas.name = data.canvas.name;
                            if (data.participants[0]._id == data.canvas.owner)
                                this.canvas.participants = data.participants
                            let response = this.authService.updateCanvas(this.canvas).subscribe((data1) => {
                                this.snackBar.open("Success, canvas settings saved!", "Thanks", {
                                    duration: 4000
                                });
                            });
                        }
                    } else
                        location.reload();
                } else
                    location.reload();
            });
        });
    }

    deleteCanvas(canvas) {
        const dialogRef = this.dialog.open(DeleteDialog, {
            height: '190px',
            width: '400px',
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.authService.deleteCanvas(canvas).subscribe((data1) => {
                    this.authService.reqresCanvasGetByParticipantId(this.account._id).subscribe((data2) => {
                        this.canvases = data2;
                    });
                });
            }
        });
    };

    viewLibrary(friend) {
        this.router.navigate(['/library/sort', friend.email]);
    }
}

@Component({
    selector: 'create-canvas.dialog',
    templateUrl: 'create-canvas.dialog.html',
})
export class CreateDialog {

    constructor(
        public dialogRef: MatDialogRef<CreateDialog>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData) { }

    onNoClick(): void {
        this.dialogRef.close();
    }
}

@Component({
    selector: 'delete-canvas.dialog',
    templateUrl: 'delete-canvas.dialog.html',
})
export class DeleteDialog {

    constructor(
        public dialogRef: MatDialogRef<DeleteDialog>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData) { }

    onNoClick(): void {
        this.dialogRef.close();
    }
}

@Component({
    selector: 'add-friend.dialog',
    templateUrl: 'add-friend.dialog.html',
})
export class AddFriendDialog {

    constructor(
        public dialogRef: MatDialogRef<AddFriendDialog>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData) { }

    onNoClick(): void {
        this.dialogRef.close();
    }
}

@Component({
    selector: 'add-participant.dialog',
    templateUrl: 'add-participant.dialog.html',
})
export class AddParticipantDialog {

    constructor(
        public dialogRef: MatDialogRef<AddParticipantDialog>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData) { }

    onNoClick(): void {
        this.dialogRef.close();
    }
}

export class mailCredentials {
    id: string;
    subject: string;
    content: string;
}