"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vsutil_1 = require("./vsutil");
function processError(logger, err) {
    if (err instanceof Error) {
        if (!err.suppress) {
            logger.error(err);
        }
        else {
            logger.show();
            logger.message(err.message);
        }
        if (err.file) {
            if (err.line) {
                vsutil_1.vsutil.open(err.file, err.line, err.column);
            }
            else {
                vsutil_1.vsutil.open(err.file);
            }
        }
    }
    else {
        logger.error(err);
    }
}
exports.processError = processError;
//# sourceMappingURL=error.js.map