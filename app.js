// تهيئة Firebase باستخدام معلومات API الخاصة بك
const firebaseConfig = {
  apiKey: "AIzaSyDdF31FcmO7qkJVmGovPExJKRDXlfJyMgA",
  authDomain: "chat-64f21.firebaseapp.com",
  databaseURL: "https://chat-64f21-default-rtdb.firebaseio.com",
  projectId: "chat-64f21",
  storageBucket: "chat-64f21.firebasestorage.app",
  messagingSenderId: "1022586742384",
  appId: "1:1022586742384:web:80ecaa1d3ed8da440a36b5",
  measurementId: "G-6WP0L4FEHE"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// عناصر DOM
const messageForm = document.getElementById('messageForm');
const usernameInput = document.getElementById('username');
const messageInput = document.getElementById('message');
const messagesDiv = document.getElementById('messages');

// إرسال الرسالة
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = usernameInput.value;
    const message = messageInput.value;
    
    if (username && message) {
        // حفظ الرسالة في Firebase
        database.ref('messages').push({
            username: username,
            message: message,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        messageInput.value = '';
    }
});

// عرض الرسائل الجديدة
database.ref('messages').orderByChild('timestamp').limitToLast(100).on('value', (snapshot) => {
    messagesDiv.innerHTML = '';
    
    snapshot.forEach((childSnapshot) => {
        const message = childSnapshot.val();
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        
        const time = new Date(message.timestamp).toLocaleTimeString();
        messageElement.textContent = `${message.username} (${time}): ${message.message}`;
        
        messagesDiv.appendChild(messageElement);
    });
    
    // التمرير إلى الأسفل لعرض أحدث الرسائل
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});
