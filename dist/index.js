"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path")); //import path from 'path';
const express_1 = __importDefault(require("express"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const serve_static_1 = __importDefault(require("serve-static"));
const app = (0, express_1.default)();
const port = process.env.PORT || 8000;
app.use((0, cookie_parser_1.default)());
app.enable('trust proxy');
app.set('etag', 'strong');
app.use((0, compression_1.default)());
// health check
app.use('/health', (_req, res) => res.send(`👍 Ok ${process.env.WEBSITE_INSTANCE_ID} ${process.env.COMPUTERNAME} ${process.env.HOSTNAME}`));
// Serve static files
const uiRoot = path.resolve(__dirname, `./static`);
for (const route of ['/', '/images', '/docs']) {
    app.use(route, (0, serve_static_1.default)(uiRoot, {
        acceptRanges: false,
        maxAge: 604800000 // milliseconds
    }));
}
app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
