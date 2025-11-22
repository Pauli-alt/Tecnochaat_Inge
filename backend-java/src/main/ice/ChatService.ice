module TecnoChat {

    // Definimos un tipo secuencia de strings
    sequence<string> StringSeq;

    interface ChatService {
        void sendMessage(string from, string to, string message);
        StringSeq getOnlineUsers();
        StringSeq getGroupMembers(string groupName);
        void sendGroupMessage(string from, string group, string message);
        bool createGroup(string name, StringSeq members);
        StringSeq getPrivateHistory(string requester, string other);
        StringSeq getGroupHistory(string groupName);
    }

    interface CallService {
        void startCall(string from, string to);
        void endCall(string user);
    }
}
