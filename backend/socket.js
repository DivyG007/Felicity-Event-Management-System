const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const User = require('./models/User');

module.exports = function setupSocket(io) {
    // Authenticate socket connections via JWT
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Authentication required'));
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.userRole = decoded.role;
            next();
        } catch (err) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', async (socket) => {
        // Fetch user info
        const user = await User.findById(socket.userId).select('firstName lastName role');
        if (!user) return socket.disconnect();

        console.log(`Socket connected: ${user.firstName} ${user.lastName}`);

        // Join an event's discussion room
        socket.on('join-event', async (eventId) => {
            socket.join(`event:${eventId}`);
            // Send recent message history (last 50)
            const messages = await Message.find({ eventId, isDeleted: false })
                .populate('userId', 'firstName lastName role')
                .sort({ createdAt: -1 })
                .limit(50)
                .lean();
            socket.emit('message-history', messages.reverse());
        });

        // Leave an event's discussion room
        socket.on('leave-event', (eventId) => {
            socket.leave(`event:${eventId}`);
        });

        // Send a message
        socket.on('send-message', async ({ eventId, content }) => {
            if (!content || content.trim().length === 0) return;
            if (content.length > 1000) return;

            const message = await Message.create({
                eventId,
                userId: socket.userId,
                content: content.trim(),
            });

            const populated = await Message.findById(message._id)
                .populate('userId', 'firstName lastName role')
                .lean();

            io.to(`event:${eventId}`).emit('new-message', populated);
        });

        // Delete a message (organizer moderation)
        socket.on('delete-message', async ({ messageId }) => {
            const msg = await Message.findById(messageId);
            if (!msg) return;

            // Only the author or an organizer can delete
            const isAuthor = msg.userId.toString() === socket.userId;
            const isOrgOrAdmin = socket.userRole === 'organizer' || socket.userRole === 'admin';
            if (!isAuthor && !isOrgOrAdmin) return;

            msg.isDeleted = true;
            msg.deletedBy = socket.userId;
            await msg.save();

            io.to(`event:${msg.eventId}`).emit('message-deleted', messageId);
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${user.firstName} ${user.lastName}`);
        });
    });
};
