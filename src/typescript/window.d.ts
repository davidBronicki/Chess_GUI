// This file should augment the properties of the `Window` with the type of the
// `ContextBridgeApi` from `Electron.contextBridge` declared in `src/preload.ts`.
import type { ChessApi, LoggingApi } from './preload'
import * as chess from './chess-handler/chess-ipc-types'

// global.exports = {}

export type I_NewBoardInfo = chess.I_NewBoardInfo


declare global {
	interface Window {
		logger: LoggingApi
		chess: ChessApi
	}
	type I_NewBoardInfo = chess.I_NewBoardInfo
	type I_FullBoardPosition = chess.I_FullBoardPosition
	type I_BoardDelta = chess.I_BoardDelta
	type I_SquareDelta = chess.I_SquareDelta
}
