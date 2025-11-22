import Ice from "ice";

class IceClient {
    constructor({ host = "localhost", port = 10000 } = {}) {
        this.host = host;
        this.port = port;
        this.communicator = null;
        this.chatPrx = null;
        this.callPrx = null;
        this.connected = false;
    }

    async connect() {
        if (this.connected && this.communicator) {
            return;
        }

        this.communicator = Ice.initialize();
        this.chatPrx = this._stringToProxy("ChatService");
        this.callPrx = this._stringToProxy("CallService");
        this.connected = true;
        console.log(`[IceClient] Conectado a ${this.host}:${this.port}`);
    }

    async close() {
        if (this.communicator) {
            await this.communicator.destroy();
        }
        this.connected = false;
        this.communicator = null;
        this.chatPrx = null;
        this.callPrx = null;
    }

    async getOnlineUsers() {
        await this._ensureConnected();
        return this._invokeStringSeq(this.chatPrx, "getOnlineUsers");
    }

    async getGroupMembers(group) {
        await this._ensureConnected();
        return this._invokeStringSeq(this.chatPrx, "getGroupMembers", (os) => {
            os.writeString(group ?? "");
        });
    }

    async getGroupHistory(group) {
        await this._ensureConnected();
        return this._invokeStringSeq(this.chatPrx, "getGroupHistory", (os) => {
            os.writeString(group ?? "");
        });
    }

    async getPrivateHistory(requester, other) {
        await this._ensureConnected();
        return this._invokeStringSeq(this.chatPrx, "getPrivateHistory", (os) => {
            os.writeString(requester ?? "");
            os.writeString(other ?? "");
        });
    }

    async sendMessage(from, to, message) {
        await this._ensureConnected();
        return this._invokeVoid(this.chatPrx, "sendMessage", (os) => {
            os.writeString(from ?? "");
            os.writeString(to ?? "");
            os.writeString(message ?? "");
        });
    }

    async sendGroupMessage(from, group, message) {
        await this._ensureConnected();
        return this._invokeVoid(this.chatPrx, "sendGroupMessage", (os) => {
            os.writeString(from ?? "");
            os.writeString(group ?? "");
            os.writeString(message ?? "");
        });
    }

    async startCall(from, to) {
        await this._ensureConnected();
        return this._invokeVoid(this.callPrx, "startCall", (os) => {
            os.writeString(from ?? "");
            os.writeString(to ?? "");
        });
    }

    async endCall(user) {
        await this._ensureConnected();
        return this._invokeVoid(this.callPrx, "endCall", (os) => {
            os.writeString(user ?? "");
        });
    }

    async createGroup(name, members) {
        await this._ensureConnected();
        const membersArr = Array.isArray(members) ? members : (members || "").split(",").map(m => m.trim()).filter(Boolean);
        return this._invokeBool(this.chatPrx, "createGroup", (os) => {
            os.writeString(name ?? "");
            os.writeStringSeq(membersArr);
        });
    }

    // ========== Helpers ==========
    _stringToProxy(identity) {
        const proxyStr = `${identity}:default -h ${this.host} -p ${this.port}`;
        return this.communicator.stringToProxy(proxyStr);
    }

    async _ensureConnected() {
        if (!this.connected) {
            await this.connect();
        }
    }

    async _invokeVoid(prx, operation, writeParams) {
        const os = new Ice.OutputStream(this.communicator);
        os.startEncapsulation();
        if (writeParams) {
            writeParams(os);
        }
        os.endEncapsulation();

        const { returnValue } = await prx.ice_invoke(
                operation,
                Ice.OperationMode.Normal,
                os.finished()
        );

        if (!returnValue) {
            throw new Error(`[IceClient] Operacion ${operation} fallo`);
        }
        return true;
    }

    async _invokeStringSeq(prx, operation, writeParams) {
        const os = new Ice.OutputStream(this.communicator);
        os.startEncapsulation();
        if (writeParams) {
            writeParams(os);
        }
        os.endEncapsulation();

        const { returnValue, outParams } = await prx.ice_invoke(
                operation,
                Ice.OperationMode.Normal,
                os.finished()
        );

        if (!returnValue) {
            throw new Error(`[IceClient] Operacion ${operation} fallo`);
        }

        const is = new Ice.InputStream(this.communicator, outParams);
        is.startEncapsulation();
        const result = is.readStringSeq();
        is.endEncapsulation();
        return result || [];
    }

    async _invokeBool(prx, operation, writeParams) {
        const os = new Ice.OutputStream(this.communicator);
        os.startEncapsulation();
        if (writeParams) {
            writeParams(os);
        }
        os.endEncapsulation();

        const { returnValue, outParams } = await prx.ice_invoke(
                operation,
                Ice.OperationMode.Normal,
                os.finished()
        );

        if (!returnValue) {
            return false;
        }

        const is = new Ice.InputStream(this.communicator, outParams);
        is.startEncapsulation();
        const result = is.readBool();
        is.endEncapsulation();
        return result;
    }
}

export default IceClient;
