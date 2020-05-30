var jwt = require('jsonwebtoken');
var passport = require("passport");
var passportJWT = require("passport-jwt");

const express = require("express")
const cors = require("cors")
const path = require("path")
const bodyParser = require('body-parser')
const app = express()
const HTTP_PORT = process.env.PORT || 8080
const manager = require("./manager.js")
const manObj = manager("<MongoDB connection string here>")

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cors())
app.set('json spaces', 4); // Make the JSON responses... readable

var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;

var jwtOptions = {}
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
jwtOptions.secretOrKey = "<jwt secret here>"

var strategy = new JwtStrategy(jwtOptions, function (jwt_payload, next) {
  if (jwt_payload)
    next(null, { _id: jwt_payload._id });
  else
    next(null, false);
})

passport.use(strategy);
app.use(passport.initialize());

function verifySource(req, res) {
  if (req.get('Source') != "InkShareHeaderOrigin")
    return { "error": "Untrusted request origin" };
  else
    return undefined;
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/index.html"));
})

// Get all accounts
app.get("/accounts", (req, res) => {
  let check = verifySource(req, res)
  if (!check)
    manObj.accountGetAll()
      .then((data) => {
        res.json(data)
      })
      .catch((err) => {
        res.status(404).json({ "error": err })
      })
  else res.status(403).json(check);
})

// Get all canvases
app.get("/canvases", (req, res) => {
  let check = verifySource(req, res)
  if (!check)
    manObj.canvasGetAll()
      .then((data) => {
        res.json(data)
      })
      .catch((err) => {
        res.status(404).json({ "error": err })
      })
  else res.status(403).json(check);
})

// Get details of a account by id
app.get("/accounts/:id", (req, res) => {
  let check = verifySource(req, res)
  if (!check)
    manObj.accountGetById(req.params.id)
      .then((account) => {
        res.json(account)
      })
      .catch((err) => {
        res.status(404).json({ "error": err })
      })
  else res.status(403).json(check);
})

// Get canvas details by id
app.get("/canvases/:id", (req, res) => {
  let check = verifySource(req, res)
  if (!check)
    manObj.canvasGetById(req.params.id)
      .then((canvas) => {
        res.json(canvas)
      })
      .catch((err) => {
        res.status(404).json({ "error": err })
      })
  else res.status(403).json(check);
})

// Get accounts a user is a friend with
app.get("/accounts/friends/:id", (req, res) => {
  let check = verifySource(req, res)
  if (!check)
    manObj.accountGetByFriendId(req.params.id)
      .then((canvas) => {
        res.json(canvas)
      })
      .catch((err) => {
        res.status(404).json({ "error": err })
      })
  else res.status(403).json(check);
})

// Get users a canvas has participants for
app.get("/accounts/participates/:id", (req, res) => {
  let check = verifySource(req, res)
  if (!check)
    manObj.accountGetByCanvasId(req.params.id)
      .then((canvas) => {
        res.json(canvas)
      })
      .catch((err) => {
        res.status(404).json({ "error": err })
      })
  else res.status(403).json(check);
})

// Get canvases a user is a participant of
app.get("/canvases/viewable/:id", (req, res) => {
  let check = verifySource(req, res)
  if (!check)
    manObj.canvasGetByParticipantId(req.params.id)
      .then((canvas) => {
        res.json(canvas)
      })
      .catch((err) => {
        res.status(404).json({ "error": err })
      })
  else res.status(403).json(check);
})

// Account login request
app.post("/accounts/login", (req, res) => {
  let check = verifySource(req, res)
  if (!check)
    manObj.accountLogin(req.body)
      .then((data) => {
        let account = {
          _id: data._id,
          userName: data.userName,
          password: data.password,
          email: data.email,
          isAdmin: data.isAdmin,
          canvases: data.canvases,
          friends: data.friends,
          avatar: data.avatar,
          theme: data.theme,
          notifications: data.notifications
        }
        let token = jwt.sign(account, jwtOptions.secretOrKey);
        res.json({ "message": "Login was successful", token: token });
      }).catch((err) => {
        res.status(400).json({ "error": err })
      })
  else res.status(403).json(check);
})

// Registers and activates a new account
app.post("/accounts/create", (req, res) => {
  let check = verifySource(req, res)
  if (!check)
    manObj.accountCreate(req.body)
      .then((data) => {
        res.json({ "message": data })
      }).catch((err) => {
        res.status(400).json({ "error": err })
      })
  else res.status(403).json(check);
})

// Create new canvas
app.post("/canvases/create", (req, res) => {
  let check = verifySource(req, res)
  if (!check)
    manObj.canvasCreate(req.body)
      .then((data) => {
        res.json({ "message": data })
      }).catch((err) => {
        res.status(400).json({ "error": err })
      })
  else res.status(403).json(check);
})

app.put("/accounts/update", (req, res) => {
  let check = verifySource(req, res)
  if (!check)
    manObj.accountUpdateById(req.body)
      .then((data) => {
        let account = {
          _id: data._id,
          userName: data.userName,
          password: data.password,
          email: data.email,
          isAdmin: data.isAdmin,
          canvases: data.canvases,
          friends: data.friends,
          avatar: data.avatar,
          theme: data.theme,
          notifications: data.notifications
        }
        let token = jwt.sign(account, jwtOptions.secretOrKey);
        res.json({ "message": `Account was updated: ${account._id}`, token: token });
      }).catch((err) => {
        res.status(400).json({ "error": err })
      })
  else res.status(403).json(check);
})

app.put("/canvases/update", (req, res) => {
  let check = verifySource(req, res)
  if (!check)
    manObj.canvasUpdateById(req.body)
      .then((data) => {
        res.json({ "message": data })
      }).catch((err) => {
        res.status(400).json({ "error": err })
      })
  else res.status(403).json(check);
})

app.put("/accounts/delete", (req, res) => {
  let check = verifySource(req, res)
  if (!check)
    manObj.accountDelete(req.body)
      .then((data) => {
        res.json({ "message": data })
      }).catch((err) => {
        res.status(400).json({ "error": err })
      })
  else res.status(403).json(check);
})

app.put("/canvases/delete", (req, res) => {
  let check = verifySource(req, res)
  if (!check)
    manObj.canvasDelete(req.body)
      .then((data) => {
        res.json({ "message": data })
      }).catch((err) => {
        res.status(400).json({ "error": err })
      })
  else res.status(403).json(check);
})

app.put("/accounts/reset", (req, res) => {
  let check = verifySource(req, res)
  if (!check)
    manObj.accountReset(req.body)
      .then((data) => {
        res.json({ "message": data });
      }).catch((err) => {
        res.status(404).json({ "error": err })
      })
  else res.status(403).json(check);
})

app.post("/accounts/recovery", (req, res) => {
  let check = verifySource(req, res)
  if (!check)
    manObj.nodeResetMail(req.body.email)
      .then((data) => {
        res.json({ "message": data })
      }).catch((err) => {
        res.status(400).json({ "error": err })
      })
  else res.status(403).json(check);
})

app.post("/accounts/email", (req, res) => {
  let check = verifySource(req, res)
  if (!check)
    manObj.accountGetById(req.body.id)
      .then((data) => {
        manObj.nodeMail(data.email, req.body.subject, req.body.content);
        res.json({ "message": data });
      }).catch((err) => {
        res.status(400).json({ "error": err })
      })
  else res.status(403).json(check);
})

app.post("/accounts/notifications/:id", (req, res) => {
  let check = verifySource(req, res)
  if (!check)
    manObj.notificationCreate(req.params.id, req.body)
      .then((data) => {
        res.json({ "message": data });
      }).catch((err) => {
        res.status(400).json({ "error": err })
      })
  else res.status(403).json(check);
})

app.put("/accounts/notifications/:id", (req, res) => {
  let check = verifySource(req, res)
  if (!check) {
    if (!req.body._id)
      res.status(400).json({ "error": `Could not delete notification - No id submitted` })
    else
    manObj.notificationDelete(req.params.id, req.body)
      .then((data) => {
        res.json({ "message": data });
      }).catch((err) => {
        res.status(400).json({ "error": err })
      });
  } else res.status(403).json(check);
})

// Auth Tester
app.get("/authTest", passport.authenticate('jwt', { session: false }), (req, res) => {
  manObj.accountGetAll()
    .then((accounts) => {
      res.json(accounts)
    })
    .catch((err) => {
      res.status(500).json({ "oops": err })
    })
})

// Database connection and port host
manObj.connect()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      if (process.argv[2] != 'true')
        manObj.garbageCollection().then((response) => { console.log(response); });
      else
        console.warn("Skipping garbage collection - Offline mode enabled");
      console.info("Ready on port " + HTTP_PORT);
    })
  })
  .catch((err) => {
    console.error("Unable to start/connect mongo - " + err);
    console.info("Launch as 'node server.js true' to continue offline");
    if (process.argv[2] != 'true')
      process.exit();
  })