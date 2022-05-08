import {contextBridge, ipcRenderer} from 'electron'

// import * as chess from './chess-handler/chess-rules.js'

import * as chess from './chess-handler/chess-ipc-types'

export type LoggingApi = {
	log: (message: string) => void
}

const exposedLoggingApi: LoggingApi = {
	log: (message: string) => ipcRenderer.send('log', message)
}

// contextBridge.exposeInMainWorld('log', (message) => ipcRenderer.send('log', message))
contextBridge.exposeInMainWorld('logger', exposedLoggingApi)

export type ChessApi = {
	start: () => Promise<chess.I_NewBoardInfo>
	indexToAlgebraic: (index: number) => Promise<string>
	algebraicToIndex: (alg: string) => Promise<number>
}

const exposedChessApi: ChessApi = {
	start: () => ipcRenderer.invoke('chess:start'),
	indexToAlgebraic: (index: number) => ipcRenderer.invoke(
		'chess:index-to-algebraic',
		index
	),
	algebraicToIndex: (alg: string) => ipcRenderer.invoke(
		'chess:algebraic-to-index',
		alg
	)
}

// contextBridge.exposeInMainWorld('log', (message) => ipcRenderer.send('log', message))
contextBridge.exposeInMainWorld('chess', exposedChessApi)
