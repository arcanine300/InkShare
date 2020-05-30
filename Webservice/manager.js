const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer')
mongoose.set('useNewUrlParser', true)
mongoose.set('useFindAndModify', false)

var Schema = mongoose.Schema

var accountSchema = new Schema({
  userName: String,
  password: String,
  email: { type: String, unique: true },
  isAdmin: Boolean,
  canvases: [String],
  friends: [String],
  avatar: String,
  theme: String,
  permissions: String,
  notifications: [{
    title: String,
    date: String,
    content: String,
    link: String,
    originEmail: String
  }]
})

var canvasSchema = new Schema({
  name: String,
  type: String,
  owner: String,
  dimensions: { width: Number, height: Number },
  modified: String,
  participants: [{
    _id: String,
    permissions: String
  }],
  image: {
    pixels: String,
    length: Number,
    width: Number,
    height: Number
  }
})

module.exports = function (mongoDBConnectionString) {

  let Accounts;
  let Canvases;

  return {

    accountGetAll: function () {
      return new Promise(function (resolve, reject) {
        Accounts.find({}, "-password -friends -canvases -isAdmin -permissions -notifications", (error, data) => {
          if (error)
            return reject(`Could not get accounts - ${error.message}`);
          if (data.length > 0) {
            return resolve(data);
          }
          else
            return reject(`Could not find accounts - Unknown Error`);
        });
      })
    },

    canvasGetAll: function () {
      return new Promise(function (resolve, reject) {
        Canvases.find({}, (error, data) => {
          if (error)
            return reject(`Could not get canvases - ${error.message}`);
          if (data.length > 0) {
            return resolve(data);
          }
          else
            return reject(`Could not find canvases - Unknown Error`);
        });
      })
    },

    accountGetById: function (id) {
      return new Promise(function (resolve, reject) {
        Accounts.findById(id, "-permissions -password", (error, account) => {
          if (error)
            return reject(`Could not get account - ${error.message}`);
          if (account)
            return resolve(account);
          else
            return reject(`Could not find account: ${id}`);
        });
      })
    },

    canvasGetById: function (id) {
      return new Promise(function (resolve, reject) {
        Canvases.findById(id, (error, canvas) => {
          if (error)
            return reject(`Could not get canvas - ${error.message}`);
          if (canvas)
            return resolve(canvas);
          else
            return reject(`Could not find canvas: ${id}`);
        })
      })
    },

    accountGetByFriendId: function (id) {
      return new Promise(function (resolve, reject) {
        Accounts.findById(id, "-permissions -notifications -password -isAdmin",
          (error1, account) => {
            if (error1)
              return reject(`Could not get friends - ${error1.message}`);
            if (account) {
              Accounts.find({ '_id': { $in: account.friends } },
                (error2, friends) => {
                  if (error2)
                    return reject(`Could not get friends - ${error2.message}`);
                  return resolve(friends);
                });
            }
            else
              return reject(`Could not find any friends of: ${id}`);
          })
      })
    },

    accountGetByCanvasId: function (id) {
      return new Promise(function (resolve, reject) {
        Canvases.findById(id,
          (error1, canvas) => {
            if (error1)
              return reject(`Could not get canvas - ${error1.message}`);
            if (canvas) {
              Accounts.find({ '_id': { $in: canvas.participants } }, "-password -canvases -theme -friends -permissions -notifications -isAdmin",
                (error2, participants) => {
                  if (error2)
                    return reject(`Could not get participants - ${error2.message}`);
                  for (let index = 0; index < participants.length; index++) {
                    participants[index]['permissions'] = canvas.participants[index].permissions;
                  }
                  return resolve(participants);
                });
            }
            else
              return reject(`Could not find any friends of: ${id}`);
          })
      })
    },

    canvasGetByParticipantId: function (id) {
      return new Promise(function (resolve, reject) {
        Canvases.find(
          { "participants._id": id },
          (error, data) => {
            if (error)
              return reject(`Could not get related canvases - ${error.message}`);
            if (data)
              return resolve(data);
            else
              return reject(`Could not find any canvases related to: ${id}`);
          })
      })
    },

    accountLogin: function (account) {
      return new Promise(function (resolve, reject) {
        Accounts.findOne(
          { email: account.email }, "-permissions", (error, item) => {
            if (error)
              return reject(`Could not login - ${error.message}`)
            if (item) {
              if (bcrypt.compareSync(account.password, item.password))
                return resolve(item);
              else
                return reject('Could not login - Password mismatch');
            } else
              return reject(`Could not login - ${account.email} not found`);
          })
      })
    },

    accountCreate: function (account) {
      return new Promise(function (resolve, reject) {
        if (!account.userName)
          return reject("Could not create account - Missing username");
        else if (!account.password)
          return reject("Could not create account - Missing password");
        else if (!account.passwordConfirm || !account.email)
          return reject("Could not create account - Missing password confirmation");
        else if (account.password != account.passwordConfirm)
          return reject("Could not create account - Password mismatch");
        else if (!account.email)
          return reject("Could not create account - Missing email");
        var salt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync(account.password, salt);
        account.password = hash;
        let newAccount = new Accounts(account);
        newAccount.avatar = [];
        let date = new Date();
      newAccount.notifications = [{ title: "InkShare", date: date.toDateString() + " - " + date.toLocaleTimeString(), content: "Welcome to InkShare! Feel free to explore and look around. Important updates like invites will appear here in the future, so check back often~", link: "/" }];
        newAccount.theme = "Dark Pink";
        newAccount.isAdmin = false;
        newAccount.save((error) => {
          if (error)
            if (error.code == 11000)
              return reject("Could not create account - Email already exists");
            else
              return reject(`Could not create account - ${error.message}`);
          else
            return resolve(`User account was created: ${newAccount._id}`);
        })
      })
    },

    canvasCreate: function (canvas) {
      // TODO: verify addition to owner/add to owner
      return new Promise(function (resolve, reject) {
        if (!canvas.name)
          return reject(`Could not create canvas - Missing canvas name`);
        else if (!canvas.owner)
          return reject(`Could not create canvas - Missing canvas owner`);
        else if (canvas.participants[0]._id != canvas.owner || canvas.participants[0].permissions != "Owner")
          return reject(`Could not create canvas - Owner is not a participant, canvas will not be accessible`);
        let newCanvas = new Canvases(canvas)
        newCanvas.image = { pixels: "", length: 0, width: canvas.width, height: canvas.height };
        if (canvas.type == "Private" || canvas.type == "Public" || canvas.type == "Featured" || canvas.type == "Locked")
          newCanvas.type = canvas.type;
        else if (!canvas.type)
          newCanvas.type = "Private";
        else
          return reject(`Could not create canvas - Canvas type was not recognized`);
        let date = new Date();
        newCanvas.modified = date.toDateString() + " - " + date.toLocaleTimeString();
        Accounts.findOneAndUpdate(
          { _id: canvas.owner },
          { $push: { canvases: newCanvas._id } },
          { new: true }, (error, item) => { });
        newCanvas.save((error) => {
          if (error)
            return reject(`Could not create canvas - ${error.message}`);
          else
            return resolve(`Canvas was created: ${newCanvas._id}`);
        })
      })
    },

    accountUpdateById: function (newAccount) {
      // TODO: Ensure duplicates are not saved
      let pendingAccount;
      return new Promise(function (resolve, reject) {
        // Determine what needs to be updated
        Accounts.findById(newAccount._id, "-permissions", (error1, oldAccount) => {
          if (error1)
            reject(`Could not update account - ${error1.message}`);
          else if (oldAccount) {
            pendingAccount = oldAccount;
            // No updates?
            if (newAccount == oldAccount)
              return reject(`Could not update account - No differences detected`);
            else if (newAccount.password)
              // Password doesn't match
              if (!bcrypt.compareSync(newAccount.password, oldAccount.password))
                return reject(`Could not update account - Password required to update these`);
              // We have a matching password, save these settings too
              else {
                if (newAccount.userName)
                  pendingAccount.userName = newAccount.userName;
                if (newAccount.email)
                  pendingAccount.email = newAccount.email;
                if (newAccount.avatar)
                  pendingAccount.avatar = newAccount.avatar;
                if (newAccount.theme)
                  pendingAccount.theme = newAccount.theme;
                // These are handled with other secured functions, not here
                /*if (newAccount.canvases)
                  pendingAccount.canvases = newAccount.canvases;
                if (newAccount.notifications)
                  pendingAccount.notifications = newAccount.notifications;*/
              }
            // These will save without a password match
            if (newAccount.friends)
              pendingAccount.friends = newAccount.friends;
            // Issue the update
            Accounts.findOneAndUpdate({ _id: newAccount._id },
              {
                userName: pendingAccount.userName,
                email: pendingAccount.email,
                friends: pendingAccount.friends,
                avatar: pendingAccount.avatar,
                theme: pendingAccount.theme
              },
              { new: true },
              (error2, item2) => {
                if (error2)
                  return reject(`Could not update account - ${error2.message}`);
                else if (item2)
                  return resolve(item2);
                else
                  return reject(`Could not find account: ${newAccount._id}`);
              });
          } else
            return reject(`Could not find account: ${newAccount._id}`);
        });
      })
    },

    canvasUpdateById: function (canvas) {
      return new Promise(function (resolve, reject) {
        // TODO: Add user to participants if owner changed
        // TODO: Ensure owner is always a participant
        // TODO: Ensure duplicates are not saved
        Canvases.findById(canvas._id, (error1, item1) => {
          if (error1)
            return reject(`Could not update canvas - ${error1.message}`);
          else if (item1) {
            if (!canvas.name)
              canvas.name = item1.name;
            if (!canvas.owner)
              canvas.owner = item1.owner;
            if (!canvas.participants)
              canvas.participants = item1.participants;
            if (!canvas.image)
              canvas.image = item1.image;
            if (!canvas.type)
              canvas.type = item1.type;
            if (!canvas.dimensions)
              canvas.dimensions = item1.dimensions;
            let date = new Date();
            canvas.modified = date.toDateString() + " - " + date.toLocaleTimeString();
            Canvases.findOneAndUpdate({ _id: canvas._id },
              {
                name: canvas.name,
                owner: canvas.owner,
                type: canvas.type,
                modified: canvas.modified,
                dimensions: canvas.dimensions,
                participants: canvas.participants,
                image: canvas.image
              },
              { new: true },
              (error2, item2) => {
                if (error2)
                  reject(`Could not update canvas - ${error2.message}`);
                else if (item2)
                  return resolve(item2);
                else
                  return reject(`Could not find canvas: ${canvas._id}`);
              });
          } else
            return reject(`Could not find canvas: ${canvas._id}`);
        });
      });
    },

    // Delete an account and all connected Canvases, non-reversable
    accountDelete: function (account) {
      return new Promise(function (resolve, reject) {
        Accounts.findById(account._id, "-permissions", (error1, item1) => {
          if (error1)
            return reject(`Could not delete account - ${error1.message}`);
          else if (item1) {
            if (!account.password)
              return reject(`Could not delete account - No password provided`);
            if (!bcrypt.compareSync(account.password, item1.password))
              return reject(`Could not delete account - Password mismatch`);
            Accounts.deleteOne({ _id: account._id })
              .exec((error2) => {
                if (error2)
                  return reject(`Could not delete account - ${error2.message}`);
                Canvases.deleteMany({ owner: account._id })
                  .exec((error2) => {
                    if (error2)
                      return reject(`Could not delete account's canvas(es) - ${error2.message}`);
                    return resolve(`Account deleted successfully: ${account._id}`);
                  });
              });
          } else
            return reject(`Could not find account: ${account._id}`);
        });
      });
    },

    // Mark a Canvas for deletion, can be undone if webservice doesn't restart
    canvasDelete: function (canvas) {
      return new Promise(function (resolve, reject) {
        Accounts.findByIdAndUpdate(canvas.owner,
          { $pull: { "canvases": canvas._id } },
          { new: true }, (error1, item1) => {
            if (error1)
              return reject(`Could not delete canvas - ${error1.message}`);
            Canvases.findOneAndUpdate(
              { _id: canvas._id, owner: canvas.owner },
              { owner: "" },
              { new: true }, (error2, item2) => {
                if (error2)
                  return reject(`Could not delete canvas - ${error2.message}`);
                if (!item2)
                  return reject(`Could not find canvas: ${canvas._id}`);
                else
                  return resolve(`Canvas flagged for deletion - ${canvas._id}, to reverse this action set an owner before webservice idle restart`);
              });
          });
      });
    },

    accountReset: function (account) {
      return new Promise(function (resolve, reject) {
        Accounts.findOne(
          { email: account.email }, (error, item) => {
            if (error)
              return reject(`Recovery - ${error.message}`)
            let isPasswordMatch = bcrypt.compareSync(account.password, item.password)
            if (isPasswordMatch) {
              if (account.newPassword != account.newPasswordConfirm)
                return reject("new passwords do not match");
              var salt = bcrypt.genSaltSync(10)
              var hash = bcrypt.hashSync(account.newPassword, salt)
              Accounts.findOneAndUpdate(
                { email: account.email },
                { password: hash },
                { new: true }, (error, updatedItem) => {
                  if (error) {
                    return reject(`Password Reset - ${error.message}`)
                  }
                  if (updatedItem) {
                    let transporter = nodemailer.createTransport({
                      service: 'gmail',
                      auth: {
                        user: 'inkshare8@gmail.com',
                        pass: 'SpicyMemes123' // Bruh
                      }
                    });
                    const mailOptions = {
                      from: 'InkShare',
                      to: account.email,
                      subject: 'Account Password Changed!',
                      html: "<p>Hello There,</p><br><p>This email is just a notification telling you that the password for your account has been changed.</p>"
                    };
                    transporter.sendMail(mailOptions, function (err, info) {
                      if (err) {
                        return reject("Error sending email");
                      }
                      else {
                        console.log("Email has been sent");
                        return resolve(info);
                      }
                    });
                    return resolve('Password has been changed');
                  }
                  else {
                    return reject('Password - no reset')
                  }
                })
            }
            else
              return reject('Incorrect password')
          }
        )
      })
    },

    // TODO: Remove this from exported functions?
    garbageCollection: function () {
      return new Promise(function (resolve, reject) {
        // TODO: Delete canvases without valid owners (ie: account deleted without canvases updating, or tranfered to an invalid user)
        Canvases.deleteMany({ owner: "" })
          .exec((error1) => {
            if (error1)
              return reject(error1.message);
            Accounts.deleteMany({ userName: "" })
              .exec((error2) => {
                if (error2)
                  return reject(error2.message);
                return resolve("Garbage collection success.")
              });
          });
      });
    },

    nodeResetMail: function (accountEmail) {
      return new Promise(function (resolve, reject) {
        Accounts.findOne(
          { email: accountEmail }, (error, item) => {
            if (error)
              return reject(`Recovery - ${error.message}`)
            let newPassword = Math.random().toString(36).substring(2, 7) + Math.random().toString(36).substring(2, 7)
            var salt = bcrypt.genSaltSync(10)
            var hash = bcrypt.hashSync(newPassword, salt)
            Accounts.findOneAndUpdate(
              { email: accountEmail },
              { password: hash },
              { new: true }, (error, updatedItem) => {
                if (error)
                  return reject(`Password Reset - ${error.message}`)
                if (updatedItem) {
                  let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                      user: 'inkshare8@gmail.com',
                      pass: 'SpicyMemes123' // Bruh
                    }
                  });
                  const mailOptions = {
                    from: 'InkShare',
                    to: accountEmail,
                    subject: 'Inkshare Recovery Password',
                    html: '<p>here is the recovery password for your account: ' + newPassword + ' <p>'
                  };
                  transporter.sendMail(mailOptions, function (err, info) {
                    if (err)
                      return reject("Error sending email");
                    else
                      console.log("Email has been sent");
                    return resolve(info);
                  });
                }
              })
          }
        )
      })
    },

    nodeMail: function (email, subject, body) {
      return new Promise(function (resolve, reject) {

        let transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'inkshare8@gmail.com',
            pass: 'SpicyMemes123' // Bruh
          }
        });

        const mailOptions = {
          from: 'InkShare',
          to: email,
          subject: subject,
          html: body
        };

        transporter.sendMail(mailOptions, function (err, info) {
          if (err)
            return reject("Error sending email");
          else
            return resolve(info);
        });
      })
    },

    notificationCreate: function (id, notification) {
      return new Promise(function (resolve, reject) {
        if (notification.title && notification.content) {
          if (notification.title == "Friend Request" && !notification.originEmail)
            return reject(`Could not create notification - Friend requests require an email that sent them`);
          let date = new Date();
          notification.date = date.toLocaleDateString() + " - " + date.toLocaleTimeString();
          Accounts.findByIdAndUpdate(
            id,
            { $push: { "notifications": notification } },
            { new: true }, (error, item) => {
              if (error)
                return reject(`Could not create notification - ${error.message}`);
              else
                return resolve(`Notification was created for: ${id}`);
            });
        } else
          return reject(`Could not create notification - Notification objects lacks a title and/or content`);

      });
    },

    notificationDelete: function (id, notificationID) {
      return new Promise(function (resolve, reject) {
        Accounts.findByIdAndUpdate(
          id,
          { $pull: { "notifications": notificationID } },
          { new: true }, (error, item) => {
            if (error)
              return reject(`Could not delete notification - ${error.message}`);
            else if (item)
              return resolve(`Notification was deleted for: ${id}`);
            else
              return reject(`Could not delete notification - Not found`);
          });
      });
    },

    connect: function () {
      return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection(mongoDBConnectionString);
        db.on('error', (err) => {
          if (process.argv[2] != 'true')
            reject(err);
          else {
            console.warn("Continuing mongodb in forced offline simulation...");
            resolve();
          }
        });
        db.once('open', () => {
          Accounts = db.model("Accounts", accountSchema, "Accounts");
          Canvases = db.model("Canvases", canvasSchema, "Canvases");
          resolve();
        })
      })
    }
  }
}