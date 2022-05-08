import {app, BrowserWindow, ipcMain, nativeTheme,
	IpcMainInvokeEvent, IpcMainEvent} from 'electron'
import * as path from 'path'

import * as chess from './chess-handler/chess-rules.js'

const electronReload = require('electron-reload')(__dirname, {
		electron: path.join(__dirname, '../..', 'node_modules', 'electron', 'dist', 'electron'),
		electronArgv: ['dist/main.js']
	});

class indexedGame{
	index: number
	game: chess.ChessGame

	constructor(
		index: number,
		fen: string = 'startpos'
	){
		this.index = index
		this.game = new chess.ChessGame(fen)
	}
}

var openGames: indexedGame[] = []

function makeChessHandles(){

	ipcMain.handle('chess:start', async (
		event: IpcMainInvokeEvent
	) => {
		let lowestOpenIndex = 0
		for (let game of openGames){
			if (game.index !== lowestOpenIndex){
				break
			}
			lowestOpenIndex++
		}
		openGames.splice(lowestOpenIndex, 0, new indexedGame(
			lowestOpenIndex
		))
		return chess.generateNewPositionData(
			openGames[lowestOpenIndex].game,
			lowestOpenIndex)
	})

	ipcMain.handle('chess:index-to-algebraic', async (
		event: IpcMainInvokeEvent,
		index: number
	) =>{
		return chess.ita(index)
	})

	ipcMain.handle('chess:algebraic-to-index', async (
		event: IpcMainInvokeEvent,
		algebraic: string
	) =>{
		return chess.ati(algebraic)
	})

	// ipcMain.handle('chess:blank', () => {
	// 	return chess.ChessGame('8/8/8/8/8/8/8/8 w KQkq - 0 1')
	// })

	// ipcMain.handle('chess:start', () => {
	// 	return chess.ChessGame('startpos')
	// })

	// ipcMain.handle('chess:parse', (fen) => {
	// 	return chess.ChessGame(fen)
	// })

	// ipcMain.handle('chess:move', (
	// 	event: IpcMainInvokeEvent,
	// 	start: string | number,
	// 	end: string | number) => {
	// 	return new Move(start, end)
	// })

	// ipcMain.handle('chess:promo', (move, promotionRule) => {
	// 	return chess.Move(move.start, move.end, promotionRule)
	// })
}

function makeLogHandle(){
	ipcMain.on('log', (
		event: IpcMainEvent,
		message: string) => {
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

	win.loadFile('../html/index.html')

	win.webContents.openDevTools();
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
