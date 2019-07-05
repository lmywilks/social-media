const firebase = require('firebase');
const config = require('../util/config');

firebase.initializeApp(config);

const { admin, db } = require('../util/admin');
const { validateSignupData, validateLoginData, reduceUserDetails } = require('../util/validators');

// Sign users up
exports.signup = (req, res) => {
    const newUser = { ...req.body };

    // validate data

    const { errors, valid } = validateSignupData(newUser);

    if (!valid) return res.status(400).json(errors);
    
    const noImg = 'no-img.png';

    let token, userId;

    db
        .doc(`/users/${ newUser.handle }`)
        .get()
        .then(doc => {
            if (doc.exists) {
                return res
                    .status(400)
                    .json({ handle: 'this handle is already exist'});
            } else {
                return firebase
                    .auth()
                    .createUserWithEmailAndPassword(newUser.email, newUser.password)
            }
        })
        .then(data => {
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then(data => {
            token = data;
            const userCredantials = {
                handle: newUser.handle,
                email: newUser.handle,
                createdAt: new Date().toISOString(),
                imageUrl: `https://firebasestorage.googleapis.com/v0/b/${ config.storageBucket }/o/${ noImg }?alt=media`,
                userId
            };

            return db
                .doc(`/users/${ newUser.handle }`)
                .set(userCredantials);
        })
        .then(() => {
            return res.status(201).json({ token });
        })
        .catch(err => {
            console.log(err);
            if (err.code === 'auth/email-already-in-use') {
                return res.status(400).json({ email: 'Email is already in use.' });
            } else {
                return res.status(500).json({ general: 'Something went wrong, please try again.' });
            }
        });
};

// Log user in
exports.login = (req, res) => {
    const user = { ...req.body };

    const { errors, valid } = validateLoginData(user);

    if (!valid) return res.status(400).json(errors);

    firebase
        .auth()
        .signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken();
        })
        .then(token => {
            return res.json({ token });
        })
        .catch(err => {
            console.log(err);
            // auth/wrong-password
            // auth/user-not-found
            return res
                .status(403)
                .json( { general: 'Wrong credentials, please try again.' });
        });
};

// Upload user image
exports.uploadImage = (req, res) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy = new BusBoy({ headers: req.headers });

    let imageFileName;
    let imageToBeUploaded = {};

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if (
            mimetype !== 'image/jpeg' && 
            mimetype !== 'image/png' && 
            mimetype !== 'image/jpg'
        ) {
            return res.status(400).json({ error: 'wrong file type submitted.' });
        }
        
        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        imageFileName = `${ req.user.handle }-${ new Date().getTime() }.${ imageExtension }`;
        const filepath = path.join(os.tmpdir(), imageFileName);

        imageToBeUploaded = { filepath, mimetype };

        file.pipe(fs.createWriteStream(filepath));
    });

    busboy.on('finish', () => {
        admin
            .storage()
            .bucket()
            .upload(
                imageToBeUploaded.filepath, 
                { 
                    resumable: false, 
                    metadata: { 
                        metadata: {
                            contentType: imageToBeUploaded.mimetype 
                        }
                    }
                }
            )
            .then(() => {
                const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${ config.storageBucket }/o/${ imageFileName }?alt=media`;
                return db
                    .doc(`/users/${ req.user.handle }`)
                    .update({ imageUrl });
            })
            .then(() => {
                return res.json({ message: 'Image uploaded successfully.' });
            })
            .catch(err => {
                console.error(err);
                return res.status(500).json({ error: err.code });
            });
    });

    busboy.end(req.rawBody);
};

// Add user detail
exports.addUserDetails = (req, res) => {
    let userDetails = reduceUserDetails(req.body);

    db
        .doc(`/users/${ req.user.handle }`)
        .update(userDetails)
        .then(() => {
            return res.json({ message: 'Details added successfully.' });
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        });
};

// Get any user's details
exports.getUserDetails = (req, res) => {
    let userData = {};

    db
        .doc(`/users/${ req.params.handle }`)
        .get()
        .then(doc => {
            if (doc.exists) {
                userData.user = doc.data();

                return db
                    .collection('screams')
                    .where('userHandle', '==', req.params.handle)
                    .orderBy('createdAt', 'desc')
                    .get();
            } else {
                return res.status(401).json({ message: 'User not found.'})
            }
        })
        .then(data => {
            userData.screams = [];

            data.forEach(doc => {
                userData.screams.push({
                    ...doc.data(),
                    screamId: doc.id
                });
            });

            return res.json(userData);
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        });
};

exports.markNotificationsRead = (req, res) => {
    let batch = db.batch();

    req.body.forEach(notificationId => {
        const notification = db.doc(`/notifications/${ notificationId }`);
        batch.update(notification, { read: true });
    });

    batch
        .commit()
        .then(() => {
            return res.json({ message: 'Notifications marked read.'});
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        });
};

// Get own user detail
exports.getAuthenticateUser = (req, res) => {
    let userData = {};

    db
        .doc(`/users/${ req.user.handle }`)
        .get()
        .then(doc => {
            if (doc.exists) {
                userData.credantials = doc.data();
                
                return db
                    .collection('likes')
                    .where('userHandle', '==', req.user.handle)
                    .get();
            } else {
                return res.status(401).json({ message: 'User not found.'})
            }
        })
        .then(data => {
            userData.likes = [];
            
            data.forEach(doc => {
                userData.likes.push(doc.data());
            });

            return db
                .collection('notifications')
                .where('recipient', '==', req.user.handle)
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();
        })
        .then(data => {
            userData.notifications = [];

            data.forEach(doc => {
                userData.notifications.push({
                    ...doc.data(),
                    notificationId: doc.id
                });
            });

            return res.json(userData);
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        });
};