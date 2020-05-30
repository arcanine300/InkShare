import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { WebSocketService } from '../web-socket.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ActivatedRoute } from "@angular/router";
import { Router } from '@angular/router';
import { AuthService } from '../data-model-manager.service';
import { MatTableDataSource } from '@angular/material/table';
import { AddParticipantDialog } from '../library/library.component'
import { FormControl } from '@angular/forms';
import { Validators } from '@angular/forms';
import { ReqresCanvas, ReqresAccount } from '../data-model-classes';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Observer } from 'rxjs';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import * as p5 from 'p5'
import 'hammerjs';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css']
})

export class CanvasComponent implements OnInit, OnDestroy {

  private account: ReqresAccount;
  private participants: ReqresAccount[];
  private canvas: ReqresCanvas;
  private canvases: ReqresCanvas[];

  private asyncTabs: Observable<string[]>;
  private backgroundR: number;
  private backgroundG: number;
  private backgroundB: number;
  private erase: boolean;
  private fillShape: boolean;
  private showOutline: boolean;
  private outlineWidth: number;
  private selectedRed: number;
  private selectedGreen: number;
  private selectedBlue: number;
  private outlineRed: number;
  private outlineGreen: number;
  private outlineBlue: number;
  private selectedBrush: string;
  private selectedSize: number;
  private room: string;
  private image: any;
  private p: any;
  private permissions: string;
  private disableDrawing: boolean;

  myControl = new FormControl('', [
    Validators.required,
    Validators.minLength(6),
    Validators.email
  ]);
  filteredOptions: Observable<string[]>;

  private displayedColumns: string[] = ['name', 'email', 'permissions', 'options'];
  private dataSource;


  //Button listeners
  colorChange(obj: any) {
    //console.log(obj) //obj format: Object { slider: "saturation-lightness", color: "rgb(197,63,63)" }
    var rgb = obj.color.slice(4, -1).split(',', 3); //slice and split the 'color' property of the returned obj from the color picker
    if (obj.color.slice(0, 3) === "rgb") {
      this.selectedRed = rgb[0];
      this.selectedGreen = rgb[1];
      this.selectedBlue = rgb[2];
    }
  }

  outlineChange(obj: any) {
    //console.log(obj) //obj format: Object { slider: "saturation-lightness", color: "rgb(197,63,63)" }
    var rgb = obj.color.slice(4, -1).split(',', 3);
    if (obj.color.slice(0, 3) === "rgb") {
      this.outlineRed = rgb[0];
      this.outlineGreen = rgb[1];
      this.outlineBlue = rgb[2];
    }
  }

  backgroundChange(obj: any) {
    console.log(obj) //obj format: Object { slider: "saturation-lightness", color: "rgb(197,63,63)" }
    var rgb = obj.color.slice(4, -1).split(',', 3); //slice and split the 'color' property of the returned obj from the color picker
    if (obj.color.slice(0, 3) === "rgb") {
      this.backgroundR = rgb[0];
      this.backgroundG = rgb[1];
      this.backgroundB = rgb[2];
    }
  }

  canvasWidthChange(value: number) {
    if (value)
      if (value <= 10000)
        this.canvas.dimensions.width = value;
  }

  canvasNameChange(value: string) {
    if (value)
      this.canvas.name = value;
  }

  canvasHeightChange(value: number) {
    if (value)
      if (value <= 10000)
        this.canvas.dimensions.height = value;
  }

  saveCanvas() {
    // Disable drawing and saving while a save is in progress (prevents corruption)
    if (this.disableDrawing) // Reject save if already saving or otherwise busy
      this.snackBar.open("Sorry, the canvas is busy at this time. Try again in a moment.", "Oops", {
        duration: 4000,
      });
    this.disableDrawing = true; // Disable draw
    this.image = this.p.get(); // State the drawing from p into the class image
    let tempImage = [0]; // Init to a number type
    tempImage.pop(); // Pop the init
    // Copy the image
    this.p.copy(this.image, 0, 0, this.canvas.dimensions.width, this.canvas.dimensions.height, 0, 0, this.canvas.dimensions.width, this.canvas.dimensions.height);
    // This is a bit complex, but is a basic flyweight algorithm. It looks at previous pixes, and if they're the same store the amount of repeats rather than each new pixel
    // TODO: If we want to furtehr compress, we could probably flyweight the RGB as well, but the results would be deminishing. Just food for thought
    for (let index = 0; index < (this.canvas.dimensions.height * this.canvas.dimensions.width * 4); index += 4) {
      if (index > 3) // Make sure we're not out-of-bounding ourselves
        if (tempImage[tempImage.length-1] >= 255) {} // Because we're working with byte arrays, 255 is our max, TODO: find a way around this. Fix this, you fix everything.
        else if (this.image.pixels[index] == this.image.pixels[index - 4] // Is the previous entry the same as this one?
          && this.image.pixels[index + 1] == this.image.pixels[index - 3]
          && this.image.pixels[index + 2] == this.image.pixels[index - 2]
          && this.image.pixels[index + 3] == this.image.pixels[index - 1]) {
            tempImage[tempImage.length-1] = tempImage[tempImage.length-1] + 1;
            continue;
        }
      tempImage.push(this.image.pixels[index], this.image.pixels[index + 1], this.image.pixels[index + 2], 1);
    }
    this.canvas.image.pixels = "";
    this.canvas.image.width = this.canvas.dimensions.width; // Save this so if the size changes between next load, we can keep data without distorting the image.
    this.canvas.image.height = this.canvas.dimensions.height; // Save this so if the size changes between next load, we can keep data without distorting the image.
    //for (let row = 0; row < this.canvas.dimensions.height; row++) { // Originally used to split large data sets, we made need this again for really large canvases.
    this.canvas.image.pixels = // Convert the pixels to a serialized string (compress from byte array to string)
    btoa(new Uint8Array(tempImage).reduce(function (data, byte) {
            return data + String.fromCharCode(byte);
          }, '' ));
    //}
    this.canvas.image.length = this.canvas.image.pixels.length; // For debugging purposes, we store the size
    
    this.authService.updateCanvas(this.canvas).subscribe((data) => {
      this.snackBar.open("Success, your canvas was saved successfully.", "Thanks", {
        duration: 3200,
      });
    });
    this.disableDrawing = false;
  }

  loadCanvas() {
    this.disableDrawing = true;

    let pixels = new Uint8Array(atob(this.canvas.image.pixels).split("").map(function (c) { // Decompress the pixels from the string back to a byte array
      return c.charCodeAt(0);
    }));

    this.p.loadPixels(); // Ensure that P5 knows we're doing some editing, so give us the newest pixels into the backing
    
    let indexSRC = 0; // Track the index of the compressed array
    let indexDES = 0; // Track the index of the expanded array
    for (indexSRC = 0; indexSRC < (this.canvas.image.height * this.canvas.image.width * 4); indexSRC += 4) {
      for (let repeat = 0; repeat < pixels[indexSRC + 3]; repeat++) { // While we're decompressing a flyweight, repeat it
        this.p.pixels[indexDES] = pixels[indexSRC];
        this.p.pixels[indexDES + 1] = pixels[indexSRC + 1];
        this.p.pixels[indexDES + 2] = pixels[indexSRC + 2];
        this.p.pixels[indexDES + 3] = 255;
        indexDES += 4; // This increases exponentially compared to indexSRC, as it should... we're decompressing
      }
    }

    this.p.updatePixels(); // Push the updated backing to the foreground

    this.disableDrawing = false; // Re-enable drawing abilities
  }

  refreshBtnOnClick() {
    if (this.permissions == "Visitor")
      return;
    var retData: returnData = new returnData();
    retData.refresh = true;
    retData.room = this.room;
    retData.backgroundR = this.backgroundR;
    retData.backgroundG = this.backgroundG;
    retData.backgroundB = this.backgroundB;
    retData.canvasWidth = this.canvas.dimensions.width;
    retData.canvasHeight = this.canvas.dimensions.height;
    this.webSocketService.emit('refresh', retData)
    let response = this.authService.updateCanvas(this.canvas).subscribe( data => { // Too laggy
      this.snackBar.open("Success, canvas size  and background updated!", "Thanks", {
        duration: 2000
     });
     location.reload();
    });
    
  }

  brushChangebtn(brush: string) {
    this.selectedBrush = brush;
  }

  constructor(
    private authService: AuthService,
    private webSocketService: WebSocketService,
    private jwtHelper: JwtHelperService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.canvas = new ReqresCanvas();

    this.room = `${this.route.snapshot.params['email']}/${this.route.snapshot.params['canvas']}`; //initalize room to email + room name (pseudo private room as emails are unique)
    this.selectedRed = 255;
    this.selectedGreen = 255;
    this.selectedBlue = 255;
    this.outlineRed = 100;
    this.outlineGreen = 100;
    this.outlineBlue = 100;
    this.backgroundR = 200;
    this.backgroundG = 200;
    this.backgroundB = 200;
    this.selectedBrush = 'ellipse';
    this.selectedSize = 36;
    this.fillShape = true;
    this.showOutline = false;
    this.erase = false;
    this.outlineWidth = 1;
    this.disableDrawing = false;

    this.init();

    // TODO: Make the connection AFTER user verification, not during/before
    this.webSocketService.connect();
    this.webSocketService.setRoom(this.room);
  }

  init() {
    this.disableDrawing = false;
    if (localStorage.getItem('access_token') && localStorage.getItem('canvas')) // TODO: get canvas by URL, so un-authenticated clients can use public canvases
      try {
        this.authService.reqresCanvasGetById(localStorage.getItem('canvas')).subscribe((data1) => {
          this.canvas = data1;
          this.account = this.jwtHelper.decodeToken(localStorage.getItem('access_token'));
          this.authService.reqresAccountGetById(this.account._id).subscribe((data2) => {
            this.account = data2;
            this.authService.reqresCanvasGetAll().subscribe((data3) => {
              this.canvases = data3;
            });
            if (this.canvas.name == this.route.snapshot.params['canvas'] || (this.canvas.type == "Locked" && this.account._id != this.canvas.owner)) {
              this.permissions = undefined;
              this.canvas.participants.forEach(participant => {
                if (participant._id == this.account._id) {
                  this.permissions = participant.permissions;
                  let tabs = [
                    "File",
                    "Tools",
                    "Insert"
                  ];
                  if (this.permissions == "Owner" || this.permissions == "Moderator")
                    tabs.push("Canvas");
                  this.asyncTabs = new Observable((observer: Observer<string[]>) => {
                    setTimeout(() => {
                      observer.next(tabs);
                    }, 2000); // Timeout in ms
                  });
                  return;
                }
              });
              if (!this.permissions && this.canvas.type != "Public" && this.canvas.type != "Featured")
                this.router.navigate(['/library', this.account.email]); // TODO: Make this lead to a request access page?
              else if (!this.permissions && this.canvas.type == "Public")
                this.permissions = "Collaborator";
              else if (!this.permissions && this.canvas.type == "Featured")
                this.permissions = "Visitor";
              this.authService.reqresAccountGetByCanvasId(this.canvas._id).subscribe((data3) => {
                this.participants = data3;
              });
            } else { // ID DOESNT MATCH URL // DOUBLE VERIFICATION SYSTEM
              this.router.navigate(['/library', this.account.email]);
            }
          });
        });
      } catch (err) { console.error(err); }
    else if (!localStorage.getItem('access_token'))
      this.router.navigate(['/login']);
    else
      this.router.navigate(['/library', this.account.email]);
  }

  shareCanvas(canvas) {
    /*this.options = [];
    this.friends.forEach(friend => {
      this.options.push(friend.email);
    });*/
    this.disableDrawing = true;
    this.dataSource = new MatTableDataSource(/*this.friends*/)
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
      this.disableDrawing = false;
      if (data)
        if (data.myControl)
          if (data.myControl.value) {
            let dupeFlag = true;
            if (data.myControl.value == this.account.email) {
              this.snackBar.open("Sorry, You can't add yourself to a canvas you're already in.", "Oops", {
                duration: 4500,
              });
              this.shareCanvas(canvas)
              return;
            } else {
              /*this.accounts.forEach(account => {
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
                    canvas.participants.push({ _id: account._id, permissions: "Collaborator" })
                    let response = this.authService.updateCanvas(canvas).subscribe((data1) => {
                      this.mail.id = account._id;
                      this.mail.subject = 'A canvas was shared with you.';
                      this.mail.content = `
                                            <p>Hey there, just letting you know that ${this.account.userName} has invited you to ${this.canvas.name}.<p>
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
              });*/
            }
          }
    });
  }

  canvasSettings() {
    if (this.permissions != "Owner" && this.permissions != "Moderator") {
      this.snackBar.open("Sorry, you can't modify this!", "Oops", {
        duration: 3200
      });
      return;
    }
    this.disableDrawing = true;
    this.dataSource = new MatTableDataSource(this.participants)
    let typesArray = [
      { value: 'Private' },
      { value: 'Public' },
      { value: 'Locked' }
    ];
    if (this.account.isAdmin)
      typesArray.push({ value: 'Featured' });
    this.dataSource = new MatTableDataSource(this.participants);
    const dialogRef = this.dialog.open(SettingsDialog, {
      height: '550px',
      width: '900px',
      data: {
        displayedColumns: this.displayedColumns,
        canvas: this.canvas,
        type: this.canvas.type,
        types: typesArray,
        participants: this.participants,
        dataSource: this.dataSource,
        owner: this.account
      },
    });
    dialogRef.afterClosed().subscribe(data => {
      this.disableDrawing = false;
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
            console.log(this.canvas._id)
            this.authService.reqresCanvasGetById(this.canvas._id).subscribe((data1) => {
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
          this.init();
      } else
        this.init();
    });
  }

  ngOnDestroy() { // save the canvas
    localStorage.removeItem('canvas');
    localStorage.removeItem('width');
    localStorage.removeItem('height');
    console.log("Canvas Destroyed");
  }

  ngOnInit() {
    try {
      this.authService.reqresCanvasGetById(localStorage.getItem('canvas')).subscribe((data1) => {
        this.canvas = data1;
        //implement p5.js functions and socket.io listeners/emitters inside the const s variable 
        const s = (p) => {

          let canvas
          p.preload = () => { console.log('Preload Complete'); }

          p.setup = () => {
            try {
              console.log('Canvas Setup');
              canvas = p.createCanvas(this.canvas.dimensions.width, this.canvas.dimensions.height);
              canvas.parent('canvas-div');
              p.background(this.backgroundR, this.backgroundG, this.backgroundB);
              this.p = p;
              this.loadCanvas();
            } catch (error) {
              this.disableDrawing = false;
              console.log(error)
              //location.reload(); // Temp solution to null canvases
            }
          }

          //called when mouse is being held down and dragged
          p.mouseDragged = () => {
            if (this.permissions == "Visitor" || this.disableDrawing)
              return;

            var retData: returnData = new returnData();
            retData.x = p.mouseX;
            if (retData.x > this.canvas.dimensions.width || retData.x < 0)
              return;
            retData.y = p.mouseY;
            if (retData.y > this.canvas.dimensions.height || retData.y < 0)
              return;
            retData.r = this.selectedRed;
            retData.g = this.selectedGreen;
            retData.b = this.selectedBlue;
            retData.backgroundR = this.backgroundR;
            retData.backgroundG = this.backgroundG;
            retData.backgroundB = this.backgroundB;
            retData.room = this.room;
            retData.brush = this.selectedBrush;
            retData.brushSize = this.selectedSize;
            retData.fillShape = this.fillShape;
            retData.outlineWidth = this.outlineWidth;
            retData.outlineRed = this.outlineRed;
            retData.outlineGreen = this.outlineGreen;
            retData.outlineBlue = this.outlineBlue;
            retData.showOutline = this.showOutline;
            retData.eraser = this.erase;

            if (this.fillShape) {
              if (this.erase)
                p.fill(this.backgroundR, this.backgroundG, this.backgroundB)
              else
                p.fill(this.selectedRed, this.selectedGreen, this.selectedBlue)
            } else {
              p.noFill()
            }

            if (this.showOutline == true) {
              p.strokeWeight(this.outlineWidth)
              if (this.erase) {
                p.stroke(this.backgroundR, this.backgroundG, this.backgroundB)
              } else {
                p.stroke(this.outlineRed, this.outlineGreen, this.outlineBlue)
              }
            } else {
              p.noStroke()
            }

            if (this.selectedBrush == 'ellipse') {
              p.ellipse(p.mouseX, p.mouseY, this.selectedSize, this.selectedSize)
            } else if (this.selectedBrush == 'rectangle') {
              p.rect(p.mouseX, p.mouseY, this.selectedSize, this.selectedSize)
            } else if (this.selectedBrush == 'triangle') {
              p.triangle(p.mouseX, p.mouseY, (p.mouseX + (this.selectedSize / 2)), p.mouseY - this.selectedSize, (p.mouseX + this.selectedSize), p.mouseY)
            } else if (this.selectedBrush == 'diamond') {
              p.quad(p.mouseX, p.mouseY, (p.mouseX + (this.selectedSize / 2)), p.mouseY - this.selectedSize,
                (p.mouseX + this.selectedSize), p.mouseY, (p.mouseX + (this.selectedSize / 2)), p.mouseY + this.selectedSize)
            }

            //emit mouse data to socket.io server
            this.webSocketService.emit('mouse', retData);
            this.p = p;
          }

          p.touchMoved = () => {
            if (this.permissions == "Visitor" || this.disableDrawing)
              return;
            var retData: returnData = new returnData();
            retData.x = p.mouseX;
            if (retData.x > this.canvas.dimensions.width || retData.x < 0)
              return;
            retData.y = p.mouseY;
            if (retData.y > this.canvas.dimensions.height || retData.y < 0)
              return;
            retData.r = this.selectedRed;
            retData.g = this.selectedGreen;
            retData.b = this.selectedBlue;
            retData.backgroundR = this.backgroundR;
            retData.backgroundG = this.backgroundG;
            retData.backgroundB = this.backgroundB;
            retData.room = this.room;
            retData.brush = this.selectedBrush;
            retData.brushSize = this.selectedSize;
            retData.fillShape = this.fillShape;
            retData.outlineWidth = this.outlineWidth;
            retData.outlineRed = this.outlineRed;
            retData.outlineGreen = this.outlineGreen;
            retData.outlineBlue = this.outlineBlue;
            retData.showOutline = this.showOutline;
            retData.eraser = this.erase;

            if (this.fillShape) {
              if (this.erase) {
                p.fill(this.backgroundR, this.backgroundG, this.backgroundB)
              } else {
                p.fill(this.selectedRed, this.selectedGreen, this.selectedBlue)
              }
            } else {
              p.noFill()
            }

            if (this.showOutline == true) {
              p.strokeWeight(this.outlineWidth)
              if (this.erase) {
                p.stroke(this.backgroundR, this.backgroundG, this.backgroundB)
              } else {
                p.stroke(this.outlineRed, this.outlineGreen, this.outlineBlue)
              }
            } else {
              p.noStroke()
            }

            if (this.selectedBrush == 'ellipse') {
              p.ellipse(p.mouseX, p.mouseY, this.selectedSize, this.selectedSize)
            } else if (this.selectedBrush == 'rectangle') {
              p.rect(p.mouseX, p.mouseY, this.selectedSize, this.selectedSize)
            } else if (this.selectedBrush == 'triangle') {
              p.triangle(p.mouseX, p.mouseY, (p.mouseX + (this.selectedSize / 2)), p.mouseY - this.selectedSize, (p.mouseX + this.selectedSize), p.mouseY)
            } else if (this.selectedBrush == 'diamond') {
              p.quad(p.mouseX, p.mouseY, (p.mouseX + (this.selectedSize / 2)), p.mouseY - this.selectedSize,
                (p.mouseX + this.selectedSize), p.mouseY, (p.mouseX + (this.selectedSize / 2)), p.mouseY + this.selectedSize)
            }

            //emit mouse data to socket.io server
            //console.log(p.get().pixels);
            this.webSocketService.emit('touch', retData);
            this.p = p;
          }

          //called when the mouse is pressed initially (mouse velocity = 0)
          p.mousePressed = () => {
            if (this.permissions == "Visitor" || this.disableDrawing)
              return;
            var retData: returnData = new returnData();
            retData.x = p.mouseX;
            if (retData.x > this.canvas.dimensions.width || retData.x < 0)
              return;
            retData.y = p.mouseY;
            if (retData.y > this.canvas.dimensions.height || retData.y < 0)
              return;
            retData.r = this.selectedRed;
            retData.g = this.selectedGreen;
            retData.b = this.selectedBlue;
            retData.backgroundR = this.backgroundR;
            retData.backgroundG = this.backgroundG;
            retData.backgroundB = this.backgroundB;
            retData.room = this.room;
            retData.brush = this.selectedBrush;
            retData.brushSize = this.selectedSize;
            retData.fillShape = this.fillShape;
            retData.outlineWidth = this.outlineWidth;
            retData.outlineRed = this.outlineRed;
            retData.outlineGreen = this.outlineGreen;
            retData.outlineBlue = this.outlineBlue;
            retData.showOutline = this.showOutline;
            retData.eraser = this.erase;

            if (this.fillShape) {
              if (this.erase) {
                p.fill(this.backgroundR, this.backgroundG, this.backgroundB)
              } else {
                p.fill(this.selectedRed, this.selectedGreen, this.selectedBlue)
              }
            } else {
              p.noFill()
            }

            if (this.showOutline == true) {
              p.strokeWeight(this.outlineWidth)
              if (this.erase) {
                p.stroke(this.backgroundR, this.backgroundG, this.backgroundB)
              } else {
                p.stroke(this.outlineRed, this.outlineGreen, this.outlineBlue)
              }
            } else {
              p.noStroke()
            }

            if (this.selectedBrush == 'ellipse') {
              p.ellipse(p.mouseX, p.mouseY, this.selectedSize, this.selectedSize)
            } else if (this.selectedBrush == 'rectangle') {
              p.rect(p.mouseX, p.mouseY, this.selectedSize, this.selectedSize)
            } else if (this.selectedBrush == 'triangle') {
              p.triangle(p.mouseX, p.mouseY, (p.mouseX + (this.selectedSize / 2)), p.mouseY - this.selectedSize, (p.mouseX + this.selectedSize), p.mouseY)
            } else if (this.selectedBrush == 'diamond') {
              p.quad(p.mouseX, p.mouseY, (p.mouseX + (this.selectedSize / 2)), p.mouseY - this.selectedSize,
                (p.mouseX + this.selectedSize), p.mouseY, (p.mouseX + (this.selectedSize / 2)), p.mouseY + this.selectedSize)
            }

            //emit mouse data to socket.io server
            //console.log(p.get().pixels);
            this.webSocketService.emit('mouse', retData);
            this.p = p;
          }

          p.touchStarted = () => {
            if (this.permissions == "Visitor" || this.disableDrawing)
            return;
          var retData: returnData = new returnData();
          retData.x = p.mouseX;
          if (retData.x > this.canvas.dimensions.width || retData.x < 0)
            return;
          retData.y = p.mouseY;
          if (retData.y > this.canvas.dimensions.height || retData.y < 0)
            return;
          retData.r = this.selectedRed;
          retData.g = this.selectedGreen;
          retData.b = this.selectedBlue;
          retData.backgroundR = this.backgroundR;
          retData.backgroundG = this.backgroundG;
          retData.backgroundB = this.backgroundB;
          retData.room = this.room;
          retData.brush = this.selectedBrush;
          retData.brushSize = this.selectedSize;
          retData.fillShape = this.fillShape;
          retData.outlineWidth = this.outlineWidth;
          retData.outlineRed = this.outlineRed;
          retData.outlineGreen = this.outlineGreen;
          retData.outlineBlue = this.outlineBlue;
          retData.showOutline = this.showOutline;
          retData.eraser = this.erase;

          if (this.fillShape) {
            if (this.erase) {
              p.fill(this.backgroundR, this.backgroundG, this.backgroundB)
            } else {
              p.fill(this.selectedRed, this.selectedGreen, this.selectedBlue)
            }
          } else {
            p.noFill()
          }

          if (this.showOutline == true) {
            p.strokeWeight(this.outlineWidth)
            if (this.erase) {
              p.stroke(this.backgroundR, this.backgroundG, this.backgroundB)
            } else {
              p.stroke(this.outlineRed, this.outlineGreen, this.outlineBlue)
            }
          } else {
            p.noStroke()
          }

          if (this.selectedBrush == 'ellipse') {
            p.ellipse(p.mouseX, p.mouseY, this.selectedSize, this.selectedSize)
          } else if (this.selectedBrush == 'rectangle') {
            p.rect(p.mouseX, p.mouseY, this.selectedSize, this.selectedSize)
          } else if (this.selectedBrush == 'triangle') {
            p.triangle(p.mouseX, p.mouseY, (p.mouseX + (this.selectedSize / 2)), p.mouseY - this.selectedSize, (p.mouseX + this.selectedSize), p.mouseY)
          } else if (this.selectedBrush == 'diamond') {
            p.quad(p.mouseX, p.mouseY, (p.mouseX + (this.selectedSize / 2)), p.mouseY - this.selectedSize,
              (p.mouseX + this.selectedSize), p.mouseY, (p.mouseX + (this.selectedSize / 2)), p.mouseY + this.selectedSize)
          }

          //emit mouse data to socket.io server
          //console.log(p.get().pixels);
          this.webSocketService.emit('touch', retData);
          this.p = p;
          }

          //socket.io event listeners
          //listen for an event from the socket.io server i.e: another user draws on the canvas
          this.webSocketService.listen('mouse').subscribe((data: returnData) => {
            //do something with the data sent from the socket.io server
            if (data.showOutline == true) {
              p.strokeWeight(data.outlineWidth)
              if (data.eraser) {
                p.stroke(data.backgroundR, data.backgroundG, data.backgroundB)
              } else {
                p.stroke(data.outlineRed, data.outlineGreen, data.outlineBlue)
              }
            } else {
              p.noStroke()
            }

            if (data.fillShape) {
              if (data.eraser) {
                p.fill(data.backgroundR, data.backgroundG, data.backgroundB)
              } else {
                p.fill(data.r, data.g, data.b)
              }
            } else {
              p.noFill()
            }

            if (data.brush == 'ellipse') {
              p.ellipse(data.x, data.y, data.brushSize, data.brushSize)
            } else if (data.brush == 'rectangle') {
              p.rect(data.x, data.y, data.brushSize, data.brushSize)
            } else if (data.brush == 'triangle') {
              p.triangle(data.x, data.y, (data.x + (data.brushSize / 2)), data.y - data.brushSize, (data.x + data.brushSize), data.y)
            } else if (data.brush == 'diamond') {
              p.quad(data.x, data.y, (data.x + (data.brushSize / 2)), data.y - data.brushSize,
                (data.x + data.brushSize), data.y, (data.x + (data.brushSize / 2)), data.y + data.brushSize)
            }

          })

          this.webSocketService.listen('touch').subscribe((data: returnData) => {
            //do something with the data sent from the socket.io server
            if (data.showOutline == true) {
              p.strokeWeight(data.outlineWidth)
              if (data.eraser) {
                p.stroke(data.backgroundR, data.backgroundG, data.backgroundB)
              } else {
                p.stroke(data.outlineRed, data.outlineGreen, data.outlineBlue)
              }
            } else {
              p.noStroke()
            }

            if (data.fillShape) {
              if (data.eraser) {
                p.fill(data.backgroundR, data.backgroundG, data.backgroundB)
              } else {
                p.fill(data.r, data.g, data.b)
              }
            } else {
              p.noFill()
            }

            if (data.brush == 'ellipse') {
              p.ellipse(data.x, data.y, data.brushSize, data.brushSize)
            } else if (data.brush == 'rectangle') {
              p.rect(data.x, data.y, data.brushSize, data.brushSize)
            } else if (data.brush == 'triangle') {
              p.triangle(data.x, data.y, (data.x + (data.brushSize / 2)), data.y - data.brushSize, (data.x + data.brushSize), data.y)
            } else if (data.brush == 'diamond') {
              p.quad(data.x, data.y, (data.x + (data.brushSize / 2)), data.y - data.brushSize,
                (data.x + data.brushSize), data.y, (data.x + (data.brushSize / 2)), data.y + data.brushSize)
            }

          })

          this.webSocketService.listen('refresh').subscribe((data: returnData) => {
            //do something with the data sent from the socket.io server
            if (data.refresh) {
              p.resizeCanvas(data.canvasWidth, data.canvasHeight)
              //canvas = p.createCanvas(data.canvasWidth, data.canvasHeight) //don't call createCanvas multiple times
              p.background(data.backgroundR, data.backgroundG, data.backgroundB)
              this.backgroundR = data.backgroundR
              this.backgroundG = data.backgroundG
              this.backgroundB = data.backgroundB
              this.canvas.dimensions.height = data.canvasHeight
              this.canvas.dimensions.width = data.canvasWidth
            }
            this.p = p;
          })

        }
        let player = new p5(s);
      });
    } catch (err) { console.error(err); }
  }
}

@Component({
  selector: 'canvas-settings.dialog',
  templateUrl: 'canvas-settings.dialog.html',
})
export class SettingsDialog {

  public dataSource;
  public participants;
  public canvas;
  public owner;

  constructor(
    public dialogRef: MatDialogRef<SettingsDialog>,
    @Inject(MAT_DIALOG_DATA) public data: SettingsDialog) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

  applyFilter(filterValue: string) {
    this.data.dataSource.filter = filterValue.trim().toLowerCase();
  }

  findParticipant(account): number {
    for (let index = 0; index < this.data.participants.length; index++) {
      if (this.data.participants[index]._id == account._id)
        return index;
    }
    return -1;
  }

  promoteParticipant(account) {
    let index = this.findParticipant(account);
    if (index >= 0) {
      switch (this.data.participants[index].permissions) {
        case "Collaborator": this.data.participants[index].permissions = "Moderator"; break;
        case "Visitor": this.data.participants[index].permissions = "Collaborator"; break;
        default: break;
      }
      this.finalize();
    }
  }

  demoteParticipant(account) {
    let index = this.findParticipant(account);
    if (index >= 0) {
      switch (this.data.participants[index].permissions) {
        case "Moderator": this.data.participants[index].permissions = "Collaborator"; break;
        case "Collaborator": this.data.participants[index].permissions = "Visitor"; break;
        default: break;
      }
      this.finalize();
    }
  }

  removeParticipant(account) {
    let index = this.findParticipant(account);
    if (index >= 0) {
      this.data.participants.splice(index, 1)
      this.finalize();
    }
  }

  transferOwnership(account) {
    let index = this.findParticipant(account);
    let ownerIndex = this.findParticipant(this.data.owner);
    console.log(index);
    console.log(ownerIndex);

    if (index >= 0) {
        this.data.participants[index].permissions = "Owner";
        this.data.participants[ownerIndex].permissions = "Moderator";
        this.data.canvas.owner = this.data.participants[index]._id;
        console.log(this.data.canvas.owner);
    }
    console.log(this.data.participants[index]._id);
    this.finalize();
  }

  finalize() {
    this.data.dataSource = new MatTableDataSource(this.data.participants)
  }
}

export class returnData {
  canvasHeight: number;
  canvasWidth: number;
  x: number;
  y: number;
  refresh: boolean;
  fillShape: boolean;
  r: number;
  g: number;
  b: number;
  backgroundR: number;
  backgroundG: number;
  backgroundB: number;
  showOutline: boolean;
  outlineRed: number;
  outlineGreen: number;
  outlineBlue: number;
  outlineWidth: number;
  room: string;
  brush: string;
  brushSize: number;
  eraser: boolean;
}