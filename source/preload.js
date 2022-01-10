const {contextBridge, ipcRenderer} = require('electron')

contextBridge.exposeInMainWorld('board', {
	blank: () => ipcRenderer.invoke('board:blank'),
	start: () => ipcRenderer.invoke('board:start'),
	parse: (fen) => ipcRenderer.invoke('board:parse', fen),
	constructMove: (start, end) => ipcRenderer.invoke('board:move', start, end),
	setPromotion: (move, promotionRule) => ipcRenderer.invoke('board:promo', move, promotionRule)
})

// contextBridge.exposeInMainWorld('log', (message) => ipcRenderer.send('log', message))
contextBridge.exposeInMainWorld('log', {
	log: (message) => ipcRenderer.send('log', message)
})
