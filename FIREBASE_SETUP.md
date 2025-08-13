# Firebase Setup for TheHoneyBee

## Security Rules Setup

To ensure that only authenticated admins can write to the database while allowing anyone to read, follow these steps to deploy the Firestore security rules:

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase** in your project (if not already done):
   ```bash
   firebase init
   ```
   - Select Firestore when prompted for which Firebase features to set up
   - Choose your Firebase project
   - Accept the default file for Firestore Rules (`firestore.rules`)

4. **Deploy the security rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Admin Authentication Setup

To set up admin authentication with custom claims:

1. **Create a Firebase Admin SDK service account**:
   - Go to the Firebase Console > Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save the JSON file securely

2. **Set up a Cloud Function or server endpoint to assign admin role**:

   ```javascript
   // Example Cloud Function to set admin claim
   const admin = require('firebase-admin');
   admin.initializeApp();
   
   exports.addAdminRole = functions.https.onCall((data, context) => {
     // Check if request is made by an admin
     if (context.auth.token.admin !== true) {
       return { error: 'Only admins can add other admins' };
     }
     
     // Get user and add custom claim (admin)
     return admin.auth().getUserByEmail(data.email).then(user => {
       return admin.auth().setCustomUserClaims(user.uid, {
         admin: true
       });
     }).then(() => {
       return {
         message: `Success! ${data.email} has been made an admin.`
       };
     }).catch(err => {
       return err;
     });
   });
   ```

3. **Verify admin status in your application**:

   ```javascript
   // After user signs in
   firebase.auth().currentUser.getIdTokenResult()
     .then((idTokenResult) => {
       // Check if user is an admin
       const isAdmin = idTokenResult.claims.admin === true;
       if (isAdmin) {
         // Show admin UI
       } else {
         // Show regular user UI
       }
     })
     .catch((error) => {
       console.log(error);
     });
   ```

## Collections Structure

This application uses two main collections:

1. **courses** - For regular courses
   - Fields: title, description, imgSrc, age, seats, duration, fee, status

2. **advancedCourses** - For advanced courses
   - Fields: title, description, imgSrc, age, seats, duration, fee, status

Both collections are set up with real-time listeners using `onSnapshot` to provide instant updates to the UI when changes occur.