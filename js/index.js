var firebaseConfig = {
  apiKey: "AIzaSyC2dHjCSBdOzoFD-cP5CeTEjwGSfYeJs2M",
  authDomain: "my-awesome-shopping-list-bf6ab.firebaseapp.com",
  databaseURL: "https://my-awesome-shopping-list-bf6ab.firebaseio.com/",
  projectId: "my-awesome-shopping-list-bf6ab",
  messagingSenderId: "869238910267"
};
firebase.initializeApp(firebaseConfig);

let pathToSound = './soundboard/'
let soundsAdd = ['add1.mp3','add2.mp3','add3.mp3','add4.mp3','add5.mp3','add6.mp3','add7.mp3']
let soundsCheckbox = ['checkbox1.mp3', 'checkbox2.mp3', 'checkbox3.mp3', 'checkbox4.mp3', 'checkbox5.mp3', 'checkbox6.mp3', 'checkbox7.mp3', 'checkbox8.mp3', 'checkbox9.mp3', 'checkbox10.mp3']
let soundsDelete= ['delete1.mp3', 'delete2.mp3', 'delete3.mp3', 'delete4.mp3', 'delete5.mp3', 'delete6.mp3', 'delete7.mp3', 'delete8.mp3', 'delete9.mp3', 'delete10.mp3', 'delete11.mp3']

let interactions = 0;

if ('serviceWorker' in navigator && 'PushManager' in window) {
  navigator.serviceWorker.register('service-worker.js')
    .then(function(reg){
    firebase.messaging().useServiceWorker(reg);
  })
  .catch(function(err) {
      console.log("No it didn't. This happened: ", err)
    });
}
const messaging = firebase.messaging();
const db = firebase.firestore();

db.enablePersistence();
const itemsRef = db.collection('items');
const tokenRef = db.collection('tokens');

function sendNotificationToDevices(message){
  messaging.getToken()
  .then((token) => {
    tokenRef.get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          if (doc.data().token !== token){
            var request = new XMLHttpRequest();
            request.open("POST", 'https://fcm.googleapis.com/fcm/send', true);
            request.setRequestHeader('Content-Type','application/json');
            request.setRequestHeader('Authorization', 'key=' + 'AAAAymKtLTs:APA91bGrlfj_JYbKFGbHeXSEjIxQyE-G0KEf3h-UBPnTSJ0qBdUgRcdg84OjnSuX6sCxn_LP-MECMeN9xjPrrOCMf_g4zcjKAzzYopHE8ckBGhP22NSWGI7CFAyu5RSGZJJK5HVlxtQx');
            request.send(`{
              "to" : "${doc.data().token}",
           "notification" : {
             "body" : "${message}",
             "title" : "Shopping App",
             }
           }`)
         }
        });
    });
 })
}

function askForNotification() {
  if ('PushManager' in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
    messaging.requestPermission()
       .then((res) => {
         console.log(res);
         return messaging.getToken();
       })
       .then((token) => {
         console.log(token);
         tokenRef.add({
             token: token
         })
         console.log(token)
       })
      .catch((error) => {
       console.error(error)});
  }
}

itemsRef
.onSnapshot(function(snapshot) {
    snapshot.docChanges().forEach(function(change) {
      if (interactions > 3) {
        askForNotification();
      }
      if (change.type === "added") {
        console.log(change.doc.data());
          let item = change.doc.data();
          let newItem = toDoTemplate.cloneNode(true);
          newItem.setAttribute('data-uId', change.doc.id);
          let name = newItem.querySelector('#item__name');
          let deleteItem = newItem.querySelector('.item__delete')
          name.innerText = item.name;
          let input = newItem.querySelector('.item__checkbox')

          if(item.checked == true) {
            newItem.classList.add('item--checked');
            newItem.querySelector('.item__checkbox').checked = true;
          }

          input.addEventListener('change', (e) => {
            interactions++;
            let random = Math.floor((Math.random() * soundsCheckbox.length));
            let audio = new Audio(pathToSound + soundsCheckbox[random]);
            audio.play();
            let targetItem = e.currentTarget.parentNode;
            let id = targetItem.getAttribute('data-uId')
            if (targetItem.classList.contains('item--checked')){
              targetItem.classList.remove('item--checked')
              itemsRef.doc(id).update({
                  checked: false
              })
            }
            else {
              targetItem.classList.add('item--checked')
              itemsRef.doc(id).update({
                  checked: true
              })
            }
          })

          deleteItem.addEventListener('click', (e) => {
            let random = Math.floor((Math.random() * soundsDelete.length));
            let audio = new Audio(pathToSound + soundsDelete[random]);
            audio.play();
            interactions++;
            let targetItem = e.currentTarget.parentNode;
            let id = targetItem.getAttribute('data-uId')
            console.log(id);
            console.log(itemsRef.doc(id));
            itemsRef.doc(id).delete()
            .then(function() {
              sendNotificationToDevices(item.name + ' got deleted from list!')
              console.log("Document successfully deleted!");
          }).catch(function(error) {
              console.error("Error removing document: ", error);
          });
          })
          items.appendChild(newItem);
      }
      if (change.type === "modified") {
          console.log("Modified city: ", change.doc.data());
      }
      if (change.type === "removed") {
        console.log('something got removed')
        let items = document.getElementsByClassName('item');
        for (let item of items) {
          if(item.getAttribute('data-uId') == change.doc.id) {
            item.remove();
          }
        }
      }
  });
});

const items = document.getElementById('items');
const toDoTemplate = document.getElementById('item--template');
toDoTemplate.remove();


const addButton = document.getElementById('button--add');
const addInput = document.getElementById('input--add');

addButton.addEventListener('click', (e) => {
  let random = Math.floor((Math.random() * soundsAdd.length));
  let audio = new Audio(pathToSound + soundsAdd[random]);
  audio.play();
  interactions++;
  let capitalizedInput = addInput.value.charAt(0).toUpperCase() + addInput.value.slice(1);
  sendNotificationToDevices(capitalizedInput + ' got added to list!');
  itemsRef.add({
      name: capitalizedInput,
      checked: false
  })
  addInput.value = '';
})
