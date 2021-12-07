const express = require('express');
const app = express();
const server = require('http').Server(app);
const socketIo = require('socket.io');
const io = socketIo(server);
// const records = require('./records.js');
const port = process.env.PORT || 4500;


app.get('/', (req, res) => {
    res.sendFile( __dirname + '/views/index.html');
});

let online = 0;
let sockets = {} // 保存用户
let SYS = '系统提示'
let t = new Date() // 用来处理消息发送时间
io.on('connection', socket => {
    console.log('客户端连接到服务器', socket.name);
    online += 1;
    io.emit('online',online);
    let rooms = [];
    let user = [];
    let username;
    socket.on('message', msg => {
        if (!username) {
            username = msg.name;
            console.log(msg);
            // 消息内容
            let message = {
                name: SYS,
                timer: t.getTime(),
                msg: `${msg.name} 開始聊天囉`,
                prive: {
                    status:false,
                    from:"no",
                },
            }
            sockets[username] = socket;
            // console.log(sockets);
            socket.broadcast.emit('message', JSON.stringify(message));
            socket.emit('message', JSON.stringify(message));
        } else {
            if (rooms.length > 0) {
                for (let i = 0; i < rooms.length; i++) {
                    if (msg.msg.match(/^@([^ ]+) (\S)+/)) {
                        let [, name, m] = msg.msg.match(/^@([^ ]+) (\S)+/);
                        let m1 = msg.msg.split(" ")[1];
                        console.log([, name, m]);
                        console.log("aaaaa");
                        username = msg.name;
            
                        if (name) {
                            if (name === username) {
                                let message = {
                                    name: SYS,
                                    timer: t.getTime(),
                                    msg: '您不可以@自己！'
                                }
                                socket.emit('message', JSON.stringify(message))
                            } else {
                                let message = {
                                    name: msg.name,
                                    timer: t.getTime(),
                                    msg: m1,
                                    prive: {
                                        status: true,
                                        from: msg.name,
                                    },
                                }
                                sockets[name].emit('message', JSON.stringify(message));
                                sockets[msg.name].emit('message', JSON.stringify(message));

                            }
                            
                        } else { // 如果不存在，则提示用户不存在
                            let message = {
                                name: SYS,
                                timer: t.getTime(),
                                msg: '你@的用户不存在！'
                            }
                            socket.emit('message', JSON.stringify(message))
                        }
                    } else {
                        let message = {
                            name: msg.name,
                            timer: t.getTime(),
                            msg: msg.msg,
                            prive: {
                                status:false,
                                from:"no",
                            },
                        }
                        io.in(rooms[i]).emit('message', JSON.stringify(message));
                    }
                }
            }else{
                if (msg.msg.match(/^@([^ ]+) (\S)+/)) {
                    let [, name, m] = msg.msg.match(/^@([^ ]+) (\S)+/);
                    let m1 = msg.msg.split(" ")[1];
                    console.log([, name, m]);
                    console.log("aaaaa");
                    username = msg.name;
        
                    if (name) {
                        if (name === username) {
                            let message = {
                                name: SYS,
                                timer: t.getTime(),
                                msg: '您不可以@自己！'
                            }
                            socket.emit('message', JSON.stringify(message))
                        } else {
                            let message = {
                                name: msg.name,
                                timer: t.getTime(),
                                msg: m1,
                                prive: {
                                    status: true,
                                    from: msg.name,
                                },
                            }
                            sockets[name].emit('message', JSON.stringify(message));
                            sockets[msg.name].emit('message', JSON.stringify(message));

                        }
                        
                    } else { // 如果不存在，则提示用户不存在
                        let message = {
                            name: SYS,
                            timer: t.getTime(),
                            msg: '你@的用户不存在！'
                        }
                        socket.emit('message', JSON.stringify(message))
                    }
                } else {
                    let message = {
                        name: msg.name,
                        timer: t.getTime(),
                        msg: msg.msg,
                        prive: {
                            status: false,
                            from: "no",
                        },
                    }
                    io.emit('message', JSON.stringify(message));
                }
            }
        }
        
    })
    socket.on('disconnect', () => {
        // 有人離線了，扣人
        online = (online < 0) ? 0 : online-=1;
        io.emit("online", online);
    });
    socket.on('error', () => {
        console.log('连接错误')
    })

    room = "大廳";

    socket.on('join', roomName => {
        room = roomName;
        socket.emit('room',room);
        
        let oldIndex = rooms.indexOf(roomName);
        if (oldIndex == -1) {
            socket.join(roomName);//相当于这个socket在服务器端进入了某个房间 
            rooms.push(roomName);
            let message = {
                name: SYS,
                timer: t.getTime(),
                msg: `您成功進入房間${roomName}囉`,
                prive: {
                    status: false,
                    from: "no",
                },
            }
            socket.emit('message', JSON.stringify(message))
        } else{ 
            let message = {
                name: SYS,
                timer: t.getTime(),
                msg: `您已經在房間${roomName}了`,
                prive: {
                    status: false,
                    from: "no",
                },
            }
            socket.emit('message', JSON.stringify(message))
        }
        
       
        socket.on('joined', () => {
            let message = {
                name: SYS,
                timer: t.getTime(),
                msg: `您進入了房間${roomName}`,
                prive: {
                    status: false,
                    from: "no",
                },
            }
            socket.emit('message', JSON.stringify(message))
            // io.in(room).emit('message', JSON.stringify(message2));
        })
       
    })
    socket.on('leave', roomName => {
        // 这里应该判断用户在不在该房间
        room = "大廳";
        socket.emit('room',room);
        let oldIndex = rooms.indexOf(roomName);
        if (oldIndex !== -1) {
            socket.leave(roomName);//相当于这个socket在服务器端进入了某个房间 
            rooms.splice(oldIndex, 1);
            let message = {
                name: SYS,
                timer: t.getTime(),
                msg: `您離開${roomName}房間了`,
                prive: {
                    status: false,
                    from: "no",
                },
            }
            socket.emit('message', JSON.stringify(message))
        } else {
            let message = {
                name: SYS,
                timer: t.getTime(),
                msg: `您已經不在${roomName}房間了`,
                prive: {
                    status: false,
                    from: "no",
                },
            }
            socket.emit('message', JSON.stringify(message))
        }
        
        
    })
})

server.listen(port, () => {
    console.log("Server Started. http://localhost:" + port);
});