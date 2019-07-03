const db = {
    users: [
        {
            userId: 'wAvxSbCTNMg7tzNh08dUPAphYw22',
            email: 'user@email.com',
            handle: 'user',
            createdAt: '2019-06-27T15:51:50.921Z',
            imageUrl: 'image/abc/abc',
            bio: 'Hello, my name is user, nice to meet you.',
            website: 'https://user.com',
            location: 'Toronto, ON'
        }
    ],
    screams: [
        {
            userHandle   : 'user',
            body         : 'this is a scream body',
            createdAt    : '2019-06-27T02:11:07.404Z',
            likeCount    : 5,
            commentCount : 2
        }
    ],
    comments: [
        {
            userHandle: 'user',
            screamId: 'FvvOjIAklkHN6q0mfVpf',
            body: 'nice one mate!',
            createdAt: '2019-06-27T02:11:07.404Z'
        }
    ]
};

const userDetails = {
    //Redux data
    credentials: {
        userId: 'wAvxSbCTNMg7tzNh08dUPAphYw22',
            email: 'user@email.com',
            handle: 'user',
            createdAt: '2019-06-27T15:51:50.921Z',
            imageUrl: 'image/abc/abc',
            bio: 'Hello, my name is user, nice to meet you.',
            website: 'https://user.com',
            location: 'Toronto, ON'
    },
    likes: [
        {
            userHandle: 'user',
            screamId: 'FvvOjIAklkHN6q0mfVpf'
        },
        {
            userHandle: 'user',
            screamId: 'J9SowjiyeViXY9qMUP0s'
        }
    ]
};