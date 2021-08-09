
const http = require('http');
const fs = require('fs');
const Moniker = require('moniker'); //random nimien generaatori

//http-serveri joka laitetaan muuttujaan app tuottaa sivun client.html
const app = http.createServer(function(req, res) {
    fs.readFile("client.html", 'utf-8', function(error, data) {
        res.writeHead(200, { 
            'Content-Type': 'text/html',
         });
        res.write(data);
        res.end();
    });
}).listen(3010);
console.log('Http server in port 3010');

//Socket-serveri io luodaan ja liitetään http-serveriin app
const io = require('socket.io')(app);

//satunnasluvun arvonta
const randomNumber = function(){
    //get a random integer between1 and 100
    const randnum = parseInt(Math.random() * 100) + 1;
    return randnum;
};
const thenumber = randomNumber(); //загданное число, которое надо угадать
const users = [];
const addUser = function(){
    const user = {
        //дает случайное имя
        name: Moniker.choose(),
        guesses: 0,
    };
    users.push(user);
    updateUsers();
    return user;
};
//Пользователь удаляется, когда закрывается браузер
const removeUser= function(user) {
    for(let i = 0; i < users.length; i++) {
        if(user.name === users[i].name) {
            users.splice(i, 1);
            updateUsers();
            return;
        }
    }
};
const updateUsers = function(){
    let str = '';
    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        str += user.name + ' <small>(' + user.guesses + ' guesses)</small>';
    }
    //всем пользователям передается имя и предположение цифры
    io.sockets.emit('users', {
    users: str,
});
}

/*'connection'-tapahtuma suoritetaan joka kerta kun joku clientin 
socket ottaa yhteyden serveriin. Parametrina oleva muuttuja socket on 
viittaus clientin socketiin
*/
io.sockets.on('connection', function(socket) {
   const user = addUser(); //lisätään user taulukkoon
   socket.emit('welcome', user); //lähetetään welcome -viesti userille
   socket.on('disconnect', function(){ //vastanotetaan disconnect-tapahtuma
    removeUser(user);//poistetaan user taulukosta
   });

   //vastaanotetaan clientilta 'guess' tapahtuma 
   socket.on('guess', function(data){
       user.guesses += 1;

       if(Number(data.message) === thenumber) {
           //lähetetään pelin voittaja kaikkille socketeille
io.sockets.emit ('win', {
    message:'<strong>' + user.name + '</strong> guesses the right number<strong>'
});
//arvaus liian suuri
        } else  if (Number(data.message) > thenumber) {
        //Lähetetään arvaus kaikille soceteille
        io.sockets.emit('message_to_client', {
            message: user.name + ': ' + data.message + ' -too big',
        });
        //arvaus liian pieni
        } else if (Number(data.message) < thenumber) {
            //Lähetetään arvaus kaikille soceteille
            io.sockets.emit('message_to_client', {
                message: user.name + ':' + data.message + ' -too small',
            });
        }
    });
});