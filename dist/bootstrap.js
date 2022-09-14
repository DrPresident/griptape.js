"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCoinBalances = exports.getNativeCoinBalance = exports.getSigningClient = exports.getClient = exports.getContracts = exports.instantiate = exports.getHeight = exports.getChainId = exports.getKeplrAccountProvider = exports.accountChangedCallback = exports.executeContract = exports.queryContract = exports.shutdown = exports.bootstrap = exports.gripApp = exports.isAccountAvailable = exports.getWalletInfo = exports.getAddress = exports.getConfig = exports.permitManager = exports.keplrViewingKeyManager = exports.viewingKeyManager = exports.provider = exports.BroadcastMode = void 0;
var wallet_1 = require("./wallet");
var secretjs_1 = require("secretjs");
Object.defineProperty(exports, "BroadcastMode", { enumerable: true, get: function () { return secretjs_1.BroadcastMode; } });
var index_1 = require("./auth/index");
var events_1 = require("./events");
var utils_1 = require("./utils");
var utils_2 = require("./contracts/utils");
var defaultFee = {
    amount: [{ amount: '500000', denom: 'uscrt' }],
    gas: '500000',
};
var systemDefaultFees = {
    upload: utils_2.getFeeForExecute(3000000) || defaultFee,
    init: utils_2.getFeeForExecute(2000000) || defaultFee,
    exec: utils_2.getFeeForExecute(100000) || defaultFee,
    send: utils_2.getFeeForExecute(90000) || defaultFee,
};
var config;
var client;
var signingClient;
var accountAvailable = false;
var getProvider;
exports.viewingKeyManager = new index_1.ViewingKeyManager();
exports.keplrViewingKeyManager = new index_1.KeplrViewingKeyManager(exports.viewingKeyManager);
exports.permitManager = new index_1.PermitManager();
function getConfig() {
    return config;
}
exports.getConfig = getConfig;
function getAddress() {
    return exports.provider === null || exports.provider === void 0 ? void 0 : exports.provider.getAddress();
}
exports.getAddress = getAddress;
function getWalletInfo() {
    var address = exports.provider === null || exports.provider === void 0 ? void 0 : exports.provider.getAddress();
    var name = exports.provider === null || exports.provider === void 0 ? void 0 : exports.provider.getName();
    return {
        address: address,
        name: name,
    };
}
exports.getWalletInfo = getWalletInfo;
function isAccountAvailable() {
    return accountAvailable;
}
exports.isAccountAvailable = isAccountAvailable;
function gripApp(_config, accountProviderGetter, runApp) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var chainId, connected;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!!config) return [3, 6];
                    if (typeof _config === 'string') {
                        config = { restUrl: _config, broadcastMode: secretjs_1.BroadcastMode.Sync };
                    }
                    else {
                        _config.broadcastMode = (_a = _config.broadcastMode) !== null && _a !== void 0 ? _a : secretjs_1.BroadcastMode.Sync;
                        config = _config;
                    }
                    return [4, initClient()];
                case 1:
                    _b.sent();
                    runApp();
                    chainId = config.chainId;
                    if (!!chainId) return [3, 3];
                    return [4, getChainId()];
                case 2:
                    chainId = _b.sent();
                    _b.label = 3;
                case 3:
                    getProvider = accountProviderGetter;
                    connected = localStorage.getItem('connected');
                    if (connected == null) {
                        events_1.emitEvent('account-not-available');
                        return [2];
                    }
                    return [4, getProvider(chainId)];
                case 4:
                    exports.provider = _b.sent();
                    accountAvailable = true;
                    events_1.emitEvent('account-available');
                    return [4, initSigningClient()];
                case 5:
                    _b.sent();
                    _b.label = 6;
                case 6: return [2];
            }
        });
    });
}
exports.gripApp = gripApp;
function initClient() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (client)
                return [2];
            if (!config)
                throw new Error('No configuration was set');
            client = new secretjs_1.CosmWasmClient(config.restUrl);
            return [2];
        });
    });
}
function initSigningClient() {
    return __awaiter(this, void 0, void 0, function () {
        var restUrl, address, signer, seed, broadcastMode, fees;
        return __generator(this, function (_a) {
            if (!config)
                throw new Error('No configuration was set');
            if (!client)
                throw new Error('No client available');
            if (!exports.provider)
                throw new Error('No provider available');
            restUrl = config.restUrl;
            if (!exports.provider)
                return [2];
            address = exports.provider.getAddress();
            signer = exports.provider.getSigner();
            seed = exports.provider.getSeed();
            broadcastMode = config.broadcastMode;
            fees = systemDefaultFees;
            if (config.defaultFees) {
                fees = {
                    upload: utils_2.getFeeForExecute(config.defaultFees.upload) || systemDefaultFees.upload,
                    init: utils_2.getFeeForExecute(config.defaultFees.init) || systemDefaultFees.init,
                    exec: utils_2.getFeeForExecute(config.defaultFees.exec) || systemDefaultFees.exec,
                    send: utils_2.getFeeForExecute(config.defaultFees.send) || systemDefaultFees.send,
                };
            }
            signingClient = new secretjs_1.SigningCosmWasmClient(restUrl, address, signer, seed, fees, broadcastMode);
            return [2];
        });
    });
}
function bootstrap() {
    return __awaiter(this, void 0, void 0, function () {
        var chainId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!getProvider)
                        throw new Error('No provider available');
                    return [4, initClient()];
                case 1:
                    _a.sent();
                    return [4, getChainId()];
                case 2:
                    chainId = _a.sent();
                    return [4, getProvider(chainId)];
                case 3:
                    exports.provider = _a.sent();
                    accountAvailable = true;
                    events_1.emitEvent('account-available');
                    return [4, initSigningClient()];
                case 4:
                    _a.sent();
                    localStorage.setItem('connected', 'connected');
                    return [2];
            }
        });
    });
}
exports.bootstrap = bootstrap;
function reloadSigningClient() {
    return __awaiter(this, void 0, void 0, function () {
        var chainId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, getChainId()];
                case 1:
                    chainId = _a.sent();
                    return [4, getKeplrAccountProviderInternal(chainId, false)];
                case 2:
                    exports.provider = _a.sent();
                    accountAvailable = true;
                    return [4, initSigningClient()];
                case 3:
                    _a.sent();
                    return [2];
            }
        });
    });
}
function shutdown() {
    var connected = localStorage.getItem('connected');
    if (!connected)
        return;
    accountAvailable = false;
    events_1.emitEvent('shutdown');
    localStorage.removeItem('connected');
}
exports.shutdown = shutdown;
function queryContract(address, queryMsg, addedParams, codeHash) {
    if (!client)
        throw new Error('No client available');
    return client.queryContractSmart(address, queryMsg, addedParams, codeHash);
}
exports.queryContract = queryContract;
function executeContract(contractAddress, handleMsg, memo, transferAmount, fee, codeHash) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (!signingClient)
                throw new Error('No signing client available');
            return [2, signingClient.execute(contractAddress, handleMsg, memo, transferAmount, fee, codeHash)];
        });
    });
}
exports.executeContract = executeContract;
function getKeplrAccountProviderInternal(chainId, keplrEnabled) {
    var _a, _b, _c;
    if (keplrEnabled === void 0) { keplrEnabled = true; }
    return __awaiter(this, void 0, void 0, function () {
        var keplr, e_1, offlineSigner, address, enigmaUtils, key;
        var _this = this;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4, wallet_1.getKeplr()];
                case 1:
                    keplr = _d.sent();
                    if (!keplr || !((_a = utils_1.getWindow()) === null || _a === void 0 ? void 0 : _a.getOfflineSigner))
                        throw new Error('Install keplr extension');
                    _d.label = 2;
                case 2:
                    _d.trys.push([2, 4, , 5]);
                    return [4, keplr.enable(chainId)];
                case 3:
                    _d.sent();
                    return [3, 5];
                case 4:
                    e_1 = _d.sent();
                    return [2];
                case 5:
                    offlineSigner = (_b = utils_1.getWindow()) === null || _b === void 0 ? void 0 : _b.getOfflineSigner(chainId);
                    if (!offlineSigner)
                        throw new Error('No offline signer');
                    return [4, offlineSigner.getAccounts()];
                case 6:
                    address = (_d.sent())[0].address;
                    enigmaUtils = keplr.getEnigmaUtils(chainId);
                    return [4, keplr.getKey(chainId)];
                case 7:
                    key = _d.sent();
                    if (keplrEnabled) {
                        exports.accountChangedCallback = function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4, reloadSigningClient()];
                                    case 1:
                                        _a.sent();
                                        events_1.emitEvent('account-change');
                                        return [2];
                                }
                            });
                        }); };
                        (_c = utils_1.getWindow()) === null || _c === void 0 ? void 0 : _c.addEventListener('keplr_keystorechange', exports.accountChangedCallback);
                    }
                    return [2, {
                            getAddress: function () { return address; },
                            getSigner: function () { return offlineSigner; },
                            getSeed: function () { return enigmaUtils; },
                            getName: function () { return key.name; },
                        }];
            }
        });
    });
}
function getKeplrAccountProvider() {
    var _this = this;
    return function (chainId) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, getKeplrAccountProviderInternal(chainId)];
                case 1: return [2, _a.sent()];
            }
        });
    }); };
}
exports.getKeplrAccountProvider = getKeplrAccountProvider;
function getChainId() {
    if (!client)
        throw new Error('No client available');
    return client.getChainId();
}
exports.getChainId = getChainId;
function getHeight() {
    if (!client)
        throw new Error('No client available');
    return client.getHeight();
}
exports.getHeight = getHeight;
function instantiate(codeId, initMsg, label) {
    if (!signingClient)
        throw new Error('No signing client available');
    return signingClient.instantiate(codeId, initMsg, label);
}
exports.instantiate = instantiate;
function getContracts(codeId) {
    if (!client)
        throw new Error('No client available');
    return client === null || client === void 0 ? void 0 : client.getContracts(codeId);
}
exports.getContracts = getContracts;
function getClient() {
    if (!client)
        throw new Error('No client available');
    return client;
}
exports.getClient = getClient;
function getSigningClient() {
    if (!signingClient)
        throw new Error('No singing client available');
    return signingClient;
}
exports.getSigningClient = getSigningClient;
function getNativeCoinBalance() {
    return __awaiter(this, void 0, void 0, function () {
        var address, account, balance;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!client)
                        throw new Error('No client available');
                    address = getAddress();
                    if (!address)
                        throw new Error('No address available');
                    return [4, client.getAccount(address)];
                case 1:
                    account = _a.sent();
                    if (!account)
                        throw new Error('No account exists on chain');
                    if (account.balance.length == 0)
                        return [2, '0'];
                    balance = account.balance.find(function (it) { return it.denom === 'uscrt'; });
                    if (!balance)
                        throw new Error('No balance available');
                    return [2, balance.amount];
            }
        });
    });
}
exports.getNativeCoinBalance = getNativeCoinBalance;
function getCoinBalances() {
    return __awaiter(this, void 0, void 0, function () {
        var address, account;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!client)
                        throw new Error('No client available');
                    address = getAddress();
                    if (!address)
                        throw new Error('No address available');
                    return [4, client.getAccount(address)];
                case 1:
                    account = _a.sent();
                    if (!account)
                        throw new Error('No account exists on chain');
                    return [2, account.balance.concat()];
            }
        });
    });
}
exports.getCoinBalances = getCoinBalances;
//# sourceMappingURL=bootstrap.js.map