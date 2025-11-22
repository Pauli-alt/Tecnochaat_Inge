package com.tecnochat.ice;

import TecnoChat.CallService;
import com.tecnochat.server.ClientHandler;
import com.tecnochat.server.MessageHistory;
import com.zeroc.Ice.Current;

public class CallServiceI implements CallService {
    @Override
    public void startCall(String from, String to, Current current) {
        boolean delivered = ClientHandler.notifyIncomingCall(from, to);
        MessageHistory.saveLlamadaIndividual(from, to, delivered ? "INICIADA_RPC" : "RECHAZADA_RPC");
    }

    @Override
    public void endCall(String user, Current current) {
        MessageHistory.saveLlamadaIndividual(user, "DESCONOCIDO", "TERMINADA_RPC");
        ClientHandler.notifyCallEnded(user);
    }
}
