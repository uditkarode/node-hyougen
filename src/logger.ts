const enum Colors {
    yellow = "\x1b[33m",
    red = "\x1b[31m",
    green = '\x1b[32m',
    reset = "\x1b[0m",
    us = "\x1b[4m",
    bold = "\x1b[1m",
}

export class Logger {
    static info(logMsg: string, filename: string) {
        const color = Colors.yellow;
        console.log(color + '(' + Colors.bold + Colors.us + filename + Colors.reset + color + ') ' + 'INFO> ' + logMsg + Colors.reset);
    }

    static error(logMsg: string, filename: string) {
        const color = Colors.red;
        console.log(color + '(' + Colors.bold + Colors.us + filename + Colors.reset + color + ') ' + 'ERR> ' + logMsg + Colors.reset);
    }

    static success(logMsg: string, filename: string) {
        const color = Colors.green;
        console.log(color + '(' + Colors.bold + Colors.us + filename + Colors.reset + color + ') ' + 'SUCCESS> ' + logMsg + Colors.reset);
    }
}
