const functions = require('firebase-functions');
const app = require('express')();

const FBAuth = require('./util/fbAuth');
const { 
    getAllScreams, 
    postOneScream,
    getScream 
} = require('./handlers/scream');
const { 
    signup, 
    login, 
    uploadImage, 
    addUserDetails,
    getAuthenticateUser 
} = require('./handlers/user');

// Scream route
app.get('/screams', getAllScreams);
app.post('/scream', FBAuth, postOneScream);
app.get('/scream/:screamId', getScream);

// Users route
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticateUser);

exports.api = functions.region('us-east1').https.onRequest(app);
