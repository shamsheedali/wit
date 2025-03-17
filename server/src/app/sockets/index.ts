import { Server, Socket} from 'socket.io'

export default function socketHandler(io: Server) {
    io.on('connection', (socket: Socket) => {
        console.log('User connected:', socket.id);

        socket.on('join', (userId: string) => {
            socket.join(userId);
            console.log(`${userId} joined their room`);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    })
}