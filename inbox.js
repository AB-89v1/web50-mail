document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
    
});

function send_email(event) {
    event.preventDefault()
    
    fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: document.querySelector('#compose-recipients').value,
            subject: document.querySelector('#compose-subject').value,
            body: document.querySelector('#compose-body').value
        })
    })
    .then(response => load_mailbox('sent'));
}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#message-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
    
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#message-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
    
  //Send GET request and convert response to JSON
  fetch('/emails/' + mailbox)
  .then(response => response.json())
  .then(emails => {
    console.log(emails);
      
     //Loop through array of emails to create div elements
      emails.forEach(email => {
          let div = document.createElement('div');
          div.innerHTML = `
            <span>From: ${email.sender}</span></br>
            <span>${email.subject}</span></br>
            <span style="font-style: italic">${email.timestamp}</span>`;
          
          div.setAttribute("class", "mailbox_item")
          if (email['read'] == false) {
              div.style.backgroundColor = "white";
          }
          else {
              div.style.backgroundColor = "#eeeeee";
          }
          document.querySelector('#emails-view').append(div);
          //Add event listener
          div.addEventListener('click', () => load_email(email.id, mailbox));
      });
  });
}

function load_email(id, mailbox) {
    
    //Show the message div and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#message-view').style.display = 'block';
    
    //Clear out contents of view
    document.querySelector('#message-view').innerHTML = '';
    
    //Send GET request and convert response to JSON
    fetch('/emails/' + id)
    .then(response => response.json())
    .then(email => {
        console.log(email);
        
        //Create div element for message data
        let div = document.createElement('div');
        div.setAttribute('id','message');
        div.innerHTML = `
            <div id="message_to_from"
                <span>From: ${email.sender}</span></br>
                <span>To: ${email.recipients}</span></br>
            </div>
            <p id="message_subject">${email.subject}</p>
            <span id="message_timestamp"> ${email.timestamp}</span></br>
            <p id="message_body">${email.body}</p>`;
        document.querySelector('#message-view').appendChild(div);
        
        //Send PUT to mark as read
        fetch('/emails/' + id, {
            method: 'PUT',
            body: JSON.stringify({
                read: true
            })
        })
        
        //Generate reply button
        let reply = document.createElement('button');
        reply.className = "btn btn-primary";
        reply.setAttribute('id', 'reply_button');
        reply.innerHTML = 'Reply';
        reply.addEventListener('click', function() {
            compose_email();
            
            //Populate 'To:' field with original sender
            document.querySelector('#compose-recipients').value = email.sender;
            
            //Add 'Re:' to subject if not already
            if (email.subject.slice(0,3) == 're:') {
                document.querySelector('#compose-subject').value = email.subject;
            } else {
                document.querySelector('#compose-subject').value = 'Re: ' + email.subject;
            }
            
            //Populate body field
            document.querySelector('#compose-body').value = 'On ' + email.timestamp + ' ' + email.sender + ' wrote: ' + email.body;
        })
        document.querySelector('#message').append(reply);
        
        //Generate archive button for inbox emails
        if (mailbox !== "sent") {
            var i;
            var user = document.querySelector('#user_email').value;
        
            if (email['archived'] === false) {
                let archive_button = document.createElement('button');
                archive_button.className = "btn btn-primary";
                archive_button.setAttribute('id','archive_button');
                archive_button.innerHTML = 'Archive Message';
                archive_button.addEventListener('click', function() {
                    fetch('/emails/' + id, {
                          method: 'PUT',
                          body: JSON.stringify({
                            archived: true
                          })
                    })
                    .then(response => load_mailbox('inbox'))
                });
                document.querySelector('#message').appendChild(archive_button);
            } else {
                let archive_button = document.createElement('button');
                archive_button.className = "btn btn-primary";
                archive_button.setAttribute('id','archive_button');
                archive_button.innerHTML = 'Unarchive Message';
                archive_button.addEventListener('click', function() {
                    fetch('/emails/' + id, {
                          method: 'PUT',
                          body: JSON.stringify({
                            archived: false
                          })
                    })
                    .then(response => load_mailbox('inbox'))
                });
                document.querySelector('#message').appendChild(archive_button);
            }
        }
    })
}
