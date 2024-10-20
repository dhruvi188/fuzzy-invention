import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";
import { getDatabase } from "firebase/database";


//I understand that it is not a good practise to keep secrey keys in public url, 
//but nonetheless I am keeping these for keeping the web-app executable for the evaluation  
const firebaseConfig = {
  apiKey: "AIzaSyAdFrKiD-8vNCU055xdCqsn9d18mXSeddI",
  authDomain: "fuzzy-invention-5df9c.firebaseapp.com",
  projectId: "fuzzy-invention-5df9c",
  storageBucket: "fuzzy-invention-5df9c.appspot.com",
  messagingSenderId: "580315884197",
  appId: "1:580315884197:web:80b217af4f5f3c76d9fb4c",
  databaseURL: "https://fuzzy-invention-5df9c-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// const provider = new GoogleAuthProvider();
const db=getFirestore(app);
const database = getDatabase(app);
export { auth, app, database, db };

