const {app, BrowserWindow, ipcMain, nativeTheme} = require('electron')
const path = require('path')

const chess = require('./chess_module/chess-rules.js')

const makeChessHandles = () => {
	ipcMain.handle('board:blank', () => {
		return chess.ChessGame('8/8/8/8/8/8/8/8 w KQkq - 0 1')
	})

	ipcMain.handle('board:start', () => {
		return chess.ChessGame('startpos')
	})

	ipcMain.handle('board:parse', (fen) => {
		return chess.ChessGame(fen)
	})

	ipcMain.handle('board:move', (start, end) => {
		return chess.Move(start, end)
	})

	ipcMain.handle('board:promo', (move, promotionRule) => {
		return chess.Move(move.start, move.end, promotionRule)
	})
}

const makeLogHandle = () => {
	ipcMain.handle('log', (message) => {
		console.log(message)
	})
}

const createWindow = () => {
	const win = new BrowserWindow({
		width: 1280,
		height: 720,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js')
		}
	})

	makeChessHandles()
	makeLogHandle()

	win.loadFile('main/index.html')
}

app.whenReady().then(() => {
	createWindow()

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})

app.on('window-all-closed', ()=>{
	if (process.platform !== 'darwin') app.quit()
})
