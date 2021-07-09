"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ftp_path = {
    normalize(ftppath) {
        const pathes = ftppath.split('/');
        const npathes = [];
        for (const name of pathes) {
            switch (name) {
                case '': break;
                case '.': break;
                case '..':
                    if (npathes.length === 0 || npathes[npathes.length - 1] === '..') {
                        npathes.push('..');
                    }
                    else
                        npathes.pop();
                    break;
                default:
                    npathes.push(name);
                    break;
            }
        }
        if (npathes.length === 0) {
            if (ftppath.startsWith('/'))
                return '/.';
            return '.';
        }
        if (ftppath.startsWith('/'))
            return '/' + npathes.join('/');
        return npathes.join('/');
    },
    dirname(ftppath) {
        const idx = ftppath.lastIndexOf('/');
        if (idx === 0)
            return '/.';
        if (idx !== -1)
            return ftppath.substr(0, idx);
        return '.';
    },
    basename(ftppath) {
        const idx = ftppath.lastIndexOf('/');
        return ftppath.substr(idx + 1);
    },
};
//# sourceMappingURL=ftp_path.js.map